import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type VernacularLang = 'hi' | 'ta' | 'te' | 'bn'
export type VernacularCategory = 'markets' | 'rbi' | 'startups' | 'budget' | 'global' | 'economy'

export type VernacularArticle = {
  title: string
  description?: string
  content?: string
  url: string
  urlToImage?: string
  publishedAt?: string
  source?: { name?: string }
}

export type TranslatedArticle = {
  translatedTitle: string
  translatedSummary: string
  keyImpact: string
  localAngle: string
  difficulty: 'simple' | 'moderate' | 'complex'
  readTimeSeconds: number
  culturalNotes: string[]
  culturalDistance?: number
  cultureBridge?: string
}

export type GlossaryTerm = {
  term: string
  romanized: string
  meaning: string
  englishEquivalent: string
}

type ReadersNow = Record<VernacularLang, number>

interface VernacularStore {
  selectedLanguage: VernacularLang
  selectedCategory: VernacularCategory
  articles: VernacularArticle[]
  translatedArticles: Record<string, TranslatedArticle>
  glossary: GlossaryTerm[]
  savedTerms: GlossaryTerm[]
  audioQueue: Array<{ id: string; text: string; lang: string; title?: string }>
  isPlaying: boolean
  audioMode: boolean
  streak: Record<VernacularLang, { days: number; lastDate: string | null }>
  stats: { translatedToday: number; avgTranslateMs: number; readersNow: ReadersNow }
  isLoading: boolean
  isTranslating: Record<string, boolean>
  error: string | null
  lastTranslatedUrl: string | null
  userPersona: 'farmer' | 'founder' | 'student' | 'general'

  setLanguage: (lang: VernacularLang) => void
  setCategory: (cat: VernacularCategory) => void
  setPersona: (p: VernacularStore['userPersona']) => void
  fetchArticles: () => Promise<void>
  translateArticle: (article: VernacularArticle, mode?: 'normal' | 'eli12') => Promise<void>
  translateAll: () => Promise<void>
  fetchGlossary: (translatedText: string) => Promise<void>
  saveTerm: (term: GlossaryTerm) => void
  clearSavedTerms: () => void
  toggleAudioMode: () => void
  addToAudioQueue: (payload: { text: string; title?: string; lang: string }) => void
  popAudioQueue: () => void
  setIsPlaying: (v: boolean) => void
  tickReadersNow: () => void
  bumpStreak: () => void
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init)
  const data = (await r.json()) as any
  if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`)
  return data as T
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const DEFAULT_READERS: ReadersNow = { hi: 1240, ta: 620, te: 540, bn: 780 }

export const useVernacularStore = create<VernacularStore>()(
  persist(
    (set, get) => ({
      selectedLanguage: 'hi',
      selectedCategory: 'markets',
      articles: [],
      translatedArticles: {},
      glossary: [],
      savedTerms: [],
      audioQueue: [],
      isPlaying: false,
      audioMode: false,
      streak: {
        hi: { days: 0, lastDate: null },
        ta: { days: 0, lastDate: null },
        te: { days: 0, lastDate: null },
        bn: { days: 0, lastDate: null },
      },
      stats: { translatedToday: 0, avgTranslateMs: 1100, readersNow: DEFAULT_READERS },
      isLoading: false,
      isTranslating: {},
      error: null,
      lastTranslatedUrl: null,
      userPersona: 'general',

      setLanguage: (lang) => set({ selectedLanguage: lang, glossary: [] }),
      setCategory: (cat) => set({ selectedCategory: cat }),
      setPersona: (p) => set({ userPersona: p }),

      fetchArticles: async () => {
        const { selectedCategory } = get()
        set({ isLoading: true, error: null, articles: [], glossary: [] })
        try {
          const data = await readJson<{ articles: VernacularArticle[] }>(
            `/api/vernacular/news?category=${encodeURIComponent(selectedCategory)}`
          )
          const articles = (data.articles || [])
            .filter((a) => a?.title && a?.url)
            .slice(0, 8)
          if (!articles.length) {
            // fallback (never empty)
            set({
              articles: [
                {
                  title: 'RBI signals a cautious stance as inflation remains sticky',
                  description: 'How interest rates affect loans, EMIs, and local prices — and what to watch next.',
                  url: 'fallback://rbi',
                  publishedAt: new Date().toISOString(),
                  source: { name: 'NewsOS Fallback' },
                },
                {
                  title: 'Nifty & Sensex swing as global cues shift',
                  description: 'What today’s market moves could mean for your portfolio and household expenses.',
                  url: 'fallback://markets',
                  publishedAt: new Date().toISOString(),
                  source: { name: 'NewsOS Fallback' },
                },
                {
                  title: 'Startup funding shows signs of revival in India',
                  description: 'Deal flow returns to select sectors as investors focus on profitability.',
                  url: 'fallback://startups',
                  publishedAt: new Date().toISOString(),
                  source: { name: 'NewsOS Fallback' },
                },
                {
                  title: 'Union Budget focus: capex, jobs, and inflation control',
                  description: 'A quick guide to what the Budget could prioritize and how it affects you.',
                  url: 'fallback://budget',
                  publishedAt: new Date().toISOString(),
                  source: { name: 'NewsOS Fallback' },
                },
              ],
            })
          } else {
            set({ articles })
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load articles'
          set({ error: message })
          // fallback
          set({
            articles: [
              {
                title: 'RBI signals a cautious stance as inflation remains sticky',
                description: 'How interest rates affect loans, EMIs, and local prices — and what to watch next.',
                url: 'fallback://rbi',
                publishedAt: new Date().toISOString(),
                source: { name: 'NewsOS Fallback' },
              },
              {
                title: 'Nifty & Sensex swing as global cues shift',
                description: 'What today’s market moves could mean for your portfolio and household expenses.',
                url: 'fallback://markets',
                publishedAt: new Date().toISOString(),
                source: { name: 'NewsOS Fallback' },
              },
            ],
          })
        } finally {
          set({ isLoading: false })
        }
      },

      translateArticle: async (article, mode = 'normal') => {
        const { selectedLanguage, translatedArticles, userPersona } = get()
        if (!article?.url) return
        if (translatedArticles[article.url] && mode === 'normal') return
        const started = performance.now()
        set((s) => ({ isTranslating: { ...s.isTranslating, [article.url]: true }, error: null }))
        try {
          const data = await readJson<TranslatedArticle>('/api/vernacular/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: article.title,
              description: article.description,
              content: article.content,
              targetLanguage: selectedLanguage,
              targetLocale:
                selectedLanguage === 'hi'
                  ? 'hi-IN'
                  : selectedLanguage === 'ta'
                    ? 'ta-IN'
                    : selectedLanguage === 'te'
                      ? 'te-IN'
                      : 'bn-IN',
              userPersona,
              mode,
            }),
          })
          set((s) => ({
            translatedArticles: { ...s.translatedArticles, [article.url]: data },
            lastTranslatedUrl: article.url,
          }))

          const ms = performance.now() - started
          set((s) => {
            const translatedToday = s.stats.translatedToday + 1
            const avg = Math.round((s.stats.avgTranslateMs * 0.7 + ms * 0.3) * 10) / 10
            return { stats: { ...s.stats, translatedToday, avgTranslateMs: avg } }
          })
          get().bumpStreak()
          // Fetch glossary from latest translation (non-blocking)
          const combined = `${data.translatedTitle}\n${data.translatedSummary}\n${data.keyImpact}\n${data.localAngle}`
          void get().fetchGlossary(combined)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Translation failed'
          set({ error: message })
        } finally {
          set((s) => ({ isTranslating: { ...s.isTranslating, [article.url]: false } }))
        }
      },

      translateAll: async () => {
        const { articles } = get()
        for (let i = 0; i < articles.length; i++) {
          // Stagger to avoid overloading
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 500))
          // eslint-disable-next-line no-await-in-loop
          await get().translateArticle(articles[i], 'normal')
        }
      },

      fetchGlossary: async (translatedText) => {
        const { selectedLanguage } = get()
        try {
          const data = await readJson<GlossaryTerm[]>('/api/vernacular/glossary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ translatedText, targetLanguage: selectedLanguage }),
          })
          set({ glossary: Array.isArray(data) ? data.slice(0, 8) : [] })
        } catch {
          set({ glossary: [] })
        }
      },

      saveTerm: (term) =>
        set((s) => {
          const exists = s.savedTerms.some((t) => t.term === term.term && t.englishEquivalent === term.englishEquivalent)
          return exists ? s : { savedTerms: [term, ...s.savedTerms].slice(0, 50) }
        }),

      clearSavedTerms: () => set({ savedTerms: [] }),

      toggleAudioMode: () => set((s) => ({ audioMode: !s.audioMode })),

      addToAudioQueue: ({ text, lang, title }) =>
        set((s) => ({
          audioQueue: [...s.audioQueue, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, lang, title }],
        })),

      popAudioQueue: () => set((s) => ({ audioQueue: s.audioQueue.slice(1) })),

      setIsPlaying: (v) => set({ isPlaying: v }),

      tickReadersNow: () =>
        set((s) => ({
          stats: {
            ...s.stats,
            readersNow: {
              hi: Math.max(420, s.stats.readersNow.hi + randInt(-30, 30)),
              ta: Math.max(180, s.stats.readersNow.ta + randInt(-18, 18)),
              te: Math.max(160, s.stats.readersNow.te + randInt(-18, 18)),
              bn: Math.max(220, s.stats.readersNow.bn + randInt(-22, 22)),
            },
          },
        })),

      bumpStreak: () => {
        const { selectedLanguage, streak } = get()
        const t = todayKey()
        const cur = streak[selectedLanguage]
        if (cur.lastDate === t) return
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yKey = yesterday.toISOString().slice(0, 10)
        const nextDays = cur.lastDate === yKey ? cur.days + 1 : 1
        set({ streak: { ...streak, [selectedLanguage]: { days: nextDays, lastDate: t } } })
      },
    }),
    {
      name: 'newsos-vernacular',
      partialize: (s) => ({
        selectedLanguage: s.selectedLanguage,
        selectedCategory: s.selectedCategory,
        translatedArticles: s.translatedArticles,
        savedTerms: s.savedTerms,
        streak: s.streak,
        stats: s.stats,
        userPersona: s.userPersona,
      }),
    }
  )
)

