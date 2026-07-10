import { type LucideIcon } from "lucide-react";

export type NavGroupId = "overview" | "commerce" | "service" | "system";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  group: NavGroupId;
};

export type SearchResult = {
  id: string;
  title: string;
  meta: string;
  to: string;
  icon: LucideIcon;
};

export type SearchIndexItem = SearchResult & {
  searchText: string;
};

export type AlertItem = {
  id: string;
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
};

export const ALERT_READ_STORAGE_KEY = "admin_alert_read_ids";
export const SEARCH_RESULT_LIMIT = 8;
export const NAV_GROUP_STORAGE_KEY = "admin_nav_groups";

export const copyKeys = {
  product: "Sản phẩm",
  order: "Đơn hàng",
  dealer: "Đại lý",
  post: "Bài viết",
  user: "Người dùng",
  discount: "Chiết khấu",
  workspace: "Không gian quản trị",
  welcome: "Bảng điều hành quản trị",
  welcomeText:
    "Theo dõi vận hành, kho, dịch vụ sau bán và tài khoản nội bộ từ một nơi.",
  searchPlaceholder: "Tìm đơn hàng, SKU, đại lý, bài viết...",
  searchEmpty: "Không tìm thấy kết quả phù hợp",
  searchHint: "Kết quả tìm kiếm nhanh",
  searchResultsLabel: "Danh sách kết quả tìm kiếm",
  searchSelectionHint: "Dùng phím mũi tên để duyệt, Enter để mở.",
  searchViewAll: "Xem tất cả {count} kết quả",
  searchCollapse: "Thu gọn kết quả",
  alerts: "Cảnh báo vận hành",
  alertsEmpty: "Không có cảnh báo cần theo dõi.",
  markAllRead: "Đánh dấu đã đọc",
  account: "Tài khoản",
  profile: "Hồ sơ tài khoản",
  logout: "Đăng xuất",
  language: "Ngôn ngữ",
  light: "Sáng",
  dark: "Tối",
  online: "Hệ thống đang trực tuyến",
  noRole: "Quản trị viên",
  openNavigation: "Mở menu điều hướng",
  closeNavigation: "Đóng menu điều hướng",
  groups: {
    overview: "Điều hành",
    commerce: "Bán hàng",
    service: "Hậu mãi",
    system: "Hệ thống",
  },
  nav: {
    dashboard: "Tổng quan",
    products: "Sản phẩm",
    orders: "Đơn hàng",
    blogs: "Bài viết",
    discounts: "Chiết khấu sỉ",
    dealers: "Đại lý",
    warranties: "Bảo hành",
    serials: "Serial",
    notifications: "Trung tâm thông báo",
    support: "Hỗ trợ",
    media: "Thư viện media",
    returns: "Đổi trả",
    recentPayments: "Thanh toán chuyển khoản",
    unmatchedPayments: "Thanh toán không khớp",
    financialSettlements: "Quyết toán tài chính",
    reports: "Báo cáo",
    users: "Người dùng",
    auditLogs: "Nhật ký hệ thống",
    settings: "Cài đặt",
  },
  alertTemplates: {
    pendingOrders: "{count} đơn hàng đang chờ xử lý",
    lowStock: "{count} sản phẩm sắp chạm ngưỡng tồn kho thấp",
    scheduledPosts: "{count} bài viết đang ở trạng thái chờ lịch",
    dealerAttention: "{count} đại lý cần bổ sung hồ sơ",
    pendingUsers: "{count} tài khoản nội bộ đang chờ duyệt",
  },
  alertDescriptions: {
    pendingOrders: "Kiểm tra và xác nhận các đơn hàng mới trước khi trễ SLA.",
    lowStock:
      "Ưu tiên kiểm tra SKU tồn dưới hoặc bằng 10 để tránh gián đoạn đơn hàng.",
    scheduledPosts: "Rà soát nội dung trước thời điểm đăng tự động.",
    dealerAttention:
      "Hoàn tất xác minh để tránh ảnh hưởng kích hoạt ứng dụng đại lý.",
    pendingUsers: "Duyệt quyền truy cập cho tài khoản nội bộ mới.",
  },
  ws: {
    newOrder: "Đơn hàng mới từ {dealer}",
    newDealer: "Đại lý mới đăng ký: {username}",
    newTicket: "Ticket hỗ trợ mới từ {dealer}",
    onNotificationCreated: "Có thông báo hệ thống mới",
  },
} as const;

export const interpolate = (template: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );

export const buildAlertStateId = (
  prefix: string,
  ids: Array<string | number | null | undefined>,
) => {
  const normalized = ids
    .filter((id): id is string | number => id !== null && id !== undefined)
    .map(String)
    .sort();

  if (normalized.length === 0) {
    return prefix;
  }

  const joined = normalized.join("|");
  let hash = 0;
  for (let index = 0; index < joined.length; index += 1) {
    hash = (hash * 31 + joined.charCodeAt(index)) >>> 0;
  }

  return `${prefix}:${normalized.length}:${hash.toString(36)}`;
};

export const loadNavGroups = (): Record<NavGroupId, boolean> => {
  try {
    const raw = window.localStorage.getItem(NAV_GROUP_STORAGE_KEY);
    if (!raw)
      return { overview: true, commerce: true, service: false, system: false };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      return {
        overview: (parsed as Record<string, boolean>).overview ?? true,
        commerce: (parsed as Record<string, boolean>).commerce ?? true,
        service: (parsed as Record<string, boolean>).service ?? false,
        system: (parsed as Record<string, boolean>).system ?? false,
      };
    }
  } catch {
    /* ignore */
  }
  return { overview: true, commerce: true, service: false, system: false };
};
