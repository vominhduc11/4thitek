import { AlertCircle, Eye, Loader2, Monitor, Smartphone, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Device = 'desktop' | 'mobile'

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

/**
 * Khung xem trước "sống" dùng chung cho sản phẩm & bài viết.
 *
 * Nhúng iframe main-fe (`previewPath`, ví dụ `/preview/product` hoặc `/preview/blog`)
 * rồi bơm dữ liệu bản nháp (đã được backend dry-run map sang public shape) qua
 * postMessage — KHÔNG lưu gì, chỉ render bằng đúng template storefront thật.
 *
 * Chỉ làm UI + cầu nối iframe; phần debounce + gọi API preview do màn hình cha đảm nhiệm
 * (xem useLivePreview) và truyền `data`/`error`/`loading` xuống. Nhãn lấy qua `t`.
 *
 * Docs: API_CONTRACT §5.1 "Live Preview".
 */
export function LivePreview({
  open,
  onClose,
  data,
  error,
  loading,
  device,
  onDeviceChange,
  webOrigin,
  previewPath,
  t,
}: {
  open: boolean
  onClose: () => void
  data: unknown
  error: Error | null
  loading: boolean
  device: Device
  onDeviceChange: (device: Device) => void
  webOrigin: string
  previewPath: string
  t: (text: string) => string
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)
  const dataRef = useRef(data)
  const frameHostRef = useRef<HTMLDivElement>(null)
  const [hostSize, setHostSize] = useState({ width: 0, height: 0 })

  // Panel là NON-MODAL: form bên trái vẫn thao tác được khi đang xem preview. Chỉ bắt
  // Escape để đóng — không trap focus.
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Bắt tay: iframe báo "ready" khi mount → gửi ngay payload hiện tại (đọc qua ref nên
  // không stale, và không setState trong effect).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (webOrigin && event.origin !== webOrigin) return
      if ((event.data as { type?: string } | undefined)?.type !== '4thitek-preview-ready') return
      readyRef.current = true
      const current = dataRef.current
      if (current) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: '4thitek-preview', data: current },
          webOrigin || '*',
        )
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [webOrigin])

  // Lưu data mới nhất + gửi sang iframe nếu đã bắt tay xong.
  useEffect(() => {
    dataRef.current = data
    if (readyRef.current && data) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: '4thitek-preview', data },
        webOrigin || '*',
      )
    }
  }, [data, webOrigin])

  // Đóng pane → reset readiness (ref mutation, không phải setState).
  useEffect(() => {
    if (!open) readyRef.current = false
  }, [open])

  // Đo vùng hiển thị để scale iframe vừa khung. useLayoutEffect đo trước khi paint nên
  // không nháy. ResizeObserver bắt cả khi cửa sổ/pane đổi kích thước.
  useLayoutEffect(() => {
    if (!open) return undefined
    const el = frameHostRef.current
    if (!el) return undefined
    const measure = () => setHostSize({ width: el.clientWidth, height: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  if (!open) return null

  const previewTitle = t('Xem trước trực tiếp')

  // Bề rộng "logic" để storefront tự quyết layout theo breakpoint: desktop = 1280,
  // mobile = 390. Khung preview hẹp hơn nên thu nhỏ vừa khít (chỉ scale xuống, tối đa 1).
  const FRAME_PAD = 12
  const targetWidth = device === 'mobile' ? 390 : 1280
  const availWidth = Math.max(0, hostSize.width - FRAME_PAD * 2)
  const availHeight = Math.max(0, hostSize.height - FRAME_PAD * 2)
  const scale = availWidth > 0 ? Math.min(1, availWidth / targetWidth) : 1

  return (
    // Không có lớp phủ full-viewport chặn click: panel chỉ chiếm dải bên phải, phần form
    // bên trái vẫn thao tác được trong lúc xem preview — đúng tinh thần "live".
    <aside
      aria-label={previewTitle}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[860px] flex-col border-l border-[var(--border)] bg-[var(--surface-muted,var(--surface))] shadow-2xl outline-none"
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2">
        <Eye size={16} className="text-[var(--accent)]" />
        <span className="text-sm font-medium text-[var(--text)]">{previewTitle}</span>
        {loading && <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />}

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <div className="flex overflow-hidden rounded-md border border-[var(--border)]">
            <button
              type="button"
              onClick={() => onDeviceChange('desktop')}
              aria-label={t('Máy tính')}
              className={classNames(
                'px-2 py-1 transition-colors',
                device === 'desktop'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted,var(--surface))]',
              )}
            >
              <Monitor size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDeviceChange('mobile')}
              aria-label={t('Điện thoại')}
              className={classNames(
                'px-2 py-1 transition-colors',
                device === 'mobile'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted,var(--surface))]',
              )}
            >
              <Smartphone size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('Đóng')}
            className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted,var(--surface))]"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Cảnh báo khi dry-run lỗi (thường là thiếu thông tin bắt buộc) */}
      {error && (
        <div className="flex items-start gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>
            {t('Chưa xem trước được — kiểm tra lại các thông tin bắt buộc (ví dụ: tên, danh mục).')}
            {import.meta.env.DEV && error.message ? ` (${error.message})` : ''}
          </span>
        </div>
      )}

      {/* Iframe storefront thật — render ở bề rộng desktop/mobile thật rồi scale vừa khung
          để thấy đúng layout theo breakpoint. */}
      <div ref={frameHostRef} className="flex flex-1 justify-center overflow-hidden bg-[var(--surface-muted,var(--surface))] p-3">
        <div
          className="overflow-hidden rounded-xl shadow-lg"
          style={{ width: Math.round(targetWidth * scale), height: availHeight || '100%' }}
        >
          <iframe
            ref={iframeRef}
            title={previewTitle}
            src={`${webOrigin}${previewPath}`}
            className="border-0 bg-white"
            style={{
              width: targetWidth,
              height: availHeight ? availHeight / scale : '100%',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>
    </aside>
  )
}
