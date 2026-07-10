export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const VIDEO_FILE_NOTICE = "Tải tệp video chưa được hỗ trợ. Vui lòng dùng URL video.";

export const suggestedSpecificationLabels = [
  "Driver",
  "Đáp tần",
  "Trở kháng",
  "Độ nhạy",
  "Cổng kết nối",
  "Kết nối không dây",
  "Thời lượng pin",
  "Chống ồn",
  "Micro",
  "Trọng lượng",
  "Bảo hành",
  "Màu sắc",
  "Chất liệu",
];

export const createSpecificationTemplate = () => [
  { label: "Driver", value: "" },
  { label: "Đáp tần", value: "" },
  { label: "Trở kháng", value: "" },
  { label: "Độ nhạy", value: "" },
  { label: "Cổng kết nối", value: "" },
  { label: "Kết nối không dây", value: "" },
  { label: "Thời lượng pin", value: "" },
  { label: "Chống ồn", value: "" },
  { label: "Micro", value: "" },
  { label: "Trọng lượng", value: "" },
  { label: "Bảo hành", value: "" },
];

export const createDescriptionTemplate = () => [
  { type: "description" as const, text: "" },
  { type: "image" as const, url: "", caption: "" },
  { type: "gallery" as const, gallery: [] },
  { type: "video" as const, url: "", caption: "" },
];

export const createVideoTemplate = () => [
  { title: "", descriptions: "", url: "" },
];

export const createDescriptionBlock = (type: "title" | "description" | "image" | "gallery" | "video") => {
  switch (type) {
    case "title":
    case "description":
      return { type, text: "" };
    case "image":
    case "video":
      return { type, url: "", caption: "" };
    case "gallery":
      return { type, gallery: [], caption: "" };
  }
};

export const isValidRemoteUrl = (value: string) => {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const moveListItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

export const moveIndexedRecord = <T,>(
  record: Record<number, T>,
  fromIndex: number,
  toIndex: number,
) => {
  const next: Record<number, T> = {};

  Object.entries(record).forEach(([key, value]) => {
    const index = Number(key);
    if (Number.isNaN(index)) return;

    if (index === fromIndex) {
      next[toIndex] = value;
      return;
    }

    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
      next[index - 1] = value;
      return;
    }

    if (fromIndex > toIndex && index >= toIndex && index < fromIndex) {
      next[index + 1] = value;
      return;
    }

    next[index] = value;
  });

  return next;
};

export const toDigitsOnly = (value: string) => value.replace(/\D/g, "");

export const formatNumberInput = (value: string) => {
  if (!value) return "";
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message.trim() ? error.message : fallback;

export const toPlainText = (value: string) =>
  value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
