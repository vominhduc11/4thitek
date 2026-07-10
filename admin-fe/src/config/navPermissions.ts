// Single source of truth for admin-fe navigation + route gating.
//
// Each primary module maps to either a granular permission code (see PERMISSION_MATRIX.md §3/§8)
// or the SUPER_ADMIN-only flag. The layout (nav filtering), the router (PermissionRoute), and the
// "first accessible module" redirect all read from this list so they can never drift.
//
// Routes whose backend read is open to any staff and has no dedicated `*.read` code
// (/products, /blogs, /discounts, /media) are intentionally gated on their `*.write` code —
// least-privilege UI, no invented codes. Recorded in PERMISSION_MATRIX.md §8.1.

export type NavAccessRule = {
  /** Primary route path, matching the NavItem `to` and the App.tsx route. */
  path: string
  /** Granular permission code required to see / enter the module. */
  permission?: string
  /** When true, gate on the SUPER_ADMIN role instead of a permission code (unchanged invariant). */
  superAdminOnly?: boolean
}

export type PermissionCheck = (code: string) => boolean
export type RoleCheck = (role: string) => boolean

// Ordered by nav appearance; the redirect helper lands the user on the first module they can access.
export const ROUTE_ACCESS: NavAccessRule[] = [
  { path: '/', permission: 'dashboard.read' },
  { path: '/reports', permission: 'reports.read' },
  { path: '/products', permission: 'products.write' },
  { path: '/orders', permission: 'orders.read' },
  { path: '/dealers', permission: 'dealers.read' },
  { path: '/discounts', permission: 'discounts.write' },
  { path: '/blogs', permission: 'blogs.write' },
  { path: '/warranties', permission: 'warranties.read' },
  { path: '/serials', permission: 'serials.read' },
  { path: '/notifications', permission: 'notifications.read' },
  { path: '/support-tickets', permission: 'support.read' },
  { path: '/media', permission: 'media.write' },
  { path: '/returns', permission: 'returns.read' },
  { path: '/payments/recent', permission: 'orders.payment.confirm' },
  { path: '/unmatched-payments', permission: 'orders.payment.confirm' },
  { path: '/financial-settlements', permission: 'orders.payment.confirm' },
  { path: '/users', superAdminOnly: true },
  { path: '/audit-logs', superAdminOnly: true },
  { path: '/settings', superAdminOnly: true },
]

export const ROUTE_ACCESS_BY_PATH: Record<string, NavAccessRule> = Object.fromEntries(
  ROUTE_ACCESS.map((rule) => [rule.path, rule]),
)

export const canAccessRule = (
  rule: NavAccessRule,
  hasPermission: PermissionCheck,
  hasRole: RoleCheck,
): boolean => {
  if (rule.superAdminOnly) {
    return hasRole('SUPER_ADMIN')
  }
  if (rule.permission) {
    return hasPermission(rule.permission)
  }
  return true
}

/** Access decision for a known module path. Unlisted paths (e.g. /profile) are open to any staff. */
export const canAccessPath = (
  path: string,
  hasPermission: PermissionCheck,
  hasRole: RoleCheck,
): boolean => {
  const rule = ROUTE_ACCESS_BY_PATH[path]
  if (!rule) {
    return true
  }
  return canAccessRule(rule, hasPermission, hasRole)
}

/** First module (in nav order) the user may access, or null when none are accessible. */
export const firstAccessiblePath = (
  hasPermission: PermissionCheck,
  hasRole: RoleCheck,
): string | null => {
  const match = ROUTE_ACCESS.find((rule) => canAccessRule(rule, hasPermission, hasRole))
  return match?.path ?? null
}
