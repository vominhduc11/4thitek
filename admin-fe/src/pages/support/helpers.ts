import {
  type BackendSupportTicketStatus,
  type BackendSupportPriority,
  type BackendSupportTicketResponse,
  type BackendSupportMessageAuthorRole,
} from "../../lib/adminApi";
import {
  normalizeSupportAttachment,
  type NormalizedSupportAttachment,
} from "../../lib/supportAttachment";

export const STATUS_OPTIONS: BackendSupportTicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

export const copyKeys = {
  title: "Hỗ trợ",
  description:
    "Theo dõi yêu cầu hỗ trợ từ đại lý, cập nhật người xử lý và phản hồi ngay trong admin.",
  searchLabel: "Tìm yêu cầu",
  searchPlaceholder: "Tìm mã yêu cầu, đại lý, chủ đề...",
  status: "Trạng thái",
  all: "Tất cả",
  open: "Mới tiếp nhận",
  processing: "Đang xử lý",
  resolved: "Đã xử lý xong",
  selected: "Yêu cầu đang xem",
  timeline: "Mốc xử lý",
  reply: "Nội dung gửi đại lý",
  save: "Lưu trạng thái xử lý",
  sendReply: "Gửi cho đại lý",
  saveInternal: "Lưu ghi chú nội bộ",
  assignee: "Người phụ trách",
  created: "Tiếp nhận lúc",
  updated: "Cập nhật gần nhất",
  closed: "Đã đóng lúc",
  next: "Tiếp",
  previous: "Trước",
  emptyTitle: "Chưa có yêu cầu hỗ trợ",
  emptyMessage: "Yêu cầu từ đại lý sẽ xuất hiện ở đây khi có trao đổi mới.",
  emptyDetailTitle: "Chọn một yêu cầu để xem chi tiết",
  emptyDetailMessage:
    "Khi có yêu cầu từ đại lý, bạn sẽ xem toàn bộ trao đổi tại đây.",
  loadTitle: "Không tải được yêu cầu hỗ trợ",
  loadFallback: "Danh sách yêu cầu hỗ trợ chưa thể tải.",
  reload: "Tải lại",
} as const;

export const STATUS_TRANSITIONS: Record<
  BackendSupportTicketStatus,
  BackendSupportTicketStatus[]
> = {
  open: ["open", "in_progress", "closed"],
  in_progress: ["in_progress", "open", "resolved", "closed"],
  resolved: ["resolved", "in_progress", "closed"],
  closed: ["closed"],
};

export const statusTone = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  closed: "neutral",
} as const;

export const priorityTone = {
  normal: "neutral",
  high: "warning",
  urgent: "danger",
} as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
export const ALLOWED_DOCUMENT_TYPES = new Set(["application/pdf"]);
export const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "mp4",
  "webm",
  "pdf",
]);

export type TicketDraftState = {
  replyDraft: string;
  statusDraft: BackendSupportTicketStatus;
  assigneeDraft: number | "";
  internalNote: boolean;
  attachments: DraftAttachment[];
};

export type DraftAttachment = NormalizedSupportAttachment;

export type ThreadItem = {
  key: string;
  authorRole: "dealer" | "admin" | "system";
  authorName?: string | null;
  internalNote: boolean;
  message: string;
  createdAt?: string | null;
  attachments: NormalizedSupportAttachment[];
  syntheticRoot?: boolean;
};

const getFileExtension = (fileName: string) => {
  const normalized = fileName.trim().toLowerCase();
  const dot = normalized.lastIndexOf(".");
  if (dot < 0 || dot === normalized.length - 1) {
    return "";
  }
  return normalized.slice(dot + 1);
};

export const validateSupportAttachmentFile = (file: File): string | null => {
  const contentType = file.type.trim().toLowerCase();
  const extension = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Chỉ hỗ trợ tệp JPG/JPEG/PNG/WEBP, MP4/WEBM hoặc PDF.";
  }

  if (contentType.startsWith("image/")) {
    if (file.size > MAX_IMAGE_BYTES) {
      return "Ảnh không được vượt quá 10MB.";
    }
    return null;
  }

  if (ALLOWED_VIDEO_TYPES.has(contentType)) {
    if (file.size > MAX_VIDEO_BYTES) {
      return "Video không được vượt quá 50MB.";
    }
    return null;
  }

  if (ALLOWED_DOCUMENT_TYPES.has(contentType)) {
    if (file.size > MAX_DOCUMENT_BYTES) {
      return "Tệp PDF không được vượt quá 10MB.";
    }
    return null;
  }

  if (["mp4", "webm"].includes(extension) && file.size <= MAX_VIDEO_BYTES) {
    return null;
  }
  if (extension === "pdf" && file.size <= MAX_DOCUMENT_BYTES) {
    return null;
  }

  return "Định dạng tệp không hợp lệ.";
};

export const upsertTicket = (
  tickets: BackendSupportTicketResponse[],
  ticket: BackendSupportTicketResponse | null,
) => {
  if (!ticket) {
    return tickets;
  }
  const index = tickets.findIndex((entry) => entry.id === ticket.id);
  if (index < 0) {
    return [ticket, ...tickets];
  }
  const next = [...tickets];
  next[index] = ticket;
  return next;
};

export function createDraft(ticket: BackendSupportTicketResponse): TicketDraftState {
  return {
    replyDraft: "",
    statusDraft: ticket.status ?? "open",
    assigneeDraft: ticket.assigneeId ?? "",
    internalNote: false,
    attachments: [],
  };
}

export function buildThreadItems(ticket: BackendSupportTicketResponse): ThreadItem[] {
  const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
  const rootMessage = (ticket.message || "").trim();
  const hasRootInMessages = messages.some(
    (message) =>
      message.authorRole === "dealer" &&
      !message.internalNote &&
      message.message.trim() === rootMessage,
  );

  const thread: ThreadItem[] = [];
  if (rootMessage && !hasRootInMessages) {
    thread.push({
      key: `root-${ticket.id}`,
      authorRole: "dealer",
      authorName: ticket.dealerName,
      internalNote: false,
      message: rootMessage,
      createdAt: ticket.createdAt,
      attachments: [],
      syntheticRoot: true,
    });
  }

  for (const message of messages) {
    thread.push({
      key: `message-${message.id}`,
      authorRole: message.authorRole,
      authorName: message.authorName,
      internalNote: message.internalNote === true,
      message: message.message,
      createdAt: message.createdAt,
      attachments: Array.isArray(message.attachments)
        ? message.attachments
            .map((attachment) => normalizeSupportAttachment(attachment ?? {}))
            .filter(
              (
                attachment,
              ): attachment is NormalizedSupportAttachment =>
                attachment !== null,
            )
        : [],
    });
  }

  return thread;
}
export default buildThreadItems;
