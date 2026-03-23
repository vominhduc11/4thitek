import { notFound, redirect } from 'next/navigation';
import ProductPageClient from './ProductPageClient';
import { publicApiServer } from '@/lib/publicApiServer';
import { buildProductPath, extractRouteId } from '@/lib/slug';

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id: rawId } = await params;
    const id = extractRouteId(rawId);
    const [productResponse, productsResponse] = await Promise.all([
        publicApiServer.fetchProductById(id),
        publicApiServer.fetchProducts()
    ]);

    if (!productResponse.success || !productResponse.data) {
        notFound();
    }

    const canonicalPath = buildProductPath(productResponse.data.id, productResponse.data.name);
    const canonicalSegment = canonicalPath.replace('/products/', '');
    if (rawId !== canonicalSegment) {
        redirect(canonicalPath);
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
