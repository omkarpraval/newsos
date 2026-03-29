import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { fetchHeadlines } from '../services/newsapi'
import { fetchIndianMarkets } from '../services/markets'
import { ZoneOverlay } from '../components/world/ZoneOverlay'
import { usePersonalizationStore } from '../store/usePersonalizationStore'

type ZoneDef = {
  id: string
  name: string
  color: string
  bgColor: string
  gridColor: string
  fetchType: 'headlines' | 'search'
  fetchCategory: string | null
  fetchQuery: string | null
  ambientLabel: string
}

const ZONES: ZoneDef[] = [
  { id: 'markets', name: 'Markets Plaza', color: '#f0a500', bgColor: '#1a1400', gridColor: 'rgba(240,165,0,0.08)', ambientLabel: 'Financial District', fetchType: 'headlines', fetchCategory: 'business', fetchQuery: null },
  { id: 'parliament', name: 'Parliament Hall', color: '#3a86ff', bgColor: '#001020', gridColor: 'rgba(58,134,255,0.08)', ambientLabel: 'Seat of Power', fetchType: 'search', fetchCategory: null, fetchQuery: 'India parliament government policy Modi BJP Congress' },
  { id: 'startup', name: 'Startup District', color: '#8b5cf6', bgColor: '#0d0020', gridColor: 'rgba(139,92,246,0.08)', ambientLabel: 'Innovation Hub', fetchType: 'search', fetchCategory: null, fetchQuery: 'India startup funding unicorn technology AI' },
  { id: 'world', name: 'World Events Arena', color: '#2ec4b6', bgColor: '#001a18', gridColor: 'rgba(46,196,182,0.08)', ambientLabel: 'Global Stage', fetchType: 'headlines', fetchCategory: 'general', fetchQuery: null },
  { id: 'bharat', name: 'Bharat Corner', color: '#ff6b35', bgColor: '#1a0800', gridColor: 'rgba(255,107,53,0.08)', ambientLabel: 'Desh Ki Baat', fetchType: 'search', fetchCategory: null, fetchQuery: 'India economy infrastructure rural agriculture development' },
  { id: 'breaking', name: 'Daily Prophet HQ', color: '#e63946', bgColor: '#1a0000', gridColor: 'rgba(230,57,70,0.08)', ambientLabel: 'Breaking News', fetchType: 'headlines', fetchCategory: 'general', fetchQuery: null },
]

type Article = {
  title: string
  description?: string
  urlToImage?: string
  url: string
  source?: { name?: string }
  publishedAt?: string
}

type ZoneWithArticles = { zone: ZoneDef; articles: Article[] }

const FALLBACK_IMAGES: Record<string, string> = {
  markets: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600',
  parliament: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600',
  startup: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600',
  world: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
  bharat: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600',
  breaking: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600',
}

export function NewsWorld() {
  const [zonesData, setZonesData] = useState<ZoneWithArticles[]>([])
  const [loading, setLoading] = useState(true)
  const [playerPos, setPlayerPos] = useState(0)
  const [activeArticle, setActiveArticle] = useState<Article | null>(null)
  const [activeZone, setActiveZone] = useState<ZoneDef | null>(null)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const keysRef = useRef<Set<string>>(new Set())
  const frameRef = useRef<number | null>(null)
  const posRef = useRef(0)
  const openStartRef = useRef<number | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showPersonalizedToast, setShowPersonalizedToast] = useState(false)
  const prevPersonalized = useRef(false)
  const { isPersonalized, interestScores, dominantZone, recordView } = usePersonalizationStore()
  const closeOverlay = useCallback(() => {
    if (isOverlayOpen && activeArticle && activeZone) {
      const dwellMs = openStartRef.current ? Date.now() - openStartRef.current : 0
      if (dwellMs > 0) {
        recordView({
          zoneId: activeZone.id,
          zoneName: activeZone.name,
          articleTitle: activeArticle.title,
          dwellMs,
        })
        console.log(`[Personalization] Recorded view in ${activeZone.id}, dwell: ${dwellMs}ms`)
      }
    }
    setIsOverlayOpen(false)
    setActiveArticle(null)
    openStartRef.current = null
  }, [activeArticle, activeZone, isOverlayOpen, recordView])

  const { data: mkts } = useQuery({
    queryKey: ['world-markets'],
    queryFn: fetchIndianMarkets,
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    async function loadWorld() {
      setLoading(true)
      console.log('[World] Starting article fetch for all zones...')
      try {
        const results = await Promise.all(
          ZONES.map(async (zone) => {
            try {
              let articles: Article[] = []
              if (zone.fetchType === 'headlines') {
                articles = (await fetchHeadlines(zone.fetchCategory || 'business', 8)) as Article[]
              } else {
                const r = await fetch(
                  `/api/news?type=search&query=${encodeURIComponent(zone.fetchQuery || 'India business')}&pageSize=8&daysBack=14`
                )
                const d = (await r.json()) as { articles?: Article[]; error?: string }
                if (d.error) throw new Error(d.error)
                articles = d.articles || []
              }
              console.log(`[World] Zone "${zone.id}": ${articles.length} articles`)
              if (!articles.length) throw new Error('No articles returned')
              return { zone, articles: articles.slice(0, 8) as Article[] }
            } catch (err) {
              console.error(`[World] Zone "${zone.id}" failed:`, err)
              return {
                zone,
                articles: [],
              }
            }
          })
        )
        setZonesData(results)
        setLastRefresh(new Date())
        const totalLoaded = results.reduce((sum, zd) => sum + zd.articles.length, 0)
        console.log(`[World] Total articles loaded: ${totalLoaded}`)
      } finally {
        setLoading(false)
      }
    }
    void loadWorld()
  }, [])

  useEffect(() => {
    if (!lastRefresh) return
    const REFRESH_INTERVAL_MS = 10 * 60 * 1000
    const interval = setInterval(async () => {
      setIsRefreshing(true)
      console.log('[World] Background refresh triggered...')
      const posterCount = Math.max(zonesData.reduce((sum, zd) => sum + zd.articles.length, 0), 1)
      const currentZoneIdx = Math.min(
        Math.floor((posRef.current / posterCount) * ZONES.length),
        ZONES.length - 1
      )
      const zonesToRefresh = [currentZoneIdx, currentZoneIdx + 1].filter((i) => i < ZONES.length)
      const refreshed = await Promise.allSettled(
        zonesToRefresh.map(async (idx) => {
          const zone = ZONES[idx]
          let url = ''
          if (zone.fetchType === 'headlines') {
            url = `/api/news?type=headlines&category=${zone.fetchCategory}&pageSize=8`
          } else {
            url = `/api/news?type=search&query=${encodeURIComponent(zone.fetchQuery || 'India business')}&pageSize=8&daysBack=14`
          }
          const res = await fetch(url)
          const data = (await res.json()) as { articles?: Article[] }
          return { zoneId: zone.id, articles: data.articles || [] }
        })
      )

      setZonesData((prev) =>
        prev.map((zd) => {
          const rz = refreshed
            .filter((r): r is PromiseFulfilledResult<{ zoneId: string; articles: Article[] }> => r.status === 'fulfilled')
            .map((r) => r.value)
            .find((r) => r.zoneId === zd.zone.id)
          if (rz && rz.articles.length) return { ...zd, articles: rz.articles }
          return zd
        })
      )
      setLastRefresh(new Date())
      setIsRefreshing(false)
      console.log('[World] Background refresh complete')
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [lastRefresh, zonesData])

  useEffect(() => {
    if (isPersonalized && !prevPersonalized.current) {
      setShowPersonalizedToast(true)
      const timer = window.setTimeout(() => setShowPersonalizedToast(false), 5000)
      prevPersonalized.current = true
      return () => window.clearTimeout(timer)
    }
    prevPersonalized.current = isPersonalized
  }, [isPersonalized])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (e.key === 'Escape') {
        closeOverlay()
      }
      if ((e.key === 'e' || e.key === 'E') && activeArticle && activeZone) {
        openStartRef.current = Date.now()
        setIsOverlayOpen(true)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [activeArticle, activeZone, closeOverlay])

  const allPosters = useMemo(() => {
    const base = zonesData.flatMap((zd) =>
      zd.articles.map((a) => ({ article: a, zone: zd.zone, score: interestScores[zd.zone.id] || 0 }))
    )
    if (!isPersonalized) return base
    const sorted = [...base].sort((a, b) => b.score - a.score)
    const extras: typeof base = []
    base.forEach((item) => {
      if (item.score >= 70) extras.push({ ...item })
    })
    const result: typeof base = []
    let extraIdx = 0
    sorted.forEach((item, i) => {
      result.push(item)
      if (i % 3 === 2 && extraIdx < extras.length) result.push(extras[extraIdx++])
    })
    return result
  }, [zonesData, isPersonalized, interestScores])
  const totalPosters = allPosters.length

  useEffect(() => {
    let last = 0
    function loop(t: number) {
      const delta = (t - last) / 1000
      last = t
      const speed = 3.5
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) {
        posRef.current = Math.min(posRef.current + speed * delta, Math.max(totalPosters - 1, 0))
        setPlayerPos(posRef.current)
      }
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) {
        posRef.current = Math.max(posRef.current - speed * delta, 0)
        setPlayerPos(posRef.current)
      }
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [totalPosters])

  const currentZoneIndex = Math.min(
    Math.floor((playerPos / Math.max(totalPosters, 1)) * ZONES.length),
    ZONES.length - 1
  )
  const currentZone = ZONES[Math.max(currentZoneIndex, 0)] || ZONES[0]
  const POSTER_SPACING = 280
  const cameraZ = playerPos * POSTER_SPACING

  if (loading) {
    return (
      <div className="relative -m-6 flex min-h-[calc(100vh-6rem)] items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />
          <p className="font-mono text-sm text-[var(--text-secondary)]">Loading the News World...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative -m-6 h-[calc(100vh-6rem)] overflow-hidden"
      style={{ background: currentZone.bgColor, transition: 'background 1.5s ease' }}
    >
      <div className="absolute inset-0 [perspective:900px] [perspective-origin:50%_45%]">
        <div
          className="absolute bottom-0 left-[-50%] right-[-50%] h-[55%] [transform-origin:bottom_center] [transform:rotateX(75deg)]"
          style={{
            backgroundImage: `linear-gradient(${currentZone.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentZone.gridColor} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
        <div
          className="absolute left-[-50%] right-[-50%] top-0 h-[30%] [transform-origin:top_center] [transform:rotateX(-75deg)]"
          style={{
            backgroundImage: `linear-gradient(${currentZone.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentZone.gridColor} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {allPosters.map((item, i) => {
            const posterZ = i * POSTER_SPACING - cameraZ
            const side = i % 2 === 0 ? -1 : 1
            const x = side * 340
            const isNear = Math.abs(posterZ) < 200
            const isFar = posterZ < -600 || posterZ > 800
            if (isFar) return null
            const opacity = posterZ > 0 ? Math.max(0, 1 - posterZ / 700) : Math.max(0, 1 + posterZ / 300)
            const img = item.article.urlToImage || FALLBACK_IMAGES[item.zone.id]
            const title =
              item.article.title?.length && item.article.title.length > 80
                ? `${item.article.title.slice(0, 77)}...`
                : item.article.title || 'Loading...'
            return (
              <div
                key={`${item.zone.id}-${i}`}
                onClick={() => {
                  if (!isNear) return
                  setActiveArticle(item.article)
                  setActiveZone(item.zone)
                  openStartRef.current = Date.now()
                  setIsOverlayOpen(true)
                }}
                className="absolute left-1/2 top-1/2 h-[220px] w-[340px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl"
                style={{
                  transform: `translate(-50%, -50%) translate3d(${x}px, ${i % 3 === 0 ? -20 : i % 3 === 1 ? 10 : -5}px, ${-posterZ}px)`,
                  opacity,
                  border: isNear ? `2px solid ${item.zone.color}` : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isNear ? `0 0 40px ${item.zone.color}66, 0 0 80px ${item.zone.color}22` : 'none',
                }}
              >
                <img
                  src={img}
                  alt={item.article.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = FALLBACK_IMAGES[item.zone.id]
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/95" />
                <div
                  className="absolute left-2 top-2 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-black"
                  style={{ background: item.zone.color }}
                >
                  {item.zone.name}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="line-clamp-2 font-display text-sm text-white">{title}</p>
                  <p className="mt-1 font-mono text-[9px]" style={{ color: `${item.zone.color}cc` }}>
                    {item.article.source?.name?.toUpperCase() || 'NEWSOS'} · {item.article.publishedAt ? formatTimeAgo(item.article.publishedAt) : ''}
                  </p>
                  {isNear && (
                    <>
                      <p className="mt-1 line-clamp-2 text-[10px] text-white/70">
                        {item.article.description || 'No description available.'}
                      </p>
                      <p className="mt-2 font-mono text-[9px]" style={{ color: item.zone.color }}>
                        PRESS E OR CLICK TO ENTER →
                      </p>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 text-center">
        <motion.div
          key={currentZone.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: currentZone.color }}
        >
          {currentZone.ambientLabel}
        </motion.div>
        <motion.div
          key={`name-${currentZone.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl text-[var(--text-primary)]"
        >
          {currentZone.name}
        </motion.div>
      </div>
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2 font-mono text-[10px] tracking-widest text-white/50">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: isRefreshing ? currentZone.color : '#2ec4b6' }}
        />
        {isRefreshing
          ? 'REFRESHING...'
          : lastRefresh
            ? `LIVE · Updated ${Math.floor((Date.now() - lastRefresh.getTime()) / 60000)}m ago`
            : 'LIVE'}
      </div>

      <div className="pointer-events-none absolute bottom-20 left-1/2 z-20 w-[320px] -translate-x-1/2">
        <div className="mb-2 flex justify-center gap-1">
          {ZONES.map((z, i) => (
            <div
              key={z.id}
              className="h-[3px] w-8 rounded"
              style={{ background: i === currentZoneIndex ? z.color : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 font-mono text-[11px] tracking-widest text-white/45">
        ← → or A/D to move · CLICK poster to open · ESC to close
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-xl border border-[var(--border-subtle)] bg-black/40 px-3 py-2 font-mono text-[10px] text-[var(--accent-gold)]">
        {(mkts?.quotes ?? []).map((q) => (
          <div key={q.symbol}>
            {q.symbol}: {q.price != null ? q.price.toFixed(2) : '—'}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isOverlayOpen && activeArticle && activeZone && (
          <ZoneOverlay
            article={activeArticle}
            zone={activeZone}
            onClose={closeOverlay}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPersonalizedToast && dominantZone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-black/85 px-4 py-2 text-xs text-[var(--text-primary)]"
            style={{ borderColor: currentZone.color }}
          >
            <span style={{ color: currentZone.color }}>✦ Feed personalized</span> — showing more{' '}
            <span style={{ color: currentZone.color }}>
              {ZONES.find((z) => z.id === dominantZone)?.name}
            </span>{' '}
            based on your interests
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  } catch {
    return ''
  }
}
