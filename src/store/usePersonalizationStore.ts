import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ViewEvent {
  zoneId: string
  zoneName: string
  articleTitle: string
  timestamp: number
  dwellMs: number
}

interface PersonalizationState {
  viewHistory: ViewEvent[]
  interestScores: Record<string, number>
  isPersonalized: boolean
  dominantZone: string | null
  recordView: (event: Omit<ViewEvent, 'timestamp'>) => void
  analyzeInterests: () => void
  resetPersonalization: () => void
}

export const usePersonalizationStore = create<PersonalizationState>()(
  persist(
    (set, get) => ({
      viewHistory: [],
      interestScores: {},
      isPersonalized: false,
      dominantZone: null,
      recordView: (event) => {
        const newHistory = [...get().viewHistory, { ...event, timestamp: Date.now() }].slice(-50)
        set({ viewHistory: newHistory })
        if (newHistory.length >= 15 && newHistory.length % 5 === 0) {
          get().analyzeInterests()
        }
      },
      analyzeInterests: () => {
        const history = get().viewHistory
        if (history.length < 5) return
        const zoneStats: Record<string, { count: number; totalDwell: number }> = {}
        history.forEach((event) => {
          if (!zoneStats[event.zoneId]) zoneStats[event.zoneId] = { count: 0, totalDwell: 0 }
          zoneStats[event.zoneId].count++
          zoneStats[event.zoneId].totalDwell += event.dwellMs
        })
        const maxCount = Math.max(...Object.values(zoneStats).map((s) => s.count))
        const maxDwell = Math.max(...Object.values(zoneStats).map((s) => s.totalDwell / s.count))
        const scores: Record<string, number> = {}
        Object.entries(zoneStats).forEach(([zoneId, stats]) => {
          const frequencyScore = (stats.count / maxCount) * 50
          const avgDwell = stats.totalDwell / stats.count
          const dwellScore = maxDwell > 0 ? (avgDwell / maxDwell) * 50 : 0
          scores[zoneId] = Math.round(frequencyScore + dwellScore)
        })
        const topZone = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
        set({
          interestScores: scores,
          isPersonalized: true,
          dominantZone: topZone?.[0] || null,
        })
        console.log('[Personalization] Interest scores:', scores)
        console.log('[Personalization] Dominant zone:', topZone?.[0])
      },
      resetPersonalization: () =>
        set({
          viewHistory: [],
          interestScores: {},
          isPersonalized: false,
          dominantZone: null,
        }),
    }),
    { name: 'newsos-personalization' }
  )
)
