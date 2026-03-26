import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

export function OwlNotification({
  headline,
  onDismiss,
}: {
  headline: string | null
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!headline) return
    const t = window.setTimeout(() => onDismiss(), 8000)
    return () => window.clearTimeout(t)
  }, [headline, onDismiss])

  return (
    <AnimatePresence>
      {headline && (
        <motion.div
          role="alert"
          initial={{ x: 120, y: -80, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={{ x: 120, y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="fixed right-6 top-24 z-[60] max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl" aria-hidden>
              🦉
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
                Breaking
              </p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{headline}</p>
              <button
                type="button"
                className="mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--accent-gold)]"
                onClick={onDismiss}
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
