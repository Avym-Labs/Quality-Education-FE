export function SkeletonBox({ className = '' }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-xl ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant p-stack-md space-y-3">
      <SkeletonBox className="h-10 w-10 rounded-xl" />
      <SkeletonBox className="h-4 w-24" />
      <SkeletonBox className="h-7 w-16" />
    </div>
  )
}

export function SkeletonList({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-stack-md bg-surface-container-lowest rounded-2xl border border-outline-variant">
          <SkeletonBox className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-3/4" />
            <SkeletonBox className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
