import { LoadingRows, PagePanel } from './ui-kit'

const RouteFallback = () => (
  <PagePanel>
    <div className="space-y-4">
      <div className="h-6 w-48 animate-pulse rounded-xl bg-[var(--accent-soft)]" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded-xl bg-[var(--surface-muted)]" />
    </div>
    <div className="mt-6">
      <LoadingRows rows={5} />
    </div>
  </PagePanel>
)

export default RouteFallback
