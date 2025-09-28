export interface BlogAuthor {
    id: string;
    name: string;
    title: string;
    avatar: string;
    bio: string;
    socialLinks?: {
        twitter?: string;
        linkedin?: string;
        github?: string;
        facebook?: string;
    };
    articlesCount?: number;
}

export interface BlogTag {
    id: string;
    name: string;
    slug: string;
    color?: string;
    description?: string;
    postsCount?: number;
}

export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description: string;
    color?: string;
    icon?: string;
    postsCount?: number;
    isVisible?: boolean;
}

export interface BlogContentBlock {
    type: 'image' | 'text' | 'title';
    content?: string;
    link?: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string | BlogContentBlock[];
    featuredImage: string;
    images?: string[];
    author: BlogAuthor;
    category: BlogCategory;
    tags: BlogTag[];
    publishedAt: string;
    updatedAt?: string;
    isPublished: boolean;
    isFeatured?: boolean;
    readingTime?: number;
    views?: number;
    likes?: number;
    comments?: number;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
    };
    introductionBlocks?: ApiBlogBlock[];
}

// Interface for API blog content blocks
export interface ApiBlogBlock {
    type: 'title' | 'description' | 'image';
    text?: string;
    imageUrl?: string;
}

// Add mapping function type
export interface BlogContentBlockMapped extends BlogContentBlock {
    type: 'title' | 'text' | 'image';
}

export interface BlogComment {
    id: string;
    postId: string;
    author: {
        name: string;
        email: string;
        avatar?: string;
    };
    content: string;
    createdAt: string;
    isApproved: boolean;
    parentId?: string;
    replies?: BlogComment[];
}

export interface BlogStats {
    totalPosts: number;
    totalCategories: number;
    totalTags: number;
    totalAuthors: number;
    totalViews: number;
    totalComments: number;
}
