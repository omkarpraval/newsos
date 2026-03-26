export type Persona = 'trader' | 'founder' | 'learner'

export type UiLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn'

export interface NewsArticle {
  source?: { id?: string; name?: string }
  author?: string
  title: string
  description?: string
  url: string
  urlToImage?: string
  publishedAt?: string
  content?: string
}

export interface PersonalizedCard {
  headline: string
  summary: string
  relevanceScore: number
  raw: NewsArticle
}

export interface BriefingDoc {
  summary: string
  facts: string[]
  players: { name: string; role: string; stance: string }[]
  views: { side: string; text: string; attribution?: string }[]
  impact: string
  watchNext: string[]
}

export interface VideoScene {
  id: string
  duration: number
  text: string
  animation_type: string
  background_color: string
}

export interface VideoScript {
  title: string
  scenes: VideoScene[]
}

export interface ArcAnalysis {
  title: string
  summary: string
  timeline: {
    date: string
    headline: string
    event: string
    sentiment: 'positive' | 'negative' | 'neutral'
    importance: number
  }[]
  players: { name: string; role: string; stance: string; influence: number }[]
  sentimentShift: string
  contradictions: string[]
  watchNext: string[]
  prediction: string
}

export interface VernacularArticle {
  headline: string
  summary: string
  fullText: string
  localContext: string
}

export type ZoneId =
  | 'markets'
  | 'politics'
  | 'startup'
  | 'world'
  | 'bharat'
  | 'breaking'

export interface ZoneConfig {
  id: ZoneId
  name: string
  category: string
  color: string
  x: number
  y: number
  w: number
  h: number
}
