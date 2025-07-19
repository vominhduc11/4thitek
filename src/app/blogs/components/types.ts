// Shared types for blog
export interface BlogPost {
    id: number;
    title: string;
    category: string;
    tags: string[];
    image: string;
    bannerImage?: string;
    excerpt: string;
    content?:
        | {
              intro?: string;
              sections?: ContentSection[];
          }
        | string;
    author: string;
    publishDate: string;
    readTime: number; // in minutes
    featured: boolean;
    popularity?: number; // For sorting purposes
}

export interface ContentSection {
    type: 'heading' | 'paragraph' | 'image' | 'list' | 'quote';
    content?: string;
    src?: string;
    alt?: string;
    caption?: string;
    float?: 'left' | 'right';
    items?: string[];
}

export interface BlogFilterState {
    selectedCategory: string;
    selectedTag: string;
    sortBy: string;
}

export interface BlogPaginationState {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}
