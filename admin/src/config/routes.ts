/**
 * Centralized Routes Configuration
 * Removes hardcoded URLs throughout the application
 */

export const ROUTES = {
  // Authentication routes
  LOGIN: '/login',
  LOGOUT: '/logout',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Main app routes
  HOME: '/',
  DASHBOARD: '/dashboard',

  // Product routes
  PRODUCTS: '/products',
  PRODUCT_CREATE: '/products/create',
  PRODUCT_EDIT: '/products/edit',
  PRODUCT_DETAIL: '/products/:id',

  // Order routes
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',

  // Blog routes
  BLOGS: '/blogs',
  BLOG_CREATE: '/blogs/create',
  BLOG_EDIT: '/blogs/edit',
  BLOG_DETAIL: '/blogs/:id',

  // Dealer routes
  DEALERS: '/dealers',
  DEALER_DETAIL: '/dealers/:id',

  // Settings
  SETTINGS: '/settings',
  PROFILE: '/profile',

  // Reports
  REPORTS: '/reports',

  // Admin management
  ADMIN_MANAGEMENT: '/admin-management',

  // Customers
  CUSTOMERS: '/customers',

  // Notifications
  NOTIFICATIONS: '/notifications',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];

/**
 * Helper function to build route with parameters
 * @example buildRoute(ROUTES.PRODUCT_DETAIL, { id: '123' }) => '/products/123'
 */
export const buildRoute = (route: string, params?: Record<string, string | number>): string => {
  if (!params) return route;

  let builtRoute = route;
  Object.entries(params).forEach(([key, value]) => {
    builtRoute = builtRoute.replace(`:${key}`, String(value));
  });

  return builtRoute;
};
