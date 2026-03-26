import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BehaviorEvent =
  | { type: 'article_click'; articleId: string; category: string; zone: string; title: string }
  | { type: 'article_read'; articleId: string; dwellMs: number; category: string }
  | { type: 'article_listen'; articleId: string; category: string }
  | { type: 'briefing_generated'; topic: string; category: string }
  | { type: 'charcha_mention'; topic: string; category: string }
  | { type: 'zone_visit'; zone: string; dwellMs: number }
  | { type: 'search_query'; query: string }
  | { type: 'language_switch'; language: string }

type StoredBehaviorEvent = BehaviorEvent & { timestamp: number }

interface CategoryScore {
  category: string
  score: number
  clicks: number
  totalDwellMs: number
  lastInteraction: number
  trend: 'rising' | 'stable' | 'falling'
}

interface BehaviorState {
  events: StoredBehaviorEvent[]
  categoryScores: Record<string, CategoryScore>
  topCategories: string[]
  recentSearches: string[]
  totalArticlesRead: number
  totalDwellMs: number
  sessionStartTime: number
  track: (event: BehaviorEvent) => void
  recalculateScores: () => void
  getPersonalizedCategories: () => string[]
  reset: () => void
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  article_click: 10,
  article_read: 20,
  article_listen: 15,
  briefing_generated: 25,
  charcha_mention: 30,
  zone_visit: 5,
}

export const useBehaviorStore = create<BehaviorState>()(
  persist(
    (set, get) => ({
      events: [],
      categoryScores: {},
      topCategories: [],
      recentSearches: [],
      totalArticlesRead: 0,
      totalDwellMs: 0,
      sessionStartTime: Date.now(),

      track: (event) => {
        const stamped: StoredBehaviorEvent = { ...event, timestamp: Date.now() }
        const events = [...get().events, stamped].slice(-200)
        set({ events })

        if (stamped.type === 'article_read') {
          set((s) => ({
            totalArticlesRead: s.totalArticlesRead + 1,
            totalDwellMs: s.totalDwellMs + stamped.dwellMs,
          }))
        }
        if (stamped.type === 'search_query') {
          set((s) => ({
            recentSearches: [stamped.query, ...s.recentSearches.filter((q) => q !== stamped.query)].slice(0, 10),
          }))
        }
        if (events.length % 3 === 0) get().recalculateScores()
      },

      recalculateScores: () => {
        const events = get().events
        const now = Date.now()
        const scores: Record<string, CategoryScore> = {}

        events.forEach((event) => {
          const category = 'category' in event ? event.category : event.type === 'zone_visit' ? event.zone : ''
          if (!category) return
          let points = CATEGORY_WEIGHTS[event.type] || 5
          if (event.type === 'article_read') {
            const dwellBonus = Math.min((event.dwellMs / 1000 / 60) * 10, 20)
            points += dwellBonus
          }
          const ageHours = (now - event.timestamp) / 3600000
          const recencyMultiplier = Math.max(0.3, 1 - ageHours / 48)
          points *= recencyMultiplier

          if (!scores[category]) {
            scores[category] = {
              category,
              score: 0,
              clicks: 0,
              totalDwellMs: 0,
              lastInteraction: now,
              trend: 'stable',
            }
          }
          const prev = scores[category].score
          scores[category].score = Math.min(100, scores[category].score + points)
          scores[category].lastInteraction = now
          if (scores[category].score > prev + 5) scores[category].trend = 'rising'
          else if (scores[category].score < prev - 2) scores[category].trend = 'falling'
          else scores[category].trend = 'stable'
          if (event.type === 'article_click') scores[category].clicks++
          if (event.type === 'article_read') scores[category].totalDwellMs += event.dwellMs
        })

        const topCategories = Object.entries(scores)
          .sort((a, b) => b[1].score - a[1].score)
          .map(([cat]) => cat)
        set({ categoryScores: scores, topCategories })
      },

      getPersonalizedCategories: () => {
        const top = get().topCategories
        if (!top.length) return ['business', 'general', 'technology', 'politics']
        const personalized = top.slice(0, 3)
        if (!personalized.includes('general')) personalized.push('general')
        return personalized
      },

      reset: () =>
        set({
          events: [],
          categoryScores: {},
          topCategories: [],
          recentSearches: [],
          totalArticlesRead: 0,
          totalDwellMs: 0,
          sessionStartTime: Date.now(),
        }),
    }),
    { name: 'newsos-behavior' }
  )
)
