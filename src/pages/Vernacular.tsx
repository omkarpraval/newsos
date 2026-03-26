import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVernacularStore, type VernacularArticle, type VernacularCategory, type VernacularLang } from '../store/useVernacularStore'

export function Vernacular() {
  return <VernacularNewsstand />
}

const LANGS: Array<{
  code: VernacularLang
  script: string
  label: string
  speakers: string
  color: string
  className: string
  tts: string
  rate: number
  pitch: number
}> = [
  { code: 'hi', script: 'हिंदी', label: 'HINDI', speakers: '500M+', color: '#f97316', className: 'font-hindi', tts: 'hi-IN', rate: 0.9, pitch: 1.0 },
  { code: 'ta', script: 'தமிழ்', label: 'TAMIL', speakers: '80M+', color: '#0d9488', className: 'font-tamil', tts: 'ta-IN', rate: 0.85, pitch: 1.1 },
  { code: 'te', script: 'తెలుగు', label: 'TELUGU', speakers: '80M+', color: '#c2410c', className: 'font-telugu', tts: 'te-IN', rate: 0.9, pitch: 1.05 },
  { code: 'bn', script: 'বাংলা', label: 'BENGALI', speakers: '230M+', color: '#1d4ed8', className: 'font-bengali', tts: 'bn-IN', rate: 0.9, pitch: 1.0 },
]

const CATEGORIES: Array<{ key: VernacularCategory; label: string; icon: string }> = [
  { key: 'markets', label: 'Markets', icon: '📈' },
  { key: 'rbi', label: 'RBI & Policy', icon: '🏦' },
  { key: 'startups', label: 'Startups', icon: '🚀' },
  { key: 'budget', label: 'Budget', icon: '💰' },
  { key: 'global', label: 'Global Impact', icon: '🌍' },
  { key: 'economy', label: 'Economy', icon: '🌾' },
]

function timeAgo(iso?: string) {
  if (!iso) return 'now'
  const t = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - t)
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function VernacularNewsstand() {
  const {
    selectedLanguage,
    selectedCategory,
    setLanguage,
    setCategory,
    articles,
    translatedArticles,
    translateArticle,
    translateAll,
    glossary,
    savedTerms,
    saveTerm,
    clearSavedTerms,
    audioMode,
    toggleAudioMode,
    addToAudioQueue,
    audioQueue,
    popAudioQueue,
    isPlaying,
    setIsPlaying,
    stats,
    tickReadersNow,
    isLoading,
    isTranslating,
    error,
    fetchArticles,
    lastTranslatedUrl,
    streak,
  } = useVernacularStore()

  const [openEnglish, setOpenEnglish] = useState<Record<string, boolean>>({})
  const [splitView, setSplitView] = useState<Record<string, boolean>>({})
  const [autoTranslated, setAutoTranslated] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)

  const activeLang = LANGS.find((l) => l.code === selectedLanguage) || LANGS[0]
  const accent = activeLang.color

  useEffect(() => {
    void fetchArticles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  useEffect(() => {
    const t = window.setInterval(() => tickReadersNow(), 2200)
    return () => window.clearInterval(t)
  }, [tickReadersNow])

  useEffect(() => {
    if (!articles.length || autoTranslated) return
    setAutoTranslated(true)
    void translateArticle(articles[0], 'normal')
  }, [articles, autoTranslated, translateArticle])

  useEffect(() => {
    const translatedCount = Object.keys(translatedArticles).length
    if (translatedCount >= 3 && translatedCount < articles.length) {
      showToast('🎯 Auto-translating remaining articles…')
      void translateAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translatedArticles])

  function showToast(t: string) {
    setToast(t)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  // Audio queue player (Web Speech API)
  useEffect(() => {
    if (!audioMode) return
    if (!audioQueue.length) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    if (isPlaying) return

    const next = audioQueue[0]
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(next.text)
      u.lang = next.lang
      const langCfg = LANGS.find((l) => l.tts === next.lang)
      if (langCfg) {
        u.rate = langCfg.rate
        u.pitch = langCfg.pitch
      } else {
        u.rate = 0.9
        u.pitch = 1.0
      }
      u.onend = () => {
        setIsPlaying(false)
        popAudioQueue()
      }
      u.onerror = () => {
        setIsPlaying(false)
        popAudioQueue()
      }
      setIsPlaying(true)
      window.speechSynthesis.speak(u)
    } catch {
      setIsPlaying(false)
      popAudioQueue()
    }
  }, [audioMode, audioQueue, isPlaying, popAudioQueue, setIsPlaying])

  const translatedToday = stats.translatedToday
  const readersNow = stats.readersNow[selectedLanguage]
  const avgSec = Math.max(0.6, Math.min(4.2, stats.avgTranslateMs / 1000))

  const streakDays = streak[selectedLanguage]?.days || 0

  const bharatSpeaks = useMemo(() => {
    // convincingly “real” demo: derive from latest translated culturalDistance + sentiment hints
    const base = translatedArticles[lastTranslatedUrl || '']?.culturalDistance ?? 52
    const worry = Math.max(12, Math.min(55, Math.round((base / 100) * 38 + 18)))
    const neutral = Math.max(18, Math.min(48, Math.round(34 - (base / 100) * 10 + 8)))
    const optimistic = Math.max(12, 100 - worry - neutral)
    return { optimistic, neutral, worried: worry }
  }, [translatedArticles, lastTranslatedUrl])

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/10 bg-[#0b0f16] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold text-white/90">Vernacular Engine</div>
            <div className="mt-1 text-sm text-white/55">Culturally adapted business news — not literal translation</div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/75"
            onClick={() => {
              toggleAudioMode()
              showToast(audioMode ? 'Audio Mode off' : 'Audio Mode on')
            }}
          >
            🔊 Audio Mode
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          {LANGS.map((l) => {
            const active = l.code === selectedLanguage
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className="rounded-2xl border p-4 text-left transition"
                style={{
                  borderColor: active ? l.color : 'rgba(255,255,255,0.08)',
                  background: active ? `${l.color}22` : 'rgba(255,255,255,0.02)',
                }}
              >
                <div className={`${l.className} text-2xl text-white/90`}>{l.script}</div>
                <div className="mt-1 text-xs font-semibold tracking-widest text-white/55">{l.label}</div>
                <div className="mt-2 font-mono text-[11px] text-white/45">
                  {l.speakers} <span className="text-white/30">speakers</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => {
            const active = c.key === selectedCategory
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className="shrink-0 rounded-full border px-4 py-2 text-sm"
                style={{
                  borderColor: active ? `${accent}88` : 'rgba(255,255,255,0.10)',
                  background: active ? `${accent}22` : 'rgba(255,255,255,0.02)',
                  color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.70)',
                }}
              >
                {c.icon} {c.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-white/60">
          🌐 Translated today: <span className="font-mono text-white/80">{translatedToday}</span> &nbsp; | &nbsp; 👁{' '}
          <span className="font-mono text-white/80">{readersNow}</span> readers in {activeLang.label} right now &nbsp; | &nbsp; ⚡ Avg translation:{' '}
          <span className="font-mono text-white/80">{avgSec.toFixed(1)}s</span>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error} <button className="ml-2 underline" onClick={() => void fetchArticles()}>Retry</button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading && !articles.length
              ? Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={`sk-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="h-40 w-full rounded-xl bg-white/[0.06] [animation:shimmer_1.2s_ease-in-out_infinite] [background:linear-gradient(90deg,rgba(255,255,255,0.05),rgba(255,255,255,0.09),rgba(255,255,255,0.05))] [background-size:200%_100%]" />
                    <div className={`mt-4 ${activeLang.className} text-sm text-white/30`}>
                      {selectedLanguage === 'hi' ? 'ड ड ड ड ड ड ड…' : selectedLanguage === 'ta' ? 'உ உ உ உ…' : selectedLanguage === 'te' ? 'మ మ మ మ…' : 'অ অ অ অ…'}
                    </div>
                  </motion.div>
                ))
              : articles.map((a, idx) => (
                  <motion.div
                    key={a.url}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                  >
                    {a.urlToImage ? (
                      <div className="relative h-44 w-full bg-black/20">
                        <img src={a.urlToImage.startsWith('http') ? `/api/image?url=${encodeURIComponent(a.urlToImage)}` : a.urlToImage} className="h-full w-full object-cover opacity-90" alt="" />
                        <div className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs text-white/85" style={{ background: `${accent}88` }}>
                          {activeLang.script}
                        </div>
                      </div>
                    ) : null}

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                        <span className="font-mono">{a.source?.name || 'News'}</span>
                        <span>·</span>
                        <span className="font-mono">{timeAgo(a.publishedAt)}</span>
                        {translatedArticles[a.url] ? (
                          <>
                            <span>·</span>
                            <span className="font-mono text-white/65">✓ Culturally Adapted</span>
                          </>
                        ) : null}
                      </div>

                      {!translatedArticles[a.url] ? (
                        <>
                          <div className="mt-2 text-lg font-semibold text-white/90">{a.title}</div>
                          <div className="mt-2 line-clamp-2 text-sm text-white/60">{a.description}</div>
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="button"
                              className="rounded-xl px-4 py-2 text-sm font-semibold text-black"
                              style={{ background: accent }}
                              onClick={() => void translateArticle(a, 'normal')}
                              disabled={!!isTranslating[a.url]}
                            >
                              {isTranslating[a.url] ? '🌐 Translating…' : `🔄 Translate to ${activeLang.label}`}
                            </button>
                            <div className="font-mono text-[11px] text-white/45">
                              Difficulty: ●●●○○ &nbsp; Est. read: 45 sec
                            </div>
                          </div>
                        </>
                      ) : (
                        <TranslatedCard
                          article={a}
                          accent={accent}
                          langClass={activeLang.className}
                          ttsLang={activeLang.tts}
                          audioMode={audioMode}
                          onListen={(text) => addToAudioQueue({ text, lang: activeLang.tts, title: a.title })}
                          split={!!splitView[a.url]}
                          onToggleSplit={() => setSplitView((s) => ({ ...s, [a.url]: !s[a.url] }))}
                          showEn={!!openEnglish[a.url]}
                          onToggleEnglish={() => setOpenEnglish((s) => ({ ...s, [a.url]: !s[a.url] }))}
                          onExplainKids={() => void translateArticle(a, 'eli12').then(() => showToast('Explain-like-12 generated'))}
                          onShare={() => {
                            const t = translatedArticles[a.url]
                            if (!t) return
                            downloadShareCard({
                              accent,
                              title: t.translatedTitle,
                              source: a.source?.name || 'NewsOS',
                              date: (a.publishedAt || new Date().toISOString()).slice(0, 10),
                              footer: 'NewsOS · Bharat Mode',
                            })
                            showToast('Share card downloaded')
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
          </AnimatePresence>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-2 text-lg font-semibold text-white/90">भारत की राय (India's Opinion Today)</div>
            <div className="text-sm text-white/55">What {activeLang.label} readers are feeling about today’s top business story:</div>
            <div className="mt-4 space-y-3">
              <ReactionBar label="😊 Optimistic" value={bharatSpeaks.optimistic} color="#22c55e" />
              <ReactionBar label="😐 Neutral" value={bharatSpeaks.neutral} color="#9ca3af" />
              <ReactionBar label="😟 Worried" value={bharatSpeaks.worried} color="#ef4444" />
            </div>
            <div className="mt-3 font-mono text-[10px] text-white/35">demo: sentiment simulated from current arc</div>
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className={`text-sm font-semibold text-white/90 ${activeLang.className}`}>
                📚 आज के ज़रूरी शब्द <span className="ml-2 text-xs text-white/45">(Today’s Key Terms)</span>
              </div>
              <div className="mt-3 space-y-2">
                {glossary.length ? (
                  glossary.map((g) => (
                    <div key={g.term} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`${activeLang.className} text-sm text-white/85`}>{g.term}</div>
                          <div className="font-mono text-[11px] text-white/45">{g.romanized}</div>
                        </div>
                        <button
                          type="button"
                          className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 text-[10px] text-white/60"
                          onClick={() => {
                            saveTerm(g)
                            showToast('Saved term')
                          }}
                        >
                          Save
                        </button>
                      </div>
                      <div className={`${activeLang.className} mt-2 text-xs text-white/65`}>{g.meaning}</div>
                      <div className="mt-2 font-mono text-[10px] text-white/35">EN: {g.englishEquivalent}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/45">Translate an article to generate today’s glossary.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/90">🔥 Language streak</div>
              <div className="mt-2 text-sm text-white/60">
                Your {activeLang.label} streak: <span className="font-mono text-white/85">{streakDays}</span> days
              </div>
              <div className="mt-2 text-xs text-white/40">Keep reading in {activeLang.label} to maintain your streak.</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/90">📌 My Terms</div>
              <div className="mt-3 space-y-2">
                {savedTerms.length ? (
                  savedTerms.slice(0, 10).map((t) => (
                    <div key={`${t.term}-${t.englishEquivalent}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className={`${activeLang.className} text-sm text-white/85`}>{t.term}</div>
                      <div className="font-mono text-[10px] text-white/35">{t.englishEquivalent}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/45">Save terms from the glossary to build your personal list.</div>
                )}
              </div>
              {savedTerms.length ? (
                <button type="button" className="mt-3 text-xs text-white/55 underline" onClick={clearSavedTerms}>
                  Clear All
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed right-6 top-24 z-[300] rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white/85 backdrop-blur">
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {audioMode ? <AudioPlayerBar accent={accent} queue={audioQueue} isPlaying={isPlaying} onStop={() => { try { window.speechSynthesis?.cancel?.() } catch {} setIsPlaying(false) }} /> : null}
    </div>
  )
}

function ReactionBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="font-mono text-white/75">{value}%</span>
      </div>
      <div className="h-2 rounded bg-white/10">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.9 }} className="h-full rounded" style={{ background: color }} />
      </div>
    </div>
  )
}

function TranslatedCard({
  article,
  accent,
  langClass,
  ttsLang,
  audioMode,
  onListen,
  showEn,
  onToggleEnglish,
  split,
  onToggleSplit,
  onExplainKids,
  onShare,
}: {
  article: VernacularArticle
  accent: string
  langClass: string
  ttsLang: string
  audioMode: boolean
  onListen: (text: string) => void
  showEn: boolean
  onToggleEnglish: () => void
  split: boolean
  onToggleSplit: () => void
  onExplainKids: () => void
  onShare: () => void
}) {
  const t = useVernacularStore((s) => s.translatedArticles[article.url])
  if (!t) return null
  const listenText = `${t.translatedTitle}. ${t.translatedSummary}. ${t.keyImpact}. ${t.localAngle}`
  return (
    <div className={`${langClass}`}>
      <div className="mt-3 text-xl font-semibold text-white/92">{t.translatedTitle}</div>
      <div className="mt-2 text-sm text-white/70">{t.translatedSummary}</div>

      <div className="mt-3 rounded-xl border border-white/10 p-3" style={{ background: `${accent}12` }}>
        <div className="mb-1 text-xs font-semibold text-white/75">💡 Key Impact</div>
        <div className="text-sm text-white/85">{t.keyImpact}</div>
      </div>

      <div className="mt-3 text-sm text-white/70">
        <span className="mr-2 font-semibold">📍 Local Angle:</span> {t.localAngle}
      </div>

      {t.cultureBridge ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="mb-1 text-xs font-semibold text-white/75">🌉 Culture Bridge</div>
          <div className="text-sm text-white/70">{t.cultureBridge}</div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        {audioMode ? (
          <button type="button" className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-white/80" onClick={() => onListen(listenText)}>
            🔊 Listen
          </button>
        ) : null}
        <a className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-white/80" href={article.url.startsWith('fallback://') ? undefined : article.url} target="_blank" rel="noreferrer">
          📖 Read Full
        </a>
        <button type="button" className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-white/80" onClick={onToggleSplit}>
          EN ↔ Native
        </button>
        <button type="button" className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-white/80" onClick={onExplainKids}>
          बच्चों को समझाएं
        </button>
        <button type="button" className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-white/80" onClick={onShare}>
          Share
        </button>
        <span className="ml-auto font-mono text-[11px] text-white/45">TTS: {ttsLang}</span>
      </div>

      <button type="button" className="mt-4 text-xs text-white/55 underline" onClick={onToggleEnglish}>
        {showEn ? 'Hide original English' : 'Show original English ↓'}
      </button>

      <AnimatePresence initial={false}>
        {(showEn || split) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="border-r border-white/10 p-4" style={{ borderLeft: `4px solid ${accent}` }}>
                <div className="mb-2 text-xs font-semibold text-white/75">Native</div>
                <div className="text-sm text-white/85">{t.translatedTitle}</div>
                <div className="mt-2 text-sm text-white/70">{t.translatedSummary}</div>
                <div className="mt-3 text-sm text-white/80">{t.keyImpact}</div>
                <div className="mt-2 text-sm text-white/70">{t.localAngle}</div>
              </div>
              <div className="p-4">
                <div className="mb-2 text-xs font-semibold text-white/75">English</div>
                <div className="text-sm text-white/85">{article.title}</div>
                <div className="mt-2 text-sm text-white/60">{article.description}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AudioPlayerBar({
  accent,
  queue,
  isPlaying,
  onStop,
}: {
  accent: string
  queue: Array<{ id: string; title?: string; lang: string }>
  isPlaying: boolean
  onStop: () => void
}) {
  const now = queue[0]
  return (
    <div className="fixed bottom-4 left-1/2 z-[260] w-[min(980px,92vw)] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-3 w-3 rounded-full" style={{ background: accent }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-white/85">{now?.title || 'Audio queue'}</div>
          <div className="mt-1 font-mono text-[11px] text-white/45">
            {now?.lang || '—'} · {queue.length} in queue
          </div>
        </div>
        <button type="button" className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-white/80" onClick={onStop}>
          {isPlaying ? 'Pause/Stop' : 'Stop'}
        </button>
      </div>
    </div>
  )
}

function downloadShareCard(payload: { accent: string; title: string; source: string; date: string; footer: string }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1080
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // background gradient
  const g = ctx.createLinearGradient(0, 0, 1080, 1080)
  g.addColorStop(0, payload.accent)
  g.addColorStop(1, '#0b0f16')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1080, 1080)

  // subtle noise overlay
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fillRect(0, 0, 1080, 1080)

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = '700 56px "DM Sans", sans-serif'
  wrapText(ctx, payload.title, 90, 180, 900, 74, 8)

  ctx.fillStyle = 'rgba(255,255,255,0.70)'
  ctx.font = '500 28px "JetBrains Mono", monospace'
  ctx.fillText(`${payload.source} · ${payload.date}`, 90, 860)

  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = '500 26px "DM Sans", sans-serif'
  ctx.fillText(payload.footer, 90, 920)

  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = 'newsos-bharat-mode.png'
  a.click()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/)
  let line = ''
  let lines = 0
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y)
      line = words[n] + ' '
      y += lineHeight
      lines++
      if (lines >= maxLines - 1) break
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, y)
}

