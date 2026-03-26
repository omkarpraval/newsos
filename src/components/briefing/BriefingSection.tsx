import type { ReactNode } from 'react'

export function BriefingSection({
  n,
  title,
  children,
  onAsk,
}: {
  n: string
  title: string
  children: ReactNode
  onAsk?: () => void
}) {
  return (
    <section
      className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 transition hover:border-[var(--border)]"
      onClick={onAsk}
      onKeyDown={(e) => e.key === 'Enter' && onAsk?.()}
      role={onAsk ? 'button' : undefined}
      tabIndex={onAsk ? 0 : undefined}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
        {n} · {title}
      </p>
      <div className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] group-hover:underline group-hover:decoration-[var(--accent-gold)] group-hover:decoration-2">
        {children}
      </div>
    </section>
  )
}
