import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Language = 'vi' | 'en'

type TranslationMap = Record<string, string>
type LanguageContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const translations: Record<Language, TranslationMap> = {
  vi: {},
  en: {
    'Chuyển ngôn ngữ': 'Switch language',
    'Tổng quan': 'Overview',
    'Sản phẩm': 'Products',
    'Đơn hàng': 'Orders',
    'Bài viết': 'Posts',
    'Chiết khấu sỉ': 'Wholesale Discounts',
    'Khách hàng': 'Customers',
    'Quản trị': 'Admins',
    'Cài đặt': 'Settings',
    'Trung tâm vận hành': 'Operations center',
    'Hệ thống: Trực tuyến': 'System: Online',
    'Trưởng ca': 'Shift lead',
    'Đội quản trị': 'Admin team',
    'Không gian quản trị': 'Admin workspace',
    'Chào mừng, Admin': 'Welcome, Admin',
    'Tìm đơn, SKU...': 'Search orders, SKU...',
    'Sáng': 'Light',
    'Tối': 'Dark',
    'Trước': 'Previous',
    'Tiếp': 'Next',
    'Cảnh báo': 'Alerts',
    'Tài khoản': 'Account',
    'Bảng điều hành': 'Control panel',
    '4ThiTek Quản trị': '4ThiTek Admin',
    'Đăng nhập để truy cập hệ thống quản lý phân phối tai nghe SCS':
      'Sign in to access the SCS distribution admin system.',
    'Tên đăng nhập': 'Username',
    'Nhập tên đăng nhập': 'Enter username',
    'Mật khẩu': 'Password',
    'Nhập mật khẩu': 'Enter password',
    'Ghi nhớ đăng nhập': 'Remember me',
    'Bảo mật qua email': 'Email verification',
    'Đăng nhập': 'Sign in',
    'Hệ thống có thể yêu cầu xác thực email sau khi đăng nhập.':
      'The system may require email verification after sign-in.',
    'Phiên bản 1.0': 'Version 1.0',
    'Kỳ: {period} - Cập nhật lúc {time}':
      'Period: {period} - Updated at {time}',
    'Kỳ báo cáo': 'Reporting period',
    'Chọn kỳ báo cáo': 'Select reporting period',
    'Xuất báo cáo': 'Export report',
    'Khoảng thời gian tùy chỉnh': 'Custom time range',
    'Chọn ngày bắt đầu và kết thúc (đến hôm nay).':
      'Choose start and end dates (up to today).',
    'Từ ngày': 'From',
    'Đến ngày': 'To',
    'Áp dụng': 'Apply',
    'Sản phẩm nổi bật': 'Top products',
    'Tổng quan hệ thống': 'System overview',
    'Kênh bán & ưu đãi': 'Sales & incentives',
    'Nội bộ & nội dung': 'Operations & content',
    'Ngày': 'Day',
    'Tháng': 'Month',
    'Năm': 'Year',
    'Tùy chỉnh': 'Custom',
    'Hôm nay': 'Today',
    '12 tháng gần nhất': 'Last 12 months',
    '5 năm gần nhất': 'Last 5 years',
    'Từ {start} đến {end}': 'From {start} to {end}',
    '{count} ngày gần nhất': 'Last {count} days',
    '{count} tháng gần nhất': 'Last {count} months',
    '{count} năm gần nhất': 'Last {count} years',
    'Kỳ': 'Period',
    'Cập nhật lúc': 'Updated at',
    'Báo cáo tổng quan': 'Overview report',
    'Chỉ số chính': 'Key metrics',
    'Biến động': 'Change',
    'Đơn hàng chờ xử lý': 'Pending orders',
    'Tồn kho thấp (hiện tại)': 'Low stock (current)',
    'Cần bổ sung': 'Needs restock',
    'Đơn hàng theo trạng thái': 'Orders by status',
    'Xu hướng doanh số': 'Sales trend',
    'Xu hướng doanh số {subtitle}': 'Sales trend {subtitle}',
    'Phân bổ đơn hàng theo kỳ đã chọn':
      'Order distribution for the selected period',
    'Tổng': 'Total',
    'Tồn kho thấp - hiện tại': 'Low stock - current',
    '{count} chờ xử lý': '{count} pending',
    '{count} cần bổ sung': '{count} restock',
    '{count} bản nháp': '{count} drafts',
    'Doanh số': 'Sales',
    'Trung bình': 'Average',
    'mới': 'new',
    'chờ duyệt': 'pending approval',
    'chương trình': 'programs',
    'xuất bản': 'published',
    'bản nháp': 'drafts',
    'tài khoản': 'accounts',
    'sắp hết hạn': 'expiring soon',
    'Đóng gói': 'Packing',
    'Chờ duyệt': 'Pending approval',
    'Chờ xử lý': 'Pending',
    'Đang giao': 'Delivering',
    'Hoàn tất': 'Completed',
    'Hủy': 'Cancelled',
    'Theo dõi xử lý đơn và ưu tiên giao hàng.':
      'Track order processing and delivery priority.',
    'Tìm mã đơn...': 'Search order code...',
    'Tạo đơn': 'Create order',
    'Trạng thái': 'Status',
    'Quản lý bài viết, lịch đăng và thông tin SEO.':
      'Manage posts, publishing schedules, and SEO info.',
    'Tìm bài viết...': 'Search posts...',
    'Danh mục': 'Category',
    'Tạo bài mới': 'Create new post',
    '+4 trong tháng này': '+4 this month',
    'Đang bán': 'Active',
    'Hoạt động gần đây': 'Recent activity',
    'Cần xác nhận': 'Needs confirmation',
    'Cập nhật': 'Updated',
    'Lượt xem': 'Views',
    'Đã đăng': 'Published',
    'Hẹn giờ': 'Scheduled',
    'Đánh giá': 'Review',
    'Hướng dẫn': 'Guide',
    'So sánh': 'Comparison',
    'Xu hướng': 'Trends',
    '2 ngày trước': '2 days ago',
    '3 ngày trước': '3 days ago',
    '5 ngày trước': '5 days ago',
    'Quản lý đại lý, hạn mức và trạng thái mua hàng.':
      'Manage dealers, limits, and purchase status.',
    'Tìm khách hàng...': 'Search customers...',
    'Thêm khách hàng': 'Add customer',
    'Tổng đại lý': 'Total dealers',
    '+6 trong 30 ngày': '+6 in 30 days',
    '87% doanh thu tháng này': "87% of this month's revenue",
    'Cần chăm sóc': 'Needs attention',
    'Không mua trong 14 ngày': 'No purchases in 14 days',
    'Hạng': 'Tier',
    'Lần mua gần nhất': 'Last purchase',
    'Doanh thu': 'Revenue',
    'Doanh thu hôm nay': "Today's revenue",
    'Doanh thu 12 tháng gần nhất': 'Revenue for the last 12 months',
    'Doanh thu 5 năm gần nhất': 'Revenue for the last 5 years',
    'Doanh thu trong khoảng': 'Revenue for the selected range',
    'Bạch kim': 'Platinum',
    'Vàng': 'Gold',
    'Bạc': 'Silver',
    'Đồng': 'Bronze',
    'Đang hoạt động': 'Active',
    'Đang xem xét': 'Under review',
    'Hôm qua': 'Yesterday',
    '1 tuần trước': '1 week ago',
    '21 ngày trước': '21 days ago',
    'Quản lý nhân sự và phân quyền truy cập hệ thống.':
      'Manage staff and access permissions.',
    'Mời nhân sự': 'Invite staff',
    'Truy cập nhóm': 'Group access',
    'Admin hệ thống': 'System admin',
    'Quản lý sản phẩm': 'Product manager',
    'Marketing & Nội dung': 'Marketing & Content',
    'CSKH & Bảo hành': 'Customer care & Warranty',
    'Cấu hình bảo mật, thông báo và chính sách mặc định.':
      'Configure security, notifications, and default policies.',
    'Lưu thay đổi': 'Save changes',
    'Bảo mật': 'Security',
    'Xác nhận email': 'Email confirmation',
    'Yêu cầu admin xác nhận đăng nhập qua email.':
      'Require admin email confirmation for login.',
    'Cấu hình': 'Configure',
    'Hết phiên đăng nhập': 'Session timeout',
    'Tự động đăng xuất sau 30 phút.': 'Auto sign-out after 30 minutes.',
    'Điều chỉnh': 'Adjust',
    'Thông báo': 'Notifications',
    'Cảnh báo đơn hàng': 'Order alerts',
    'Thông báo khi có đơn hàng giá trị cao.':
      'Notify when there is a high-value order.',
    'Chỉnh sửa': 'Edit',
    'Cảnh báo tồn kho': 'Inventory alerts',
    'Gửi thông báo khi tồn kho thấp.':
      'Send notification when stock is low.',
    'Chiết khấu bán sỉ': 'Wholesale discounts',
    'Quản lý quy tắc chiết khấu bán sỉ theo ngưỡng doanh số.':
      'Manage wholesale discount rules by revenue thresholds.',
    'Quản lý sản phẩm và tồn kho.': 'Manage products and inventory.',
    'Tổng quan doanh số, đơn hàng, tồn kho và thống kê toàn hệ thống.':
      'Overview of revenue, orders, inventory, and system-wide stats.',
    'Tìm quy tắc...': 'Search rules...',
    'Bộ lọc': 'Filter',
    'Thêm quy tắc': 'Add rule',
    'Cập nhật gần đây': 'Recently updated',
    'Cần phê duyệt': 'Needs approval',
    'Doanh số áp dụng': 'Applicable revenue',
    'Ngưỡng cao nhất': 'Highest threshold',
    'Quy tắc': 'Rule',
    'Ngưỡng': 'Threshold',
    'Chiết khấu': 'Discount',
    'Đơn từ 50 triệu': 'Orders from 50 million',
    'Đơn từ 100 triệu': 'Orders from 100 million',
    'Đơn từ 200 triệu': 'Orders from 200 million',
    'Chương trình Q2': 'Q2 program',
    '50 - 100 triệu': '50 - 100 million',
    '100 - 200 triệu': '100 - 200 million',
    '>= 200 triệu': '>= 200 million',
    'Áp dụng theo chiến dịch': 'Applied by campaign',
    'Tìm tên, SKU...': 'Search name, SKU...',
    'Xuất bản: Tất cả': 'Publish: All',
    'Hủy xuất bản': 'Unpublish',
    'Đã xuất bản': 'Published',
    'Đã lưu trữ': 'Archived',
    'Đã xóa': 'Deleted',
    'Bản nháp': 'Draft',
    'Nổi bật: Tất cả': 'Featured: All',
    'Nổi bật': 'Featured',
    'Không nổi bật': 'Not featured',
    'Trang chủ: Tất cả': 'Homepage: All',
    'Trang chủ': 'Homepage',
    'Không ở trang chủ': 'Not on homepage',
    'Tồn kho: Tất cả': 'Stock: All',
    'Tồn kho thấp (<20)': 'Low stock (<20)',
    'Hết hàng': 'Out of stock',
    'Tất cả': 'All',
    'Tồn kho thấp': 'Low stock',
    'Đã lưu trữ / Đã xóa': 'Archived / Deleted',
    'Tên sản phẩm': 'Product name',
    'Giá': 'Price',
    'Tồn kho': 'Stock',
    'Xuất bản': 'Publish',
    'Có': 'Yes',
    'Không': 'No',
    'Xuất CSV': 'Export CSV',
    'Thêm sản phẩm': 'Add product',
    'Tổng SKU': 'Total SKUs',
    'Đang kinh doanh': 'On sale',
    'Thao tác': 'Actions',
    'Thử đổi bộ lọc hoặc từ khóa tìm kiếm.':
      'Try changing filters or search keywords.',
    'Chi tiết': 'Details',
    'Khôi phục': 'Restore',
    'Ẩn sản phẩm': 'Hide product',
    'Xóa': 'Delete',
    'Xóa vĩnh viễn': 'Delete permanently',
    'Chỉ xóa vĩnh viễn được khi đã ẩn sản phẩm':
      'Only permanently delete after hiding the product.',
    'Xóa vĩnh viễn sản phẩm này? Hành động không thể hoàn tác.':
      'Permanently delete this product? This action cannot be undone.',
    'Tạo sản phẩm': 'Create product',
    'Thông tin': 'Info',
    'Mô tả': 'Description',
    'Mô tả (Descriptions)': 'Descriptions',
    'Mô tả ngắn': 'Short description',
    'Mô tả chi tiết': 'Long description',
    'Giá bán lẻ': 'Retail price',
    'Th\u00f4ng tin c\u01a1 b\u1ea3n': 'Basic information',
    'Gi\u00e1 & tr\u1ea1ng th\u00e1i': 'Price & status',
    'Hi\u1ec3n th\u1ecb': 'Visibility',
    'Trạng thái xuất bản': 'Publish status',
    'Ảnh URL': 'Image URL',
    '\u1ea2nh s\u1ea3n ph\u1ea9m': 'Product image',
    'Ch\u1ecdn \u1ea3nh': 'Select image',
    '\u0110\u00e3 ch\u1ecdn': 'Selected',
    '\u0058\u00f3a \u1ea3nh': 'Remove image',
    'Đã chọn tệp ảnh cục bộ.': 'Selected a local image file.',
    'Đã chọn tệp video cục bộ.': 'Selected a local video file.',
    'Xem trước sẽ hiển thị sau khi lưu.': 'Preview will appear after saving.',
    'Chỉnh sửa chưa hỗ trợ tải tệp. Vui lòng dùng URL hoặc tạo mới.':
      'Editing does not support file uploads yet. Please use a URL or create a new product.',
    'PNG/JPG, t\u1ed1i \u0111a 10MB': 'PNG/JPG, up to 10MB',
    '\u1ea2nh t\u1ed1i \u0111a 10MB': 'Image size up to 10MB',
    'Xem trước': 'Preview',
    'Tiêu đề': 'Title',
    'Dùng mẫu': 'Use template',
    'Hình ảnh': 'Image',
    'Nhiều hình ảnh': 'Image gallery',
    'URL hình ảnh': 'Image URL',
    'Chú thích': 'Caption',
    'Thêm hình ảnh': 'Add image',
    'Ch?n nhi?u ?nh': 'Select multiple images',
    'Ch?a c? h?nh ?nh n?o.': 'No images yet.',
    'Th?m h?nh ?nh ??u ti?n': 'Add the first image',
    'Ch? th?ch b? ?nh': 'Gallery caption',
    'Thêm mục mô tả': 'Add description item',
    'Thông số': 'Specifications',
    'Thêm các đoạn mô tả ngắn cho sản phẩm.': 'Add short description sections for the product.',
    'Chưa có mô tả nào.': 'No descriptions yet.',
    'Thêm mô tả đầu tiên': 'Add the first description',
    'Thêm các thông số kỹ thuật quan trọng.': 'Add key technical specifications.',
    'Chưa có thông số nào.': 'No specifications yet.',
    'Thêm thông số đầu tiên': 'Add the first specification',
    'Thêm video giới thiệu hoặc hướng dẫn sản phẩm.': 'Add product intro or tutorial videos.',
    'Chưa có video nào.': 'No videos yet.',
    'Thêm video đầu tiên': 'Add the first video',
    '+ Thêm dòng mô tả': '+ Add description row',
    'Thông số (Specifications)': 'Specifications',
    'Nhãn': 'Label',
    'Giá trị': 'Value',
    '+ Thêm thông số': '+ Add specification',
    'Mở hộp': 'Unboxing',
    'Trình diễn': 'Demo',
    'URL video': 'Video URL',
    'URL ảnh thu nhỏ': 'Thumbnail URL',
    'Xóa video': 'Delete video',
    'Chọn video': 'Select video',
    'Video tối đa 10MB': 'Video size up to 10MB',
    '+ Thêm video': '+ Add video',
    'Vui lòng nhập tên sản phẩm': 'Please enter product name',
    'Vui lòng nhập SKU': 'Please enter SKU',
    'SKU đã tồn tại': 'SKU already exists',
    'Giá phải là số không âm': 'Price must be a non-negative number',
    'Tồn kho phải là số không âm': 'Stock must be a non-negative number',
    'Tạo': 'Create',
    'Không tìm thấy sản phẩm': 'Product not found',
    'SKU {sku} không tồn tại hoặc đã bị xóa.':
      'SKU {sku} does not exist or has been deleted.',
    'Quay lại danh sách': 'Back to list',
    'Cập nhật {date}': 'Updated {date}',
    'Tính năng (ngăn cách bằng dấu phẩy)':
      'Features (comma separated)',
    'Tính năng chính': 'Key features',
    'Ghi chú phát hành': 'Release notes',
    'Đã cập nhật bao bì và tối ưu đường âm cho lô sản xuất 2026.':
      'Updated packaging and optimized audio curve for the 2026 production batch.',
    'Video': 'Videos',
  },
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const LANGUAGE_STORAGE_KEY = 'admin_language'
const FALLBACK_LANGUAGE: Language = 'vi'

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return FALLBACK_LANGUAGE
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'vi' || stored === 'en') {
      return stored
    }
  } catch {
    // ignore storage errors
  }

  const browserLang = window.navigator.language.toLowerCase()
  return browserLang.startsWith('en') ? 'en' : FALLBACK_LANGUAGE
}

const interpolate = (
  value: string,
  vars?: Record<string, string | number>,
) => {
  if (!vars) return value
  return Object.keys(vars).reduce(
    (acc, key) => acc.replaceAll(`{${key}}`, String(vars[key])),
    value,
  )
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
      } catch {
        // ignore storage errors
      }
    }
  }, [language])

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: string, vars?: Record<string, string | number>) => {
      const dictionary = translations[language] || {}
      const fallback = translations[FALLBACK_LANGUAGE] || {}
      const translated = dictionary[key] || fallback[key] || key
      return interpolate(translated, vars)
    }

    return { language, setLanguage, t }
  }, [language])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}


