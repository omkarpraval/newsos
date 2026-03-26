import { useUserStore } from '../../store/useUserStore'
import type { UiLanguage } from '../../types'

const options: { code: UiLanguage; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
]

export function LanguageSelector() {
  const language = useUserStore((s) => s.language)
  const setLanguage = useUserStore((s) => s.setLanguage)

  return (
    <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
      <span className="sr-only">Language</span>
      <select
        aria-label="Interface language"
        className="cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2 py-1 text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
        value={language}
        onChange={(e) => setLanguage(e.target.value as UiLanguage)}
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
