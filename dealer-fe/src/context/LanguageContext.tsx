import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Language = 'vi' | 'en'

type TranslationValue = string | { [key: string]: TranslationValue }
type Translations = Record<Language, TranslationValue>

type LanguageContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const translations: Translations = {
  vi: {
    common: {
      english: 'Tiếng Anh',
      vietnamese: 'Tiếng Việt',
      toggleLanguage: 'Chuyển ngôn ngữ',
      account: 'Tài khoản',
      logout: 'Đăng xuất',
    },
    nav: {
      dashboard: 'Tổng quan',
      products: 'Quản lý sản phẩm',
      cart: 'Giỏ hàng',
      orders: 'Đơn hàng',
      checkout: 'Thanh toán',
      reports: 'Báo cáo doanh số',
      support: 'Hỗ trợ',
      settings: 'Cài đặt',
    },
    sidebar: {
      navigation: 'Điều hướng',
    },
    header: {
      portal: 'Cổng đại lý SCS',
      brand: 'SCS | 4thitek',
      searchPlaceholder: 'Tìm tai nghe, mã đơn...',
      cart: 'Giỏ hàng',
      dealerName: 'Đại lý SCS Bình Minh',
    },
    quickStats: {
      title: 'Chỉ số nhanh',
      products: 'Sản phẩm',
      inCart: 'Trong giỏ',
      totalValue: 'Giá trị',
    },
    footer: {
      copyright: '© 2026 4thitek. Nhà phân phối tai nghe SCS.',
      privacy: 'Chính sách bảo mật',
      terms: 'Điều khoản dịch vụ',
      contact: 'Liên hệ',
      zalo: 'Zalo OA',
      facebook: 'Facebook',
    },
    dashboard: {
      promoLabel: 'Ưu đãi tháng này',
      promoTitle:
        'Giảm thêm 2% cho đơn tai nghe SCS từ 80 triệu trong tháng 2.',
      promoSubtitle: 'Kết hợp chính sách chiết khấu đại lý để tối ưu doanh số tai nghe SCS.',
      viewProducts: 'Xem sản phẩm',
      createOrder: 'Tạo đơn hàng',
      statCartValue: 'Giá trị giỏ',
      statProducts: 'Sản phẩm',
      statDiscount: 'Chiết khấu',
      statTier: 'Hạng đại lý',
      tierValue: 'Vàng',
      ordersThisMonth: 'Đơn hàng tháng này',
      ordersDelta: '+12% so với tháng trước',
      revenueEstimate: 'Doanh số ước tính',
      revenueUpdated: 'Đã cập nhật hôm nay',
      discountRate: 'Mức chiết khấu',
      recentOrdersTitle: 'Đơn hàng gần đây',
      recentOrdersSubtitle: 'Theo dõi nhanh trạng thái vận hành.',
      statusShipping: 'Đang giao',
      statusProcessing: 'Đang xử lý',
      statusCompleted: 'Hoàn tất',
      viewDetail: 'Xem chi tiết',
      tasksTitle: 'Nhắc việc',
      task1: 'Kiểm tra tồn kho cho dòng SCS AirBeat Pro trước ngày 10/02.',
      task2: 'Cập nhật chương trình trưng bày tai nghe true wireless SCS.',
      task3: 'Hoàn tất đối soát công nợ tuần này.',
      contactSupport: 'Liên hệ hỗ trợ',
      reportsTitle: 'Báo cáo chi tiết',
      reportsSubtitle: 'Theo dõi xu hướng doanh số, chiết khấu và sản phẩm bán chạy.',
      reportsCta: 'Xem báo cáo',
    },
    summary: {
      title: 'Tổng quan',
      subtitle: 'Theo dõi tổng giá trị và chiết khấu.',
      orderReady: 'Đã tạo đơn',
      orderPending: 'Chưa tạo đơn',
      cartQty: 'Số lượng trong giỏ',
      subtotal: 'Tổng trước giảm',
      discount: 'Chiết khấu',
      total: 'Cần thanh toán',
      applying: 'Đang áp dụng:',
      notEligible: 'Chưa đạt ngưỡng chiết khấu.',
    },
    discountRules: {
      title: 'Quy tắc chiết khấu',
      badge: 'Bán sỉ',
      subtitle: 'Chiết khấu được áp dụng trước thanh toán.',
      'qty-20': 'Giảm 4% cho 20+ sản phẩm',
      'qty-40': 'Giảm 7% cho 40+ sản phẩm',
      'total-50m': 'Giảm 8% cho đơn >= 50 triệu',
      'total-100m': 'Giảm 12% cho đơn >= 100 triệu',
    },
    products: {
      title: 'Quản lý sản phẩm',
      subtitle: 'Danh mục sản phẩm đang phân phối.',
      demoBadge: 'Dữ liệu mô phỏng',
      filters: 'Lọc nhanh',
      byCategory: 'Danh mục',
      all: 'Tất cả',
      addToCart: 'Thêm vào giỏ',
      minOrder: 'Tối thiểu',
      stock: 'Tồn kho',
      packSize: 'Quy cách',
      unitPrice: 'Giá',
      packLabel: 'Quy cách',
      pricePerUnit: 'Giá/{{unit}}',
      stockLabel: 'Tồn kho: {{stock}}',
      minOrderLabel: 'Tối thiểu: {{min}} {{unit}}',
      addQty: 'Thêm {{qty}}',
      inCart: 'Trong giỏ: {{qty}}',
    },
    cart: {
      title: 'Giỏ hàng',
      subtitle: 'Theo dõi đơn hàng trước khi tạo.',
      createdOrder:
        'Đơn hàng đã tạo. Vui lòng thanh toán tại trang',
      emptyTitle: 'Chưa có sản phẩm trong giỏ.',
      emptySubtitle: 'Thêm sản phẩm từ danh mục để bắt đầu đơn hàng.',
      itemsCount: '{{count}} mục',
      quantity: 'Số lượng',
      unitPrice: 'Đơn giá',
      lineTotal: 'Thành tiền',
      remove: 'Xóa',
      noteLabel: 'Ghi chú đơn hàng',
      notePlaceholder: 'Ví dụ: giao hàng trước 17h, gọi trước khi giao...',
      createOrder: 'Tạo đơn hàng',
      clearCart: 'Xóa giỏ hàng',
      total: 'Tổng thanh toán',
    },
    orders: {
      title: 'Đơn hàng',
      subtitle: 'Danh sách các đơn đã tạo.',
      id: 'Mã đơn',
      status: 'Trạng thái',
      products: 'Sản phẩm',
      total: 'Giá trị',
      date: 'Ngày tạo',
      paid: 'Đã thanh toán',
      unpaid: 'Chưa thanh toán',
      exportReport: 'Xuất báo cáo',
      itemsLabel: '{{count}} sản phẩm',
      statusShipping: 'Đang giao',
      statusProcessing: 'Đang xử lý',
      statusCompleted: 'Hoàn tất',
      statusCancelled: 'Đã hủy',
    },
    checkout: {
      title: 'Đơn hàng & thanh toán',
      subtitle: 'Chiết khấu được áp dụng trước khi thanh toán.',
      hint:
        'Tạo đơn hàng từ giỏ hàng để mở khóa thanh toán.',
      linkCart: 'Mở giỏ hàng',
      orderSummary: 'Thông tin đơn hàng',
      orderId: 'Mã đơn hàng',
      createdAt: 'Thời gian tạo',
      noteLabel: 'Ghi chú',
      subtotal: 'Tổng trước giảm',
      discount: 'Chiết khấu',
      total: 'Cần thanh toán',
      pay: 'Thanh toán',
      paid: 'Đã thanh toán',
      startNew: 'Tạo đơn mới',
      success:
        'Thanh toán thành công. Giá trị đã thu:',
    },
    reports: {
      title: 'Báo cáo doanh số',
      subtitle: 'Tổng hợp doanh thu, chiết khấu và hiệu suất bán tai nghe SCS.',
      rangeLabel: 'Khoảng thời gian',
      rangeThisMonth: 'Tháng này',
      rangeThisQuarter: 'Quý này',
      rangeLast6: '6 tháng gần nhất',
      export: 'Xuất báo cáo',
      monthlyRevenue: 'Doanh thu tháng',
      monthlyRevenueDelta: '+8% so với tháng trước',
      appliedDiscount: 'Chiết khấu đã áp dụng',
      discountNote: 'Tối ưu lợi nhuận đại lý tai nghe SCS.',
      completedOrders: 'Đơn hàng hoàn tất',
      completedNote: 'Tỷ lệ đúng hạn',
      trend: 'Xu hướng doanh thu',
      last6Months: '6 tháng gần nhất',
      monthLabels: 'T9,T10,T11,T12,T1,T2',
      topProducts: 'Sản phẩm bán chạy',
      monthlyTarget: 'Mục tiêu tháng',
      targetNote: 'Kế hoạch doanh thu cho tháng này.',
    },
    support: {
      title: 'Hỗ trợ',
      subtitle: 'Gửi yêu cầu để được hỗ trợ nhanh cho kênh đại lý SCS.',
      infoTitle: 'Thông tin hỗ trợ',
      infoPhone: 'Hotline',
      infoEmail: 'Email',
      infoHours: 'Giờ làm việc',
      infoChat: 'Chat nhanh',
      hotlineHours: '08:00 - 18:00 (T2 - T7)',
      emailResponse: 'Phản hồi trong 4 giờ',
      chatValue: 'Zalo OA',
      chatHours: 'Trực tuyến 24/7',
      formTitle: 'Gửi yêu cầu hỗ trợ',
      formSubtitle: 'Điền thông tin để đội ngũ chăm sóc đại lý SCS liên hệ lại.',
      name: 'Họ tên',
      phone: 'Số điện thoại',
      message: 'Nội dung',
      send: 'Gửi yêu cầu',
      namePlaceholder: 'Nguyễn Văn A',
      phonePlaceholder: '0909 123 456',
      messagePlaceholder: 'Mô tả vấn đề cần hỗ trợ',
    },
    settings: {
      title: 'Cài đặt',
      subtitle: 'Cập nhật thông tin đại lý và thiết lập bán tai nghe SCS.',
      dealerInfo: 'Thông tin đại lý',
      dealerId: 'Mã đại lý',
      name: 'Tên đại lý',
      email: 'Email',
      address: 'Địa chỉ',
      region: 'Khu vực',
      phone: 'Số điện thoại',
      contact: 'Liên hệ',
      notification: 'Thông báo',
      orderAlerts: 'Nhận cảnh báo đơn hàng',
      stockAlerts: 'Nhận cảnh báo tồn kho',
      promotions: 'Nhận thông tin khuyến mãi',
      weeklyReport: 'Báo cáo tuần qua email',
      save: 'Lưu thay đổi',
    },
    login: {
      title: 'Chào mừng quay lại',
      subtitle: 'Sử dụng tài khoản đại lý SCS để truy cập hệ thống.',
      account: 'Tài khoản',
      password: 'Mật khẩu',
      accountPlaceholder: 'Nhập tài khoản',
      passwordPlaceholder: 'Nhập mật khẩu',
      remember: 'Ghi nhớ đăng nhập',
      forgot: 'Quên mật khẩu?',
      submit: 'Đăng nhập',
      sectionLabel: 'Đăng nhập',
      portal: 'Cổng đại lý SCS',
      brand: 'SCS | 4thitek',
      version: 'Version 1.0',
      description:
        'Quản lý đơn tai nghe SCS, tồn kho và chương trình chiết khấu trong một bảng điều khiển thống nhất.',
      secure: 'Bảo mật',
      support: 'Hỗ trợ',
      access: 'Secure access',
      featureOverviewTitle: 'Danh mục tai nghe SCS',
      featureOverviewBody:
        'Theo dõi doanh số, chiết khấu và tiến độ thanh toán mỗi ngày.',
      featureSupportTitle: 'Hỗ trợ',
      featureSupportBody:
        'Kết nối nhanh với đội ngũ chăm sóc đại lý SCS khi cần trợ giúp.',
      copyright: '© 2026 4thitek | SCS',
      goDashboard: 'Vào trang tổng quan',
    },
    theme: {
      toLight: 'Chuyển sang giao diện sáng',
      toDark: 'Chuyển sang giao diện tối',
    },
  },
  en: {
    common: {
      english: 'English',
      vietnamese: 'Vietnamese',
      toggleLanguage: 'Switch language',
      account: 'Account',
      logout: 'Sign out',
    },
    nav: {
      dashboard: 'Overview',
      products: 'Products',
      cart: 'Cart',
      orders: 'Orders',
      checkout: 'Checkout',
      reports: 'Sales reports',
      support: 'Support',
      settings: 'Settings',
    },
    sidebar: {
      navigation: 'Navigation',
    },
    header: {
      portal: 'SCS Dealer Portal',
      brand: 'SCS | 4thitek',
      searchPlaceholder: 'Search headphones, order code...',
      cart: 'Cart',
      dealerName: 'Binh Minh SCS Dealer',
    },
    quickStats: {
      title: 'Quick stats',
      products: 'Products',
      inCart: 'In cart',
      totalValue: 'Total value',
    },
    footer: {
      copyright: '© 2026 4thitek. Official SCS headphone distributor.',
      privacy: 'Privacy policy',
      terms: 'Terms of service',
      contact: 'Contact',
      zalo: 'Zalo OA',
      facebook: 'Facebook',
    },
    dashboard: {
      promoLabel: 'This month offer',
      promoTitle: 'Extra 2% off SCS headphone orders over 80M in February.',
      promoSubtitle: 'Combine dealer discount policy to optimize SCS headphone sales.',
      viewProducts: 'View products',
      createOrder: 'Create order',
      statCartValue: 'Cart value',
      statProducts: 'Products',
      statDiscount: 'Discount',
      statTier: 'Dealer tier',
      tierValue: 'Gold',
      ordersThisMonth: 'Orders this month',
      ordersDelta: '+12% vs last month',
      revenueEstimate: 'Estimated revenue',
      revenueUpdated: 'Updated today',
      discountRate: 'Discount rate',
      recentOrdersTitle: 'Recent orders',
      recentOrdersSubtitle: 'Quickly track fulfillment status.',
      statusShipping: 'Shipping',
      statusProcessing: 'Processing',
      statusCompleted: 'Completed',
      viewDetail: 'View detail',
      tasksTitle: 'Reminders',
      task1: 'Check stock for SCS AirBeat Pro before 10/02.',
      task2: 'Update the SCS true wireless display program.',
      task3: 'Finalize weekly account reconciliation.',
      contactSupport: 'Contact support',
      reportsTitle: 'Detailed reports',
      reportsSubtitle: 'Track revenue trends, discounts, and top products.',
      reportsCta: 'View reports',
    },
    summary: {
      title: 'Summary',
      subtitle: 'Track totals and discounts.',
      orderReady: 'Order created',
      orderPending: 'No order yet',
      cartQty: 'Items in cart',
      subtotal: 'Subtotal',
      discount: 'Discount',
      total: 'Amount due',
      applying: 'Applying:',
      notEligible: 'Not eligible for discount.',
    },
    discountRules: {
      title: 'Discount rules',
      badge: 'Wholesale',
      subtitle: 'Discounts apply before payment.',
      'qty-20': '4% off for 20+ items',
      'qty-40': '7% off for 40+ items',
      'total-50m': '8% off orders >= 50M',
      'total-100m': '12% off orders >= 100M',
    },
    products: {
      title: 'Products',
      subtitle: 'Current wholesale catalog.',
      demoBadge: 'Demo data',
      filters: 'Quick filters',
      byCategory: 'Category',
      all: 'All',
      addToCart: 'Add to cart',
      minOrder: 'Minimum',
      stock: 'Stock',
      packSize: 'Pack size',
      unitPrice: 'Price',
      packLabel: 'Pack size',
      pricePerUnit: 'Price/{{unit}}',
      stockLabel: 'Stock: {{stock}}',
      minOrderLabel: 'Minimum: {{min}} {{unit}}',
      addQty: 'Add {{qty}}',
      inCart: 'In cart: {{qty}}',
    },
    cart: {
      title: 'Cart',
      subtitle: 'Review items before creating an order.',
      createdOrder:
        'Order created. Please proceed to',
      emptyTitle: 'Your cart is empty.',
      emptySubtitle: 'Add items from the catalog to start an order.',
      itemsCount: '{{count}} items',
      quantity: 'Quantity',
      unitPrice: 'Unit price',
      lineTotal: 'Line total',
      remove: 'Remove',
      noteLabel: 'Order note',
      notePlaceholder: 'e.g., deliver before 5pm, call before delivery...',
      createOrder: 'Create order',
      clearCart: 'Clear cart',
      total: 'Total payment',
    },
    orders: {
      title: 'Orders',
      subtitle: 'List of created orders.',
      id: 'Order ID',
      status: 'Status',
      products: 'Products',
      total: 'Total',
      date: 'Created',
      paid: 'Paid',
      unpaid: 'Unpaid',
      exportReport: 'Export report',
      itemsLabel: '{{count}} items',
      statusShipping: 'Shipping',
      statusProcessing: 'Processing',
      statusCompleted: 'Completed',
      statusCancelled: 'Cancelled',
    },
    checkout: {
      title: 'Order & payment',
      subtitle: 'Discounts apply before payment.',
      hint: 'Create an order from the cart to unlock payment.',
      linkCart: 'Open cart',
      orderSummary: 'Order summary',
      orderId: 'Order ID',
      createdAt: 'Created at',
      noteLabel: 'Note',
      subtotal: 'Subtotal',
      discount: 'Discount',
      total: 'Amount due',
      pay: 'Pay',
      paid: 'Paid',
      startNew: 'Start new order',
      success: 'Payment successful. Collected:',
    },
    reports: {
      title: 'Sales reports',
      subtitle: 'Revenue, discounts, and sales performance for SCS headphones.',
      rangeLabel: 'Range',
      rangeThisMonth: 'This month',
      rangeThisQuarter: 'This quarter',
      rangeLast6: 'Last 6 months',
      export: 'Export report',
      monthlyRevenue: 'Monthly revenue',
      monthlyRevenueDelta: '+8% vs last month',
      appliedDiscount: 'Discounts applied',
      discountNote: 'Optimized SCS dealer margin.',
      completedOrders: 'Orders completed',
      completedNote: 'On-time rate',
      trend: 'Revenue trend',
      last6Months: 'Last 6 months',
      monthLabels: 'Sep,Oct,Nov,Dec,Jan,Feb',
      topProducts: 'Top products',
      monthlyTarget: 'Monthly target',
      targetNote: 'Revenue plan for this month.',
    },
    support: {
      title: 'Support',
      subtitle: 'Send a request for quick support from the SCS dealer team.',
      infoTitle: 'Support info',
      infoPhone: 'Hotline',
      infoEmail: 'Email',
      infoHours: 'Working hours',
      infoChat: 'Quick chat',
      hotlineHours: '08:00 - 18:00 (Mon - Sat)',
      emailResponse: 'Reply within 4 hours',
      chatValue: 'Zalo OA',
      chatHours: 'Online 24/7',
      formTitle: 'Submit a request',
      formSubtitle: 'Share details so the SCS dealer care team can reach out.',
      name: 'Full name',
      phone: 'Phone number',
      message: 'Message',
      send: 'Send request',
      namePlaceholder: 'John Doe',
      phonePlaceholder: '0909 123 456',
      messagePlaceholder: 'Describe the issue you need help with',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Update dealer profile and SCS sales preferences.',
      dealerInfo: 'Dealer information',
      dealerId: 'Dealer ID',
      name: 'Dealer name',
      email: 'Email',
      address: 'Address',
      region: 'Region',
      phone: 'Phone number',
      contact: 'Contact',
      notification: 'Notifications',
      orderAlerts: 'Order alerts',
      stockAlerts: 'Stock alerts',
      promotions: 'Promotion updates',
      weeklyReport: 'Weekly report via email',
      save: 'Save changes',
    },
    login: {
      title: 'Welcome back',
      subtitle: 'Use your SCS dealer account to access the portal.',
      account: 'Account',
      password: 'Password',
      accountPlaceholder: 'Enter account',
      passwordPlaceholder: 'Enter password',
      remember: 'Remember me',
      forgot: 'Forgot password?',
      submit: 'Sign in',
      sectionLabel: 'Sign in',
      portal: 'SCS dealer portal',
      brand: 'SCS | 4thitek',
      version: 'Version 1.0',
      description:
        'Manage SCS headphone orders, inventory, and discount programs in one unified dashboard.',
      secure: 'Secure access',
      support: 'Support',
      access: 'Secure access',
      featureOverviewTitle: 'SCS headphone overview',
      featureOverviewBody:
        'Track revenue, discounts, and payment progress every day.',
      featureSupportTitle: 'Support',
      featureSupportBody:
        'Connect quickly with the SCS dealer care team when you need help.',
      copyright: '© 2026 4thitek | SCS',
      goDashboard: 'Go to dashboard',
    },
    theme: {
      toLight: 'Switch to light mode',
      toDark: 'Switch to dark mode',
    },
  },
}

const FALLBACK_LANGUAGE: Language = 'vi'

const getTranslation = (source: TranslationValue, path: string): TranslationValue | null => {
  const keys = path.split('.')
  let value: TranslationValue = source
  for (const key of keys) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      value = (value as Record<string, TranslationValue>)[key]
    } else {
      return null
    }
  }
  return value ?? null
}

const interpolate = (value: string, vars?: Record<string, string | number>) => {
  if (!vars) return value
  return Object.entries(vars).reduce((result, [key, replacement]) => {
    return result.replace(new RegExp(`{{${key}}}`, 'g'), String(replacement))
  }, value)
}

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return FALLBACK_LANGUAGE
  const stored = window.localStorage.getItem('language')
  if (stored === 'vi' || stored === 'en') {
    return stored
  }
  const navigatorLang = window.navigator.language.toLowerCase()
  return navigatorLang.startsWith('en') ? 'en' : 'vi'
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('language', language)
    }
  }, [language])

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: string, vars?: Record<string, string | number>) => {
      const current = getTranslation(translations[language], key)
      const fallback = getTranslation(translations[FALLBACK_LANGUAGE], key)
      const resolved =
        typeof current === 'string'
          ? current
          : typeof fallback === 'string'
            ? fallback
            : key
      return interpolate(resolved, vars)
    }

    return { language, setLanguage, t }
  }, [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
