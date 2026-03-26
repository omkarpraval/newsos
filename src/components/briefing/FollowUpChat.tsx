import { useState } from 'react'
import { answerAboutSection } from '../../services/groq'
import type { Persona } from '../../types'

export function FollowUpChat({
  sectionText,
  topic,
  persona,
}: {
  sectionText: string
  topic: string
  persona: Persona
}) {
  const [q, setQ] = useState('')
  const [a, setA] = useState('')
  const chips = [
    'Explain this simply',
    "What's the historical context?",
    `How does this affect me as a ${persona}?`,
  ]

  async function ask(question: string) {
    const ans = await answerAboutSection(sectionText, question, persona, topic)
    setA(ans)
  }

  return (
    <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
      <p className="text-xs text-[var(--text-muted)]">Ask about this section</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]"
            onClick={() => void ask(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        className="mt-3 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
        placeholder="Your question…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && q && void ask(q)}
      />
      {a && <p className="mt-2 border-t border-[var(--border-subtle)] pt-2 text-sm text-[var(--text-secondary)]">{a}</p>}
    </div>
  )
}
