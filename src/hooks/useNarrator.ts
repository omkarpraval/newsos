import { useCallback, useEffect, useState } from 'react'
import { stopSpeaking, type VoicePreset } from '../services/tts'

export type { VoicePreset }

export function useNarrator() {
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
    }
  }, [])

  const narrate = useCallback((text: string, preset: VoicePreset = 'authoritative') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    stopSpeaking()
    setSpeaking(true)
    const u = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const en = voices.find((v) => v.lang.startsWith('en')) || voices[0]
    if (en) u.voice = en
    if (preset === 'authoritative') {
      u.rate = 0.95
      u.pitch = 0.9
    } else if (preset === 'casual') {
      u.rate = 1.05
      u.pitch = 1.05
    } else {
      u.rate = 0.88
      u.pitch = 0.85
    }
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    try {
      window.speechSynthesis.speak(u)
    } catch {
      setSpeaking(false)
    }
  }, [])

  const stop = useCallback(() => {
    stopSpeaking()
    setSpeaking(false)
  }, [])

  return { narrate, stop, speaking }
}
