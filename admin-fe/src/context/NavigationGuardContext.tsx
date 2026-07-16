import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react'
import { Outlet, useBlocker } from 'react-router-dom'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { useLanguage } from '../context/LanguageContext'

type NavigationGuardContextValue = {
  registerDirty: (key: string, dirty: boolean) => void
  /**
   * Bỏ qua guard cho đúng MỘT lần điều hướng kế tiếp. Gọi ngay trước
   * `navigate()` khi việc rời trang đã được xác nhận/hợp lệ (sau khi lưu thành
   * công, hoặc sau khi user bấm đồng ý ở confirmDiscard) — tránh hỏi hai lần.
   */
  bypassNextNavigation: () => void
}

// Default no-op: page test render qua MemoryRouter không cần provider vẫn chạy được.
const NavigationGuardContext = createContext<NavigationGuardContextValue>({
  registerDirty: () => {},
  bypassNextNavigation: () => {},
})

/**
 * Đăng ký trạng thái dirty của một form với guard điều hướng trung tâm.
 * Guard (NavigationGuardRoot) chặn mọi điều hướng trong app — Link/sidebar,
 * navigate() lập trình, browser back/forward — khi còn form dirty, và hỏi xác
 * nhận trước khi rời. KHÔNG lưu draft ra storage (tránh lộ secret) — chỉ confirm.
 */
export function useDirtyGuard(isDirty: boolean) {
  const key = useId()
  const { registerDirty } = useContext(NavigationGuardContext)

  useEffect(() => {
    registerDirty(key, isDirty)
    return () => registerDirty(key, false)
  }, [key, isDirty, registerDirty])
}

/** Truy cập bypass một-lần của guard trung tâm (dùng trước navigate() sau khi lưu). */
export function useNavigationGuardBypass() {
  return useContext(NavigationGuardContext).bypassNextNavigation
}

/**
 * Route-shell bọc toàn bộ route tree (App.tsx). Yêu cầu data router
 * (createBrowserRouter) vì dùng useBlocker. Trạng thái dirty giữ trong ref để
 * shouldBlock luôn đọc giá trị mới nhất (kể cả khi navigate() chạy cùng event
 * handler với setState). Dialog xác nhận dùng react-modal qua useConfirmDialog
 * — có sẵn focus trap + Escape + aria.
 */
export function NavigationGuardRoot() {
  const dirtyKeysRef = useRef<Set<string>>(new Set())
  const bypassRef = useRef(false)
  const promptingRef = useRef(false)
  const { confirm, confirmDialog } = useConfirmDialog()
  const { t } = useLanguage()

  const registerDirty = useCallback((key: string, dirty: boolean) => {
    if (dirty) {
      dirtyKeysRef.current.add(key)
    } else {
      dirtyKeysRef.current.delete(key)
    }
  }, [])

  const bypassNextNavigation = useCallback(() => {
    bypassRef.current = true
  }, [])

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (currentLocation.pathname === nextLocation.pathname) {
      return false
    }
    if (bypassRef.current) {
      // Bypass một lần: tiêu thụ cờ rồi cho đi thẳng.
      bypassRef.current = false
      return false
    }
    return dirtyKeysRef.current.size > 0
  })

  useEffect(() => {
    if (blocker.state !== 'blocked' || promptingRef.current) {
      return
    }
    promptingRef.current = true
    void confirm({
      title: t('Thay đổi chưa lưu'),
      message: t(
        'Bạn có thay đổi chưa được lưu. Rời khỏi trang sẽ làm mất các thay đổi này. Bạn có chắc muốn tiếp tục?',
      ),
      tone: 'warning',
      confirmLabel: t('Rời khỏi'),
      cancelLabel: t('Ở lại'),
    }).then((approved) => {
      promptingRef.current = false
      if (blocker.state !== 'blocked') {
        return
      }
      if (approved) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    })
  }, [blocker, confirm, t])

  const value = useMemo(
    () => ({ registerDirty, bypassNextNavigation }),
    [registerDirty, bypassNextNavigation],
  )

  return (
    <NavigationGuardContext.Provider value={value}>
      <Outlet />
      {confirmDialog}
    </NavigationGuardContext.Provider>
  )
}
