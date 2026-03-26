import { create } from 'zustand'

type Article = {
  title: string
  description?: string
  url?: string
  urlToImage?: string
  source?: { name?: string }
  publishedAt?: string
}

type MarketData = { symbol: string; data: unknown | null; error?: string }

export type CustomChartData = {
  chartType: 'line' | 'bar' | 'scatter' | 'radar' | 'heatmap' | 'treemap' | 'gauge' | 'geo'
  title: string
  description: string
  labels: string[]
  datasets: Array<{ label: string; data: number[]; color: string }>
  insight: string
  dataSource: string
}

export type FullAnalysis = {
  headline: string
  summary: string
  keyPlayers: Array<{ name: string; role: string; stance: 'bullish' | 'bearish' | 'neutral' | 'warning'; impact: 'High' | 'Medium' | 'Low' }>
  sentimentByDate: Array<{ date: string; score: number; headline: string }>
  keyNumbers: Array<{ label: string; value: string; unit: string; change: string; sentiment: 'positive' | 'negative' | 'neutral' }>
  riskFactors: string[]
  catalysts: string[]
  prediction: { text: string; confidence: number; bullCase: string; bearCase: string; timeframe: string }
  watchSignals: string[]
  relatedTopics: string[]
  dnaProfile?: Record<string, number>
  hiddenSignals?: string[]
  riskMatrix?: {
    risks?: Array<{ name: string; probability: number; impact: number }>
    catalysts?: Array<{ name: string; probability: number; impact: number }>
  }
}

interface ArcStore {
  topic: string
  articles: Article[]
  analysis: FullAnalysis | null
  marketData: MarketData | null
  customCharts: CustomChartData[]
  comparisonTopic: string
  comparisonAnalysis: FullAnalysis | null
  isLoading: boolean
  isLoadingChart: boolean
  error: string | null
  setTopic: (topic: string) => void
  analyze: (topic: string) => Promise<void>
  generateCustomChart: (request: string) => Promise<void>
  removeCustomChart: (index: number) => void
  setComparisonTopic: (topic: string) => void
  compareTopics: () => Promise<void>
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init)
  const data = (await r.json()) as any
  if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`)
  return data as T
}

export const useArcStore = create<ArcStore>((set, get) => ({
  topic: 'Nifty 50',
  articles: [],
  analysis: null,
  marketData: null,
  customCharts: [],
  comparisonTopic: '',
  comparisonAnalysis: null,
  isLoading: false,
  isLoadingChart: false,
  error: null,

  setTopic: (topic) => set({ topic }),

  analyze: async (topic) => {
    set({ isLoading: true, error: null, analysis: null, articles: [], marketData: null })
    try {
      const [articlesRes, marketRes] = await Promise.all([
        readJson<{ articles: Article[] }>(`/api/arc/articles?topic=${encodeURIComponent(topic)}`),
        readJson<MarketData>(`/api/arc/market-data?topic=${encodeURIComponent(topic)}`),
      ])
      const articles = (articlesRes.articles || []).filter((a) => a?.title && a?.description)
      set({ articles, marketData: marketRes })
      if (!articles.length) throw new Error('No articles found for this topic in the last 14 days.')
      const analysis = await readJson<FullAnalysis>('/api/arc/full-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, articles, marketData: marketRes }),
      })
      set({ analysis })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Arc analysis failed'
      set({ error: message })
    } finally {
      set({ isLoading: false })
    }
  },

  generateCustomChart: async (request) => {
    const { topic, articles, marketData } = get()
    if (!request.trim()) return
    set({ isLoadingChart: true, error: null })
    try {
      const chart = await readJson<CustomChartData>('/api/arc/custom-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRequest: request, topic, articles, marketData }),
      })
      set((s) => ({ customCharts: [chart, ...s.customCharts] }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chart generation failed'
      set({ error: message })
    } finally {
      set({ isLoadingChart: false })
    }
  },

  removeCustomChart: (index) => set((s) => ({ customCharts: s.customCharts.filter((_, i) => i !== index) })),

  setComparisonTopic: (topic) => set({ comparisonTopic: topic }),

  compareTopics: async () => {
    const { comparisonTopic } = get()
    if (!comparisonTopic.trim()) return
    set({ error: null })
    try {
      const articlesRes = await readJson<{ articles: Article[] }>(`/api/arc/articles?topic=${encodeURIComponent(comparisonTopic)}`)
      const articles = (articlesRes.articles || []).filter((a) => a?.title && a?.description)
      const marketRes = await readJson<MarketData>(`/api/arc/market-data?topic=${encodeURIComponent(comparisonTopic)}`)
      const analysis = await readJson<FullAnalysis>('/api/arc/full-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: comparisonTopic, articles, marketData: marketRes }),
      })
      set({ comparisonAnalysis: analysis })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Comparison failed'
      set({ error: message })
    }
  },
}))

