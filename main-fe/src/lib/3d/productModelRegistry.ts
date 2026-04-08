const PRODUCT_MODEL_REGISTRY: Record<string, string> = {};

export function resolveProductModelAsset(productId: string | number) {
    return PRODUCT_MODEL_REGISTRY[String(productId)] ?? null;
}
