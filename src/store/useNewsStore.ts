import { create } from 'zustand'
import type { NewsArticle } from '../types'

interface NewsState {
  cachedHeadlines: NewsArticle[]
  selectedArticle: NewsArticle | null
  breakingHeadline: string | null
  lastBreakingAt: number | null
  zoneNarrationCache: Record<string, string>
  setHeadlines: (a: NewsArticle[]) => void
  setSelectedArticle: (a: NewsArticle | null) => void
  setBreaking: (h: string | null) => void
  cacheZoneNarration: (zoneId: string, text: string) => void
}

export const useNewsStore = create<NewsState>((set) => ({
  cachedHeadlines: [],
  selectedArticle: null,
  breakingHeadline: null,
  lastBreakingAt: null,
  zoneNarrationCache: {},
  setHeadlines: (cachedHeadlines) => set({ cachedHeadlines }),
  setSelectedArticle: (selectedArticle) => set({ selectedArticle }),
  setBreaking: (breakingHeadline) =>
    set({ breakingHeadline, lastBreakingAt: breakingHeadline ? Date.now() : null }),
  cacheZoneNarration: (zoneId, text) =>
    set((s) => ({
      zoneNarrationCache: { ...s.zoneNarrationCache, [zoneId]: text },
    })),
}))
