import { LoadingRows, PagePanel } from './ui-kit'

const RouteFallback = () => (
  <PagePanel>
    <div className="space-y-4">
      <div className="h-6 w-48 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-700/40" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-700/40" />
    </div>
    <div className="mt-6">
      <LoadingRows rows={5} />
    </div>
  </PagePanel>
)

export default RouteFallback
