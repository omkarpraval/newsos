import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useBehaviorStore } from '../store/useBehaviorStore'
import { callGroq, parseGroqJSON } from '../services/groq'
import { fetchTopHeadlines, searchNews } from '../services/newsapi'
import type { NewsArticle } from '../types'

// HARD Fallback Data to ensure it's NEVER blank
const FALLBACK_HERO: NewsArticle = {
  title: "NEXUS SYNCHRONIZED: GLOBAL INTELLIGENCE STREAM ACTIVE",
  description: "NewsOS semantic engine has completed a full map of planetary narrative flows. Causal links are now being prioritized for all active pilot modules.",
  url: "#",
  urlToImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
  source: { name: "SYSTEM CORE", id: "sys" },
  publishedAt: new Date().toISOString()
}

const FALLBACK_FEED: NewsArticle[] = [
  { title: "Quantum Computing Breakthrough in Sector 7", source: { name: "Tech Pulse" }, url: "#", urlToImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400" },
  { title: "Market Alpha: Narrative Shift in Emerging Markets", source: { name: "Fiscal Machine" }, url: "#", urlToImage: "https://images.unsplash.com/photo-1611974714405-728ed271b058?auto=format&fit=crop&q=80&w=400" },
  { title: "Policy Delta: New Intelligence Regulations Proposed", source: { name: "Shadow Board" }, url: "#", urlToImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=400" },
  { title: "Bengaluru Hybrid Cloud Infra Scales to Zettaflops", source: { name: "India Tech" }, url: "#", urlToImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc48?auto=format&fit=crop&q=80&w=400" }
]

const STAT_WIDGETS = [
  { label: 'INTEL INTENSITY', value: '84.2', unit: 'TB' },
  { label: 'CAUSAL RADIUS', value: '98.2', unit: '%' },
  { label: 'FLOW VELOCITY', value: '1,429', unit: 'MPS' },
]

export function Dashboard() {
  const navigate = useNavigate()
  const { track, totalArticlesRead } = useBehaviorStore()
  const [heroArticle, setHeroArticle] = useState<Article | null>(FALLBACK_HERO)
  const [feedArticles, setFeedArticles] = useState<Article[]>(FALLBACK_FEED)
  const [markets, setMarkets] = useState([
    { symbol: 'NIFTY 50', price: '22,819.6', isUp: false, changePercent: '-2.08%' },
    { symbol: 'SENSEX', price: '73,583.22', isUp: false, changePercent: '-2.35%' },
    { symbol: 'USD/INR', price: '84.76', isUp: true, changePercent: '+0.56%' },
    { symbol: 'GC', price: '4,524.3', isUp: true, changePercent: '+2.62%' },
  ])
  const [niftyMood, setNiftyMood] = useState({ label: 'CAUTIOUS', color: '#f59e0b', description: 'System syncing with global signals.' })
  const [readingInsight, setReadingInsight] = useState('Initializing Cognitive Logic...')
  const [loading, setLoading] = useState(true)
  const [expandedArticle, setExpandedArticle] = useState<Article | null>(null)
  const [breaking, setBreaking] = useState<Article[]>(FALLBACK_FEED.slice(0, 3))
  const articleOpenTime = useRef<number>(0)

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const hRes = await fetchTopHeadlines('business', 15)
      const bRes = await fetchTopHeadlines('general', 5)
      
      if (hRes.articles && hRes.articles.length > 0) {
        setHeroArticle(hRes.articles[0])
        setFeedArticles(hRes.articles.slice(1, 9))
      }
      if (bRes.articles && bRes.articles.length > 0) {
        setBreaking(bRes.articles.slice(0, 4))
      }

      void generateNiftyMood(hRes.articles?.slice(0, 5) || [])
      if (totalArticlesRead >= 1) void generateReadingInsight()
    } catch (err) {
      console.warn('Using full stack fallback.')
    } finally {
      setLoading(false)
    }
  }

  async function generateNiftyMood(articles: Article[]) {
    if (articles.length === 0) return
    try {
      const result = await callGroq([{ role: 'user', content: `Market: ${articles.map(a=>a.title).join('|')}. JSON: {"label":"Bullish|Bearish","color":"#hex","description":"1 sentence"}` }], 'JSON.')
      const parsed = parseGroqJSON(result) as any
      if (parsed.label) setNiftyMood({ label: parsed.label.toUpperCase(), color: parsed.color, description: parsed.description })
    } catch { }
  }

  async function generateReadingInsight() {
    try {
      const result = await callGroq([{ role: 'user', content: `Analyst stats: ${totalArticlesRead} read. ONE witty insight.` }], 'Witty.')
      setReadingInsight(result.trim())
    } catch { }
  }

  function handleArticleClick(article: Article) {
    track({ type: 'article_click', articleId: article.url, title: article.title })
    setExpandedArticle(article)
  }

  if (loading && !heroArticle) {
    return <div className="flex h-screen items-center justify-center bg-black text-white/20 uppercase tracking-[.4em] text-[10px]">Synchronizing...</div>
  }

  return (
    <div className="relative pb-24 text-white">
      {/* HUD Ribbon */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="rounded-xl bg-white/[0.04] border border-white/5 p-4 group transition-all">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Mood Signal</div>
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-500">
               <div className="text-xl font-black mb-1" style={{ color: niftyMood.color }}>{niftyMood.label}</div>
               <div className="text-[10px] font-bold text-white/30 uppercase tracking-tighter line-clamp-1">{niftyMood.description}</div>
            </div>
         </div>

         {STAT_WIDGETS.map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.04] border border-white/5 p-4 group">
               <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">{s.label}</div>
               <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black">{s.value}</span>
                  <span className="text-[9px] font-black text-white/10">{s.unit}</span>
               </div>
            </div>
         ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Core Stream */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="group relative h-[380px] overflow-hidden rounded-[24px] cursor-pointer border border-white/10"
            onClick={() => heroArticle && handleArticleClick(heroArticle)}
          >
             <img src={heroArticle?.urlToImage || FALLBACK_HERO.urlToImage} className="h-full w-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" alt="hero" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0c] via-transparent to-transparent" />
             <div className="absolute bottom-8 left-8 right-8">
                <div className="mb-4 inline-flex rounded bg-white text-[9px] font-black uppercase tracking-widest text-black px-2 py-0.5">
                  {heroArticle?.source?.name || 'CORE'}
                </div>
                <h2 className="text-3xl font-black leading-[1.1] tracking-tighter uppercase italic group-hover:text-purple-400 transition-colors line-clamp-2">{heroArticle?.title}</h2>
             </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedArticles.map((article, idx) => (
              <motion.div
                key={article.url + idx}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="group cursor-pointer rounded-2xl bg-white/[0.03] border border-white/5 p-4 hover:border-purple-500/50 transition-all"
                onClick={() => handleArticleClick(article)}
              >
                 <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-white/5 grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img src={article.urlToImage || 'https://picsum.photos/seed/news' + idx + '/400/300'} className="h-full w-full object-cover" alt="feed" />
                 </div>
                 <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">{article.source?.name}</div>
                 <h3 className="line-clamp-2 text-sm font-bold leading-tight uppercase tracking-tight text-white/70 group-hover:text-white transition-colors">{article.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>

        {/* HUD Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-[24px] bg-white/[0.04] border border-white/5 p-6 relative overflow-hidden group">
               <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-6 flex items-center justify-between">
                  Live Indices <span className="h-1 w-1 bg-green-500 rounded-full animate-ping" />
               </div>
               <div className="flex flex-col gap-5">
                 {markets.map(m => (
                   <div key={m.symbol} className="flex flex-col">
                     <div className="text-[9px] font-bold text-white/20 mb-1 uppercase tracking-widest">{m.symbol}</div>
                     <div className="flex items-center justify-between">
                        <span className="text-xl font-black">{m.price}</span>
                        <span className={`text-[10px] font-black ${m.isUp ? 'text-green-400' : 'text-red-400'}`}>{m.isUp ? '▲' : '▼'} {m.changePercent}</span>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="flex flex-col gap-3">
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-2">Urgent Signals</div>
               {breaking.map((a, idx) => (
                  <motion.div key={idx} whileHover={{ x: 4 }} className="group cursor-pointer rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-purple-500/40 transition-all" onClick={() => handleArticleClick(a)}>
                     <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">{a.source?.name}</div>
                     <div className="text-[11px] font-bold text-white/40 group-hover:text-white line-clamp-2 leading-snug">{a.title}</div>
                  </motion.div>
               ))}
            </div>

            <div className="rounded-xl bg-purple-600/5 border border-purple-500/10 p-5">
               <div className="text-[10px] font-black uppercase text-purple-400 mb-3 tracking-widest">Causal Thread</div>
               <p className="text-xs font-bold text-white/40 italic leading-relaxed">&ldquo;{readingInsight}&rdquo;</p>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {expandedArticle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-6" onClick={() => setExpandedArticle(null)}>
            <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="relative h-full max-h-[700px] w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0b0c] lg:grid lg:grid-cols-2" onClick={e => e.stopPropagation()}>
               <img src={expandedArticle.urlToImage || ''} className="h-full w-full object-cover hidden lg:block grayscale" alt="expanded" />
               <div className="flex flex-col p-10 overflow-y-auto">
                  <div className="mb-8 flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/20">{expandedArticle.source?.name}</span>
                     <button onClick={() => setExpandedArticle(null)} className="text-white/20 hover:text-white">✕</button>
                  </div>
                  <h2 className="mb-8 text-4xl font-black leading-tight uppercase italic">{expandedArticle.title}</h2>
                  <p className="text-md leading-relaxed text-white/40 mb-10">{expandedArticle.description || expandedArticle.content}</p>
                    <button onClick={() => navigate('/video', { state: { article: expandedArticle } })} className="rounded-xl bg-purple-600 py-4 text-[10px] font-black text-white hover:bg-purple-500 transition-all shadow-xl shadow-purple-900/40 col-span-2 uppercase tracking-widest mb-2">Generate Intelligence Video</button>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => navigate('/charcha')} className="rounded-xl bg-white py-4 text-[10px] font-black text-black">OPEN BROADCAST</button>
                      <button onClick={() => navigate('/butterfly')} className="rounded-xl bg-white/10 py-4 text-[10px] font-black text-white">MAP CAUSAL</button>
                    </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type Article = NewsArticle
