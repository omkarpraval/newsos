import { motion } from 'framer-motion'
import type { NewsArticle } from '../../types'
import { useNarrator } from '../../hooks/useNarrator'
import { useNewsStore } from '../../store/useNewsStore'
import { useBehaviorStore } from '../../store/useBehaviorStore'

type Props = {
  article: NewsArticle
  headline: string
  summary: string
  badge?: string
  index?: number
}

export function NewsCard({ article, headline, summary, badge = 'News', index = 0 }: Props) {
  const { narrate } = useNarrator()
  const setArticle = useNewsStore((s) => s.setSelectedArticle)
  const track = useBehaviorStore((s) => s.track)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:scale-[1.02] hover:border-[var(--accent-gold)] hover:shadow-[0_0_32px_rgba(240,165,0,0.08)]"
    >
      <span className="inline-block rounded-md bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--persona-accent,var(--accent-gold))]">
        {badge}
      </span>
      <h3 className="mt-3 font-display text-lg leading-snug text-[var(--text-primary)]">{headline}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{summary}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
        <span>{article.source?.name ?? 'Source'}</span>
        <span>{article.publishedAt?.slice(0, 16) ?? ''}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:border-[var(--accent-gold)]"
          onClick={() => {
            track({
              type: 'article_click',
              articleId: article.url,
              category: ((article as NewsArticle & { category?: string }).category || 'general'),
              zone: 'dashboard',
              title: article.title,
            })
            setArticle(article)
          }}
        >
          Read More
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:border-[var(--accent-gold)]"
          onClick={() => {
            track({
              type: 'article_listen',
              articleId: article.url,
              category: ((article as NewsArticle & { category?: string }).category || 'general'),
            })
            narrate(summary)
          }}
        >
          Listen
        </button>
      </div>
    </motion.article>
  )
}
