import type { Metadata } from 'next';
import ProductsPageClient from './ProductsPageClient';
import { mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';
import { publicApiServer } from '@/lib/publicApiServer';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/products',
    title: 'Sản phẩm tai nghe SCS - 4ThiTek',
    description: 'Khám phá dòng sản phẩm tai nghe SCS chính hãng tại 4ThiTek. Tai nghe chuyên nghiệp cho môtô, xe máy với chất lượng cao và bảo hành chính hãng.',
    keywords: ['tai nghe SCS', 'tai nghe xe máy', 'tai nghe mũ bảo hiểm', 'SCS headset', '4ThiTek sản phẩm']
});

export default async function ProductsPage() {
    const response = await publicApiServer.fetchProducts();
    const initialProducts = (response.data ?? [])
        .map((product) => mapProductSummaryToSimpleProduct(product))
        .filter((product): product is NonNullable<typeof product> => product !== null);

    return <ProductsPageClient initialProducts={initialProducts} />;
}
