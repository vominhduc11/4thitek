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
    const [productResponse, relatedProductsResponse] = await Promise.all([
        publicApiServer.fetchProductById(id),
        publicApiServer.fetchRelatedProducts(id, 4)
    ]);

    if (!productResponse.success || !productResponse.data) {
        notFound();
    }

    const canonicalPath = buildProductPath(productResponse.data.id, productResponse.data.name);
    const canonicalSegment = canonicalPath.replace('/products/', '');
    if (rawId !== canonicalSegment) {
        redirect(canonicalPath);
    }

    const initialRelatedProducts = relatedProductsResponse.data ?? [];

    return (
        <ProductPageClient
            initialProductData={productResponse.data}
            initialRelatedProducts={initialRelatedProducts}
        />
    );
}
