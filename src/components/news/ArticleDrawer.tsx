import { AnimatePresence, motion } from 'framer-motion'
import { useNarrator } from '../../hooks/useNarrator'
import { useNewsStore } from '../../store/useNewsStore'
import { useNavigate } from 'react-router-dom'
import { useBehaviorStore } from '../../store/useBehaviorStore'
import { useEffect, useRef } from 'react'

export function ArticleDrawer() {
  const article = useNewsStore((s) => s.selectedArticle)
  const setArticle = useNewsStore((s) => s.setSelectedArticle)
  const { narrate, stop } = useNarrator()
  const navigate = useNavigate()
  const track = useBehaviorStore((s) => s.track)
  const openedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (article) openedAtRef.current = Date.now()
  }, [article])

  const close = () => {
    if (article && openedAtRef.current) {
      track({
        type: 'article_read',
        articleId: article.url,
        dwellMs: Date.now() - openedAtRef.current,
        category: ((article as typeof article & { category?: string }).category || 'general'),
      })
    }
    stop()
    setArticle(null)
    openedAtRef.current = null
  }

  return (
    <AnimatePresence>
      {article && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            aria-hidden
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label="Article"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-xl text-[var(--text-primary)]">{article.title}</h2>
              <button
                type="button"
                aria-label="Close article"
                className="rounded-lg border border-[var(--border-subtle)] px-2 py-1 text-sm text-[var(--text-secondary)] hover:border-[var(--accent-gold)]"
                onClick={close}
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {article.source?.name ?? 'Source'} · {article.publishedAt?.slice(0, 16) ?? ''}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              {article.description || article.content?.slice(0, 800) || 'No preview available.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent-gold)]"
                onClick={() => {
                  track({
                    type: 'article_listen',
                    articleId: article.url,
                    category: ((article as typeof article & { category?: string }).category || 'general'),
                  })
                  narrate(article.description || article.title)
                }}
              >
                Listen
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent-gold)]"
                onClick={() => {
                  close()
                  navigate('/briefing')
                }}
              >
                Deep Briefing
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent-gold)]"
                onClick={() => {
                  void navigator.clipboard.writeText(article.url)
                }}
              >
                Share link
              </button>
            </div>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 text-sm text-[var(--accent-gold)] hover:underline"
              >
                Open original source →
              </a>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
