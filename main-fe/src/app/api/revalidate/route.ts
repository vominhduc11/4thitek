import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Chạy trên Node runtime (revalidateTag/revalidatePath là API server-only).
export const runtime = 'nodejs';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET ?? '';

function parseTags(body: unknown): string[] {
    if (!body || typeof body !== 'object' || !('tags' in body) || !Array.isArray((body as { tags: unknown }).tags)) {
        return [];
    }

    return Array.from(
        new Set(
            (body as { tags: unknown[] }).tags
                .filter((tag): tag is string => typeof tag === 'string')
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0 && tag.length <= 256)
        )
    );
}

// Ánh xạ tag → path danh sách/home cần revalidate. Trang chi tiết (/products/[id],
// /blogs/[id]) được phủ qua revalidateTag('product:{id}' / 'blog:{id}') nên không cần path
// (webhook không biết slug canonical). Các section content khác home là CSR (usePublicContent)
// nên không có route ISR để revalidate.
function pathsForTag(tag: string): string[] {
    if (tag === 'products') return ['/products', '/'];
    if (tag === 'blogs') return ['/blogs', '/'];
    if (tag === 'content') return ['/'];

    const [kind, ...rest] = tag.split(':');
    const id = rest.join(':').trim();
    if (!id) return [];

    if (kind === 'product') return ['/products', '/'];
    if (kind === 'blog') return ['/blogs', '/'];
    if (kind === 'content') return id === 'home' ? ['/'] : [];

    return [];
}

export async function POST(request: NextRequest) {
    const secret = request.headers.get('x-revalidate-secret');
    if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const tags = parseTags(body);
    if (tags.length === 0) {
        return NextResponse.json({ error: 'No valid tags provided' }, { status: 400 });
    }

    const paths = new Set<string>();
    for (const tag of tags) {
        revalidateTag(tag);
        for (const path of pathsForTag(tag)) {
            paths.add(path);
        }
    }

    for (const path of paths) {
        revalidatePath(path);
    }

    return NextResponse.json({ revalidated: true, tags, paths: Array.from(paths) });
}
