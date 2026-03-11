import ProductsPageClient from './ProductsPageClient';
import { mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';
import { publicApiServer } from '@/lib/publicApiServer';

export default async function ProductsPage() {
    const response = await publicApiServer.fetchProducts();
    const initialProducts = (response.data ?? [])
        .map((product) => mapProductSummaryToSimpleProduct(product))
        .filter((product): product is NonNullable<typeof product> => product !== null);

    return <ProductsPageClient initialProducts={initialProducts} />;
}
