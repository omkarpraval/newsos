const NEWS_KEY = process.env.NEWSAPI_KEY || process.env.VITE_NEWSAPI_KEY
const BASE = 'https://newsapi.org/v2'

function getFromDate(daysBack = 7): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.min(daysBack, 28))
  return d.toISOString().split('T')[0]
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!NEWS_KEY) {
    res.status(500).json({ error: 'NEWSAPI_KEY not set in environment' })
    return
  }

  const { type, query, category, pageSize = 12, daysBack = 7 } = req.query || {}

  try {
    let url = ''
    if (type === 'headlines' || !type) {
      url = `${BASE}/top-headlines?country=in&category=${category || 'business'}&pageSize=${pageSize}&apiKey=${NEWS_KEY}`
    } else if (type === 'search') {
      const from = getFromDate(Number(daysBack))
      url = `${BASE}/everything?q=${encodeURIComponent(String(query || 'India business'))}&language=en&sortBy=publishedAt&from=${from}&pageSize=${pageSize}&apiKey=${NEWS_KEY}`
    } else if (type === 'arc') {
      const from = getFromDate(14)
      url = `${BASE}/everything?q=${encodeURIComponent(String(query || 'India business'))}&language=en&sortBy=publishedAt&from=${from}&pageSize=20&apiKey=${NEWS_KEY}`
    } else {
      url = `${BASE}/top-headlines?country=in&category=business&pageSize=${pageSize}&apiKey=${NEWS_KEY}`
    }

    // eslint-disable-next-line no-console
    console.log('Fetching NewsAPI:', url.replace(NEWS_KEY, '[KEY]'))
    const response = await fetch(url)
    const data = (await response.json()) as {
      status?: string
      message?: string
      code?: string
      articles?: Array<Record<string, unknown>>
    }

    if (data.status === 'error') {
      // eslint-disable-next-line no-console
      console.error('NewsAPI error:', data.message)
      res.status(400).json({ error: data.message, code: data.code })
      return
    }

    const articles = (data.articles || []).filter((a) => {
      const title = String(a.title || '')
      const desc = String(a.description || '')
      return title && title !== '[Removed]' && desc && desc !== '[Removed]'
    })

    res.json({ status: 'ok', articles, totalResults: articles.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'News proxy error'
    // eslint-disable-next-line no-console
    console.error('News proxy error:', message)
    res.status(500).json({ error: message })
  }
}
