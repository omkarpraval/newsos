export function ShimmerCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl border border-[var(--border-subtle)] p-4 ${className}`}
      aria-hidden
    >
      <div className="mb-3 h-4 w-2/3 rounded bg-[var(--bg-elevated)]" />
      <div className="mb-2 h-3 w-full rounded bg-[var(--bg-elevated)]" />
      <div className="h-3 w-5/6 rounded bg-[var(--bg-elevated)]" />
    </div>
  )
}
