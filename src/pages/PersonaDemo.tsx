import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PERSONA_PROFILES, type PersonaProfile, type NewsArticle } from '../types'
import { personalizeForProfile } from '../services/groq'
import { MOCK_HEADLINES } from '../services/mockData'

interface PersonalizedArticle {
  original: NewsArticle
  headline: string
  summary: string
  relevanceScore: number
  depthLabel: string
  format: string
  whyItMatters: string
  keyMetric?: { label: string; value: string }
}

type DemoPhase = 'before' | 'transitioning' | 'after'

const USER_A = PERSONA_PROFILES.trader
const USER_B = PERSONA_PROFILES.learner

export function PersonaDemo() {
  const [phase, setPhase] = useState<DemoPhase>('before')
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [personalizedA, setPersonalizedA] = useState<PersonalizedArticle[]>([])
  const [personalizedB, setPersonalizedB] = useState<PersonalizedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [personalizing, setPersonalizing] = useState(false)

  useEffect(() => {
    void loadArticles()
  }, [])

  async function loadArticles() {
    setLoading(true)
    try {
      const res = await fetch('/api/news?type=headlines&category=business&pageSize=6')
      const data = (await res.json()) as { articles?: NewsArticle[] }
      let list = data.articles || []

      // Fallback to mock data if API returns nothing (rate limit, etc.)
      if (list.length === 0) {
        console.log('[PersonaDemo] Using mock data fallback')
        list = MOCK_HEADLINES.slice(0, 6)
      }

      setArticles(list)
    } catch {
      // On network error, use mock data
      console.log('[PersonaDemo] Network error, using mock data')
      setArticles(MOCK_HEADLINES.slice(0, 6))
    } finally {
      setLoading(false)
    }
  }

  async function startPersonalization() {
    setPhase('transitioning')
    setPersonalizing(true)

    try {
      const [aResults, bResults] = await Promise.all([
        Promise.all(articles.slice(0, 4).map((a) => personalizeForProfile(a, USER_A))),
        Promise.all(articles.slice(0, 4).map((a) => personalizeForProfile(a, USER_B))),
      ])

      setPersonalizedA(
        aResults.map((r, i) => ({
          original: articles[i],
          headline: r?.headline || articles[i].title,
          summary: r?.summary || articles[i].description || '',
          relevanceScore: r?.relevanceScore || 5,
          depthLabel: r?.depthLabel || 'Quick Read',
          format: r?.format || 'story-card',
          whyItMatters: r?.whyItMatters || '',
          keyMetric: r?.keyMetric,
        }))
      )

      setPersonalizedB(
        bResults.map((r, i) => ({
          original: articles[i],
          headline: r?.headline || articles[i].title,
          summary: r?.summary || articles[i].description || '',
          relevanceScore: r?.relevanceScore || 5,
          depthLabel: r?.depthLabel || 'Explainer',
          format: r?.format || 'explainer-card',
          whyItMatters: r?.whyItMatters || '',
          keyMetric: r?.keyMetric,
        }))
      )

      setTimeout(() => setPhase('after'), 800)
    } catch (err) {
      console.error('[PersonaDemo] Error:', err)
    } finally {
      setPersonalizing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080c18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, border: '2px solid rgba(240,165,0,0.3)', borderTop: '2px solid #f0a500', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em' }}>LOADING ARTICLES...</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080c18', color: '#f0ede8', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '32px 40px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', marginBottom: 8 }}>
          CHALLENGE 2 · PERSONA DIFFERENTIATION DEMO
        </div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>
          Same News, Different Worlds
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 600, margin: '0 auto 16px', lineHeight: 1.6 }}>
          Watch how the same homepage transforms into completely different experiences
          based on who&apos;s reading — different headlines, depth, format, and framing.
        </p>

        {phase === 'before' && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={startPersonalization}
            style={{
              background: 'linear-gradient(135deg, #f0a500, #e63946)',
              border: 'none',
              borderRadius: 12,
              padding: '14px 32px',
              fontSize: 15,
              fontWeight: 700,
              color: '#000',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            ✦ Activate AI Personalization
          </motion.button>
        )}

        {personalizing && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#f0a500', animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
              ))}
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#f0a500', letterSpacing: '0.1em' }}>
              AI REFRAMING IN PROGRESS...
            </span>
          </div>
        )}

        {phase === 'after' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#2ec4b6', letterSpacing: '0.1em' }}>
              ✓ PERSONALIZATION COMPLETE — COMPARE BELOW
            </span>
          </motion.div>
        )}
      </div>

      {/* Phase label */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.15em',
          padding: '6px 16px',
          borderRadius: 20,
          background: phase === 'before' ? 'rgba(255,255,255,0.05)' : 'rgba(46,196,182,0.1)',
          border: `1px solid ${phase === 'before' ? 'rgba(255,255,255,0.1)' : 'rgba(46,196,182,0.3)'}`,
          color: phase === 'before' ? 'rgba(255,255,255,0.5)' : '#2ec4b6',
        }}>
          {phase === 'before' ? '📋 BEFORE: SAME HOMEPAGE FOR EVERYONE' : '✦ AFTER: AI-PERSONALIZED EXPERIENCE'}
        </div>
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, maxWidth: 1400, margin: '0 auto' }}>
        {/* User A column */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '0 24px 40px' }}>
          <PersonaHeader profile={USER_A} phase={phase} />
          <AnimatePresence mode="wait">
            {phase === 'before' ? (
              <motion.div key="before-a" exit={{ opacity: 0, x: -20 }}>
                {articles.slice(0, 4).map((a, i) => (
                  <GenericCard key={a.url || i} article={a} index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="after-a" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                {personalizedA.map((pa, i) => (
                  <PersonalizedCard key={pa.original.url || i} data={pa} index={i} profile={USER_A} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User B column */}
        <div style={{ padding: '0 24px 40px' }}>
          <PersonaHeader profile={USER_B} phase={phase} />
          <AnimatePresence mode="wait">
            {phase === 'before' ? (
              <motion.div key="before-b" exit={{ opacity: 0, x: 20 }}>
                {articles.slice(0, 4).map((a, i) => (
                  <GenericCard key={a.url || i} article={a} index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="after-b" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                {personalizedB.map((pa, i) => (
                  <PersonalizedCard key={pa.original.url || i} data={pa} index={i} profile={USER_B} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounce { from { transform: translateY(0); opacity: 0.4; } to { transform: translateY(-5px); opacity: 1; } }
      `}</style>
    </div>
  )
}

function PersonaHeader({ profile, phase }: { profile: PersonaProfile; phase: DemoPhase }) {
  const color = profile.id === 'trader' ? '#3a86ff' : '#8b5cf6'
  return (
    <div style={{ padding: '20px 0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `${color}20`, border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color,
        }}>
          {profile.id === 'trader' ? 'A' : 'B'}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f0ede8' }}>
            User {profile.id === 'trader' ? 'A' : 'B'} — {profile.label}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            {profile.description}
          </div>
        </div>
      </div>
      {phase !== 'before' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, background: `${color}15`, border: `1px solid ${color}30`, color, borderRadius: 4, padding: '2px 6px', letterSpacing: '0.1em' }}>
            DEPTH: {profile.depth.toUpperCase()}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, background: `${color}15`, border: `1px solid ${color}30`, color, borderRadius: 4, padding: '2px 6px', letterSpacing: '0.1em' }}>
            FORMAT: {profile.preferredFormat.toUpperCase()}
          </span>
        </motion.div>
      )}
    </div>
  )
}

function GenericCard({ article, index }: { article: NewsArticle; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
        {article.source?.name || 'News'} · GENERIC VIEW
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8', margin: '0 0 6px', lineHeight: 1.4 }}>
        {article.title}
      </h3>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
        {article.description?.slice(0, 120)}...
      </p>
    </motion.div>
  )
}

function PersonalizedCard({
  data,
  index,
  profile,
}: {
  data: PersonalizedArticle
  index: number
  profile: PersonaProfile
}) {
  const color = profile.id === 'trader' ? '#3a86ff' : '#8b5cf6'
  const formatStyles: Record<string, { bg: string; border: string }> = {
    'metrics-card': { bg: 'rgba(58,134,255,0.06)', border: 'rgba(58,134,255,0.2)' },
    'story-card': { bg: 'rgba(240,165,0,0.06)', border: 'rgba(240,165,0,0.2)' },
    'explainer-card': { bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.2)' },
  }
  const style = formatStyles[data.format] || formatStyles['story-card']

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
      }}
    >
      {/* Depth label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, background: `${color}20`, color, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.1em' }}>
          {data.depthLabel.toUpperCase()}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
          Relevance: {data.relevanceScore}/10
        </span>
      </div>

      {/* Rewritten headline */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color, margin: '0 0 6px', lineHeight: 1.4, fontFamily: 'Playfair Display, serif' }}>
        {data.headline}
      </h3>

      {/* Key Metric (for executive format) */}
      {data.keyMetric && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, display: 'inline-flex', gap: 8, alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{data.keyMetric.label}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#f0ede8' }}>{data.keyMetric.value}</span>
        </div>
      )}

      {/* Summary */}
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 8px', lineHeight: 1.6 }}>
        {data.summary}
      </p>

      {/* Why it matters */}
      {data.whyItMatters && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 8 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color, letterSpacing: '0.1em', marginBottom: 4 }}>
            WHY THIS MATTERS TO YOU
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            {data.whyItMatters}
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default PersonaDemo
