import type { NewsArticle } from '../types'

const API_BASE = '/api/news'

type NewsProxyResult = {
  status?: string
  articles?: NewsArticle[]
  message?: string
  error?: string
  code?: string
}

async function readNews(url: string): Promise<NewsProxyResult> {
  const res = await fetch(url)
  let data: NewsProxyResult
  try {
    data = (await res.json()) as NewsProxyResult
  } catch {
    throw new Error(`News API failed: ${res.status}`)
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || `News API failed: ${res.status}`)
  }
  if (data.error) throw new Error(data.error)
  return data
}

export async function fetchHeadlines(category = 'business', pageSize = 12): Promise<NewsArticle[]> {
  const data = await readNews(`${API_BASE}?type=headlines&category=${encodeURIComponent(category)}&pageSize=${pageSize}`)
  return data.articles || []
}

export async function searchNews(query: string, pageSize = 20, daysBack = 14): Promise<NewsArticle[]> {
  const data = await readNews(
    `${API_BASE}?type=search&query=${encodeURIComponent(query)}&pageSize=${pageSize}&daysBack=${daysBack}`
  )
  return data.articles || []
}

export async function fetchArcArticles(query: string): Promise<NewsArticle[]> {
  const data = await readNews(`${API_BASE}?type=arc&query=${encodeURIComponent(query)}`)
  return data.articles || []
}

// Compatibility wrappers used by existing UI while migrating.
export async function fetchTopHeadlines(category?: string, pageSize = 10) {
  try {
    const articles = await fetchHeadlines(category || 'business', pageSize)
    return { status: 'ok', articles, message: '' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Headlines failed'
    return { status: 'error', articles: [] as NewsArticle[], message }
  }
}

export async function fetchGNewsTop() {
  return { articles: [] as { title: string; url: string; publishedAt?: string }[] }
}

/** Simple topic clustering: group by first significant word from titles */
export function clusterTopicsFromArticles(
  articles: { title: string; source?: { name?: string } }[],
  maxTopics = 10
): { keyword: string; count: number; sample: string }[] {
  const stop = new Set(['the', 'a', 'an', 'in', 'on', 'for', 'to', 'and', 'of', 'is', 'at'])
  const buckets = new Map<string, { count: number; sample: string }>()
  for (const a of articles) {
    const words = a.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stop.has(w))
    const kw = words[0] || 'news'
    const cur = buckets.get(kw) || { count: 0, sample: a.title }
    cur.count += 1
    buckets.set(kw, cur)
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, maxTopics)
    .map(([keyword, v]) => ({ keyword, count: v.count, sample: v.sample }))
}
