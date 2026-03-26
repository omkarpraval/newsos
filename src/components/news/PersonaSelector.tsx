import { motion } from 'framer-motion'
import type { Persona } from '../../types'
import { useEffect, useState } from 'react'
import { SafeLottie } from '../ui/SafeLottie'

const cards: {
  id: Persona
  title: string
  label: string
  lottie: string
}[] = [
  {
    id: 'trader',
    title: 'The Trader',
    label: 'I track markets & portfolios',
    lottie: '/lottie/chart.json',
  },
  {
    id: 'founder',
    title: 'The Founder',
    label: 'I follow startups & funding',
    lottie: '/lottie/rocket.json',
  },
  {
    id: 'learner',
    title: 'The Learner',
    label: 'I want to understand the world',
    lottie: '/lottie/book.json',
  },
]

export function PersonaSelector({
  selected,
  onSelect,
}: {
  selected: Persona | null
  onSelect: (p: Persona) => void
}) {
  const [data, setData] = useState<Record<string, object>>({})

  useEffect(() => {
    cards.forEach((c) => {
      fetch(c.lottie)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setData((d) => ({ ...d, [c.id]: j })))
        .catch(() => {})
    })
  }, [])

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {cards.map((c, i) => (
        <motion.button
          key={c.id}
          type="button"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 120, damping: 18 }}
          onClick={() => onSelect(c.id)}
          className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-left transition hover:scale-[1.02] hover:border-[var(--accent-gold)] hover:shadow-[0_0_40px_rgba(240,165,0,0.12)] ${
            selected === c.id ? 'ring-2 ring-[var(--accent-gold)]' : ''
          }`}
          aria-pressed={selected === c.id}
        >
          <div className="h-28 w-28">
            {data[c.id] ? (
              <SafeLottie animationData={data[c.id]} loop />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
                …
              </div>
            )}
          </div>
          <p className="mt-4 font-display text-lg text-[var(--text-primary)]">{c.title}</p>
          <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">{c.label}</p>
        </motion.button>
      ))}
    </div>
  )
}
