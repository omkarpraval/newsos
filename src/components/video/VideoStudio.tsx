import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { generateVideoScript } from '../../services/groq'
import { searchNews } from '../../services/newsapi'
import { useNarrator, type VoicePreset } from '../../hooks/useNarrator'
import type { VideoScript } from '../../types'

export function VideoStudio() {
  const [topic, setTopic] = useState('')
  const [voice, setVoice] = useState<VoicePreset>('authoritative')
  const [script, setScript] = useState<VideoScript | null>(null)
  const [loading, setLoading] = useState(false)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const { narrate, stop } = useNarrator()

  const scenes = script?.scenes ?? []

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

  const active = scenes[sceneIdx]

  const totalDur = useMemo(() => scenes.reduce((a, s) => a + s.duration, 0), [scenes])

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
        <p className="text-xs text-[var(--text-muted)]">
          Full MP4 export via Remotion — coming soon. This preview uses Web Speech API narration.
        </p>
      </div>
      <div className="lg:col-span-7">
        <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-black">
          <div
            className="flex aspect-video items-center justify-center p-8 text-center"
            style={{ backgroundColor: active?.background_color || '#111' }}
          >
            <motion.p
              key={sceneIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display text-2xl text-white md:text-3xl"
            >
              {active?.text ?? 'Script preview'}
            </motion.p>
          </div>
          <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs"
              onClick={() => {
                setSceneIdx(0)
                setPlaying(true)
              }}
              disabled={!scenes.length}
            >
              Play
            </button>
            <div className="h-1 flex-1 rounded-full bg-[var(--bg-elevated)]">
              <div className="h-1 rounded-full bg-[var(--accent-gold)]" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              {totalDur ? `${sceneIdx + 1}/${scenes.length}` : '—'}
            </span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs"
            onClick={downloadTxt}
            disabled={!script}
          >
            Download Script
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs"
            onClick={() => script && void navigator.clipboard.writeText(script.scenes.map((s) => s.text).join('\n'))}
            disabled={!script}
          >
            Copy narration
          </button>
        </div>
      </div>
    </div>
  )
}
