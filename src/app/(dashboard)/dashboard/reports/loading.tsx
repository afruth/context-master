import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function ReportsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-8 bg-muted animate-pulse rounded w-64" />
        <div className="h-4 bg-muted animate-pulse rounded w-96" />
      </div>

      {/* Quick filters skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 bg-muted animate-pulse rounded w-24" />
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-fit">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded w-20" />
          ))}
        </div>

        {/* Filters card skeleton */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="h-6 bg-muted animate-pulse rounded w-32" />
          <div className="h-4 bg-muted animate-pulse rounded w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-20" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-muted animate-pulse rounded w-20" />
            <div className="h-10 bg-muted animate-pulse rounded w-24" />
          </div>
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-6 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-muted animate-pulse rounded w-24" />
                <div className="h-4 bg-muted animate-pulse rounded w-4" />
              </div>
              <div className="h-8 bg-muted animate-pulse rounded w-16" />
              <div className="h-3 bg-muted animate-pulse rounded w-32" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <div className="h-6 bg-muted animate-pulse rounded w-48" />
                <div className="h-4 bg-muted animate-pulse rounded w-64" />
              </div>
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}