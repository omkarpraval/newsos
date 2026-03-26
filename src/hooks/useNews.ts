import { useQuery } from '@tanstack/react-query'
import { fetchTopHeadlines, searchNews } from '../services/newsapi'

const stale = 5 * 60 * 1000

export function useTopHeadlines(category?: string) {
  return useQuery({
    queryKey: ['headlines', category ?? 'business'],
    queryFn: async () => {
      const data = await fetchTopHeadlines(category, 12)
      if (data.status === 'error') {
        throw new Error(data.message || 'News fetch failed')
      }
      return data.articles ?? []
    },
    staleTime: stale,
    retry: 1,
  })
}

export function useSearchNews(q: string, enabled = true) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      const articles = await searchNews(q, 30)
      return articles
    },
    enabled: enabled && q.length > 1,
    staleTime: stale,
  })
}
