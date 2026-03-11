import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { createBaseMetadata, productJsonLd } from '@/lib/seo';
import { publicApiServer } from '@/lib/publicApiServer';
import { parseImageUrl } from '@/utils/media';

export async function generateStaticParams() {
    const response = await publicApiServer.fetchProducts();
    return (response.data ?? []).flatMap((product) => {
        const id = String(product.id).trim();
        return id ? [{ id }] : [];
    });
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const response = await publicApiServer.fetchProductById(id);
    if (!response.success || !response.data) {
        return createBaseMetadata({
            locale: 'vi',
            path: `/products/${id}`,
            title: '4ThiTek | San pham',
            description: 'Thong tin san pham 4ThiTek.'
        });
    }

    const product = response.data;
    return createBaseMetadata({
        locale: 'vi',
        path: `/products/${id}`,
        title: `${product.name} | 4ThiTek`,
        description: product.shortDescription || product.description || product.name
    });
}

export default async function ProductLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
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
                            image: parseImageUrl(product.image, '')
                        })}
                    />
                ) : null}
                {children}
            </div>
        </div>
    );
}
