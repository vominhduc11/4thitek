import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { createBaseMetadata, productJsonLd } from '@/lib/seo';
import { publicApiServer } from '@/lib/publicApiServer';

const parseImageUrl = (value: string) => {
    try {
        const parsed = JSON.parse(value) as { imageUrl?: string };
        return parsed.imageUrl || '';
    } catch {
        return value;
    }
};

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
            title: '4ThiTek | Sản phẩm',
            description: 'Thông tin sản phẩm 4ThiTek.'
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
                            id: id,
                            name: product.name,
                            description: product.shortDescription || product.description || product.name,
                            image: parseImageUrl(product.image)
                        })}
                    />
                ) : null}
                {children}
            </div>
        </div>
    );
}
