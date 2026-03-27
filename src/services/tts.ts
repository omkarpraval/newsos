export type VoicePreset = 'authoritative' | 'casual' | 'dramatic'

export function speakText(text: string, preset: VoicePreset = 'authoritative') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()
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

  try {
    window.speechSynthesis.speak(u)
  } catch {
    /* noop */
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

/** ElevenLabs when key present — optional enhancement */
export async function speakElevenLabs(text: string): Promise<boolean> {
  const key = import.meta.env.VITE_ELEVENLABS_KEY as string | undefined
  if (!key || key.startsWith('your_')) return false
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: 'eleven_monolingual_v1' }),
    })
    if (!res.ok) return false
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    await audio.play()
    return true
  } catch {
    return false
  }
}

/** Speak text in Hindi using Web Speech API */
export function speakHindi(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const voices = window.speechSynthesis.getVoices()

  // Try to find a Hindi voice
  const hindiVoice =
    voices.find((v) => v.lang === 'hi-IN') ||
    voices.find((v) => v.lang.startsWith('hi')) ||
    voices.find((v) => v.name.toLowerCase().includes('hindi'))

  if (hindiVoice) {
    u.voice = hindiVoice
    u.lang = 'hi-IN'
  } else {
    u.lang = 'hi-IN'
  }

  u.rate = 0.85  // Slower for comprehension
  u.pitch = 1.0

  if (onEnd) {
    u.onend = onEnd
  }

  try {
    window.speechSynthesis.speak(u)
  } catch {
    /* noop */
  }
}

