import type { ArcAnalysis } from '../../types'

export function ArcTimeline({ timeline }: { timeline: ArcAnalysis['timeline'] }) {
  return (
    <div className="relative overflow-x-auto pb-8">
      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-[var(--accent-red)] via-[var(--text-muted)] to-[var(--accent-green)]" />
      <div className="flex min-w-max gap-8 px-4">
        {timeline.map((ev, i) => {
          const up = i % 2 === 0
          const border =
            ev.sentiment === 'positive'
              ? 'border-[var(--accent-green)]'
              : ev.sentiment === 'negative'
                ? 'border-[var(--accent-red)]'
                : 'border-[var(--text-muted)]'
          const h = 40 + ev.importance * 16
          return (
            <div key={ev.date + ev.headline} className="relative flex w-48 flex-col items-center">
              <div
                className={`w-px bg-[var(--border-subtle)] ${up ? 'order-1 mb-2' : 'order-3 mt-2'}`}
                style={{ height: 24 }}
              />
              <div
                className={`order-2 rounded-xl border ${border} bg-[var(--bg-card)] p-3 shadow-lg`}
                style={{ minHeight: h }}
              >
                <p className="text-[10px] text-[var(--text-muted)]">{ev.date}</p>
                <p className="mt-1 text-xs font-medium text-[var(--text-primary)]">{ev.headline}</p>
                <p className="mt-2 text-[11px] text-[var(--text-secondary)]">{ev.event}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
