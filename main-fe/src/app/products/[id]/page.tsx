import { notFound } from 'next/navigation';
import ProductPageClient from './ProductPageClient';
import { publicApiServer } from '@/lib/publicApiServer';

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const [productResponse, productsResponse] = await Promise.all([
        publicApiServer.fetchProductById(id),
        publicApiServer.fetchProducts()
    ]);

    if (!productResponse.success || !productResponse.data) {
        notFound();
    }

    const initialRelatedProducts = (productsResponse.data ?? [])
        .filter((product) => String(product.id).trim() !== id)
        .slice(0, 4);

    return (
        <ProductPageClient
            initialProductData={productResponse.data}
            initialRelatedProducts={initialRelatedProducts}
        />
    );
}
