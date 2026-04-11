const normalizeVietnamese = (value: unknown) =>
    (typeof value === 'string' ? value : '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd');

export const slugify = (value: unknown) =>
    normalizeVietnamese(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');

export const extractRouteId = (value: string) => {
    const [firstSegment] = value.split('-');
    return firstSegment.trim();
};

export const buildBlogPath = (id: string | number, title: string) => {
    const safeId = String(id).trim();
    const slug = slugify(title);
    return slug ? `/blogs/${safeId}-${slug}` : `/blogs/${safeId}`;
};

export const buildProductPath = (id: string | number, name: string) => {
    const safeId = String(id).trim();
    const slug = slugify(name);
    return slug ? `/products/${safeId}-${slug}` : `/products/${safeId}`;
};
