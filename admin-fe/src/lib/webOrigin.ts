// Origin của site public (main-fe) để nhúng khung xem trước /preview/*.
// Local dev mặc định main-fe chạy ở cổng 3000; production set qua VITE_WEB_ORIGIN.
// Xem docs/DEPLOYMENT_GUIDE "Frontend env cho Live Preview".
const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

export const WEB_ORIGIN = trimTrailingSlash(
  (import.meta.env.VITE_WEB_ORIGIN ?? 'http://localhost:3000').trim(),
)
