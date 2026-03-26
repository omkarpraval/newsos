import type { MutableRefObject } from 'react'
import { useEffect, useState } from 'react'

type Props = {
  sceneRef: MutableRefObject<unknown>
}

export default function CharchaHUD({ sceneRef }: Props) {
  const [nearestTitle, setNearestTitle] = useState<string | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => {
      const scene = sceneRef.current as { nearestPoster?: { article?: { title?: string } } } | null
      setNearestTitle(scene?.nearestPoster?.article?.title || null)
    }, 250)
    return () => window.clearInterval(id)
  }, [sceneRef])

  return (
    <div className="pointer-events-none absolute inset-0 font-sans">
      <div className="absolute left-4 top-4">
        <div className="font-display text-xl text-[var(--accent-gold)]">News Pe Charcha</div>
        <div className="font-mono text-[10px] tracking-widest text-white/45">LIVE NEWSROOM - AI PODCAST STUDIO</div>
      </div>
      <div className="absolute right-4 top-4 text-right font-mono text-[10px] tracking-wide text-white/40">
        <div>CLICK to capture mouse · ESC to release</div>
        <div>WASD / arrows to move</div>
        <div>MOUSE to look around</div>
        <div className="text-[var(--accent-gold)]">T - start / stop talking</div>
      </div>
      <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-0 h-4 w-[2px] -translate-x-1/2 bg-white/60" />
        <div className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 bg-white/60" />
      </div>
      {nearestTitle && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-xs text-white/80 backdrop-blur">
          Nearby story: <span className="text-[var(--accent-gold)]">{nearestTitle}</span>
        </div>
      )}
      <div className="absolute bottom-4 left-4 text-xs text-white/35">
        Microphone and pointer-lock permissions required for full experience.
      </div>
    </div>
  )
}
