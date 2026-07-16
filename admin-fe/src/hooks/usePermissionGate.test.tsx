// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePermissionGate } from './usePermissionGate'

const { hasPermissionMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ hasPermission: hasPermissionMock }),
}))

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ t: (value: string) => value }),
}))

describe('usePermissionGate', () => {
  it('cho phép khi user có permission code', () => {
    hasPermissionMock.mockReturnValue(true)
    const { result } = renderHook(() => usePermissionGate('orders.approve'))

    expect(result.current.allowed).toBe(true)
    expect(result.current.disabledProps).toEqual({})
  })

  it('disable kèm tooltip khi thiếu permission code', () => {
    hasPermissionMock.mockReturnValue(false)
    const { result } = renderHook(() => usePermissionGate('notifications.write'))

    expect(result.current.allowed).toBe(false)
    expect(result.current.disabledProps).toEqual({
      disabled: true,
      'aria-disabled': true,
      title: 'Bạn không có quyền thực hiện thao tác này',
    })
  })
})
