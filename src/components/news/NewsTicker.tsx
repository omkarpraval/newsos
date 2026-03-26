import { useQuery } from '@tanstack/react-query'
import { fetchTopHeadlines } from '../../services/newsapi'
import { AnimatedTicker } from '../ui/AnimatedTicker'

export function NewsTicker() {
  const { data: articles } = useQuery({
    queryKey: ['ticker-headlines'],
    queryFn: async () => {
      const res = await fetchTopHeadlines('business', 8)
      return res.articles ?? []
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })

  const items =
    articles?.map((a) => a.title).filter(Boolean) ??
    ['NewsOS — connecting to live headlines…', 'Add VITE_NEWSAPI_KEY for real ticker data']

  return (
    <div className="h-9 w-full border-b border-[var(--border-subtle)] bg-black">
      <AnimatedTicker
        items={items}
        className="h-9 leading-9"
      />
      <div className="sr-only" aria-live="polite">
        Top headlines loaded
      </div>
    </div>
  )
}
