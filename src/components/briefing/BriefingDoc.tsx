import type { BriefingDoc as Doc } from '../../types'

export function BriefingDocView({ doc }: { doc: Doc }) {
  return (
    <div className="space-y-6">
      <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
          01 · Headline summary
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{doc.summary}</p>
      </article>

      <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
          02 · Key facts
        </p>
        <ol className="mt-3 space-y-2 border-l-2 border-[var(--accent-gold-dim)] pl-4">
          {doc.facts.map((f, i) => (
            <li key={i} className="text-sm text-[var(--text-secondary)]">
              {f}
            </li>
          ))}
        </ol>
      </article>

      <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
          03 · The players
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {doc.players.map((p, i) => (
            <div key={i} className="rounded-lg border border-[var(--border-subtle)] p-3">
              <p className="font-medium text-[var(--text-primary)]">{p.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{p.role}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{p.stance}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
          04 · Opposing views
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {doc.views.slice(0, 2).map((v, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 ${i === 0 ? 'border-[var(--accent-blue)]/40 bg-[#3a86ff]/5' : 'border-[var(--accent-red)]/40 bg-[#e63946]/5'}`}
            >
              <p className="text-xs uppercase text-[var(--text-muted)]">{v.side}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{v.text}</p>
              {v.attribution && <p className="mt-2 text-xs text-[var(--text-muted)]">{v.attribution}</p>}
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
          05 · Market / policy impact
        </p>
        <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">{doc.impact}</p>
      </article>

      <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
          06 · What to watch next
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {doc.watchNext.map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-[var(--border-subtle)] p-3">
              <span className="text-[var(--accent-gold)]">↗</span>
              <p className="text-sm text-[var(--text-secondary)]">{w}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
