export type BlogParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type BlogImageBlock = {
  type: "image";
  url: string;
  caption?: string;
};

export type BlogGalleryItem = {
  url: string;
};

export type BlogGalleryBlock = {
  type: "gallery";
  items: BlogGalleryItem[];
  caption?: string;
};

export type BlogVideoBlock = {
  type: "video";
  url: string;
  caption?: string;
};

export type BlogContentBlock =
  | BlogParagraphBlock
  | BlogImageBlock
  | BlogGalleryBlock
  | BlogVideoBlock;
