import { describe, expect, it } from 'vitest'
import { canAccessPath, firstAccessiblePath } from './navPermissions'

// Helpers mirroring AuthContext.hasPermission / hasRole for a fixed permission set.
const permCheck = (codes: string[]) => (code: string) =>
  codes.includes('*') || codes.includes(code)
const roleCheck = (roles: string[]) => (role: string) => roles.includes(role)

// A warehouse-scoped staff account: no dashboard.read edge case, no products/discounts/payments,
// not SUPER_ADMIN.
const WAREHOUSE = [
  'orders.read',
  'orders.process',
  'serials.read',
  'serials.write',
  'serials.assign',
  'warranties.read',
  'warranties.write',
  'returns.read',
  'returns.write',
  'notifications.read',
  'dashboard.read',
]

describe('navPermissions access rules', () => {
  it('grants a full-access (*) admin every module', () => {
    const hasPermission = permCheck(['*'])
    const hasRole = roleCheck(['SUPER_ADMIN'])
    expect(canAccessPath('/', hasPermission, hasRole)).toBe(true)
    expect(canAccessPath('/discounts', hasPermission, hasRole)).toBe(true)
    expect(canAccessPath('/users', hasPermission, hasRole)).toBe(true)
    expect(firstAccessiblePath(hasPermission, hasRole)).toBe('/')
  })

  it('gates read-code-less routes on their *.write code', () => {
    const editor = permCheck(['products.write', 'blogs.write', 'media.write', 'dashboard.read'])
    const hasRole = roleCheck([])
    expect(canAccessPath('/products', editor, hasRole)).toBe(true)
    expect(canAccessPath('/blogs', editor, hasRole)).toBe(true)
    expect(canAccessPath('/media', editor, hasRole)).toBe(true)
    // No discounts.write → discounts hidden.
    expect(canAccessPath('/discounts', editor, hasRole)).toBe(false)
  })

  it('hides modules a warehouse role lacks and keeps SUPER_ADMIN surfaces role-gated', () => {
    const hasPermission = permCheck(WAREHOUSE)
    const hasRole = roleCheck([]) // not SUPER_ADMIN

    // Allowed
    expect(canAccessPath('/serials', hasPermission, hasRole)).toBe(true)
    expect(canAccessPath('/warranties', hasPermission, hasRole)).toBe(true)
    expect(canAccessPath('/returns', hasPermission, hasRole)).toBe(true)
    expect(canAccessPath('/orders', hasPermission, hasRole)).toBe(true)

    // Denied by missing permission code
    expect(canAccessPath('/products', hasPermission, hasRole)).toBe(false)
    expect(canAccessPath('/discounts', hasPermission, hasRole)).toBe(false)
    expect(canAccessPath('/dealers', hasPermission, hasRole)).toBe(false)
    expect(canAccessPath('/financial-settlements', hasPermission, hasRole)).toBe(false)

    // Denied because SUPER_ADMIN-only surfaces stay role-gated, not permission-gated
    expect(canAccessPath('/users', hasPermission, hasRole)).toBe(false)
    expect(canAccessPath('/settings', hasPermission, hasRole)).toBe(false)
    expect(canAccessPath('/audit-logs', hasPermission, hasRole)).toBe(false)
  })

  it('lands a dashboard-less account on the first module it can access', () => {
    // Account without dashboard.read but with orders.read → first accessible is /orders.
    const hasPermission = permCheck(['orders.read', 'returns.read'])
    const hasRole = roleCheck([])
    expect(canAccessPath('/', hasPermission, hasRole)).toBe(false)
    expect(firstAccessiblePath(hasPermission, hasRole)).toBe('/orders')
  })

  it('returns null landing when no module is accessible', () => {
    const hasPermission = permCheck([])
    const hasRole = roleCheck([])
    expect(firstAccessiblePath(hasPermission, hasRole)).toBeNull()
  })

  it('treats unlisted paths (e.g. /profile) as open to any authenticated user', () => {
    const hasPermission = permCheck([])
    const hasRole = roleCheck([])
    expect(canAccessPath('/profile', hasPermission, hasRole)).toBe(true)
  })
})
