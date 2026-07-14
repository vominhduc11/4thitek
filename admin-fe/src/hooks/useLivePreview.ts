import { useEffect, useRef, useState } from 'react'

/**
 * Cầu nối debounce cho khung "Live Preview": mỗi khi form đổi (và panel đang mở), gọi
 * endpoint dry-run của backend để lấy public shape rồi trả về `{ data, error, loading }`
 * cho <LivePreview>. KHÔNG lưu gì — chỉ map bản nháp. Xem API_CONTRACT §5.1.
 *
 * `payload` là body gửi lên backend (BackendProductUpsertRequest / BackendBlogUpsertRequest);
 * hook so sánh bằng JSON để chỉ gọi lại khi nội dung thực sự đổi. `previewFn` đóng gói
 * token + endpoint (ví dụ `(body) => previewAdminProduct(token, body)`).
 */
export function useLivePreview<TBody, TData>({
  open,
  payload,
  previewFn,
  debounceMs = 400,
}: {
  open: boolean
  payload: TBody
  previewFn: (body: TBody) => Promise<TData>
  debounceMs?: number
}) {
  const [data, setData] = useState<TData | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)
  const previewFnRef = useRef(previewFn)
  previewFnRef.current = previewFn

  const payloadJson = open ? JSON.stringify(payload) : null

  useEffect(() => {
    if (!open || payloadJson == null) return undefined
    let cancelled = false
    const handle = window.setTimeout(() => {
      setLoading(true)
      previewFnRef.current(JSON.parse(payloadJson) as TBody)
        .then((result) => {
          if (cancelled) return
          setData(result)
          setError(null)
        })
        .catch((err) => {
          if (cancelled) return
          setError(err instanceof Error ? err : new Error(String(err)))
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, debounceMs)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [open, payloadJson, debounceMs])

  return { data, error, loading }
}
