import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateVideoScript, generateHindiVideoScript } from '../../services/groq'
import { searchNews } from '../../services/newsapi'
import { useNarrator, type VoicePreset } from '../../hooks/useNarrator'
import { speakHindi, stopSpeaking } from '../../services/tts'
import { MOCK_BREAKING_ARTICLE } from '../../services/mockData'
import type { VideoScript, HindiVideoScript, NewsArticle } from '../../types'

type StudioMode = 'english' | 'hindi-breaking'

export function VideoStudio() {
  const [mode, setMode] = useState<StudioMode>('english')

  // ── English mode state ──
  const [topic, setTopic] = useState('')
  const [voice, setVoice] = useState<VoicePreset>('authoritative')
  const [script, setScript] = useState<VideoScript | null>(null)
  const [loading, setLoading] = useState(false)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const { narrate, stop } = useNarrator()

  // ── Hindi breaking mode state ──
  const [hindiScript, setHindiScript] = useState<HindiVideoScript | null>(null)
  const [hindiLoading, setHindiLoading] = useState(false)
  const [hindiSceneIdx, setHindiSceneIdx] = useState(0)
  const [hindiPlaying, setHindiPlaying] = useState(false)
  const [hindiProgress, setHindiProgress] = useState(0)
  const [breakingArticle, setBreakingArticle] = useState<NewsArticle | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [pipelineStartTime, setPipelineStartTime] = useState<number | null>(null)
  const [pipelineComplete, setPipelineComplete] = useState(false)
  const timerRef = useRef<number | null>(null)

  const scenes = script?.scenes ?? []
  const hindiScenes = hindiScript?.scenes ?? []

  // ── English playback ──
  useEffect(() => {
    if (!playing || !scenes.length) return
    const sc = scenes[sceneIdx]
    if (!sc) {
      setPlaying(false)
      return
    }
    narrate(sc.text, voice)
    const t = window.setTimeout(() => {
      setSceneIdx((i) => i + 1)
      setProgress(((sceneIdx + 1) / scenes.length) * 100)
    }, Math.max(sc.duration * 1000, 2000))
    return () => {
      window.clearTimeout(t)
      stop()
    }
  }, [playing, scenes, sceneIdx, narrate, stop, voice])

  // ── Hindi playback ──
  useEffect(() => {
    if (!hindiPlaying || !hindiScenes.length) return
    const sc = hindiScenes[hindiSceneIdx]
    if (!sc) {
      setHindiPlaying(false)
      return
    }
    speakHindi(sc.hindiText, () => {
      setHindiSceneIdx((i) => i + 1)
      setHindiProgress(((hindiSceneIdx + 1) / hindiScenes.length) * 100)
    })
    // Fallback timer in case speech doesn't fire onEnd
    const t = window.setTimeout(() => {
      setHindiSceneIdx((i) => i + 1)
      setHindiProgress(((hindiSceneIdx + 1) / hindiScenes.length) * 100)
    }, sc.duration * 1000 + 1000)
    return () => {
      window.clearTimeout(t)
      stopSpeaking()
    }
  }, [hindiPlaying, hindiScenes, hindiSceneIdx])

  // ── Timer for pipeline elapsed ──
  useEffect(() => {
    if (pipelineStartTime && !pipelineComplete) {
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - pipelineStartTime)
      }, 100)
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [pipelineStartTime, pipelineComplete])

  // ── English generate ──
  async function generate() {
    setLoading(true)
    setScript(null)
    try {
      const q = topic.trim() || 'India business'
      const res = await searchNews(q, 1)
      const article = res[0]
      if (!article) throw new Error('No article found')
      const s = await generateVideoScript(article)
      if (!s) throw new Error('Could not parse script')
      setScript(s)
      setSceneIdx(0)
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  // ── Hindi breaking pipeline ──
  async function startHindiPipeline() {
    setHindiLoading(true)
    setHindiScript(null)
    setBreakingArticle(null)
    setPipelineComplete(false)
    setPipelineStartTime(Date.now())
    setElapsedMs(0)

    try {
      // Step 1: Fetch breaking article
      let article: NewsArticle | null = null
      try {
        const res = await fetch('/api/breaking/latest')
        const data = (await res.json()) as { article?: NewsArticle }
        article = data.article || null
      } catch {
        console.log('[VideoStudio] API error, using mock data')
      }

      // Fallback to mock data if API fails
      if (!article) {
        console.log('[VideoStudio] Using mock breaking article')
        article = MOCK_BREAKING_ARTICLE
      }
      setBreakingArticle(article)

      // Step 2: Generate Hindi script
      const hs = await generateHindiVideoScript(article)
      if (!hs) throw new Error('Could not generate Hindi script')
      setHindiScript(hs)
      setHindiSceneIdx(0)
      setHindiProgress(0)
      setPipelineComplete(true)

      // Auto-play after generation
      setTimeout(() => {
        setHindiPlaying(true)
      }, 500)
    } catch (err) {
      console.error('[VideoStudio] Hindi pipeline error:', err)
      setPipelineComplete(true)
    } finally {
      setHindiLoading(false)
    }
  }

  const activeHindiScene = hindiScenes[hindiSceneIdx]
  const active = scenes[sceneIdx]
  const totalDur = useMemo(() => scenes.reduce((a, s) => a + s.duration, 0), [scenes])
  const hindiTotalDur = useMemo(() => hindiScenes.reduce((a, s) => a + s.duration, 0), [hindiScenes])
  const elapsedSeconds = (elapsedMs / 1000).toFixed(1)

  function downloadTxt() {
    if (!script) return
    const blob = new Blob([JSON.stringify(script, null, 2)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'newsos-video-script.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setMode('english')}
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: 12,
            border: mode === 'english' ? '2px solid #f0a500' : '1px solid rgba(255,255,255,0.1)',
            background: mode === 'english' ? 'rgba(240,165,0,0.1)' : 'transparent',
            color: mode === 'english' ? '#f0a500' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.15em', marginBottom: 4 }}>STANDARD MODE</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>▶ English Video Script Studio</div>
        </button>
        <button
          onClick={() => setMode('hindi-breaking')}
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: 12,
            border: mode === 'hindi-breaking' ? '2px solid #e63946' : '1px solid rgba(255,255,255,0.1)',
            background: mode === 'hindi-breaking' ? 'rgba(230,57,70,0.1)' : 'transparent',
            color: mode === 'hindi-breaking' ? '#e63946' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.15em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e63946', animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }} />
            CHALLENGE 3
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>⚡ Breaking → Hindi Video (&lt;60s)</div>
        </button>
      </div>

      {mode === 'english' ? (
        /* ── ENGLISH MODE ── */
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <h1 className="font-display text-2xl">AI Video News Studio</h1>
            <input
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm"
              placeholder="Topic or keywords…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              type="button"
              className="w-full rounded-xl border border-[var(--border)] px-4 py-2 text-xs hover:border-[var(--accent-gold)]"
              onClick={() => void generate()}
            >
              Use today&apos;s top story (auto-pick)
            </button>
            <div className="flex gap-2">
              {(['authoritative', 'casual', 'dramatic'] as VoicePreset[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`rounded-lg px-3 py-1 text-xs capitalize ${voice === v ? 'bg-[var(--accent-gold)] text-black' : 'border border-[var(--border)]'}`}
                  onClick={() => setVoice(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="w-full rounded-xl bg-[var(--accent-gold)] px-4 py-3 text-sm font-semibold text-black"
              onClick={() => void generate()}
              disabled={loading}
            >
              {loading ? 'Generating…' : 'Generate Video Script'}
            </button>
          </div>
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-black">
              <div
                className="flex aspect-video items-center justify-center p-8 text-center"
                style={{ backgroundColor: active?.background_color || '#111' }}
              >
                <motion.p key={sceneIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-2xl text-white md:text-3xl">
                  {active?.text ?? 'Script preview'}
                </motion.p>
              </div>
              <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs"
                  onClick={() => { setSceneIdx(0); setPlaying(true) }}
                  disabled={!scenes.length}
                >Play</button>
                <div className="h-1 flex-1 rounded-full bg-[var(--bg-elevated)]">
                  <div className="h-1 rounded-full bg-[var(--accent-gold)]" style={{ width: `${progress}%` }} />
                </div>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  {totalDur ? `${sceneIdx + 1}/${scenes.length}` : '—'}
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs" onClick={downloadTxt} disabled={!script}>
                Download Script
              </button>
              <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs" onClick={() => script && void navigator.clipboard.writeText(script.scenes.map((s) => s.text).join('\n'))} disabled={!script}>
                Copy narration
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── HINDI BREAKING MODE ── */
        <div>
          {/* Pipeline Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
              Breaking → Hindi Video Pipeline
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 600, margin: '0 auto 20px', lineHeight: 1.6 }}>
              One click: fetches the latest breaking news, generates a 60-90 second Hindi explainer
              video with culturally appropriate analogies, no English jargon, and accurate facts.
            </p>

            {!hindiLoading && !hindiScript && (
              <button
                onClick={() => void startHindiPipeline()}
                style={{
                  background: 'linear-gradient(135deg, #e63946, #f0a500)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '16px 40px',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#000',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                ⚡ Generate Hindi Video Now
              </button>
            )}
          </div>

          {/* Countdown Timer */}
          {(hindiLoading || pipelineComplete) && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{
                background: pipelineComplete ? (Number(elapsedSeconds) < 60 ? 'rgba(46,196,182,0.1)' : 'rgba(230,57,70,0.1)') : 'rgba(240,165,0,0.1)',
                border: `2px solid ${pipelineComplete ? (Number(elapsedSeconds) < 60 ? '#2ec4b6' : '#e63946') : '#f0a500'}`,
                borderRadius: 16,
                padding: '16px 32px',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                  {pipelineComplete ? 'PIPELINE COMPLETED IN' : 'PIPELINE RUNNING'}
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 48,
                  fontWeight: 700,
                  color: pipelineComplete ? (Number(elapsedSeconds) < 60 ? '#2ec4b6' : '#e63946') : '#f0a500',
                }}>
                  {elapsedSeconds}s
                </div>
                {pipelineComplete && Number(elapsedSeconds) < 60 && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#2ec4b6', letterSpacing: '0.15em', marginTop: 4 }}>
                    ✓ UNDER 60 SECONDS
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pipeline Steps */}
          {hindiLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#e63946', animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
                ))}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#e63946', letterSpacing: '0.1em' }}>
                {!breakingArticle ? '1/2 FETCHING BREAKING NEWS...' : '2/2 GENERATING HINDI SCRIPT...'}
              </div>
            </div>
          )}

          {/* Source Article */}
          {breakingArticle && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 24, maxWidth: 700, margin: '0 auto 24px' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 8 }}>
                SOURCE ARTICLE
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8', margin: '0 0 4px', lineHeight: 1.4 }}>
                {breakingArticle.title}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                {breakingArticle.description}
              </p>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
                {breakingArticle.source?.name}
              </div>
            </div>
          )}

          {/* Hindi Video Player */}
          {hindiScript && (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ overflow: 'hidden', borderRadius: 16, border: '2px solid rgba(230,57,70,0.3)', background: '#000' }}>
                {/* Video viewport */}
                <div
                  style={{
                    aspectRatio: '16/9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 32,
                    textAlign: 'center',
                    backgroundColor: activeHindiScene?.background_color || '#111',
                    transition: 'background-color 0.5s',
                    position: 'relative',
                  }}
                >
                  {/* Scene ID label */}
                  <div style={{ position: 'absolute', top: 12, left: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>
                    {activeHindiScene?.id?.toUpperCase() || 'READY'}
                  </div>

                  {/* Visual cue */}
                  {activeHindiScene?.visualCue && (
                    <div style={{ position: 'absolute', top: 12, right: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', maxWidth: 200, textAlign: 'right' }}>
                      🎬 {activeHindiScene.visualCue}
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={hindiSceneIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Hindi text (Devanagari) */}
                      <p style={{
                        fontFamily: "'Noto Sans Devanagari', 'Mangal', sans-serif",
                        fontSize: 28,
                        color: '#ffffff',
                        lineHeight: 1.6,
                        margin: '0 0 12px',
                        fontWeight: 600,
                      }}>
                        {activeHindiScene?.hindiText || hindiScript.hindiTitle || 'तैयार है'}
                      </p>

                      {/* Romanized (smaller, for non-Hindi readers) */}
                      {activeHindiScene?.romanized && (
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: 0 }}>
                          {activeHindiScene.romanized}
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* NewsOS branding */}
                  <div style={{ position: 'absolute', bottom: 12, left: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>
                    NEWSОС · HINDI EXPLAINER
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px', background: 'rgba(0,0,0,0.5)' }}>
                  <button
                    onClick={() => {
                      setHindiSceneIdx(0)
                      setHindiProgress(0)
                      setHindiPlaying(true)
                    }}
                    style={{ background: '#e63946', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
                  >
                    {hindiPlaying ? '⟳ Restart' : '▶ Play'}
                  </button>
                  <button
                    onClick={() => { setHindiPlaying(false); stopSpeaking() }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                  >
                    ⏸ Pause
                  </button>
                  <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.1)' }}>
                    <div style={{ height: 4, borderRadius: 4, background: '#e63946', width: `${hindiProgress}%`, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    {hindiTotalDur ? `${hindiSceneIdx + 1}/${hindiScenes.length} · ${hindiTotalDur}s` : '—'}
                  </span>
                </div>
              </div>

              {/* English reference & Fact check */}
              {activeHindiScene && (
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 6 }}>
                      ENGLISH REFERENCE
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                      {activeHindiScene.englishReference}
                    </p>
                  </div>
                  {hindiScript.factCheckSummary && (
                    <div style={{ background: 'rgba(46,196,182,0.05)', border: '1px solid rgba(46,196,182,0.2)', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#2ec4b6', letterSpacing: '0.1em', marginBottom: 6 }}>
                        ✓ FACT CHECK
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                        {hindiScript.factCheckSummary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Scene list */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 10 }}>
                  SCENE BREAKDOWN
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {hindiScenes.map((sc, i) => (
                    <button
                      key={sc.id}
                      onClick={() => { setHindiSceneIdx(i); setHindiPlaying(false); stopSpeaking() }}
                      style={{
                        display: 'flex', gap: 12, alignItems: 'center',
                        background: hindiSceneIdx === i ? 'rgba(230,57,70,0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${hindiSceneIdx === i ? 'rgba(230,57,70,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 8, padding: '8px 12px', cursor: 'pointer', width: '100%', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#e63946', minWidth: 20 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 2 }}>
                          {sc.id.toUpperCase()} · {sc.duration}s
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{sc.hindiText.slice(0, 60)}...</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounce { from { transform: translateY(0); opacity: 0.4; } to { transform: translateY(-5px); opacity: 1; } }
      `}</style>
    </div>
  )
}
