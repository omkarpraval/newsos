export type Persona = 'trader' | 'founder' | 'learner'

export type UiLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn'

// Challenge 2: Rich persona profiles for differentiated experiences
export interface PersonaProfile {
  id: Persona
  label: string
  age: number
  role: string
  depth: 'executive' | 'intermediate' | 'beginner'
  preferredFormat: 'data-rich' | 'balanced' | 'visual-story'
  description: string
  focusAreas: string[]
}

export const PERSONA_PROFILES: Record<Persona, PersonaProfile> = {
  trader: {
    id: 'trader',
    label: 'The CFO',
    age: 45,
    role: 'CFO tracking macro policy',
    depth: 'executive',
    preferredFormat: 'data-rich',
    description: '45-year-old CFO who tracks macro policy, market indices, and regulatory changes',
    focusAreas: ['macro economy', 'interest rates', 'market indices', 'regulatory changes', 'sector performance'],
  },
  founder: {
    id: 'founder',
    label: 'The Founder',
    age: 32,
    role: 'Startup founder tracking funding & policy',
    depth: 'intermediate',
    preferredFormat: 'balanced',
    description: '32-year-old startup founder tracking funding rounds, policy impact, and growth sectors',
    focusAreas: ['startup funding', 'policy impact on business', 'growth sectors', 'digital economy'],
  },
  learner: {
    id: 'learner',
    label: 'First-Gen Investor',
    age: 24,
    role: '24-year-old first-generation investor',
    depth: 'beginner',
    preferredFormat: 'visual-story',
    description: '24-year-old first-generation investor learning about markets and finance',
    focusAreas: ['what does this mean for me', 'simple explanations', 'beginner investing', 'personal finance'],
  },
}

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

// Challenge 1: Angle-based synthesis
export interface SynthesisAngle {
  id: string
  name: string
  icon: string
  color: string
  description: string
  articleIndices: number[]
  articleCount: number
}

export interface AngleBriefingData {
  summary: string
  keyPoints: string[]
  expertQuotes: Array<{ speaker: string; role: string; quote: string }>
  dataPoints: Array<{ label: string; value: string; change?: string; sentiment: 'positive' | 'negative' | 'neutral' }>
  implications: string
}

// Challenge 3: Hindi video script
export interface HindiVideoScene {
  id: string
  duration: number
  hindiText: string
  romanized: string
  englishReference: string
  visualCue: string
  background_color: string
  animation_type: string
}

export interface HindiVideoScript {
  title: string
  hindiTitle: string
  totalDuration: number
  scenes: HindiVideoScene[]
  factCheckSummary: string
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
