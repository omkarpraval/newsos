import { useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateVideoScript, generateHindiVideoScript } from '../../services/groq'
import { searchNews } from '../../services/newsapi'
import { useNarrator, type VoicePreset } from '../../hooks/useNarrator'
import { speakHindi, stopSpeaking } from '../../services/tts'
import { MOCK_BREAKING_ARTICLE } from '../../services/mockData'
import { useBehaviorStore } from '../../store/useBehaviorStore'
import { useUserStore } from '../../store/useUserStore'
import type { VideoScript, HindiVideoScript, NewsArticle } from '../../types'

type StudioMode = 'english' | 'hindi-breaking'

export function VideoStudio() {
  const location = useLocation()
  const { track } = useBehaviorStore()
  const { token } = useUserStore()
  const incomingArticle = location.state?.article as NewsArticle | undefined
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

  useEffect(() => {
    if (incomingArticle) {
      track({ type: 'article_click', articleId: incomingArticle.url, title: incomingArticle.title, category: (incomingArticle as any).category || 'general', zone: 'dashboard' })
      setTopic(incomingArticle.title)
      setMode('english')
    }
  }, [incomingArticle])

  // ── Hindi breaking mode state ──
  const [hindiScript, setHindiScript] = useState<HindiVideoScript | null>(null)
  const [hindiLoading, setHindiLoading] = useState(false)
  const [hindiSceneIdx, setHindiSceneIdx] = useState(0)
  const [hindiPlaying, setHindiPlaying] = useState(false)
  const [hindiProgress, setHindiProgress] = useState(0)
  const [_breakingArticle, setBreakingArticle] = useState<NewsArticle | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [pipelineStartTime, setPipelineStartTime] = useState<number | null>(null)
  const [pipelineComplete, setPipelineComplete] = useState(false)
  const [veoUrl, setVeoUrl] = useState<string | null>(null)
  const [renderingVeo, setRenderingVeo] = useState(false)
  const timerRef = useRef<number | null>(null)

  const scenes = script?.scenes ?? []
  const hindiScenes = hindiScript?.scenes ?? []

  // ── Playback ──
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
    const t = window.setTimeout(() => {
      setHindiSceneIdx((i) => i + 1)
      setHindiProgress(((hindiSceneIdx + 1) / hindiScenes.length) * 100)
    }, sc.duration * 1000 + 1000)
    return () => {
      window.clearTimeout(t)
      stopSpeaking()
    }
  }, [hindiPlaying, hindiScenes, hindiSceneIdx])

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

  async function generate() {
    setLoading(true)
    setScript(null)
    try {
      const q = topic.trim() || 'India business macro'
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

  async function startHindiPipeline() {
    setHindiLoading(true)
    setHindiScript(null)
    setBreakingArticle(null)
    setPipelineComplete(false)
    setPipelineStartTime(Date.now())
    setElapsedMs(0)

    try {
      let article: NewsArticle | null = null
      try {
        const res = await fetch('/api/breaking/latest')
        const data = (await res.json()) as { article?: NewsArticle }
        article = data.article || null
      } catch {
        console.log('[VideoStudio] Using mock data')
      }
      if (!article) article = MOCK_BREAKING_ARTICLE
      setBreakingArticle(article)
      const hs = await generateHindiVideoScript(article)
      if (!hs) throw new Error('Generation failed')
      setHindiScript(hs)
      setHindiSceneIdx(0)
      setHindiProgress(0)
      setPipelineComplete(true)
      setTimeout(() => setHindiPlaying(true), 500)
    } catch (err) {
      console.error(err)
      setPipelineComplete(true)
    } finally {
      setHindiLoading(false)
    }
  }

  async function renderWithVeo() {
    if (!topic) return
    setRenderingVeo(true)
    setVeoUrl(null)
    try {
      if (!token) throw new Error('Authentication required for VEO.')
      const res = await fetch('/api/video/veo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: `Cinematic news coverage: ${topic}. High definition, professional journalist style.` })
      })
      const data = await res.json()
      if (data.videoUrl || data.previewUrl) {
        setVeoUrl(data.videoUrl || data.previewUrl)
      }
    } catch (e) {
      console.error('[VEO] Component error:', e)
    } finally {
      setRenderingVeo(false)
    }
  }

  const activeHindiScene = hindiScenes[hindiSceneIdx]
  const active = scenes[sceneIdx]
  const totalDur = useMemo(() => scenes.reduce((a, s) => a + s.duration, 0), [scenes])
  const _hindiTotalDur = useMemo(() => hindiScenes.reduce((a, s) => a + s.duration, 0), [hindiScenes])
  const elapsedSeconds = (elapsedMs / 1000).toFixed(1)

  return (
    <div className="min-h-screen bg-[#0a0b0c] text-white">
      {/* Mode Tabs */}
      <div className="flex gap-4 mb-16 bg-white/5 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setMode('english')}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'english' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
        >
          Prime Studio
        </button>
        <button
          onClick={() => setMode('hindi-breaking')}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'hindi-breaking' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
        >
          Vernacular Pulse
        </button>
      </div>

      {mode === 'english' ? (
        <div className="grid gap-16 lg:grid-cols-12 items-start">
          <div className="lg:col-span-4 flex flex-col gap-8">
            <h1 className="text-6xl font-black tracking-tighter leading-[0.8] mb-4">Deep<br/><span className="text-white/20">Cinema.</span></h1>
            <p className="text-sm font-bold text-white/30 leading-relaxed mb-8">Transform any intelligence thread into a high-fidelity cinematic script with autonomous narration.</p>
            
            <div className="space-y-6">
               <input
                 className="w-full rounded-2xl bg-white/[0.03] border border-white/5 px-6 py-4 text-sm font-bold text-white outline-none focus:border-purple-500/50"
                 placeholder="Search Intelligence Topic..."
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
               />
               
               <div className="flex gap-2">
                 {(['authoritative', 'casual', 'dramatic'] as VoicePreset[]).map((v) => (
                   <button
                     key={v}
                     type="button"
                     className={`flex-1 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${voice === v ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40 border border-white/5 hover:border-white/20'}`}
                     onClick={() => setVoice(v)}
                   >
                     {v}
                   </button>
                 ))}
               </div>
               
               <div className="flex gap-2">
                 <button
                   type="button"
                   className={`w-full rounded-2xl py-5 text-sm font-black transition-all shadow-2xl ${loading ? 'bg-white/10 text-white/20' : 'bg-white text-black hover:scale-[1.01]'}`}
                   onClick={() => void generate()}
                   disabled={loading}
                 >
                   {loading ? 'Synthesizing...' : '1. Build Script'}
                 </button>
                 {script && (
                   <button
                    type="button"
                    className={`w-full rounded-2xl py-5 text-sm font-black transition-all shadow-2xl border border-white/10 ${renderingVeo ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-600 text-white hover:bg-purple-500'}`}
                    onClick={() => void renderWithVeo()}
                    disabled={renderingVeo}
                  >
                    {renderingVeo ? 'VEO Rendering...' : '2. Render VEO'}
                  </button>
                 )}
               </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-[40px] border border-white/10 bg-black shadow-2xl relative">
              <div
                className="flex aspect-video items-center justify-center p-16 text-center transition-colors duration-1000"
                style={{ backgroundColor: active?.background_color || '#000' }}
              >
                 {veoUrl ? (
                   <video 
                     src={veoUrl} 
                     autoPlay 
                     controls 
                     className="w-full h-full object-cover rounded-[32px] border border-white/10 animate-in fade-in zoom-in duration-1000"
                   />
                 ) : (
                   <AnimatePresence mode="wait">
                    <motion.p 
                      key={sceneIdx} 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.8, ease: "circOut" }}
                      className="font-display text-4xl font-black text-white md:text-5xl tracking-tighter leading-none italic"
                    >
                      {active?.text ?? 'STUDIO READY. STANDBY...'}
                    </motion.p>
                  </AnimatePresence>
                 )}
                <div className="absolute top-10 left-10 text-[10px] font-black tracking-[0.4em] text-white/20 uppercase">SCENE {sceneIdx + 1}</div>
              </div>
              
              <div className="flex items-center gap-6 border-t border-white/5 bg-[#0a0b0c] px-10 py-8">
                <button
                  type="button"
                  className="h-14 w-14 flex items-center justify-center rounded-full bg-white text-black shadow-xl hover:scale-110 active:scale-95 transition-all"
                  onClick={() => { setSceneIdx(0); setPlaying(true) }}
                  disabled={!scenes.length}
                >
                   {playing ? '⏹' : '▶'}
                </button>
                <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div 
                    className="h-1 bg-purple-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <span className="font-black text-[10px] tracking-widest text-white/20">
                  {totalDur ? `${sceneIdx + 1}/${scenes.length}` : 'STUDIOIDLE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
             <div className="inline-flex px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mb-8">Vernacular Acceleration</div>
             <h1 className="text-7xl font-black tracking-tighter mb-8 italic uppercase">Zero<span className="text-white/10">-Latency.</span></h1>
             <p className="text-xl font-bold text-white/30 max-w-xl mx-auto leading-relaxed mb-12">Generating full-spectrum Hindi intelligence explainers from live breaking signals in under 60 seconds.</p>
             
             {!hindiLoading && !hindiScript && (
               <button
                 onClick={() => void startHindiPipeline()}
                 className="px-16 py-6 rounded-3xl bg-white text-black text-sm font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/5"
               >
                 START TRANSMISSION
               </button>
             )}
          </div>

          {(hindiLoading || pipelineComplete) && (
            <div className="flex justify-center mb-20 scale-150">
              <div className="text-center">
                 <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">SYNTHESIS TIME</div>
                 <div className="text-6xl font-black text-white tabular-nums">{elapsedSeconds}s</div>
                 {pipelineComplete && Number(elapsedSeconds) < 60 && <div className="text-[10px] font-black text-purple-500 mt-2 tracking-[0.2em]">✓ RECORD SPEED</div>}
              </div>
            </div>
          )}

          {hindiScript && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[48px] border border-white/10 bg-black shadow-2xl"
            >
              <div
                className="flex aspect-video items-center justify-center p-16 text-center relative overflow-hidden"
                style={{ backgroundColor: activeHindiScene?.background_color || '#000' }}
              >
                <div className="absolute top-12 left-12 text-[10px] font-black tracking-[0.5em] text-white/20 uppercase italic">VERNACULAR BROADCAST</div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hindiSceneIdx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.6, ease: "circOut" }}
                  >
                    <p className="font-display text-5xl font-black text-white leading-[1.1] mb-6 tracking-tighter italic">
                      {activeHindiScene?.hindiText || 'READY OUT'}
                    </p>
                    <p className="text-sm font-bold text-white/30 italic uppercase tracking-[0.2em]">{activeHindiScene?.romanized}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="bg-[#0a0b0c] p-10 flex flex-col gap-6">
                 <div className="flex items-center gap-6">
                    <button
                      onClick={() => setHindiPlaying(!hindiPlaying)}
                      className="h-16 w-16 min-w-[64px] rounded-full bg-white text-black flex items-center justify-center text-xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                    >
                       {hindiPlaying ? '⏹' : '▶'}
                    </button>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                       <motion.div className="h-full bg-purple-500" animate={{ width: `${hindiProgress}%` }} />
                    </div>
                    <span className="font-black text-[10px] text-white/20 tracking-widest">{hindiSceneIdx + 1}/{hindiScenes.length}</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6 mt-4">
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                       <span className="block text-[8px] font-black uppercase text-purple-500 mb-2 tracking-[0.3em]">Causal Logic</span>
                       <p className="text-xs font-bold text-white/40 leading-relaxed">{activeHindiScene?.englishReference}</p>
                    </div>
                    {hindiScript.factCheckSummary && (
                      <div className="rounded-2xl bg-purple-500/5 border border-purple-500/10 p-6">
                         <span className="block text-[8px] font-black uppercase text-purple-400 mb-2 tracking-[0.3em]">Verification</span>
                         <p className="text-xs font-bold text-white/30 leading-relaxed italic">{hindiScript.factCheckSummary}</p>
                      </div>
                    )}
                 </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
