/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "vi" | "en";

type TranslationMap = Record<string, string>;
type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const translations: Record<Language, TranslationMap> = {
  vi: {
    "Không tải được dữ liệu": "Không tải được dữ liệu",
    "Vui lòng kiểm tra kết nối và thử lại.":
      "Vui lòng kiểm tra kết nối và thử lại.",
    "Lưu không thành công. Vui lòng thử lại.":
      "Lưu không thành công. Vui lòng thử lại.",
    "Không tải được dữ liệu admin": "Không tải được dữ liệu admin",
    "Không tải được danh sách sản phẩm": "Không tải được danh sách sản phẩm",
    "Không tải được danh sách bài viết": "Không tải được danh sách bài viết",
    "Vui lòng nhập đầy đủ tiêu đề và danh mục.":
      "Vui lòng nhập đầy đủ tiêu đề và danh mục.",
    "Không thể dọn một số ảnh tạm trên máy chủ. Vui lòng thử lại.":
      "Không thể dọn một số ảnh tạm trên máy chủ. Vui lòng thử lại.",
    "Không tải được chi tiết bài viết": "Không tải được chi tiết bài viết",
    "Không có dữ liệu trong kỳ này": "Không có dữ liệu trong kỳ này",
    "Biểu đồ xu hướng doanh số": "Biểu đồ xu hướng doanh số",
    "Biểu đồ trạng thái đơn hàng": "Biểu đồ trạng thái đơn hàng",
  },
  en: {
    "Chuyển ngôn ngữ": "Switch language",
    "Tổng quan": "Overview",
    "Sản phẩm": "Products",
    "Đơn hàng": "Orders",
    "Bài viết": "Posts",
    "Chiết khấu sỉ": "Wholesale Discounts",
    "Đại lý": "Dealers",
    "Quản trị": "Admins",
    "Cài đặt": "Settings",
    "Trung tâm vận hành": "Operations center",
    "Hệ thống: Trực tuyến": "System: Online",
    "Trưởng ca": "Shift lead",
    "Đội quản trị": "Admin team",
    "Không gian quản trị": "Admin workspace",
    "Chào mừng, Admin": "Welcome, Admin",
    "Tìm đơn, SKU...": "Search orders, SKU...",
    Sáng: "Light",
    Tối: "Dark",
    Trước: "Previous",
    Tiếp: "Next",
    "Cảnh báo": "Alerts",
    "Tài khoản": "Account",
    "Bảng điều hành": "Control panel",
    "4ThiTek Quản trị": "4ThiTek Admin",
    "Đăng nhập để truy cập hệ thống quản lý phân phối tai nghe SCS":
      "Sign in to access the SCS distribution admin system.",
    "Tên đăng nhập": "Username",
    "Nhập tên đăng nhập": "Enter username",
    "Mật khẩu": "Password",
    "Nhập mật khẩu": "Enter password",
    "Hiển thị mật khẩu": "Show password",
    "Ẩn mật khẩu": "Hide password",
    "Ghi nhớ đăng nhập": "Remember me",
    "Bảo mật qua email": "Email verification",
    "Đăng nhập": "Sign in",
    "Hệ thống có thể yêu cầu xác thực email sau khi đăng nhập.":
      "The system may require email verification after sign-in.",
    "Phiên bản 1.0": "Version 1.0",
    "Kỳ: {period} - Cập nhật lúc {time}":
      "Period: {period} - Updated at {time}",
    "Kỳ báo cáo": "Reporting period",
    "Chọn kỳ báo cáo": "Select reporting period",
    "Xuất báo cáo": "Export report",
    "Khoảng thời gian tùy chỉnh": "Custom time range",
    "Chọn ngày bắt đầu và kết thúc (đến hôm nay).":
      "Choose start and end dates (up to today).",
    "Từ ngày": "From",
    "Đến ngày": "To",
    "Áp dụng": "Apply",
    "Sản phẩm nổi bật": "Top products",
    "Tổng quan hệ thống": "System overview",
    "Kênh bán & ưu đãi": "Sales & incentives",
    "Nội bộ & nội dung": "Operations & content",
    Ngày: "Day",
    Tháng: "Month",
    Năm: "Year",
    "Tùy chỉnh": "Custom",
    "Hôm nay": "Today",
    "12 tháng gần nhất": "Last 12 months",
    "5 năm gần nhất": "Last 5 years",
    "Từ {start} đến {end}": "From {start} to {end}",
    "{count} ngày gần nhất": "Last {count} days",
    "{count} tháng gần nhất": "Last {count} months",
    "{count} năm gần nhất": "Last {count} years",
    Kỳ: "Period",
    "Cập nhật lúc": "Updated at",
    "Báo cáo tổng quan": "Overview report",
    "Chỉ số chính": "Key metrics",
    "Biến động": "Change",
    "Đơn hàng chờ xử lý": "Pending orders",
    "Tồn kho thấp (hiện tại)": "Low stock (current)",
    "Cần bổ sung": "Needs restock",
    "Đơn hàng theo trạng thái": "Orders by status",
    "Xu hướng doanh số": "Sales trend",
    "Xu hướng doanh số {subtitle}": "Sales trend {subtitle}",
    "Phân bổ đơn hàng theo kỳ đã chọn":
      "Order distribution for the selected period",
    Tổng: "Total",
    "Tồn kho thấp - hiện tại": "Low stock - current",
    "{count} chờ xử lý": "{count} pending",
    "{count} cần bổ sung": "{count} restock",
    "{count} bản nháp": "{count} drafts",
    "Doanh số": "Sales",
    "Trung bình": "Average",
    mới: "new",
    "chờ duyệt": "pending approval",
    "chương trình": "programs",
    "xuất bản": "published",
    "bản nháp": "drafts",
    "tài khoản": "accounts",
    "sắp hết hạn": "expiring soon",
    "Đóng gói": "Packing",
    "Chờ duyệt": "Pending approval",
    "Chờ xử lý": "Pending",
    "Đang giao": "Delivering",
    "Hoàn tất": "Completed",
    Hủy: "Cancelled",
    "Theo dõi xử lý đơn và ưu tiên giao hàng.":
      "Track order processing and delivery priority.",
    "Tìm mã đơn...": "Search order code...",
    "Tạo đơn": "Create order",
    "Trạng thái": "Status",
    "Quản lý bài viết, lịch đăng và thông tin SEO.":
      "Manage posts, publishing schedules, and SEO info.",
    "Tìm bài viết...": "Search posts...",
    "Danh mục": "Category",
    "Tạo bài mới": "Create new post",
    "+4 trong tháng này": "+4 this month",
    "Đang bán": "Active",
    "Hoạt động gần đây": "Recent activity",
    "Cần xác nhận": "Needs confirmation",
    "Cập nhật": "Updated",
    "Lượt xem": "Views",
    "Đã đăng": "Published",
    "Hẹn giờ": "Scheduled",
    "Đánh giá": "Review",
    "Hướng dẫn": "Guide",
    "So sánh": "Comparison",
    "Xu hướng": "Trends",
    "2 ngày trước": "2 days ago",
    "3 ngày trước": "3 days ago",
    "5 ngày trước": "5 days ago",
    "Quản lý đại lý, hạn mức và trạng thái mua hàng.":
      "Manage dealers, limits, and purchase status.",
    "Tìm đại lý...": "Search dealers...",
    "Thêm khách hàng": "Add customer",
    "Tổng đại lý": "Total dealers",
    "+6 trong 30 ngày": "+6 in 30 days",
    "87% doanh thu tháng này": "87% of this month's revenue",
    "Cần chăm sóc": "Needs attention",
    "Không mua trong 14 ngày": "No purchases in 14 days",
    "Lần mua gần nhất": "Last purchase",
    "Doanh thu": "Revenue",
    "Doanh thu hôm nay": "Today's revenue",
    "Doanh thu 12 tháng gần nhất": "Revenue for the last 12 months",
    "Doanh thu 5 năm gần nhất": "Revenue for the last 5 years",
    "Doanh thu trong khoảng": "Revenue for the selected range",
    "Bạch kim": "Platinum",
    Vàng: "Gold",
    Bạc: "Silver",
    Đồng: "Bronze",
    "Đang hoạt động": "Active",
    "Đang xem xét": "Under review",
    "Hôm qua": "Yesterday",
    "1 tuần trước": "1 week ago",
    "21 ngày trước": "21 days ago",
    "Quản lý nhân sự và phân quyền truy cập hệ thống.":
      "Manage staff and access permissions.",
    "Mời nhân sự": "Invite staff",
    "Truy cập nhóm": "Group access",
    "Admin hệ thống": "System admin",
    "Quản lý sản phẩm": "Product manager",
    "Marketing & Nội dung": "Marketing & Content",
    "CSKH & Bảo hành": "Customer care & Warranty",
    "Cấu hình bảo mật, thông báo và chính sách mặc định.":
      "Configure security, notifications, and default policies.",
    "Lưu thay đổi": "Save changes",
    "Bảo mật": "Security",
    "Xác nhận email": "Email confirmation",
    "Yêu cầu admin xác nhận đăng nhập qua email.":
      "Require admin email confirmation for login.",
    "Cấu hình": "Configure",
    "Hết phiên đăng nhập": "Session timeout",
    "Tự động đăng xuất sau 30 phút.": "Auto sign-out after 30 minutes.",
    "Điều chỉnh": "Adjust",
    "Thông báo": "Notifications",
    "Cảnh báo đơn hàng": "Order alerts",
    "Thông báo khi có đơn hàng giá trị cao.":
      "Notify when there is a high-value order.",
    "Chỉnh sửa": "Edit",
    "Cảnh báo tồn kho": "Inventory alerts",
    "Gửi thông báo khi tồn kho thấp.": "Send notification when stock is low.",
    "Chiết khấu bán sỉ": "Wholesale discounts",
    "Quản lý quy tắc chiết khấu bán sỉ theo ngưỡng doanh số.":
      "Manage wholesale discount rules by revenue thresholds.",
    "Quản lý sản phẩm và tồn kho.": "Manage products and inventory.",
    "Tổng quan doanh số, đơn hàng, tồn kho và thống kê toàn hệ thống.":
      "Overview of revenue, orders, inventory, and system-wide stats.",
    "Tìm quy tắc...": "Search rules...",
    "Bộ lọc": "Filter",
    "Thêm quy tắc": "Add rule",
    "Cập nhật gần đây": "Recently updated",
    "Cần phê duyệt": "Needs approval",
    "Doanh số áp dụng": "Applicable revenue",
    "Ngưỡng cao nhất": "Highest threshold",
    "Quy tắc": "Rule",
    Ngưỡng: "Threshold",
    "Chiết khấu": "Discount",
    "Đơn từ 50 triệu": "Orders from 50 million",
    "Đơn từ 100 triệu": "Orders from 100 million",
    "Đơn từ 200 triệu": "Orders from 200 million",
    "Chương trình Q2": "Q2 program",
    "50 - 100 triệu": "50 - 100 million",
    "100 - 200 triệu": "100 - 200 million",
    ">= 200 triệu": ">= 200 million",
    "Áp dụng theo chiến dịch": "Applied by campaign",
    "Tìm tên, SKU...": "Search name, SKU...",
    "Xuất bản: Tất cả": "Publish: All",
    "Hủy xuất bản": "Unpublish",
    "Đã xuất bản": "Published",
    "Đã lưu trữ": "Archived",
    "Đã xóa": "Deleted",
    "Bản nháp": "Draft",
    "Nổi bật: Tất cả": "Featured: All",
    "Nổi bật": "Featured",
    "Không nổi bật": "Not featured",
    "Trang chủ: Tất cả": "Homepage: All",
    "Trang chủ": "Homepage",
    "Không ở trang chủ": "Not on homepage",
    "Tồn kho: Tất cả": "Stock: All",
    "Tồn kho thấp (≤10)": "Low stock (≤10)",
    "Hết hàng": "Out of stock",
    "Tất cả": "All",
    "Tồn kho thấp": "Low stock",
    "Đã lưu trữ / Đã xóa": "Archived / Deleted",
    "Tên sản phẩm": "Product name",
    Giá: "Price",
    "Tồn kho": "Stock",
    "Xuất bản": "Publish",
    Có: "Yes",
    Không: "No",
    "Xuất CSV": "Export CSV",
    "Thêm sản phẩm": "Add product",
    "Tổng SKU": "Total SKUs",
    "Đang kinh doanh": "On sale",
    "Thao tác": "Actions",
    "Thử đổi bộ lọc hoặc từ khóa tìm kiếm.":
      "Try changing filters or search keywords.",
    "Chi tiết": "Details",
    "Khôi phục": "Restore",
    "Ẩn sản phẩm": "Hide product",
    Xóa: "Delete",
    "Xóa vĩnh viễn": "Delete permanently",
    "Chỉ xóa vĩnh viễn được khi đã ẩn sản phẩm":
      "Only permanently delete after hiding the product.",
    "Xóa vĩnh viễn sản phẩm này? Hành động không thể hoàn tác.":
      "Permanently delete this product? This action cannot be undone.",
    "Tạo sản phẩm": "Create product",
    "Thông tin": "Info",
    "Mô tả": "Description",
    "Mô tả (Descriptions)": "Descriptions",
    "Mô tả ngắn": "Short description",
    "Mô tả chi tiết": "Long description",
    "Giá bán lẻ": "Retail price",
    "Th\u00f4ng tin c\u01a1 b\u1ea3n": "Basic information",
    "Gi\u00e1 & tr\u1ea1ng th\u00e1i": "Price & status",
    "Hi\u1ec3n th\u1ecb": "Visibility",
    "Trạng thái xuất bản": "Publish status",
    "Ảnh URL": "Image URL",
    "\u1ea2nh s\u1ea3n ph\u1ea9m": "Product image",
    "Ch\u1ecdn \u1ea3nh": "Select image",
    "\u0110\u00e3 ch\u1ecdn": "Selected",
    "\u0058\u00f3a \u1ea3nh": "Remove image",
    "Đã chọn tệp ảnh cục bộ.": "Selected a local image file.",
    "Đã chọn tệp video cục bộ.": "Selected a local video file.",
    "Xem trước sẽ hiển thị sau khi lưu.": "Preview will appear after saving.",
    "Chỉnh sửa chưa hỗ trợ tải tệp. Vui lòng dùng URL hoặc tạo mới.":
      "Editing does not support file uploads yet. Please use a URL or create a new product.",
    "PNG/JPG, t\u1ed1i \u0111a 10MB": "PNG/JPG, up to 10MB",
    "\u1ea2nh t\u1ed1i \u0111a 10MB": "Image size up to 10MB",
    "T\u1ea3i \u1ea3nh": "Upload image",
    "Ho\u1eb7c nh\u1eadp URL th\u1ee7 c\u00f4ng": "Or enter a URL manually",
    "Xem trước": "Preview",
    "Tiêu đề": "Title",
    "Dùng mẫu": "Use template",
    "Hình ảnh": "Image",
    "Nhiều hình ảnh": "Image gallery",
    "URL hình ảnh": "Image URL",
    "Chú thích": "Caption",
    "Thêm hình ảnh": "Add image",
    "Chọn nhiều ảnh": "Select multiple images",
    "Chưa có hình ảnh nào.": "No images yet.",
    "Thêm hình ảnh đầu tiên": "Add the first image",
    "Chú thích bộ ảnh": "Gallery caption",
    "Thêm mục mô tả": "Add description item",
    "Thông số": "Specifications",
    "Thêm các đoạn mô tả ngắn cho sản phẩm.":
      "Add short description sections for the product.",
    "Chưa có mô tả nào.": "No descriptions yet.",
    "Thêm mô tả đầu tiên": "Add the first description",
    "Thêm các thông số kỹ thuật quan trọng.":
      "Add key technical specifications.",
    "Chưa có thông số nào.": "No specifications yet.",
    "Thêm thông số đầu tiên": "Add the first specification",
    "Thêm video giới thiệu hoặc hướng dẫn sản phẩm.":
      "Add product intro or tutorial videos.",
    "Chưa có video nào.": "No videos yet.",
    "Thêm video đầu tiên": "Add the first video",
    "+ Thêm dòng mô tả": "+ Add description row",
    "Thông số (Specifications)": "Specifications",
    Nhãn: "Label",
    "Giá trị": "Value",
    "+ Thêm thông số": "+ Add specification",
    "Mở hộp": "Unboxing",
    "Trình diễn": "Demo",
    "URL video": "Video URL",
    "URL ảnh thu nhỏ": "Thumbnail URL",
    "Nh\u1eadp URL video YouTube ho\u1eb7c file video c\u00f4ng khai":
      "Enter a YouTube video URL or a public video file",
    "Nh\u1eadp ch\u00fa th\u00edch": "Enter a caption",
    "Xóa video": "Delete video",
    "Chọn video": "Select video",
    "Video tối đa 10MB": "Video size up to 10MB",
    "T\u1ea3i t\u1ec7p video ch\u01b0a \u0111\u01b0\u1ee3c h\u1ed7 tr\u1ee3. Vui l\u00f2ng d\u00f9ng URL video.":
      "Video file uploads are not supported yet. Please use a video URL.",
    "+ Thêm video": "+ Add video",
    "Vui lòng nhập tên sản phẩm": "Please enter product name",
    "Vui lòng nhập SKU": "Please enter SKU",
    "SKU đã tồn tại": "SKU already exists",
    "Giá phải là số không âm": "Price must be a non-negative number",
    "Gi\u00e1 b\u00e1n l\u1ebb ph\u1ea3i l\u00e0 s\u1ed1 kh\u00f4ng \u00e2m":
      "Retail price must be a non-negative number",
    "Tồn kho phải là số không âm": "Stock must be a non-negative number",
    "Th\u1eddi h\u1ea1n b\u1ea3o h\u00e0nh (th\u00e1ng)":
      "Warranty period (months)",
    "Nh\u1eadp s\u1ed1 th\u00e1ng b\u1ea3o h\u00e0nh": "Enter warranty months",
    "Th\u1eddi h\u1ea1n b\u1ea3o h\u00e0nh ph\u1ea3i l\u00e0 s\u1ed1 nguy\u00ean d\u01b0\u01a1ng":
      "Warranty period must be a positive integer",
    Tạo: "Create",
    "Không tìm thấy sản phẩm": "Product not found",
    "SKU {sku} không tồn tại hoặc đã bị xóa.":
      "SKU {sku} does not exist or has been deleted.",
    "Quay lại danh sách": "Back to list",
    "Cập nhật {date}": "Updated {date}",
    "Tính năng (ngăn cách bằng dấu phẩy)": "Features (comma separated)",
    "Tính năng chính": "Key features",
    "Ghi chú phát hành": "Release notes",
    "Đã cập nhật bao bì và tối ưu đường âm cho lô sản xuất 2026.":
      "Updated packaging and optimized audio curve for the 2026 production batch.",
    Video: "Videos",
    // ChangePasswordPage
    "Đổi mật khẩu lần đầu": "First-time password change",
    "Tài khoản quản trị cần cập nhật mật khẩu trước khi tiếp tục sử dụng hệ thống.":
      "Admin account must update password before continuing.",
    "Mật khẩu hiện tại": "Current password",
    "Nhập mật khẩu hiện tại": "Enter current password",
    "Mật khẩu mới": "New password",
    "Tối thiểu 8 ký tự": "Minimum 8 characters",
    "Xác nhận mật khẩu mới": "Confirm new password",
    "Nhập lại mật khẩu mới": "Re-enter new password",
    "Vui lòng nhập đầy đủ thông tin.": "Please fill in all required fields.",
    "Mật khẩu mới phải có ít nhất 8 ký tự.":
      "New password must be at least 8 characters.",
    "Xác nhận mật khẩu không khớp.": "Passwords do not match.",
    "Phiên đăng nhập không còn hợp lệ.": "Session is no longer valid.",
    "Mật khẩu đã được cập nhật.": "Password has been updated.",
    "Không thể cập nhật mật khẩu.": "Unable to update password.",
    "Đang cập nhật...": "Updating...",
    "Cập nhật mật khẩu": "Update password",
    "Đăng xuất": "Sign out",
    // LoginPage
    "Đăng nhập thất bại": "Sign-in failed",
    "Đăng nhập thành công": "Signed in successfully",
    "Đang đăng nhập...": "Signing in...",
    "Vui lòng nhập tên đăng nhập": "Please enter username",
    "Vui lòng nhập mật khẩu": "Please enter password",
    // SettingsPage
    "Không thể tải cài đặt": "Unable to load settings",
    "Không tải được cài đặt": "Failed to load settings",
    "Đã lưu cài đặt hệ thống": "System settings saved",
    "Không lưu được cài đặt": "Failed to save settings",
    "Đang lưu...": "Saving...",
    "Hoàn tác thay đổi": "Discard changes",
    "Bạn có thay đổi chưa lưu trong cài đặt hệ thống.":
      "You have unsaved changes in system settings.",
    "Tự động đăng xuất sau {n} phút.": "Auto sign-out after {n} minutes.",
    "{n} phút": "{n} minutes",
    // adminLabels – dealer
    "Đã kích hoạt": "Activated",
    "Chờ duyệt hồ sơ": "Pending review",
    "Tạm khóa": "Suspended",
    "Đại lý đã được phê duyệt và có thể đăng nhập ứng dụng dealer.":
      "The dealer has been approved and can sign in to the dealer app.",
    "Hồ sơ đang chờ admin xác minh trước khi kích hoạt.":
      "Profile is pending admin verification before activation.",
    "Tài khoản đại lý đã bị tạm khóa, không thể đăng nhập ứng dụng dealer.":
      "Dealer account has been suspended and cannot sign in to the dealer app.",
    "Sắp xếp": "Sort",
    "Mới nhất": "Latest",
    Ẩn: "Hide",
    "Cần ẩn sản phẩm trước khi xóa vĩnh viễn":
      "Archive the product first before permanently deleting",
    "Xuất bản sản phẩm": "Publish product",
    'Xuất bản "{name}"?': 'Publish "{name}"?',
    "Cập nhật ngay không cần lưu": "Updates immediately without saving",
    "Không tải được dữ liệu": "Failed to load data",
    "Vui lòng kiểm tra kết nối và thử lại.":
      "Please check your connection and try again.",
    "Lưu không thành công. Vui lòng thử lại.": "Save failed. Please try again.",
    "Không tải được dữ liệu admin": "Failed to load admin data",
    "Không tải được danh sách sản phẩm": "Failed to load product list",
    "Không tải được danh sách bài viết": "Failed to load the post list",
    "Vui lòng nhập đầy đủ tiêu đề và danh mục.":
      "Please provide a title and category.",
    "Không thể dọn một số ảnh tạm trên máy chủ. Vui lòng thử lại.":
      "Some temporary images on the server could not be cleaned up. Please try again.",
    "Không tải được chi tiết bài viết": "Failed to load post details",
    "Không có dữ liệu trong kỳ này": "No data for this period",
    "Biểu đồ xu hướng doanh số": "Sales trend chart",
    "Biểu đồ trạng thái đơn hàng": "Order status distribution chart",

    "-": "-",
    "(trống)": "(blank)",
    "{count} bài viết đang ở trạng thái chờ lịch":
      "{count} posts are still scheduled",
    "{count} đại lý cần bổ sung hồ sơ": "{count} dealers need profile updates",
    "{count} đơn hàng đang chờ xử lý":
      "{count} orders are waiting for processing",
    "{count} sản phẩm sắp chạm ngưỡng tồn kho thấp":
      "{count} products are close to low-stock threshold",
    "{count} tài khoản nội bộ đang chờ duyệt":
      "{count} internal users are pending approval",
    "An form tao": "Hide composer",
    "Anh dai dien": "Cover image",
    "Anh dai dien (URL)": "Cover image (URL)",
    "Áp dụng cho upload ảnh hoặc chứng từ qua giao diện quản trị.":
      "Applies to image and proof uploads in the admin interface.",
    "Backend chưa trả về dữ liệu dashboard.":
      "The backend has not returned dashboard data.",
    "Bai {id} khong ton tai hoac da bi xoa.":
      "Post {id} does not exist or has been deleted.",
    "Bai viet": "Post",
    "Bai viet nay chua co noi dung.": "This post has no content yet.",
    'Bạn có chắc muốn chuyển đơn này sang trạng thái "{status}" không?':
      'Change this order to "{status}"?',
    'Bạn có chắc muốn chuyển trạng thái đại lý này sang "{status}" không?':
      'Change this dealer to "{status}"?',
    "Bán hàng": "Commerce",
    "Ban nhap": "Draft",
    "Bảng điều hành quản trị": "Operations control panel",
    "Báo cáo": "Reports",
    "Báo cáo xuất file": "Report exports",
    "Bảo hành": "Warranties",
    'Bảo hành "{code}" sẽ bị hủy vĩnh viễn. Khách hàng sẽ mất quyền bảo hành còn lại.':
      'Warranty "{code}" will be permanently voided. The customer will lose remaining warranty coverage.',
    "Bảo vệ đầu vào webhook trước lưu lượng đột biến.":
      "Protect webhook entry points from burst traffic.",
    "Bắt đầu kiểm định": "Start Inspection",
    Bật: "Enabled",
    "Bộ báo cáo": "Report sets",
    "Các giao dịch SePay không khớp đơn hàng nào. Xem xét và xử lý từng trường hợp.":
      "SePay transactions that could not be matched to any order. Review and resolve each case.",
    "Các giới hạn này áp dụng ngay sau khi lưu. Chỉ điều chỉnh khi bạn đã có nhu cầu vận hành rõ ràng.":
      "These limits take effect immediately after saving. Change them only when there is a clear operational need.",
    "Các mục quyết toán tài chính đơn hàng chờ xử lý. Xem xét và giải quyết từng trường hợp.":
      "Order financial settlement items awaiting resolution. Review and resolve each case.",
    "Cài đặt hệ thống": "System settings",
    "Cap nhat": "Updated",
    "Cap nhat lan cuoi": "Last updated",
    "Cap nhat trang thai": "Update status",
    "Cần ít nhất một URL bằng chứng.": "At least one proof URL is required.",
    "Cần nhập email gửi đi khi bật email hệ thống.":
      "A sender email is required when system email is enabled.",
    "Cần nhập tên người gửi khi bật email hệ thống.":
      "A sender name is required when system email is enabled.",
    "Chỉ lưu token webhook đang được SePay cấp cho môi trường vận hành hiện tại.":
      "Store only the webhook token currently issued by SePay for this environment.",
    "Chỉ nhập chữ số. Không dùng khoảng trắng hoặc ký tự đặc biệt.":
      "Digits only. Avoid spaces or special characters.",
    "Chi tiết kỹ thuật": "Technical details",
    "Chi xoa khi ban chac chan bai viet khong con duoc su dung.":
      "Only delete when you are sure the post is no longer needed.",
    "Chinh sua": "Edit",
    "Chọn các tín hiệu vận hành cần gửi cho đội ngũ nội bộ.":
      "Choose which operational signals should notify the internal team.",
    "Chọn vai trò": "Select a role",
    "Chủ tài khoản": "Account holder",
    "Chua co tom tat cho bai viet nay.":
      "This post does not have a summary yet.",
    "Chua co tom tat.": "No summary yet.",
    "Chua phan loai": "Uncategorized",
    'Chuyen bai viet nay sang trang thai "{status}"?':
      'Change this post to "{status}"?',
    'Chuyển quy tắc này sang trạng thái "{status}"?':
      'Change this rule to "{status}"?',
    'Chuyển tài khoản này sang trạng thái "{status}"?':
      'Change this account to "{status}"?',
    "Chưa có dữ liệu": "No data yet",
    "Chưa có thông báo": "No notifications yet",
    "Chưa đặt": "Not set",
    "Chưa đọc": "Unread",
    Co: "Yes",
    "Còn lại": "Remaining",
    "Cửa sổ thời gian": "Time window",
    "Cửa sổ thời gian phải là số nguyên trong khoảng từ 1 đến 86.400 giây.":
      "Time window must be an integer between 1 and 86,400 seconds.",
    "Da dang": "Published",
    "Da tao bai {id}.": "Created post {id}.",
    "Dang tai anh...": "Uploading image...",
    "Dành cho quản lý bài viết, truyền thông và nội dung hiển thị.":
      "For posts, campaigns, and storefront-facing content.",
    "Danh muc": "Category",
    "Danh sách giao dịch chưa thể tải.":
      "The transaction list could not be loaded.",
    "Danh sách ID tài khoản": "Account IDs",
    "Danh sách kết quả tìm kiếm": "Search results list",
    "Danh sách người dùng chưa thể tải.": "The user list could not be loaded.",
    "Danh sách quy tắc chưa thể tải.": "The rule list could not be loaded.",
    "Danh sách quyết toán chưa thể tải.":
      "The settlements list could not be loaded.",
    "Danh sách serial": "Serial list",
    "Danh sách thông báo chưa thể tải.":
      "The notification list could not be loaded.",
    "Danh sách ticket chưa thể tải.": "The ticket list could not be loaded.",
    "Deep link": "Deep link",
    "Dòng thời gian": "Timeline",
    "Dùng phím mũi tên để duyệt, Enter để mở.":
      "Use arrow keys to browse and Enter to open.",
    "Duyệt quyền truy cập cho tài khoản nội bộ mới.":
      "Approve access for newly invited internal users.",
    "Đã đọc": "Read",
    "Đã gán": "Assigned",
    "Đã ghi có": "Credited",
    "Đã gửi lời mời người dùng mới.": "New user invite sent.",
    "Đã hoàn tiền": "Refunded",
    "Đã hủy": "Void",
    "Đã import {imported} serial, bỏ qua {skipped} serial.":
      "Imported {imported} serial(s), skipped {skipped} serial(s).",
    "Đã khớp": "Matched",
    "Đã lưu cài đặt hệ thống.": "System settings saved.",
    "Đã tải {title} ({format}).": "Downloaded {title} ({format}).",
    "Đã tải gần đây": "Downloaded recently",
    "Đã xảy ra lỗi khi tải nội dung của trang. Hãy thử lại để tiếp tục.":
      "Something went wrong while loading this page. Try again to continue.",
    "Đã xóa serial thành công.": "Serial deleted successfully.",
    "Đã xóa sổ": "Written off",
    "Đã xử lý": "Resolved",
    "Đại lý mới đăng ký: {username}": "New dealer registered: {username}",
    "Đang chuẩn bị tệp": "Preparing file",
    "đang giao": "in transit",
    "Đang giữ chỗ": "Reserved",
    "Đang hiệu lực": "Active",
    "Đang kiểm định": "Inspecting",
    "Đang mở": "Open",
    "Đang tải...": "Loading...",
    "Đang xuất": "Exporting",
    "Đang xử lý": "In progress",
    "Đánh dấu đã đọc": "Mark all as read",
    "Đánh dấu lỗi": "Mark as defective",
    "Đạt kiểm định — đưa về kho": "Pass QC — Return to stock",
    "Đạt QC": "Pass QC",
    "Địa chỉ này sẽ xuất hiện ở trường người gửi. Dùng email đã được hạ tầng mail xác thực.":
      "This address appears as the sender. Use an email that has been verified by your mail infrastructure.",
    "Điều hành": "Overview",
    "Định dạng": "Formats",
    Đóng: "Closed",
    "Đóng menu điều hướng": "Close navigation menu",
    "Đối tượng": "Audience",
    "đơn chờ xử lý": "pending",
    "đơn có thanh toán không xác nhận được": "with unresolved payments",
    "Đơn đã huỷ": "Order cancelled",
    "Đơn đã khớp": "Matched order",
    "Đơn đã thanh toán": "Already settled",
    "Đơn hàng cần xem xét": "Orders need review",
    "Đơn hàng mới từ {dealer}": "New order from {dealer}",
    "Đơn vị giây.": "Measured in seconds.",
    "Đưa về kho": "Restore to stock",
    Email: "Email",
    "Email gửi đi": "From email",
    "Email gửi đi không đúng định dạng.":
      "Sender email is not in a valid format.",
    "Email không đúng định dạng.": "Email is not in a valid format.",
    "Ghi chú": "Note",
    "Ghi chú (bắt buộc)": "Note (required)",
    "Ghi chú xử lý": "Resolution",
    "Ghi chú xử lý là bắt buộc.": "Resolution note is required.",
    "giao dịch chờ xử lý": "transactions pending",
    "Giới hạn số lần thử đăng nhập để giảm rủi ro dò mật khẩu.":
      "Limit sign-in attempts to reduce password guessing risk.",
    "Giữ ổn định cho điểm tra cứu công khai và nội bộ.":
      "Keep the lookup surface stable for public and internal use.",
    "Gợi ý đơn hàng": "Order hint",
    "Gửi lời mời": "Send invite",
    "Gửi thông báo": "Send notification",
    "Gửi thông báo chủ động theo nhóm nhận và kiểm tra lịch sử thông báo đã phát đi.":
      "Send targeted notifications and review dispatch history from one screen.",
    "Hạn mức": "Credit",
    "Hàng lỗi": "Defective",
    "Hanh dong nay se xoa bai viet khoi danh sach quan tri.":
      "This action removes the post from the admin list.",
    "Hanh dong nay se xoa bai viet khoi he thong quan tri.":
      "This action removes the post from the admin system.",
    "Hành động này sẽ xóa đơn hàng khỏi danh sách quản trị.":
      "This action removes the order from the admin list.",
    "Hậu mãi": "After-sales",
    "Hen gio": "Scheduled",
    "Hen gio / nhap": "Scheduled / drafts",
    "Hệ thống": "System",
    "Hệ thống chưa lấy được danh sách bảo hành.":
      "The warranty list could not be loaded.",
    "Hệ thống chưa lấy được danh sách serial.":
      "The serial list could not be loaded.",
    "Hệ thống đang trực tuyến": "System online",
    "Hệ thống và vận hành": "System and operations",
    "Hết hạn": "Expired",
    "Hien tren trang chu": "Show on homepage",
    "Hiển thị cho thao tác đối soát và kiểm tra thông tin nhận tiền.":
      "Used for reconciliation and payment destination checks.",
    "Họ và tên": "Full name",
    "Họ và tên cần có ít nhất 2 ký tự.":
      "Full name must be at least 2 characters.",
    "Hoàn tất xác minh để tránh ảnh hưởng kích hoạt dealer app.":
      "Complete verification to avoid dealer-app activation delays.",
    "Hỗ trợ": "Support",
    "https://cdn.example.com/proof-1.jpg":
      "https://cdn.example.com/proof-1.jpg",
    Huy: "Cancel",
    "Hủy bảo hành": "Void warranty",
    "Hủy hàng": "Scrap",
    "Import danh sách serial": "Import serial list",
    "Import serial": "Import serials",
    "Import thành công {count} serial.":
      "Successfully imported {count} serial(s).",
    "In mã QR": "Print QR",
    "kết quả": "results",
    "Kết quả tìm kiếm nhanh": "Quick search results",
    "Khả dụng": "Available",
    "Khách hàng": "Customer",
    Kho: "Warehouse",
    Khong: "No",
    "Khong cap nhat duoc bai viet": "Could not update the post",
    "Khong co bai viet": "No posts found",
    "Khong luu duoc bai viet": "Could not save the post",
    "Khong tai duoc chi tiet bai viet": "Could not load the post details",
    "Khong tai duoc danh sach bai viet": "Could not load the post list",
    "Khong the tai anh bai viet.": "Could not upload the post image.",
    "Khong the tai bai viet": "Unable to load posts",
    "Khong the tao bai viet": "Could not create the post",
    "Khong tim thay bai viet": "Post not found",
    "Khong xoa duoc bai viet": "Could not delete the post",
    "Không cập nhật được đơn hàng": "Could not update the order",
    "Không cập nhật được trạng thái đại lý":
      "Could not update the dealer status",
    "Không có bảo hành phù hợp": "No warranties match",
    "Không có cảnh báo cần theo dõi.": "No alerts need attention.",
    "Không có đại lý": "No dealers found",
    "Không có đơn hàng": "No orders found",
    "Không có giao dịch phù hợp": "No matching transactions",
    "Không có mục phù hợp": "No matching items",
    "Không có người dùng phù hợp": "No matching users",
    "Không có quy tắc phù hợp": "No matching rules",
    "Không có serial phù hợp": "No matching serials",
    "Không có ticket phù hợp": "No matching tickets",
    "Không lưu được cài đặt hệ thống.": "Could not save system settings.",
    "Không lưu được thay đổi.": "Could not save changes.",
    "Không tải được bảo hành": "Unable to load warranties",
    "Không tải được cài đặt hệ thống.": "Could not load system settings.",
    "Không tải được danh sách": "Unable to load list",
    "Không tải được danh sách đại lý": "Could not load the dealer list",
    "Không tải được danh sách đơn hàng": "Could not load the orders list",
    "Không tải được dashboard": "Unable to load dashboard",
    "Không tải được người dùng": "Unable to load users",
    "Không tải được quy tắc": "Unable to load rules",
    "Không tải được serial": "Unable to load serials",
    "Không tải được thông báo": "Unable to load notifications",
    "Không tải được ticket": "Unable to load tickets",
    "Không thể gửi lời mời người dùng.": "Could not send the user invite.",
    "Không thể hiển thị trang này": "This page could not be displayed",
    "Không thể tải đại lý": "Unable to load dealers",
    "Không thể tải đơn hàng": "Unable to load orders",
    "Không tìm thấy đơn": "Order not found",
    "Không tìm thấy kết quả phù hợp": "No matching results",
    "Không xóa được đơn hàng": "Could not delete the order",
    "Khuyến mãi": "Promotions",
    "Kiểm định": "Inspect",
    "Kiểm soát import hàng loạt, truy vết chủ sở hữu và cập nhật trạng thái serial theo vòng đời.":
      "Control batch imports, ownership tracing, and serial lifecycle status in one place.",
    "Kiểm tra và xác nhận các đơn hàng mới trước khi trễ SLA.":
      "Review and confirm new orders before they impact SLA.",
    "Liên kết": "Link",
    Loại: "Type",
    "Loc trang thai": "Filter status",
    "Luu bai viet": "Save post",
    "Luu thay doi": "Save changes",
    "Lưu cập nhật": "Save update",
    "Lưu quy tắc": "Save rule",
    "Lưu xử lý": "Save resolution",
    "Lý do": "Reason",
    "Mã bảo hành": "Warranty",
    "Mã đơn": "Order code",
    "Mã đơn hàng": "Order ID",
    "Mã giao dịch": "Transaction code",
    "Mã QR": "QR Code",
    "Mã QR Serial": "Serial QR Code",
    "Mô tả cách xử lý giao dịch này...":
      "Describe how this transaction was handled...",
    "Mô tả cách xử lý mục quyết toán này...":
      "Describe how this settlement was handled...",
    "Mô tả lý do...": "Describe the reason...",
    "Mỗi bộ báo cáo hiện hỗ trợ hai định dạng tải nhanh.":
      "Each report currently supports both quick-download formats.",
    "Mỗi dòng một serial, hoặc phân cách bằng dấu phẩy.\nVí dụ:\nSN001\nSN002\nSN003":
      "One serial per line, or comma-separated.\nExample:\nSN001\nSN002\nSN003",
    "Một báo cáo khác đang được xuất. Vui lòng đợi hoàn tất trước khi tải tiếp.":
      "Another export is in progress. Please wait for it to finish before starting a new one.",
    "Một số giá trị chưa hợp lệ. Hãy kiểm tra lại các trường được đánh dấu trước khi lưu.":
      "Some values are invalid. Review the highlighted fields before saving.",
    "Một số serial không đúng định dạng. Chỉ chấp nhận chữ, số, dấu gạch và tối thiểu 4 ký tự.":
      "Some serials are invalid. Only letters, numbers, dashes, and at least 4 characters are allowed.",
    "Mở menu điều hướng": "Open navigation menu",
    "Mời người dùng": "Invite user",
    "Mời tài khoản mới": "Invite a new account",
    "mục chờ xử lý": "items pending",
    "Mức cao nhất": "Highest value",
    "Nên khớp với tên pháp lý dùng cho nhận chuyển khoản.":
      "This should match the legal receiving-account name.",
    ngày: "days",
    "Ngày bắt đầu": "Start date",
    "Ngày hết hạn": "End date",
    "Ngày nhập": "Imported",
    "Ngày tạo": "Created at",
    "Ngăn việc yêu cầu đặt lại mật khẩu quá dày trong thời gian ngắn.":
      "Prevent too many reset requests in a short period.",
    "Ngôn ngữ": "Language",
    "Người dùng": "Users",
    "Người dùng nội bộ": "Internal users",
    "Người gửi": "Sender",
    "Ngưỡng áp dụng": "Threshold",
    "Nhap danh muc": "Enter a category",
    "Nhap day du metadata va noi dung de bai viet khop voi public site.":
      "Capture the full content so public pages render the intended article.",
    "Nhap noi dung chi tiet cho bai viet": "Enter the full post content",
    "Nhap tieu de bai viet": "Enter the post title",
    "Nhap tom tat ngan": "Write a short summary",
    "Nhập số phút": "Enter minutes",
    "Nhật ký hệ thống": "Audit logs",
    "Noi dung": "Content",
    "Nội dung": "Content",
    "Phản hồi admin": "Admin reply",
    "Phân bổ trạng thái đơn hàng": "Order status distribution",
    "Phần trăm ưu đãi": "Discount percent",
    "Phù hợp cho đội phụ trách danh mục, nội dung sản phẩm và trạng thái xuất bản.":
      "Best for catalog management, product content, and publishing status.",
    "Phục vụ theo dõi hỗ trợ, bảo hành và các đầu việc sau bán hàng.":
      "For support, warranty, and after-sales operations.",
    "Quan ly bai viet, noi dung chi tiet, anh dai dien va trang thai hien thi tren trang chu.":
      "Manage post metadata, full content, cover images, and homepage visibility.",
    "Quản lý bảo mật đăng nhập, thông báo vận hành, cấu hình SePay, email gửi đi và giới hạn tốc độ theo tác vụ.":
      "Manage sign-in security, operational notifications, SePay configuration, outbound email, and task-level rate limits.",
    "Quản lý hồ sơ đại lý, hạn mức và trạng thái kích hoạt tài khoản.":
      "Manage dealer profiles, credit limits, and account activation status.",
    "Quản lý ngưỡng doanh số, phần trăm ưu đãi và trạng thái kích hoạt của từng quy tắc.":
      "Manage revenue thresholds, discount percentages, and activation status for each rule.",
    "Quản lý tài khoản admin, vai trò phụ trách và trạng thái kích hoạt một cách nhất quán.":
      "Manage admin accounts, responsibility roles, and activation status with clearer guardrails.",
    "Quản lý thông tin nhận thanh toán và webhook dùng cho đối soát giao dịch.":
      "Manage receiving-account details and webhook configuration for payment reconciliation.",
    "Quản trị viên": "Administrator",
    "Quên mật khẩu": "Password reset",
    "Quyền quản trị toàn diện, bao gồm tài khoản nội bộ và cài đặt nhạy cảm.":
      "Full admin access, including internal accounts and sensitive settings.",
    "Quyết toán tài chính": "Financial settlements",
    "Rà soát nội dung trước thời điểm đăng tự động.":
      "Review content before automatic publishing time.",
    "Rate limit": "Rate limits",
    "Sản phẩm bán chạy": "Top product",
    "Sẵn sàng": "Available",
    "Sẵn sàng tải": "Ready to download",
    SePay: "SePay",
    Serial: "Serial",
    'Serial "{serial}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.':
      'Serial "{serial}" will be permanently deleted. This action cannot be undone.',
    "Serial bị bỏ qua": "Skipped serials",
    "Serial này sẽ bị đánh dấu là hàng lỗi và không thể phân phối cho đến khi được khôi phục.":
      "This serial will be marked as defective and cannot be distributed until restored.",
    "Serial này sẽ trở về trạng thái khả dụng và có thể phân phối lại.":
      "This serial will return to available status and can be distributed again.",
    "SKU cần bổ sung": "restock",
    "Số tài khoản": "Account number",
    "Số tài khoản chỉ được chứa chữ số.":
      "Account number can contain digits only.",
    "Số tiền": "Amount",
    "Số tiền sai": "Amount mismatch",
    "Số yêu cầu": "Requests",
    "Số yêu cầu phải là số nguyên trong khoảng từ 1 đến 10.000.":
      "Requests must be an integer between 1 and 10,000.",
    "Sở hữu": "Owner",
    "Tai anh dai dien": "Upload cover image",
    "Tại đại lý": "At dealer",
    "Tài khoản cụ thể": "Specific accounts",
    "Tài khoản mới sẽ bắt đầu ở trạng thái chờ duyệt cho đến khi được kích hoạt.":
      "New accounts start in pending status until an admin approves access.",
    "Tải lại": "Reload",
    "Tải nhanh các bộ báo cáo vận hành dành cho kế toán, kho vận và hậu mãi, với phản hồi rõ ràng trong suốt quá trình xuất.":
      "Download operational exports for accounting, warehouse, and after-sales teams with clearer in-flow feedback.",
    "Tải PDF": "Download PDF",
    "Tải tệp": "Uploads",
    "Tải XLSX": "Download XLSX",
    "Tao bai moi": "Create post",
    "Tao bai viet moi": "Create a new post",
    "Tạo bởi": "Created by",
    "Tạo chiến dịch thông báo": "Create notification dispatch",
    "Tạo lúc": "Created",
    "Tạo quy tắc mới": "Create rule",
    "Tạo thông báo đầu tiên hoặc tải lại dữ liệu.":
      "Send the first notification or reload the data.",
    "Tat ca": "All",
    "Tất cả tài khoản": "All accounts",
    "Tên hiển thị trong hộp thư người nhận.":
      "This name is shown in the recipient inbox.",
    "Tên ngân hàng": "Bank name",
    "Tên người gửi": "From name",
    "Tên quy tắc": "Rule label",
    "Thanh toán không khớp": "Unmatched payments",
    "Thao tac": "Actions",
    "Thay doi trang thai va kha nang xuat hien tren public site.":
      "Change how this post is surfaced in the admin workspace and public site.",
    "Theo dõi thời hạn bảo hành, đại lý liên quan và xử lý ngoại lệ trực tiếp từ admin.":
      "Track warranty terms, linked dealers, and exception handling from one screen.",
    "Theo dõi ticket từ đại lý, điều phối trạng thái và phản hồi trực tiếp trong admin.":
      "Review dealer tickets, manage status, and reply directly from the admin app.",
    "Theo dõi vận hành, kho, dịch vụ sau bán và tài khoản nội bộ từ một nơi.":
      "Monitor commerce, inventory, after-sales, and internal access from one place.",
    "Theo dõi xử lý đơn, xác nhận trạng thái và ưu tiên giao hàng.":
      "Track the order queue, confirm status changes, and prioritize delivery.",
    "Thiết lập địa chỉ người gửi dùng cho email hệ thống.":
      "Configure the sender identity used by system emails.",
    "Thiết lập xác thực và thời lượng phiên đăng nhập cho tài khoản quản trị.":
      "Set sign-in verification and session duration for admin accounts.",
    "Thông báo khi có đơn mới hoặc đơn cần xử lý thêm.":
      "Notify the team about new orders or orders that need attention.",
    "Thông báo khi SKU giảm xuống ngưỡng tồn kho thấp.":
      "Notify when a SKU drops into the low-stock threshold.",
    "Thời điểm nhận": "Received at",
    "Thời điểm xử lý": "Resolved at",
    "Thời lượng phiên phải là số nguyên trong khoảng từ 5 đến 480 phút.":
      "Session timeout must be an integer between 5 and 480 minutes.",
    "Thu gọn kết quả": "Collapse results",
    "Thu thay doi bo loc hoac tu khoa tim kiem.":
      "Try adjusting filters or your search keywords.",
    "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.":
      "Try adjusting filters or your search keywords.",
    "Thử đổi bộ lọc hoặc import thêm serial.":
      "Try another filter or import more serials.",
    "Thử đổi bộ lọc hoặc tải lại dữ liệu.":
      "Try changing filters or reload the data.",
    "Thử đổi từ khóa tìm kiếm hoặc mời thêm người dùng.":
      "Try another search term or invite a new user.",
    "Thử lại": "Try again",
    "Thử thay đổi bộ lọc hoặc tải lại dữ liệu.":
      "Try another filter or reload the data.",
    "Thử thay đổi bộ lọc hoặc thêm quy tắc mới.":
      "Try another filter or create a new rule.",
    "Thực hiện import": "Run import",
    "Ticket đang chọn": "Selected ticket",
    "Ticket hỗ trợ mới từ {dealer}": "New support ticket from {dealer}",
    "Tieu de": "Title",
    "Tiến độ": "Progress",
    "Tiêu đề hoặc nội dung vượt quá giới hạn cho phép.":
      "Title or content exceeds the allowed length.",
    "Tim bai viet": "Search posts",
    "Tìm bảo hành": "Search warranties",
    "Tìm đại lý": "Search dealers",
    "Tìm đơn hàng": "Search orders",
    "Tìm đơn hàng, SKU, đại lý, bài viết...":
      "Search orders, SKUs, dealers, or posts...",
    "Tìm mã bảo hành, serial, khách hàng, đại lý...":
      "Search warranty code, serial, customer, dealer...",
    "Tìm mã đơn hoặc đại lý...": "Search by order code or dealer...",
    "Tìm mã ticket, đại lý, chủ đề...": "Search code, dealer, or subject...",
    "Tìm người dùng": "Search users",
    "Tìm quy tắc": "Search rules",
    "Tìm serial": "Search serials",
    "Tìm serial, sản phẩm, đại lý...":
      "Search serials, products, or dealers...",
    "Tim theo id, tieu de hoac danh muc...":
      "Search by id, title, or category...",
    "Tìm theo tên hoặc mã quy tắc...": "Search by label or rule id...",
    "Tìm theo tên, mã hoặc email...": "Search by name, code, or email...",
    "Tìm theo tên, vai trò, email hoặc mã...":
      "Search by name, role, email, or id...",
    "Tìm thông báo": "Search notifications",
    "Tìm ticket": "Search tickets",
    "Tìm tiêu đề, tài khoản, nội dung...":
      "Search title, account, or content...",
    "Toàn bộ chỉ số được lấy trực tiếp từ backend quản trị theo theme hiện tại.":
      "Metrics are loaded directly from the admin backend and adapt to the active theme.",
    "Tom tat": "Summary",
    "Tong bai viet": "Total posts",
    "Tổng doanh thu": "Total revenue",
    "Tổng đơn": "Total orders",
    "Tổng đơn hàng": "Total orders",
    "Tổng giá trị": "Total",
    "Tổng số yêu cầu được phép trong một cửa sổ thời gian.":
      "Total allowed requests inside one time window.",
    "Tổng tài khoản": "Total users",
    "Tra cứu bảo hành": "Warranty lookup",
    "Trả lại": "Returned",
    "Trang chu": "Homepage",
    "Trang hiện tại": "Current page",
    "Trang thai": "Status",
    "Trạng thái mới": "New status",
    "Tự động đăng xuất sau {n} phút không hoạt động. Khuyến nghị từ 15 đến 120 phút.":
      "Automatically sign out after {n} minutes of inactivity. Recommended range: 15 to 120 minutes.",
    "URL bằng chứng (mỗi dòng một URL)": "Proof URLs (one per line)",
    "Ưu tiên kiểm tra SKU tồn dưới hoặc bằng 10 để tránh gián đoạn đơn hàng.":
      "Check SKUs at or below 10 units before they block order fulfillment.",
    "Vai trò": "Role",
    "Ve danh sach bai viet": "Back to posts",
    "Vui lòng chọn sản phẩm và nhập ít nhất một serial hợp lệ.":
      "Select a product and enter at least one valid serial.",
    "Vui lòng chọn vai trò.": "Please select a role.",
    "Vui long nhap day du tieu de va danh muc.":
      "Please provide both a title and category.",
    "Vui lòng nhập đủ tên, ngưỡng và phần trăm hợp lệ.":
      "Enter a valid label, threshold, and percentage.",
    "Vui lòng nhập đủ tiêu đề và nội dung.": "Title and content are required.",
    "Vui lòng nhập email.": "Email is required.",
    "Vui lòng nhập họ và tên.": "Full name is required.",
    "Vui lòng nhập ít nhất một ID tài khoản hợp lệ.":
      "Enter at least one valid account id.",
    "Vui lòng nhập lý do.": "Please enter a reason.",
    "Vui lòng nhập nội dung.": "Content is required.",
    "Vui lòng nhập tiêu đề.": "Title is required.",
    Webhook: "Webhook",
    "Webhook token": "Webhook token",
    "Xac nhan doi trang thai": "Confirm status change",
    "Xác nhận": "Confirm",
    "Xác nhận cập nhật trạng thái": "Confirm status update",
    "Xác nhận đánh dấu hàng lỗi": "Confirm mark as defective",
    "Xác nhận đổi trạng thái": "Confirm status change",
    "Xác nhận đổi trạng thái người dùng": "Confirm user status change",
    "Xác nhận đổi trạng thái quy tắc": "Confirm rule status change",
    "Xác nhận đưa về kho": "Confirm restore to stock",
    "Xác nhận hủy bảo hành": "Confirm void warranty",
    "Xác nhận xóa serial": "Confirm delete serial",
    "Xem tất cả {count} kết quả": "View all {count} results",
    "Xem truoc bai viet": "Post preview",
    "XLSX + PDF": "XLSX + PDF",
    Xoa: "Delete",
    "Xoa bai": "Delete post",
    "Xoa bai viet": "Delete post",
    "Xóa đơn": "Delete order",
    "Xóa đơn hàng": "Delete order",
    "Xóa serial": "Delete serial",
    "Xử lý bởi": "Resolved by",
    "Yêu cầu quản trị viên xác nhận email trước khi hoàn tất đăng nhập.":
      "Require admins to confirm email before sign-in completes.",
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LANGUAGE_STORAGE_KEY = "admin_language";
const FALLBACK_LANGUAGE: Language = "vi";

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return FALLBACK_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "vi" || stored === "en") {
      return stored;
    }
  } catch {
    // ignore storage errors
  }

  const browserLang = window.navigator.language.toLowerCase();
  return browserLang.startsWith("en") ? "en" : FALLBACK_LANGUAGE;
};

const interpolate = (value: string, vars?: Record<string, string | number>) => {
  if (!vars) return value;
  return Object.keys(vars).reduce(
    (acc, key) => acc.replaceAll(`{${key}}`, String(vars[key])),
    value,
  );
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      } catch {
        // ignore storage errors
      }
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: string, vars?: Record<string, string | number>) => {
      const dictionary = translations[language] || {};
      const fallback = translations[FALLBACK_LANGUAGE] || {};
      const translated = dictionary[key] || fallback[key] || key;
      return interpolate(translated, vars);
    };

    return { language, setLanguage, t };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
