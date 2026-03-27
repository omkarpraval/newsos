import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import {
  generateAngleSynthesis,
  generateAngleBriefing,
  answerWithAngleContext,
  generateSyntheticArticles,
} from '../services/groq'
import {
  MOCK_BUDGET_ARTICLES,
  MOCK_IPL_ARTICLES,
  MOCK_STOCK_MARKET_ARTICLES,
  MOCK_WAR_ARTICLES
} from '../services/mockData'
import type { SynthesisAngle, AngleBriefingData } from '../types'

interface Article {
  title: string
  description: string
  url: string
  urlToImage: string
  content?: string
  source: { name: string }
  publishedAt: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const URGENCY_CONFIG = {
  breaking: { label: 'BREAKING', color: '#e63946', pulse: true },
  developing: { label: 'DEVELOPING', color: '#f0a500', pulse: false },
  analysis: { label: 'ANALYSIS', color: '#3a86ff', pulse: false },
} as const

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
  const queryParams = new URLSearchParams(location.search)
  const prefilledTopic = queryParams.get('topic')

  // ── Topic selection state ──
  const [articles, setArticles] = useState<Article[]>([])
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [customQuery, setCustomQuery] = useState('')
  const [activeTopic, setActiveTopic] = useState<string | null>(null)

  // ── Angle synthesis state ──
  const [angles, setAngles] = useState<SynthesisAngle[]>([])
  const [activeAngleId, setActiveAngleId] = useState<string | null>(null)
  const [angleBriefings, setAngleBriefings] = useState<Record<string, AngleBriefingData>>({})
  const [loadingAngle, setLoadingAngle] = useState<string | null>(null)
  const [synthesizing, setSynthesizing] = useState(false)

  // ── Chat state ──
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const briefingRef = useRef<HTMLDivElement>(null)

  // ── Suggested topics ──
  const SUGGESTED_TOPICS = [
    { label: 'Union Budget India 2025', query: 'Union Budget India 2025', color: '#f0a500' },
    { label: 'RBI Rate Decision', query: 'RBI interest rate monetary policy', color: '#3a86ff' },
    { label: 'Nifty & Markets', query: 'Nifty Sensex stock market India', color: '#e63946' },
    { label: 'India Startup Funding', query: 'India startup funding unicorn', color: '#8b5cf6' },
    { label: 'AI & Tech India', query: 'India artificial intelligence technology', color: '#06d6a0' },
  ]

  useEffect(() => {
    if (prefilledTopic) void handleSearch(prefilledTopic)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledTopic])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleSearch(query: string) {
    if (!query.trim()) return
    setTopicsLoading(true)
    setActiveTopic(query.trim())
    setAngles([])
    setAngleBriefings({})
    setActiveAngleId(null)
    setLoadingAngle(null)
    setChatMessages([])
    setShowChat(false)
    setCustomQuery('')

    try {
      // Try search first with 30 days back
      let res = await fetch(`/api/news?type=search&query=${encodeURIComponent(query)}&pageSize=20&daysBack=30`)
      let data = (await res.json()) as { articles?: Article[] }
      let fetched = data.articles || []

      // Fallback to headlines if search returns nothing
      if (fetched.length === 0) {
        res = await fetch(`/api/news?type=headlines&category=business&pageSize=15`)
        data = (await res.json()) as { articles?: Article[] }
        fetched = data.articles || []
      }

      // --- MULTI-TIER FALLBACK STRATEGY ---
      if (fetched.length === 0) {
        const q = query.toLowerCase()
        if (q.includes('budget') || q.includes('union')) {
          console.log('[Briefing] Using mock budget fallback')
          fetched = MOCK_BUDGET_ARTICLES as Article[]
        } else if (q.includes('ipl')) {
          console.log('[Briefing] Using mock IPL fallback')
          fetched = MOCK_IPL_ARTICLES as Article[]
        } else if (q.includes('stock') || q.includes('market') || q.includes('nifty')) {
          console.log('[Briefing] Using mock Stock Market fallback')
          fetched = MOCK_STOCK_MARKET_ARTICLES as Article[]
        } else if (q.includes('war') || q.includes('conflict') || q.includes('iran')) {
          console.log('[Briefing] Using mock War/Conflict fallback')
          fetched = MOCK_WAR_ARTICLES as Article[]
        } else {
          // Ultimate AI Fallback: Generate synthetic news
          console.log('[Briefing] Generating synthetic news fallback for:', query)
          const synthetic = await generateSyntheticArticles(query)
          fetched = synthetic as Article[]
        }
      }

      setArticles(fetched)

      if (fetched.length === 0) {
        setTopicsLoading(false)
        return
      }

      // Generate angle synthesis
      setSynthesizing(true)
      const generatedAngles = await generateAngleSynthesis(query, fetched)
      setAngles(generatedAngles)
      setSynthesizing(false)

      // Auto-load first angle
      if (generatedAngles.length > 0) {
        setActiveAngleId(generatedAngles[0].id)
        await loadAngleBriefing(generatedAngles[0], fetched, query)
      }
    } catch (err) {
      console.error('[Briefing] Error:', err)
    } finally {
      setTopicsLoading(false)
      setSynthesizing(false)
    }
  }

  async function loadAngleBriefing(angle: SynthesisAngle, arts: Article[], topic: string) {
    if (angleBriefings[angle.id]) return // already loaded
    setLoadingAngle(angle.id)
    try {
      const briefing = await generateAngleBriefing(angle, arts, topic)
      setAngleBriefings((prev) => ({ ...prev, [angle.id]: briefing }))
      setShowChat(true)
    } catch (err) {
      console.error('[Briefing] Angle error:', err)
    } finally {
      setLoadingAngle(null)
    }
  }

  function handleAngleSelect(angle: SynthesisAngle) {
    setActiveAngleId(angle.id)
    setChatMessages([])
    if (!angleBriefings[angle.id]) {
      void loadAngleBriefing(angle, articles, activeTopic || '')
    }
    window.setTimeout(
      () => briefingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      100
    )
  }

  async function handleChat(e?: React.FormEvent) {
    e?.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const activeAngle = angles.find((a) => a.id === activeAngleId)
    const activeBriefing = activeAngleId ? angleBriefings[activeAngleId] : null
    if (!activeAngle || !activeBriefing) return

    const userMsg = chatInput.trim()
    setChatInput('')
    const newHistory: ChatMessage[] = [...chatMessages, { role: 'user', content: userMsg }]
    setChatMessages(newHistory)
    setChatLoading(true)

    try {
      const response = await answerWithAngleContext(
        userMsg,
        activeBriefing,
        activeAngle.name,
        activeTopic || '',
        newHistory.map((m) => ({ role: m.role, content: m.content }))
      )
      setChatMessages([...newHistory, { role: 'assistant', content: response }])
    } catch {
      setChatMessages([...newHistory, { role: 'assistant', content: 'Error fetching response.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const activeAngle = angles.find((a) => a.id === activeAngleId)
  const activeBriefing = activeAngleId ? angleBriefings[activeAngleId] : null
  const angleColor = activeAngle?.color || '#f0a500'

  // ── Determine urgency based on freshest article ──
  const urgency: keyof typeof URGENCY_CONFIG = articles.length > 0
    ? (() => {
        const newest = articles.reduce((a, b) =>
          new Date(a.publishedAt) > new Date(b.publishedAt) ? a : b
        )
        const ageH = (Date.now() - new Date(newest.publishedAt).getTime()) / 3600000
        return ageH < 2 ? 'breaking' : ageH < 12 ? 'developing' : 'analysis'
      })()
    : 'analysis'

  return (
    <div style={{ minHeight: '100vh', background: '#080c18', color: '#f0ede8', display: 'flex', fontFamily: 'DM Sans, sans-serif' }}>
      {/* ── LEFT SIDEBAR: Topic + Angles ── */}
      <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', marginBottom: 8 }}>
            MULTI-ANGLE SYNTHESIS · NEWSОС
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, margin: 0, color: '#f0ede8' }}>
            Deep Briefing
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            AI synthesizes multiple articles into angle-based briefings. Ask different questions — get different answers per angle.
          </p>
        </div>

        {/* Search */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', alignItems: 'center' }}>
            <span style={{ fontSize: 12, opacity: 0.4 }}>⌕</span>
            <input
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSearch(customQuery)}
              placeholder="Search any topic..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#f0ede8', fontFamily: 'DM Sans, sans-serif' }}
            />
            {customQuery ? (
              <button onClick={() => void handleSearch(customQuery)} style={{ background: '#f0a500', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: '#000', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                GO
              </button>
            ) : null}
          </div>
        </div>

        {/* Suggested Topics */}
        {!activeTopic && (
          <div style={{ padding: '16px' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 12 }}>
              SUGGESTED TOPICS
            </div>
            {SUGGESTED_TOPICS.map((t) => (
              <button
                key={t.query}
                onClick={() => void handleSearch(t.query)}
                style={{ display: 'block', width: '100%', background: `${t.color}0a`, border: `1px solid ${t.color}25`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', marginBottom: 8 }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: t.color, fontFamily: 'DM Sans, sans-serif' }}>
                  {t.label}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                  Multi-angle synthesis →
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Angle Tabs */}
        {angles.length > 0 && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            <div style={{ padding: '0 16px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', display: 'flex', justifyContent: 'space-between' }}>
              <span>ANGLES OF COVERAGE</span>
              <span>{articles.length} SOURCES</span>
            </div>
            {angles.map((angle, i) => {
              const isActive = activeAngleId === angle.id
              const isLoaded = !!angleBriefings[angle.id]
              const isThisLoading = loadingAngle === angle.id
              return (
                <motion.button
                  key={angle.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleAngleSelect(angle)}
                  style={{
                    width: '100%',
                    background: isActive ? `${angle.color}12` : 'transparent',
                    border: 'none',
                    borderLeft: `3px solid ${isActive ? angle.color : 'transparent'}`,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16 }}>{angle.icon}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: isLoaded ? '#2ec4b6' : 'rgba(255,255,255,0.2)' }}>
                      {isThisLoading ? '⟳ LOADING' : isLoaded ? '✓ READY' : `${angle.articleCount} articles`}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? angle.color : '#f0ede8', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.3 }}>
                    {angle.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, fontFamily: 'DM Sans, sans-serif' }}>
                    {angle.description}
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Loading state */}
        {(topicsLoading || synthesizing) && (
          <div style={{ padding: '20px 16px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: 72, borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 8, animation: 'shimmer 1.5s ease-in-out infinite' }} />
            ))}
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#f0a500', textAlign: 'center', marginTop: 8, letterSpacing: '0.1em' }}>
              {synthesizing ? 'CLUSTERING ARTICLES INTO ANGLES...' : 'FETCHING ARTICLES...'}
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeTopic ? (
          // Empty state
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 48 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '1px solid rgba(240,165,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>≡</div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#f0ede8', margin: '0 0 8px' }}>Multi-Angle Synthesis</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 500, lineHeight: 1.6 }}>
                Search a topic like &quot;Union Budget India&quot;. AI will fetch 20+ articles, cluster them into angles
                (Macro Impact, Sector Winners, Expert Commentary...), and generate distinct briefings.
                Ask different questions per angle — get non-overlapping answers.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Briefing content */}
            <div ref={briefingRef} style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
              {/* Header */}
              <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${angleColor}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: URGENCY_CONFIG[urgency].color, letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {urgency === 'breaking' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: URGENCY_CONFIG[urgency].color, animation: 'pulse 1s ease-in-out infinite' }} />}
                    {URGENCY_CONFIG[urgency].label}
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>·</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
                    {articles.length} SOURCES SYNTHESIZED · {angles.length} ANGLES
                  </span>
                </div>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, color: '#f0ede8', margin: '0 0 8px', lineHeight: 1.2 }}>
                  {activeTopic}
                </h1>
                {activeAngle && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <span style={{ fontSize: 20 }}>{activeAngle.icon}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: angleColor, fontFamily: 'DM Sans, sans-serif' }}>
                      {activeAngle.name}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                      · {activeAngle.articleCount} ARTICLES IN THIS ANGLE
                    </span>
                  </div>
                )}
              </div>

              {/* No articles message */}
              {articles.length === 0 && !topicsLoading && !synthesizing && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 32 }}>📭</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#f0ede8' }}>No articles found for this topic</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 400, lineHeight: 1.6 }}>
                    Try a broader search term like &quot;India economy&quot;, &quot;stock market&quot;, or &quot;RBI policy&quot;.
                    NewsAPI free tier has limited coverage of older events.
                  </p>
                </div>
              )}

              {/* Synthesizing state */}
              {synthesizing && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 48 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#f0a500', animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#f0a500', letterSpacing: '0.1em' }}>
                    CLUSTERING {articles.length} ARTICLES INTO ANGLES...
                  </div>
                </div>
              )}

              {/* Angle briefing content */}
              {loadingAngle !== null && loadingAngle === activeAngleId ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 48 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: angleColor, animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: angleColor, letterSpacing: '0.1em' }}>
                    GENERATING &quot;{activeAngle?.name}&quot; BRIEFING...
                  </div>
                </div>
              ) : activeBriefing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Summary Section */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: angleColor, letterSpacing: '0.15em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>◉</span> SITUATION SUMMARY
                    </div>
                    <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(240,237,232,0.85)', margin: 0 }}>
                      {activeBriefing.summary}
                    </p>
                  </motion.div>

                  {/* Key Points */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: angleColor, letterSpacing: '0.15em', marginBottom: 10 }}>
                      ≡ KEY INTELLIGENCE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {activeBriefing.keyPoints.map((point, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: angleColor, flexShrink: 0, marginTop: 3, fontWeight: 700 }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span style={{ fontSize: 14, color: 'rgba(240,237,232,0.82)', lineHeight: 1.6 }}>{point}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Data Points */}
                  {activeBriefing.dataPoints.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: angleColor, letterSpacing: '0.15em', marginBottom: 14 }}>
                        📊 DATA POINTS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                        {activeBriefing.dataPoints.map((dp, i) => (
                          <div key={i} style={{ background: `${dp.sentiment === 'positive' ? '#2ec4b6' : dp.sentiment === 'negative' ? '#e63946' : '#9c9a92'}0a`, border: `1px solid ${dp.sentiment === 'positive' ? '#2ec4b6' : dp.sentiment === 'negative' ? '#e63946' : '#9c9a92'}25`, borderRadius: 10, padding: 14 }}>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{dp.label}</div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#f0ede8', marginTop: 4 }}>{dp.value}</div>
                            {dp.change && (
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: dp.sentiment === 'positive' ? '#2ec4b6' : dp.sentiment === 'negative' ? '#e63946' : '#9c9a92', marginTop: 2 }}>
                                {dp.change}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Expert Quotes */}
                  {activeBriefing.expertQuotes.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: angleColor, letterSpacing: '0.15em', marginBottom: 14 }}>
                        ◈ EXPERT COMMENTARY
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {activeBriefing.expertQuotes.map((eq, i) => (
                          <div key={i} style={{ background: `${angleColor}08`, border: `1px solid ${angleColor}20`, borderRadius: 10, padding: 16 }}>
                            <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.7, color: 'rgba(240,237,232,0.9)', fontStyle: 'italic', fontFamily: 'Playfair Display, serif' }}>
                              &quot;{eq.quote}&quot;
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: angleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000' }}>
                                {eq.speaker[0]}
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#f0ede8' }}>{eq.speaker}</div>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: angleColor }}>{eq.role}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Implications */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: angleColor, letterSpacing: '0.15em', marginBottom: 10 }}>
                      ⚡ IMPLICATIONS
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(240,237,232,0.82)', margin: 0, borderLeft: `3px solid ${angleColor}`, paddingLeft: 16 }}>
                      {activeBriefing.implications}
                    </p>
                  </motion.div>

                  {/* Source articles for this angle */}
                  {activeAngle && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: 14 }}>
                        SOURCE ARTICLES ({activeAngle.articleCount})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {activeAngle.articleIndices.map((idx) => {
                          const article = articles[idx]
                          if (!article) return null
                          return (
                            <a key={idx} href={article.url} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, textDecoration: 'none', alignItems: 'center' }}>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: angleColor, minWidth: 20 }}>{idx + 1}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{article.title}</div>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                                  {article.source.name} · {timeAgo(article.publishedAt)}
                                </div>
                              </div>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>↗</span>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* ── CHAT PANEL ── */}
            <AnimatePresence>
              {showChat && activeBriefing ? (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: angleColor, letterSpacing: '0.15em', marginBottom: 4 }}>
                      ANGLE-AWARE ANALYST
                    </div>
                    <div style={{ fontSize: 12, color: '#f0ede8' }}>
                      Ask about <strong style={{ color: angleColor }}>{activeAngle?.name}</strong>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                      Answers stay within this angle — switch angles for different perspectives
                    </div>
                  </div>

                  {chatMessages.length === 0 && (
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 8 }}>QUICK QUESTIONS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                          'What does this mean for IT stocks?',
                          'What do economists think?',
                          'How does this affect retail investors?',
                          'Historical comparison?',
                          'What are the risks?',
                        ].map((q) => (
                          <button key={q} onClick={() => { setChatInput(q) }} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${angleColor}25`, borderRadius: 6, padding: '7px 10px', fontSize: 11, color: 'rgba(255,255,255,0.65)', cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif' }}>
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: msg.role === 'user' ? angleColor : 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                          {msg.role === 'user' ? 'YOU' : `${activeAngle?.name?.toUpperCase()} ANALYST`}
                        </span>
                        <div style={{ background: msg.role === 'user' ? `${angleColor}15` : 'rgba(255,255,255,0.05)', border: `1px solid ${msg.role === 'user' ? angleColor + '30' : 'rgba(255,255,255,0.08)'}`, borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '2px 10px 10px 10px', padding: '9px 12px', maxWidth: '90%' }}>
                          <p style={{ margin: 0, fontSize: 12, color: 'rgba(240,237,232,0.85)', lineHeight: 1.6 }}>{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div style={{ display: 'flex', gap: 4, padding: '10px 14px' }}>
                        {[0, 1, 2].map((i) => (
                          <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: angleColor, animation: `bounce 0.7s ease-in-out ${i * 0.12}s infinite alternate` }} />
                        ))}
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={(e) => void handleChat(e)} style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', gap: 8 }}>
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={`Ask about ${activeAngle?.name || 'this angle'}...`} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${angleColor}30`, borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#f0ede8', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
                    <button type="submit" disabled={!chatInput.trim() || chatLoading} style={{ background: chatInput.trim() ? angleColor : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', fontSize: 14, color: chatInput.trim() ? '#000' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
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
