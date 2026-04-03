import type { Metadata } from 'next';
import ProductsPageClient from './ProductsPageClient';
import { mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';
import { publicApiServer } from '@/lib/publicApiServer';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/products',
    title: 'San pham tai nghe SCS - 4T HITEK',
    description:
        'Kham pha dong san pham tai nghe SCS chinh hang tai 4T HITEK. Tai nghe chuyen nghiep cho moto, xe may voi chat luong cao va bao hanh chinh hang.',
    keywords: ['tai nghe SCS', 'tai nghe xe may', 'tai nghe mu bao hiem', 'SCS headset', '4T HITEK san pham']
});

export default async function ProductsPage() {
    const response = await publicApiServer.fetchProducts();
    const initialProducts = (response.data ?? [])
        .map((product) => mapProductSummaryToSimpleProduct(product))
        .filter((product): product is NonNullable<typeof product> => product !== null);

    return <ProductsPageClient initialProducts={initialProducts} />;
}
