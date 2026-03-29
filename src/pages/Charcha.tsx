import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CharchaHUD from '../components/charcha/CharchaHUD'
import ConversationEngine from '../components/charcha/ConversationEngine'
import type { Article } from '../components/charcha/NewsPoster'
import { useCharchaStore } from '../store/useCharchaStore'

export default function CharchaPage() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('Initializing newsroom...')
  const sceneRef = useRef<unknown>(null)
  const sessionActive = useCharchaStore((s) => s.sessionActive)

  useEffect(() => {
    let destroyed = false
    async function initScene() {
      if (!mountRef.current) return
      setLoadingStatus('Fetching latest news...')
      const newsData: Record<string, Article[]> = {}
      try {
        const zones = [
          { id: 'business', query: null, type: 'headlines', category: 'business' },
          { id: 'politics', query: 'India parliament government', type: 'search' },
          { id: 'startup', query: 'India startup technology', type: 'search' },
          { id: 'world', query: null, type: 'headlines', category: 'general' },
        ] as const
        await Promise.all(
          zones.map(async (zone) => {
            const url =
              zone.type === 'headlines'
                ? `/api/news?type=headlines&category=${zone.category}&pageSize=6`
                : `/api/news?type=search&query=${encodeURIComponent(zone.query || '')}&pageSize=6&daysBack=7`
            const res = await fetch(url)
            const data = (await res.json()) as { articles?: Article[], error?: string }
            if (data.error || !data.articles || data.articles.length === 0) {
              // Rate limit fallback so AR/VR scene remains functional
              newsData[zone.id] = [
                {
                  title: `Synthetic ${zone.id.charAt(0).toUpperCase() + zone.id.slice(1)} News Update - Major Market Movements Recorded`,
                  description: 'Due to API rate limits, these synthetic headlines ensure the AR/VR features remain available. Markets are responding to global technical developments.',
                  urlToImage: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=1000',
                  url: '#',
                  source: { name: 'NewsOS' },
                  publishedAt: new Date().toISOString()
                },
                {
                  title: `Tech Giants Announce New AI Innovations the Industry Did Not See Coming`,
                  description: 'The latest developments in Artificial Intelligence have caused immense shockwaves across the tech industry.',
                  urlToImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000',
                  url: '#',
                  source: { name: 'NewsOS Tech' },
                  publishedAt: new Date().toISOString()
                },
                {
                  title: `Global Markets Rally Continues As Tech Surges to New Highs`,
                  description: 'Investors remain optimistic as key technology stocks drive market indices upwards for the third consecutive week.',
                  urlToImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1000',
                  url: '#',
                  source: { name: 'NewsOS Finance' },
                  publishedAt: new Date().toISOString()
                },
                {
                  title: `Central Banks Discuss New Interest Rate Policies for Next Quarter`,
                  description: 'Policy makers are debating potential rate cuts following recent inflation reports that show mixed signals in the economy.',
                  urlToImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=1000',
                  url: '#',
                  source: { name: 'NewsOS Policy' },
                  publishedAt: new Date().toISOString()
                },
                {
                  title: `Renewable Energy Sector Sees Massive Influx of Venture Capital`,
                  description: 'Startups focusing on solid-state batteries and solar efficiency are receiving unprecedented backing from major funds.',
                  urlToImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1000',
                  url: '#',
                  source: { name: 'NewsOS Green' },
                  publishedAt: new Date().toISOString()
                },
                {
                  title: `Healthcare Innovations Reach Breakthrough Phase in Clinical Trials`,
                  description: 'New personalized medicine approaches are showing promising results in late-stage clinical testing, potentially revolutionizing treatments.',
                  urlToImage: 'https://images.unsplash.com/photo-1532187863486-abf9db0f7082?auto=format&fit=crop&q=80&w=1000',
                  url: '#',
                  source: { name: 'NewsOS Health' },
                  publishedAt: new Date().toISOString()
                }
              ]
            } else {
              newsData[zone.id] = data.articles
                .filter((a) => a.urlToImage)
                .map((a) => ({
                  ...a,
                  urlToImage: `/api/image?url=${encodeURIComponent(a.urlToImage)}`,
                }))
            }
          })
        )
      } catch (err) {
        console.error('News fetch failed:', err)
      }
      setLoadingStatus('Building the newsroom...')
      const { NewsroomScene } = await import('../components/charcha/NewsroomScene')
      if (destroyed || !mountRef.current) return
      const scene = new NewsroomScene(mountRef.current, newsData)
      await scene.init()
      sceneRef.current = scene
      setLoadingStatus('')
      setSceneReady(true)
    }
    void initScene()
    return () => {
      destroyed = true
      ;(sceneRef.current as { destroy?: () => void } | null)?.destroy?.()
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current as { resize?: () => void } | null
    scene?.resize?.()
  }, [sessionActive, sceneReady])

  return (
    <div className="relative -m-8 h-[calc(100vh-4rem)] overflow-hidden bg-black">
      <AnimatePresence>
        {!sceneReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black font-display"
          >
            <div className="mb-4 font-black text-6xl text-white tracking-tighter">STUDIO <span className="text-white/20">LIVE.</span></div>
            <div className="mb-10 text-[10px] font-black text-purple-500 tracking-[0.4em] uppercase">{loadingStatus}</div>
            <div className="h-0.5 w-64 overflow-hidden rounded-full bg-white/5">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-purple-500 to-transparent" 
              />
            </div>
            <div className="mt-16 text-center text-xs font-bold leading-8 text-white/30 uppercase tracking-[0.2em]">
              <span className="text-white/60">Controls:</span> WASD to move · Mouse to look around
              <br />
              Walk near a poster to inspect headlines
              <br />
              Press T to start talking to the bots
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        ref={mountRef}
        className="h-full"
        style={{
          width: sessionActive ? 'calc(100% - 320px)' : '100%',
          transition: 'width 0.4s ease',
        }}
      />
      {sceneReady && (
        <>
          <CharchaHUD sceneRef={sceneRef} />
          <ConversationEngine sceneRef={sceneRef} />
        </>
      )}
    </div>
  )
}
