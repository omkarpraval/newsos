import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { callGroq, parseGroqJSON } from '../services/groq'

interface Article {
  title: string
  description: string
  url: string
  urlToImage: string
  source: { name: string }
  publishedAt: string
}

interface TopicCluster {
  keyword: string
  label: string
  category: string
  color: string
  articleCount: number
  articles: Article[]
  latestTime: string
  urgency: 'breaking' | 'developing' | 'analysis'
}

interface BriefingSection {
  id: string
  title: string
  icon: string
  content: string
  isLoading: boolean
}

interface BriefingData {
  summary: string
  facts: string[]
  players: Array<{ name: string; role: string; stance: string }>
  views: Array<{ perspective: string; argument: string }>
  impact: string
  watchNext: string[]
  prediction: string
  confidenceScore: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const FALLBACK_TOPICS: TopicCluster[] = [
  { keyword: 'RBI interest rates', label: 'RBI & Monetary Policy', category: 'business', color: '#f0a500', articleCount: 0, articles: [], latestTime: new Date().toISOString(), urgency: 'developing' },
  { keyword: 'India GDP economy', label: 'India Economy', category: 'business', color: '#2ec4b6', articleCount: 0, articles: [], latestTime: new Date().toISOString(), urgency: 'analysis' },
  { keyword: 'India startup funding', label: 'Startup Ecosystem', category: 'technology', color: '#8b5cf6', articleCount: 0, articles: [], latestTime: new Date().toISOString(), urgency: 'developing' },
  { keyword: 'Modi government policy', label: 'Government Policy', category: 'politics', color: '#3a86ff', articleCount: 0, articles: [], latestTime: new Date().toISOString(), urgency: 'analysis' },
  { keyword: 'Nifty Sensex stock market', label: 'Markets Today', category: 'business', color: '#e63946', articleCount: 0, articles: [], latestTime: new Date().toISOString(), urgency: 'breaking' },
  { keyword: 'India technology AI', label: 'Tech & AI in India', category: 'technology', color: '#06d6a0', articleCount: 0, articles: [], latestTime: new Date().toISOString(), urgency: 'analysis' },
]

const URGENCY_CONFIG = {
  breaking: { label: 'BREAKING', color: '#e63946', pulse: true },
  developing: { label: 'DEVELOPING', color: '#f0a500', pulse: false },
  analysis: { label: 'ANALYSIS', color: '#3a86ff', pulse: false },
} as const

const SECTION_TEMPLATES: Omit<BriefingSection, 'content' | 'isLoading'>[] = [
  { id: 'summary', title: 'Situation Summary', icon: '◉' },
  { id: 'facts', title: 'Key Intelligence', icon: '≡' },
  { id: 'players', title: 'Key Players', icon: '◈' },
  { id: 'views', title: 'Contrasting Views', icon: '⟺' },
  { id: 'impact', title: 'Impact Assessment', icon: '⚡' },
  { id: 'watchNext', title: 'Signals to Monitor', icon: '◎' },
  { id: 'prediction', title: 'AI Prediction', icon: '✦' },
]

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    return `${Math.floor(m / 60)}h ago`
  } catch {
    return ''
  }
}

export default function BriefingPage() {
  const location = useLocation()
  // keep hook import alignment if we later add navigation actions
  const queryParams = new URLSearchParams(location.search)
  const prefilledTopic = queryParams.get('topic')

  const [topics, setTopics] = useState<TopicCluster[]>([])
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [topicsError, setTopicsError] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<TopicCluster | null>(null)
  const [customQuery, setCustomQuery] = useState('')

  const [sections, setSections] = useState<BriefingSection[]>([])
  // briefingLoading reserved for future progress UI
  const [briefingData, setBriefingData] = useState<BriefingData | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'facts']))
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const [isStreaming, setIsStreaming] = useState(false)
  const [savedBriefings, setSavedBriefings] = useState<Array<{ topic: string; savedAt: string }>>([])

  const chatEndRef = useRef<HTMLDivElement>(null)
  const briefingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void loadTopics()
  }, [])

  useEffect(() => {
    if (prefilledTopic && topics.length > 0) {
      void handleCustomSearch(prefilledTopic)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledTopic, topics.length])

  async function loadTopics() {
    setTopicsLoading(true)
    setTopicsError(null)
    try {
      const [businessRes, generalRes, techRes] = await Promise.allSettled([
        fetch('/api/news?type=headlines&category=business&pageSize=20').then((r) => r.json()),
        fetch('/api/news?type=headlines&category=general&pageSize=15').then((r) => r.json()),
        fetch('/api/news?type=search&query=India+technology+startup&pageSize=10&daysBack=7').then((r) => r.json()),
      ])
      const allArticles: Article[] = [
        ...(businessRes.status === 'fulfilled' ? businessRes.value.articles || [] : []),
        ...(generalRes.status === 'fulfilled' ? generalRes.value.articles || [] : []),
        ...(techRes.status === 'fulfilled' ? techRes.value.articles || [] : []),
      ]
      if (allArticles.length === 0) throw new Error('No articles returned from API')
      const clusters = clusterArticlesIntoTopics(allArticles)
      setTopics(clusters.length > 0 ? clusters : FALLBACK_TOPICS)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load topics'
      // eslint-disable-next-line no-console
      console.error('[Briefing] Topic load error:', message)
      setTopicsError(message)
      setTopics(FALLBACK_TOPICS)
    } finally {
      setTopicsLoading(false)
    }
  }

  function clusterArticlesIntoTopics(articles: Article[]): TopicCluster[] {
    const patterns = [
      { keyword: 'RBI', label: 'RBI & Monetary Policy', category: 'business', color: '#f0a500' },
      { keyword: 'budget|fiscal|GDP|economy', label: 'India Economy', category: 'business', color: '#2ec4b6' },
      { keyword: 'startup|unicorn|funding|VC', label: 'Startup Ecosystem', category: 'technology', color: '#8b5cf6' },
      { keyword: 'Modi|BJP|parliament|government|policy', label: 'Government & Policy', category: 'politics', color: '#3a86ff' },
      { keyword: 'Nifty|Sensex|BSE|NSE|stock|market', label: 'Markets Today', category: 'business', color: '#e63946' },
      { keyword: 'AI|artificial intelligence|tech|digital', label: 'Tech & AI in India', category: 'technology', color: '#06d6a0' },
      { keyword: 'China|US|trade|global|war|geopolit', label: 'Geopolitics', category: 'general', color: '#ff6b35' },
      { keyword: 'inflation|price|cost|petrol|fuel', label: 'Prices & Inflation', category: 'business', color: '#f0a500' },
    ]
    const clusters: TopicCluster[] = []
    patterns.forEach((pattern) => {
      const regex = new RegExp(pattern.keyword, 'i')
      const matched = articles.filter((a) => regex.test(a.title) || regex.test(a.description || ''))
      if (matched.length > 0) {
        const sorted = matched.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        const ageHours = (Date.now() - new Date(sorted[0].publishedAt).getTime()) / 3600000
        const urgency: TopicCluster['urgency'] = ageHours < 2 ? 'breaking' : ageHours < 12 ? 'developing' : 'analysis'
        clusters.push({
          keyword: pattern.keyword.split('|')[0],
          label: pattern.label,
          category: pattern.category,
          color: pattern.color,
          articleCount: matched.length,
          articles: sorted,
          latestTime: sorted[0].publishedAt,
          urgency,
        })
      }
    })
    const urgencyOrder = { breaking: 0, developing: 1, analysis: 2 } as const
    return clusters.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
  }

  async function handleTopicSelect(topic: TopicCluster) {
    setSelectedTopic(topic)
    setBriefingData(null)
    setChatMessages([])
    setShowChat(false)
    setExpandedSections(new Set(['summary', 'facts']))
    setSections(SECTION_TEMPLATES.map((t) => ({ ...t, content: '', isLoading: true })))
    // setBriefingLoading(true)
    setIsStreaming(true)
    window.setTimeout(() => briefingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    try {
      const articlesContext = topic.articles
        .slice(0, 8)
        .map(
          (a) =>
            `SOURCE: ${a.source.name}\nHEADLINE: ${a.title}\nDETAILS: ${a.description || 'No details'}\nPUBLISHED: ${new Date(a.publishedAt).toLocaleString('en-IN')}`
        )
        .join('\n\n---\n\n')

      const prompt = `You are an elite intelligence analyst for NewsOS, preparing a classified briefing on: "${topic.label}"

Analyze these ${topic.articles.length} source articles and return a structured JSON briefing:

SOURCES:
${articlesContext}

Return ONLY valid JSON in this exact structure (no markdown, no code blocks):
{
  "summary": "3 clear sentences. What happened, why it matters, what comes next.",
  "facts": [
    "Specific fact with number or date",
    "Specific fact with number or date", 
    "Specific fact with number or date",
    "Specific fact with number or date",
    "Specific fact with number or date"
  ],
  "players": [
    {"name": "Person or org name", "role": "Their role", "stance": "Their position on this issue"},
    {"name": "Person or org name", "role": "Their role", "stance": "Their position on this issue"},
    {"name": "Person or org name", "role": "Their role", "stance": "Their position on this issue"}
  ],
  "views": [
    {"perspective": "Optimistic view", "argument": "2 sentence argument for this perspective"},
    {"perspective": "Pessimistic view", "argument": "2 sentence argument for this perspective"}
  ],
  "impact": "2-3 sentences on specific measurable consequences — use numbers and timeframes.",
  "watchNext": [
    "Specific signal to watch with timeframe",
    "Specific signal to watch with timeframe",
    "Specific signal to watch with timeframe"
  ],
  "prediction": "One bold, specific, falsifiable prediction with a timeframe.",
  "confidenceScore": 72
}`

      const result = await callGroq(
        [{ role: 'user', content: prompt }],
        'You are a senior intelligence analyst. Return only valid JSON. No markdown. No explanation. Just the JSON object.'
      )
      const data = parseGroqJSON(result) as BriefingData
      setBriefingData(data)

      const sectionIds = ['summary', 'facts', 'players', 'views', 'impact', 'watchNext', 'prediction']
      for (let i = 0; i < sectionIds.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 180))
        setSections((prev) => prev.map((s) => (s.id === sectionIds[i] ? { ...s, isLoading: false, content: 'ready' } : s)))
      }
      setIsStreaming(false)
      setShowChat(true)
      setSavedBriefings((prev) => [{ topic: topic.label, savedAt: new Date().toISOString() }, ...prev.filter((b) => b.topic !== topic.label)].slice(0, 8))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Briefing failed'
      // eslint-disable-next-line no-console
      console.error('[Briefing] Generation error:', message)
      setSections((prev) => prev.map((s) => ({ ...s, isLoading: false, content: 'error' })))
      setIsStreaming(false)
    } finally {
      // setBriefingLoading(false)
    }
  }

  async function handleCustomSearch(query: string) {
    if (!query.trim()) return
    const customTopic: TopicCluster = {
      keyword: query,
      label: query,
      category: 'general',
      color: '#f0a500',
      articleCount: 0,
      articles: [],
      latestTime: new Date().toISOString(),
      urgency: 'analysis',
    }
    try {
      const res = await fetch(`/api/news?type=search&query=${encodeURIComponent(query)}&pageSize=10&daysBack=14`)
      const data = (await res.json()) as { articles?: Article[] }
      customTopic.articles = data.articles || []
      customTopic.articleCount = customTopic.articles.length
    } catch {
      // ignore
    }
    await handleTopicSelect(customTopic)
    setCustomQuery('')
  }

  async function handleChat(e?: React.FormEvent) {
    e?.preventDefault()
    if (!chatInput.trim() || !briefingData || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    const newHistory: ChatMessage[] = [...chatMessages, { role: 'user', content: userMsg }]
    setChatMessages(newHistory)
    setChatLoading(true)
    try {
      const contextStr = `Topic: ${selectedTopic?.label}
Summary: ${briefingData.summary}
Key facts: ${briefingData.facts.join('; ')}
Prediction: ${briefingData.prediction}`
      const response = await callGroq(
        newHistory.map((m) => ({ role: m.role, content: m.content })),
        `You are a senior news analyst for NewsOS. You have just briefed on "${selectedTopic?.label}".
Context of your briefing: ${contextStr}
Answer follow-up questions precisely in 2-4 sentences. Use specific numbers and facts. No markdown. Plain text only.`
      )
      setChatMessages([...newHistory, { role: 'assistant', content: response }])
    } catch {
      setChatMessages([...newHistory, { role: 'assistant', content: 'Error fetching response. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  function renderSectionContent(section: BriefingSection): React.ReactNode {
    if (!briefingData) return null
    switch (section.id) {
      case 'summary':
        return (
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(240,237,232,0.85)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
            {briefingData.summary}
          </p>
        )
      case 'facts':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {briefingData.facts.map((fact, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: selectedTopic?.color || '#f0a500', flexShrink: 0, marginTop: 3, fontWeight: 700 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(240,237,232,0.82)', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>{fact}</span>
              </motion.div>
            ))}
          </div>
        )
      case 'players':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {briefingData.players.map((player, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: selectedTopic?.color || '#f0a500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, color: '#000', marginBottom: 10 }}>
                  {player.name[0]}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8', marginBottom: 2, fontFamily: 'DM Sans, sans-serif' }}>{player.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: selectedTopic?.color || '#f0a500', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>
                  {player.role}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>{player.stance}</div>
              </motion.div>
            ))}
          </div>
        )
      case 'views':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {briefingData.views.map((view, i) => (
              <div key={i} style={{ background: i === 0 ? 'rgba(46,196,182,0.06)' : 'rgba(230,57,70,0.06)', border: `1px solid ${i === 0 ? 'rgba(46,196,182,0.2)' : 'rgba(230,57,70,0.2)'}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: i === 0 ? '#2ec4b6' : '#e63946', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{i === 0 ? '↑' : '↓'}</span>
                  {view.perspective}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>{view.argument}</p>
              </div>
            ))}
          </div>
        )
      case 'impact':
        return (
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(240,237,232,0.82)', margin: 0, fontFamily: 'DM Sans, sans-serif', borderLeft: `3px solid ${selectedTopic?.color || '#f0a500'}`, paddingLeft: 16 }}>
            {briefingData.impact}
          </p>
        )
      case 'watchNext':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {briefingData.watchNext.map((signal, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedTopic?.color || '#f0a500', flexShrink: 0, animation: 'pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'DM Sans, sans-serif' }}>{signal}</span>
              </div>
            ))}
          </div>
        )
      case 'prediction':
        return (
          <div style={{ background: `${selectedTopic?.color || '#f0a500'}08`, border: `1px solid ${selectedTopic?.color || '#f0a500'}30`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: 'rgba(240,237,232,0.9)', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', flex: 1 }}>
                &quot;{briefingData.prediction}&quot;
              </p>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: selectedTopic?.color || '#f0a500' }}>
                  {briefingData.confidenceScore}%
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginTop: 2 }}>
                  AI CONFIDENCE
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>
              ⚠ AI PREDICTION — FOR INFORMATIONAL PURPOSES ONLY
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080c18', color: '#f0ede8', display: 'flex', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', marginBottom: 8 }}>
            INTELLIGENCE UNIT · NEWSОС
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, margin: 0, color: '#f0ede8' }}>News Navigator</h1>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            Select a topic. AI synthesizes all sources into one classified briefing.
          </p>
          {topicsError ? (
            <p style={{ margin: '10px 0 0', fontSize: 11, color: 'rgba(240,165,0,0.75)', lineHeight: 1.5 }}>
              Using fallback topics. API error: {topicsError}
            </p>
          ) : null}
        </div>

        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', alignItems: 'center' }}>
            <span style={{ fontSize: 12, opacity: 0.4 }}>⌕</span>
            <input
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleCustomSearch(customQuery)}
              placeholder="Search any topic..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#f0ede8', fontFamily: 'DM Sans, sans-serif' }}
            />
            {customQuery ? (
              <button onClick={() => void handleCustomSearch(customQuery)} style={{ background: '#f0a500', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: '#000', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                GO
              </button>
            ) : null}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {topicsLoading ? (
            <div style={{ padding: '20px 16px' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ height: 72, borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 8, animation: 'shimmer 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            topics.map((topic, i) => {
              const urgency = URGENCY_CONFIG[topic.urgency]
              const isSelected = selectedTopic?.keyword === topic.keyword
              return (
                <motion.button
                  key={topic.keyword}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => void handleTopicSelect(topic)}
                  style={{ width: '100%', background: isSelected ? `${topic.color}12` : 'transparent', border: 'none', borderLeft: `3px solid ${isSelected ? topic.color : 'transparent'}`, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: urgency.color, letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {urgency.pulse ? <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: urgency.color, animation: 'pulse 1s ease-in-out infinite' }} /> : null}
                      {urgency.label}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{timeAgo(topic.latestTime)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? topic.color : '#f0ede8', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.3, transition: 'color 0.2s' }}>
                    {topic.label}
                  </div>
                  {topic.articleCount > 0 ? (
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                      {topic.articleCount} source{topic.articleCount !== 1 ? 's' : ''} synthesized
                    </div>
                  ) : null}
                </motion.button>
              )
            })
          )}
        </div>

        {savedBriefings.length > 0 ? (
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 8 }}>RECENT BRIEFINGS</div>
            {savedBriefings.slice(0, 4).map((b) => (
              <button key={b.topic} onClick={() => void handleCustomSearch(b.topic)} style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', textAlign: 'left', padding: '5px 0', fontSize: 11, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                ⟳ {b.topic}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedTopic ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 48 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '1px solid rgba(240,165,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>≡</div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#f0ede8', margin: '0 0 8px' }}>Select a topic to brief</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 400, lineHeight: 1.6 }}>
                Choose from today&apos;s live topics on the left, or search any topic. The AI will synthesize multiple sources into one classified briefing you can interact with.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 500 }}>
              {['RBI rate cut', 'India startup ecosystem', 'Geopolitical tensions', 'Nifty outlook'].map((q) => (
                <button key={q} onClick={() => void handleCustomSearch(q)} style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 20, padding: '8px 16px', fontSize: 12, color: '#f0a500', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {q} →
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div ref={briefingRef} style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
              <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${selectedTopic.color}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: URGENCY_CONFIG[selectedTopic.urgency].color, letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {selectedTopic.urgency === 'breaking' ? <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: URGENCY_CONFIG[selectedTopic.urgency].color, animation: 'pulse 1s ease-in-out infinite' }} /> : null}
                    {URGENCY_CONFIG[selectedTopic.urgency].label}
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>·</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
                    NEWSОС INTELLIGENCE · {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  {selectedTopic.articleCount > 0 ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: selectedTopic.color, letterSpacing: '0.1em' }}>· {selectedTopic.articleCount} SOURCES SYNTHESIZED</span> : null}
                </div>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, color: '#f0ede8', margin: '0 0 8px', lineHeight: 1.2 }}>{selectedTopic.label}</h1>
                {isStreaming ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: selectedTopic.color, letterSpacing: '0.1em' }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: selectedTopic.color, animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
                      ))}
                    </div>
                    ASSEMBLING INTELLIGENCE BRIEFING...
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sections.map((section, i) => {
                  const template = SECTION_TEMPLATES.find((t) => t.id === section.id)
                  const isExpanded = expandedSections.has(section.id)
                  const isActive = activeSection === section.id
                  return (
                    <motion.div key={section.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: section.isLoading ? 0.5 : 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ background: isActive ? `${selectedTopic.color}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? selectedTopic.color + '30' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, overflow: 'hidden', transition: 'all 0.3s' }}>
                      <button
                        onClick={() => {
                          setExpandedSections((prev) => {
                            const next = new Set(prev)
                            if (next.has(section.id)) next.delete(section.id)
                            else next.add(section.id)
                            return next
                          })
                          setActiveSection(section.id)
                        }}
                        style={{ width: '100%', background: 'transparent', border: 'none', padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: selectedTopic.color }}>{template?.icon}</span>
                          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#f0ede8' }}>{template?.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {section.isLoading ? (
                            <div style={{ width: 12, height: 12, border: `2px solid ${selectedTopic.color}40`, borderTop: `2px solid ${selectedTopic.color}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveSection(section.id)
                                setShowChat(true)
                                setChatInput(`Tell me more about the "${template?.title}" section`)
                              }}
                              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '3px 8px', fontSize: 9, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}
                            >
                              ASK
                            </button>
                          )}
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>
                            ▾
                          </span>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && !section.isLoading && briefingData ? (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ padding: '0 20px 20px', overflow: 'hidden' }}>
                            {renderSectionContent(section)}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>

              {selectedTopic.articles.length > 0 && briefingData ? (
                <div style={{ marginTop: 32 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: 14 }}>
                    SOURCE ARTICLES ({selectedTopic.articles.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedTopic.articles.slice(0, 5).map((article, i) => (
                      <a key={i} href={article.url} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, textDecoration: 'none', alignItems: 'center', transition: 'all 0.2s' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: selectedTopic.color, minWidth: 20 }}>{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4 }}>{article.title}</div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                            {article.source.name} · {timeAgo(article.publishedAt)}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <AnimatePresence>
              {showChat ? (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: selectedTopic.color, letterSpacing: '0.15em', marginBottom: 4 }}>AI ANALYST</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8', fontFamily: 'DM Sans, sans-serif' }}>Ask anything about this briefing</div>
                  </div>

                  {chatMessages.length === 0 ? (
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 8 }}>QUICK QUESTIONS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {['Explain this simply', 'Historical context?', 'How does this affect me?', 'What are the risks?', 'Timeline of events?'].map((q) => (
                          <button key={q} onClick={() => setChatInput(q)} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${selectedTopic.color}25`, borderRadius: 6, padding: '7px 10px', fontSize: 11, color: 'rgba(255,255,255,0.65)', cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: msg.role === 'user' ? selectedTopic.color : 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                          {msg.role === 'user' ? 'YOU' : 'ANALYST'}
                        </span>
                        <div style={{ background: msg.role === 'user' ? `${selectedTopic.color}15` : 'rgba(255,255,255,0.05)', border: `1px solid ${msg.role === 'user' ? selectedTopic.color + '30' : 'rgba(255,255,255,0.08)'}`, borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '2px 10px 10px 10px', padding: '9px 12px', maxWidth: '90%' }}>
                          <p style={{ margin: 0, fontSize: 12, color: 'rgba(240,237,232,0.85)', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {chatLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>ANALYST</span>
                        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2px 10px 10px 10px', padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {[0, 1, 2].map((i) => (
                              <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: selectedTopic.color, animation: `bounce 0.7s ease-in-out ${i * 0.12}s infinite alternate` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={(e) => void handleChat(e)} style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', gap: 8 }}>
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask the analyst..." style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${selectedTopic.color}30`, borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#f0ede8', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
                    <button type="submit" disabled={!chatInput.trim() || chatLoading} style={{ background: chatInput.trim() ? selectedTopic.color : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', fontSize: 14, color: chatInput.trim() ? '#000' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s', flexShrink: 0 }}>
                      →
                    </button>
                  </form>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounce { from { transform: translateY(0); opacity: 0.4; } to { transform: translateY(-5px); opacity: 1; } }
        @keyframes shimmer { 0% { opacity: 0.4; } 50% { opacity: 0.7; } 100% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
