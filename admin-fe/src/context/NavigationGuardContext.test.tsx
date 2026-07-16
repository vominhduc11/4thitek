// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react'
import {
  createMemoryRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NavigationGuardRoot,
  useDirtyGuard,
  useNavigationGuardBypass,
} from './NavigationGuardContext'

const { confirmMock } = vi.hoisted(() => ({
  confirmMock: vi.fn(),
}))

vi.mock('../hooks/useConfirmDialog', () => ({
  useConfirmDialog: () => ({ confirm: confirmMock, confirmDialog: null }),
}))

vi.mock('./LanguageContext', () => ({
  useLanguage: () => ({ t: (value: string) => value }),
}))

let bypassFn: (() => void) | null = null

function DirtyPage({ dirty }: { dirty: boolean }) {
  useDirtyGuard(dirty)
  bypassFn = useNavigationGuardBypass()
  return <div>Trang có form</div>
}

function buildRouter(dirty: boolean) {
  return createMemoryRouter(
    createRoutesFromElements(
      <Route element={<NavigationGuardRoot />}>
        <Route path="/" element={<DirtyPage dirty={dirty} />} />
        <Route path="/orders" element={<div>Trang đơn hàng</div>} />
      </Route>,
    ),
  )
}

describe('NavigationGuardContext', () => {
  beforeEach(() => {
    confirmMock.mockReset()
    bypassFn = null
  })

  afterEach(() => {
    cleanup()
  })

  it('form dirty + chọn "Ở lại" → giữ nguyên route và draft', async () => {
    confirmMock.mockResolvedValue(false)
    const router = buildRouter(true)
    render(<RouterProvider router={router} />)

    await act(async () => {
      await router.navigate('/orders')
    })

    await waitFor(() => expect(confirmMock).toHaveBeenCalled())
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('form dirty + chọn "Rời khỏi" → điều hướng tiếp', async () => {
    confirmMock.mockResolvedValue(true)
    const router = buildRouter(true)
    render(<RouterProvider router={router} />)

    await act(async () => {
      await router.navigate('/orders')
    })

    await waitFor(() => expect(confirmMock).toHaveBeenCalled())
    await waitFor(() => expect(router.state.location.pathname).toBe('/orders'))
  })

  it('không dirty → điều hướng tự do, không hỏi', async () => {
    const router = buildRouter(false)
    render(<RouterProvider router={router} />)

    await act(async () => {
      await router.navigate('/orders')
    })

    expect(confirmMock).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/orders')
  })

  it('bypassNextNavigation bỏ qua guard đúng một lần (sau khi lưu thành công)', async () => {
    const router = buildRouter(true)
    render(<RouterProvider router={router} />)

    await act(async () => {
      bypassFn?.()
      await router.navigate('/orders')
    })

    expect(confirmMock).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/orders')
  })
})
