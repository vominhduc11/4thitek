import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { createBaseMetadata, productJsonLd } from '@/lib/seo';
import { publicApiServer } from '@/lib/publicApiServer';
import { buildProductPath, extractRouteId } from '@/lib/slug';
import { parseImageUrl } from '@/utils/media';

export async function generateStaticParams() {
    const response = await publicApiServer.fetchProducts();
    return (response.data ?? []).flatMap((product) => {
        const path = buildProductPath(product.id, product.name);
        const id = path.replace('/products/', '');
        return id ? [{ id }] : [];
    });
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id: rawId } = await params;
    const id = extractRouteId(rawId);
    const response = await publicApiServer.fetchProductById(id);
    if (!response.success || !response.data) {
        return createBaseMetadata({
            locale: 'vi',
            path: `/products/${id}`,
    title: '4T HITEK | Sản phẩm',
    description: 'Thông tin sản phẩm 4T HITEK.'
        });
    }

    const product = response.data;
    const canonicalPath = buildProductPath(product.id, product.name);
    return createBaseMetadata({
        locale: 'vi',
        path: canonicalPath,
        title: `${product.name} | 4T HITEK`,
        description: product.shortDescription || product.description || product.name,
        image: parseImageUrl(product.image, '') || undefined,
        keywords: ['tai nghe SCS', product.name, '4T HITEK', 'tai nghe chính hãng']
    });
}

export default async function ProductLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id: rawId } = await params;
    const id = extractRouteId(rawId);
    const response = await publicApiServer.fetchProductById(id);
    const product = response.success ? response.data : null;

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white">
            <div className="max-w-[1920px] mx-auto">
                {product ? (
                    <JsonLd
                        data={productJsonLd({
                            id,
                            name: product.name,
                            description: product.shortDescription || product.description || product.name,
                            image: parseImageUrl(product.image, '') || undefined,
                            price: product.price,
                            path: buildProductPath(product.id, product.name)
                        })}
                    />
                ) : null}
                {children}
            </div>
        </div>
    );
}
