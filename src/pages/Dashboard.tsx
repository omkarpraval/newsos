import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useBehaviorStore } from '../store/useBehaviorStore'
import { usePersonalizationStore } from '../store/usePersonalizationStore'
import { useUserStore } from '../store/useUserStore'
import { callGroq, parseGroqJSON } from '../services/groq'

interface Article {
  title: string
  description: string
  urlToImage: string
  url: string
  source: { name: string }
  publishedAt: string
  category?: string
}

interface MarketData {
  symbol: string
  price: string
  change: string
  changePercent: string
  isUp: boolean
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch {
    return ''
  }
}

function isBreaking(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 60 * 60 * 1000
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  business: { label: 'Markets', color: '#f0a500', icon: '📈' },
  technology: { label: 'Tech', color: '#8b5cf6', icon: '⚡' },
  politics: { label: 'Policy', color: '#3a86ff', icon: '🏛' },
  general: { label: 'World', color: '#2ec4b6', icon: '🌍' },
  startup: { label: 'Startup', color: '#8b5cf6', icon: '🚀' },
  sports: { label: 'Sports', color: '#e63946', icon: '🏏' },
  science: { label: 'Science', color: '#06d6a0', icon: '🔬' },
  health: { label: 'Health', color: '#ff6b9d', icon: '❤️' },
}

export function Dashboard() {
  const navigate = useNavigate()
  const { persona } = useUserStore()
  const { track, categoryScores, topCategories, totalArticlesRead, recentSearches } = useBehaviorStore()
  const { isPersonalized } = usePersonalizationStore()
  const [heroArticle, setHeroArticle] = useState<Article | null>(null)
  const [feedArticles, setFeedArticles] = useState<Article[]>([])
  const [marketArticles, setMarketArticles] = useState<Article[]>([])
  const [breakingArticles, setBreakingArticles] = useState<Article[]>([])
  const [markets, setMarkets] = useState<MarketData[]>([])
  const [niftyMood, setNiftyMood] = useState<{ label: string; color: string; description: string } | null>(null)
  const [readingInsight, setReadingInsight] = useState('')
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('for-you')
  const [expandedArticle, setExpandedArticle] = useState<Article | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const articleOpenTime = useRef<number>(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-persona', persona)
  }, [persona])

  useEffect(() => {
    void loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true)
      void loadDashboard(true).finally(() => setIsRefreshing(false))
    }, 10 * 60 * 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDashboard(silent = false) {
    if (!silent) setLoading(true)
    try {
      const [businessRes, generalRes, techRes, marketRes, breakingRes] = await Promise.allSettled([
        fetch('/api/news?type=headlines&category=business&pageSize=12').then((r) => r.json()),
        fetch('/api/news?type=headlines&category=general&pageSize=8').then((r) => r.json()),
        fetch('/api/news?type=search&query=India+technology+startup+AI&pageSize=8&daysBack=7').then((r) => r.json()),
        fetch('/api/news?type=search&query=Nifty+Sensex+BSE+NSE+stock+market+India&pageSize=6&daysBack=3').then((r) => r.json()),
        fetch('/api/news?type=headlines&category=general&pageSize=5').then((r) => r.json()),
      ])
      const businessArticles: Article[] = businessRes.status === 'fulfilled' ? (businessRes.value.articles || []) : []
      const generalArticles: Article[] = generalRes.status === 'fulfilled' ? (generalRes.value.articles || []) : []
      const techArticles: Article[] = techRes.status === 'fulfilled' ? (techRes.value.articles || []) : []
      const marketRaw: Article[] = marketRes.status === 'fulfilled' ? (marketRes.value.articles || []) : []
      const breakingRaw: Article[] = breakingRes.status === 'fulfilled' ? (breakingRes.value.articles || []) : []

      businessArticles.forEach((a) => (a.category = 'business'))
      generalArticles.forEach((a) => (a.category = 'general'))
      techArticles.forEach((a) => (a.category = 'technology'))
      marketRaw.forEach((a) => (a.category = 'business'))

      const breaking = breakingRaw.filter((a) => Date.now() - new Date(a.publishedAt).getTime() < 2 * 60 * 60 * 1000).slice(0, 3)
      setBreakingArticles(breaking)

      const allArticles = [...businessArticles, ...generalArticles, ...techArticles].filter((a) => a.urlToImage)
      setHeroArticle(allArticles[0] || null)
      const sortedFeed = [...allArticles.slice(1)].sort((a, b) => {
        const scoreA = categoryScores[a.category || 'general']?.score || 0
        const scoreB = categoryScores[b.category || 'general']?.score || 0
        return scoreB - scoreA
      })
      setFeedArticles(sortedFeed.slice(0, 8))
      setMarketArticles(marketRaw.filter((a) => a.urlToImage).slice(0, 3))

      try {
        const mktRes = await fetch('/api/markets')
        if (mktRes.ok) {
          const mktData = (await mktRes.json()) as MarketData[]
          setMarkets(mktData)
        }
      } catch {
        setMarkets([])
      }

      if (marketRaw.length > 0) void generateNiftyMood(marketRaw.slice(0, 5))
      if (totalArticlesRead >= 3) void generateReadingInsight()
      if (topCategories.length > 0) void generateSuggestedTopics()
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }

  async function generateNiftyMood(articles: Article[]) {
    try {
      const headlines = articles.map((a) => a.title).join('\n')
      const result = await callGroq(
        [
          {
            role: 'user',
            content: `Based on these Indian market headlines, what is the market mood today?\n${headlines}\nReturn ONLY JSON (no markdown): {"label":"Bullish|Bearish|Cautious|Mixed|Rally","color":"#hex","description":"one sharp sentence explaining why"}`,
          },
        ],
        'You are a market analyst. Return only valid JSON.'
      )
      const parsed = parseGroqJSON(result) as { label?: string; description?: string }
      const moodColors: Record<string, string> = {
        Bullish: '#2ec4b6',
        Bearish: '#e63946',
        Cautious: '#f0a500',
        Mixed: '#9c9a92',
        Rally: '#06d6a0',
      }
      setNiftyMood({
        label: parsed.label || 'Mixed',
        color: moodColors[parsed.label || 'Mixed'] || '#9c9a92',
        description: parsed.description || '',
      })
    } catch {
      setNiftyMood(null)
    }
  }

  async function generateReadingInsight() {
    try {
      const topCats = Object.entries(categoryScores)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 3)
        .map(([cat, data]) => `${cat} (${Math.round(data.score)})`)
        .join(', ')
      const result = await callGroq(
        [
          {
            role: 'user',
            content: `A news reader has top interests: ${topCats}. Read ${totalArticlesRead} articles. Write ONE witty observation under 15 words.`,
          },
        ],
        'Short witty insight. Plain text only.'
      )
      setReadingInsight(result.trim().replace(/['"*]/g, ''))
    } catch {
      setReadingInsight('')
    }
  }

  async function generateSuggestedTopics() {
    try {
      const topCats = topCategories.slice(0, 2).join(' and ')
      const result = await callGroq(
        [
          {
            role: 'user',
            content: `Someone who loves ${topCats} news in India. Suggest 4 topics. Return JSON array max 3 words each.`,
          },
        ],
        'Return only JSON array.'
      )
      const topics = parseGroqJSON(result) as unknown
      if (Array.isArray(topics)) setSuggestedTopics(topics.slice(0, 4) as string[])
    } catch {
      setSuggestedTopics([])
    }
  }

  function handleArticleClick(article: Article) {
    track({
      type: 'article_click',
      articleId: article.url,
      category: article.category || 'general',
      zone: 'dashboard',
      title: article.title,
    })
    articleOpenTime.current = Date.now()
    setExpandedArticle(article)
  }

  function handleArticleClose() {
    if (expandedArticle) {
      track({
        type: 'article_read',
        articleId: expandedArticle.url,
        dwellMs: Date.now() - articleOpenTime.current,
        category: expandedArticle.category || 'general',
      })
    }
    setExpandedArticle(null)
  }

  function handleListen(article: Article) {
    track({ type: 'article_listen', articleId: article.url, category: article.category || 'general' })
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(`${article.title}. ${article.description}`)
      utt.rate = 0.95
      window.speechSynthesis.speak(utt)
    }
  }

  const FILTERS = [
    { id: 'for-you', label: 'For You', icon: '✦' },
    { id: 'markets', label: 'Markets', icon: '📈' },
    { id: 'technology', label: 'Tech', icon: '⚡' },
    { id: 'world', label: 'World', icon: '🌍' },
    { id: 'startups', label: 'Startups', icon: '🚀' },
  ]

  const filteredFeed =
    activeFilter === 'for-you'
      ? feedArticles
      : feedArticles.filter((a) => {
          if (activeFilter === 'markets') return a.category === 'business'
          if (activeFilter === 'technology') return a.category === 'technology'
          if (activeFilter === 'world') return a.category === 'general'
          if (activeFilter === 'startups') return a.title.toLowerCase().includes('startup') || a.title.toLowerCase().includes('fund')
          return true
        })

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(240,165,0,0.3)] border-t-[var(--accent-gold)]" />
        <p className="text-sm text-white/45">Loading your newsroom...</p>
      </div>
    )
  }

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const personaLabel: Record<string, string> = { trader: 'Trader', founder: 'Founder', learner: 'Learner' }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 text-[var(--text-primary)]">
      <AnimatePresence>
        {breakingArticles.length > 0 && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 overflow-hidden bg-[#e63946] px-6 py-2">
            <span className="rounded bg-black/30 px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] text-white">BREAKING</span>
            <div className="whitespace-nowrap text-xs text-white [animation:marquee_30s_linear_infinite]">
              {[...breakingArticles, ...breakingArticles].map((a, i) => (
                <span key={`${a.url}-${i}`} className="cursor-pointer" onClick={() => handleArticleClick(a)}>
                  {a.title}
                  <span className="mx-5 opacity-50">·</span>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-7 flex items-end justify-between border-b border-white/10 py-7">
          <div>
            <div className="mb-1 font-mono text-[10px] tracking-[0.15em] text-white/45">
              {greeting}, {personaLabel[persona] || 'Reader'} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="m-0 font-display text-4xl leading-tight">Your Morning Brief</h1>
            {readingInsight && <div className="mt-2 text-sm italic text-[var(--accent-gold)]">✦ {readingInsight}</div>}
          </div>
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className={`font-mono text-[10px] tracking-wider ${isRefreshing ? 'text-[var(--accent-gold)]' : 'text-white/35'}`}>
                {isRefreshing ? '⟳ REFRESHING' : `LIVE · ${Math.floor((Date.now() - lastRefresh.getTime()) / 60000)}m ago`}
              </span>
            )}
            <button onClick={() => navigate('/world')} className="rounded-lg bg-[var(--accent-gold)] px-4 py-2 text-sm font-semibold text-black">
              Enter The World →
            </button>
            <button onClick={() => navigate('/charcha')} className="rounded-lg border border-[rgba(230,57,70,0.4)] bg-[rgba(230,57,70,0.12)] px-4 py-2 text-sm text-[#e63946]">
              🎙 News Pe Charcha
            </button>
          </div>
        </div>

        <div className="mb-7 flex gap-3 overflow-x-auto pb-1">
          {markets.map((mkt) => (
            <div key={mkt.symbol} className={`min-w-[140px] shrink-0 rounded-xl border px-4 py-3 ${mkt.isUp ? 'border-[rgba(46,196,182,0.25)]' : 'border-[rgba(230,57,70,0.25)]'} bg-white/5`}>
              <div className="mb-1 font-mono text-[10px] tracking-wider text-white/45">{mkt.symbol}</div>
              <div className="font-mono text-lg">{mkt.price}</div>
              <div className={`mt-0.5 font-mono text-xs ${mkt.isUp ? 'text-[#2ec4b6]' : 'text-[#e63946]'}`}>
                {mkt.isUp ? '▲' : '▼'} {mkt.change} ({mkt.changePercent})
              </div>
            </div>
          ))}
          {niftyMood && (
            <div className="min-w-[220px] shrink-0 rounded-xl border px-4 py-3" style={{ background: `${niftyMood.color}12`, borderColor: `${niftyMood.color}40` }}>
              <div className="mb-1 font-mono text-[10px] tracking-wider text-white/45">MARKET MOOD · AI</div>
              <div className="font-display text-2xl" style={{ color: niftyMood.color }}>
                {niftyMood.label}
              </div>
              <div className="mt-1 text-xs text-white/55">{niftyMood.description}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            {heroArticle && (
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 h-[340px] cursor-pointer overflow-hidden rounded-2xl border border-white/10" onClick={() => handleArticleClick(heroArticle)}>
                <img src={heroArticle.urlToImage} alt={heroArticle.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
                <div className="absolute left-4 top-4 flex gap-2">
                  {isBreaking(heroArticle.publishedAt) && <span className="rounded bg-[#e63946] px-2 py-0.5 font-mono text-[9px] tracking-wider text-white">BREAKING</span>}
                  <span className="rounded px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-black" style={{ background: CATEGORY_LABELS[heroArticle.category || 'general']?.color || '#f0a500' }}>
                    {CATEGORY_LABELS[heroArticle.category || 'general']?.label || 'NEWS'}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="mb-2 font-mono text-[10px] tracking-wider text-white/55">
                    {heroArticle.source.name} · {timeAgo(heroArticle.publishedAt)}
                  </div>
                  <h2 className="mb-2 font-display text-3xl leading-tight text-white">{heroArticle.title}</h2>
                  <p className="mb-4 line-clamp-2 text-sm text-white/75">{heroArticle.description}</p>
                  <div className="flex gap-2">
                    <button className="rounded-md bg-[var(--accent-gold)] px-4 py-2 text-xs font-semibold text-black">Read Full Story</button>
                    <button
                      className="rounded-md border border-white/20 bg-white/10 px-4 py-2 text-xs text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleListen(heroArticle)
                      }}
                    >
                      🔊 Listen
                    </button>
                    <button
                      className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-xs text-white/75"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/briefing')
                      }}
                    >
                      Deep Briefing →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mb-4 flex gap-2 border-b border-white/10 pb-3">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className="rounded-full px-4 py-1.5 text-xs"
                  style={{
                    background: activeFilter === f.id ? '#f0a500' : 'transparent',
                    border: activeFilter === f.id ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    color: activeFilter === f.id ? '#000' : 'rgba(255,255,255,0.65)',
                  }}
                >
                  <span className="mr-1">{f.icon}</span>
                  {f.label}
                  {f.id === 'for-you' && isPersonalized ? <span className="ml-1 rounded-full bg-black/25 px-1.5 py-0.5 font-mono text-[9px]">AI</span> : null}
                </button>
              ))}
            </div>

            {filteredFeed.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] py-12 text-center text-white/40">
                <div className="mb-2 text-3xl">📰</div>
                <p>No stories for this filter yet.</p>
                <button onClick={() => void loadDashboard()} className="mt-3 rounded-lg border border-[rgba(240,165,0,0.35)] bg-[rgba(240,165,0,0.1)] px-5 py-2 text-sm text-[var(--accent-gold)]">
                  Refresh Feed
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredFeed.map((article, i) => (
                  <ArticleCard
                    key={article.url}
                    article={article}
                    index={i}
                    onClick={() => handleArticleClick(article)}
                    onListen={() => handleListen(article)}
                    onBriefing={() => navigate(`/briefing?topic=${encodeURIComponent(article.title)}`)}
                    isNew={isBreaking(article.publishedAt)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {Object.keys(categoryScores).length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-white/45">
                  <span className="text-[var(--accent-gold)]">✦</span> YOUR INTEREST RADAR
                </div>
                {Object.entries(categoryScores)
                  .sort((a, b) => b[1].score - a[1].score)
                  .slice(0, 5)
                  .map(([cat, data]) => {
                    const meta = CATEGORY_LABELS[cat] || { label: cat, color: '#9c9a92', icon: '📰' }
                    return (
                      <div key={cat} className="mb-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                          <span className="flex items-center gap-1.5">
                            <span>{meta.icon}</span>
                            {meta.label}
                            {data.trend === 'rising' ? <span className="font-mono text-[9px] text-[#2ec4b6]">↑ RISING</span> : null}
                          </span>
                          <span className="font-mono" style={{ color: meta.color }}>
                            {Math.round(data.score)}
                          </span>
                        </div>
                        <div className="h-[3px] rounded bg-white/10">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${data.score}%` }} transition={{ duration: 0.7 }} className="h-full rounded" style={{ background: meta.color }} />
                        </div>
                      </div>
                    )
                  })}
                {totalArticlesRead > 0 ? (
                  <div className="mt-4 flex justify-between border-t border-white/10 pt-3 font-mono text-[10px] text-white/35">
                    <span>{totalArticlesRead} articles read</span>
                    <span>This session</span>
                  </div>
                ) : null}
              </div>
            )}

            {suggestedTopics.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 font-mono text-[10px] tracking-[0.15em] text-white/45">EXPLORE TODAY</div>
                <div className="flex flex-wrap gap-2">
                  {suggestedTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        track({ type: 'search_query', query: topic })
                        navigate(`/briefing?topic=${encodeURIComponent(topic)}`)
                      }}
                      className="rounded-full border border-[rgba(240,165,0,0.25)] bg-[rgba(240,165,0,0.08)] px-3 py-1 text-xs text-[var(--accent-gold)]"
                    >
                      {topic} →
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {marketArticles.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 font-mono text-[10px] tracking-[0.15em] text-white/45">MARKET STORIES</div>
                {marketArticles.map((article, i) => (
                  <div key={article.url} className={`flex cursor-pointer gap-2.5 py-2 ${i < marketArticles.length - 1 ? 'border-b border-white/10' : ''}`} onClick={() => handleArticleClick(article)}>
                    {article.urlToImage ? <img src={article.urlToImage} alt="" className="h-[52px] w-[52px] shrink-0 rounded-lg object-cover" /> : null}
                    <div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-white/80">{article.title}</p>
                      <span className="font-mono text-[9px] text-white/35">
                        {article.source.name} · {timeAgo(article.publishedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {recentSearches.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="mb-2 font-mono text-[10px] tracking-[0.15em] text-white/35">RECENT SEARCHES</div>
                {recentSearches.slice(0, 5).map((q) => (
                  <div key={q} className="flex cursor-pointer items-center gap-1.5 border-b border-white/5 py-1.5 text-xs text-white/55" onClick={() => navigate(`/arc?topic=${encodeURIComponent(q)}`)}>
                    <span className="text-[10px] opacity-40">⟳</span>
                    {q}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Deep Briefing', icon: '≡', route: '/briefing', color: '#3a86ff' },
                { label: 'Arc Tracker', icon: '⟳', route: '/arc', color: '#8b5cf6' },
                { label: 'Video Studio', icon: '▶', route: '/video', color: '#f0a500' },
                { label: 'Vernacular', icon: 'अ', route: '/vernacular', color: '#ff6b35' },
              ].map(({ label, icon, route, color }) => (
                <button key={label} onClick={() => navigate(route)} className="rounded-xl border px-3 py-3 text-left" style={{ background: `${color}10`, borderColor: `${color}25` }}>
                  <div className="mb-1 text-xl" style={{ color }}>
                    {icon}
                  </div>
                  <div className="text-xs text-white/70">{label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expandedArticle ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleArticleClose} className="fixed inset-0 z-[199] bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed right-0 top-0 z-[200] flex h-screen w-full max-w-[480px] flex-col overflow-hidden border-l border-white/10 bg-[#0d0d0d]">
              {expandedArticle.urlToImage ? (
                <div className="relative h-[220px] shrink-0">
                  <img src={expandedArticle.urlToImage} alt={expandedArticle.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d0d]" />
                </div>
              ) : null}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-2 font-mono text-[10px] tracking-wider text-white/45">
                  {expandedArticle.source.name} · {timeAgo(expandedArticle.publishedAt)}
                </div>
                <h2 className="mb-4 font-display text-2xl leading-snug text-[var(--text-primary)]">{expandedArticle.title}</h2>
                <p className="mb-5 text-sm leading-7 text-white/75">{expandedArticle.description}</p>
                <div className="flex flex-col gap-2">
                  <a href={expandedArticle.url} target="_blank" rel="noreferrer" className="rounded-lg bg-[var(--accent-gold)] px-4 py-2.5 text-center text-sm font-semibold text-black no-underline">
                    Read Full Article →
                  </a>
                  <button className="rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white" onClick={() => handleListen(expandedArticle)}>
                    🔊 Listen to Summary
                  </button>
                  <button
                    className="rounded-lg border border-[rgba(58,134,255,0.2)] bg-[rgba(58,134,255,0.08)] px-4 py-2.5 text-sm text-[#3a86ff]"
                    onClick={() => {
                      handleArticleClose()
                      navigate(`/briefing?topic=${encodeURIComponent(expandedArticle.title)}`)
                      track({ type: 'briefing_generated', topic: expandedArticle.title, category: expandedArticle.category || 'general' })
                    }}
                  >
                    Generate Deep Briefing
                  </button>
                  <button
                    className="rounded-lg border border-[rgba(230,57,70,0.2)] bg-[rgba(230,57,70,0.08)] px-4 py-2.5 text-sm text-[#e63946]"
                    onClick={() => {
                      handleArticleClose()
                      navigate('/charcha')
                    }}
                  >
                    🎙 Discuss in Charcha
                  </button>
                </div>
              </div>
              <button onClick={handleArticleClose} className="absolute right-3 top-3 rounded-lg border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-white/75 backdrop-blur">
                ESC ✕
              </button>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

function ArticleCard({
  article,
  index,
  onClick,
  onListen,
  onBriefing,
  isNew,
}: {
  article: Article
  index: number
  onClick: () => void
  onListen: () => void
  onBriefing: () => void
  isNew: boolean
}) {
  const meta = CATEGORY_LABELS[article.category || 'general'] || { label: 'NEWS', color: '#f0a500', icon: '📰' }
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white/[0.03]"
      style={{ borderColor: isNew ? 'rgba(240,165,0,0.3)' : 'rgba(255,255,255,0.07)' }}
    >
      {article.urlToImage ? (
        <div className="relative h-[130px] overflow-hidden">
          <img src={article.urlToImage} alt={article.title} className="h-full w-full object-cover" />
          <div className="absolute left-2 top-2 flex gap-1">
            {isNew ? <span className="rounded bg-[#e63946] px-1.5 py-0.5 font-mono text-[8px] tracking-wider text-white">NEW</span> : null}
            <span className="rounded px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider text-black" style={{ background: meta.color }}>
              {meta.label}
            </span>
          </div>
        </div>
      ) : null}
      <div className="flex-1 p-3.5">
        <div className="mb-1 font-mono text-[9px] tracking-wider text-white/35">
          {article.source.name} · {timeAgo(article.publishedAt)}
        </div>
        <p className="line-clamp-3 font-display text-[15px] leading-snug text-[var(--text-primary)]">{article.title}</p>
      </div>
      <div className="flex gap-1.5 border-t border-white/10 px-3.5 pb-3 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onListen()
          }}
          className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-white/65"
        >
          🔊 Listen
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onBriefing()
          }}
          className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-white/65"
        >
          ≡ Brief
        </button>
      </div>
    </motion.div>
  )
}

export default Dashboard
