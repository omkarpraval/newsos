import { useEffect, useMemo, useRef, useState } from 'react'
import { callGroq, parseGroqJSON } from '../../services/groq'
import { useCharchaStore } from '../../store/useCharchaStore'
import { useBehaviorStore } from '../../store/useBehaviorStore'

interface ConversationMessage {
  speaker: 'user' | 'Riya' | 'Arjun'
  text: string
  timestamp: number
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

type Props = {
  sceneRef: React.MutableRefObject<unknown>
}

const BOT_PERSONAS = {
  Riya: {
    personality:
      'You are Riya, an energetic female news analyst on the NewsOS podcast. Hinglish style. Data-driven, crisp, 2-3 short sentences.',
    voice: { pitch: 1.15, rate: 0.95, lang: 'hi-IN' },
  },
  Arjun: {
    personality:
      "You are Arjun, a calm senior journalist and devil's advocate. Clear English with occasional Hindi phrase. 2-3 short sentences.",
    voice: { pitch: 0.9, rate: 0.9, lang: 'en-IN' },
  },
} as const

export default function ConversationEngine({ sceneRef }: Props) {
  const [isListening, setIsListening] = useState(false)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [userTranscript, setUserTranscript] = useState('')
  const [newsContext, setNewsContext] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [status, setStatus] = useState('Press T to start News Pe Charcha')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const conversationRef = useRef<ConversationMessage[]>([])
  const transcriptRef = useRef('')
  const [voiceReady, setVoiceReady] = useState(false)
  const setSessionActive = useCharchaStore((s) => s.setSessionActive)
  const isTalkingRef = useRef(false)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const [charchaMood, setCharchaMood] = useState<{ label: string; emoji: string; color: string } | null>(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [sessionSummary, setSessionSummary] = useState<{
    headline: string
    topics: string[]
    riyaTake: string
    arjunTake: string
    keyFacts: string[]
  } | null>(null)
  const escArmedRef = useRef(false)
  const track = useBehaviorStore((s) => s.track)

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    const loadVoices = () => {
      const voices = synth.getVoices()
      if (voices.length > 0) setVoiceReady(true)
    }
    loadVoices()
    synth.onvoiceschanged = loadVoices
    return () => {
      synth.onvoiceschanged = null
    }
  }, [])

  useEffect(() => {
    async function buildNewsContext() {
      try {
        const responses = await Promise.all([
          fetch('/api/news?type=headlines&category=business&pageSize=4').then((r) => r.json()),
          fetch('/api/news?type=headlines&category=general&pageSize=4').then((r) => r.json()),
          fetch('/api/news?type=search&query=India+economy+government&pageSize=4&daysBack=7').then((r) => r.json()),
        ])
        const allArticles = responses.flatMap((r) => r.articles || [])
        setNewsContext(
          allArticles
            .slice(0, 10)
            .map((a: { title?: string; description?: string }) => `- ${a.title}: ${a.description}`)
            .join('\n')
        )
      } catch {
        setNewsContext('')
      }
    }
    void buildNewsContext()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && isActive) {
        // First ESC releases pointer lock; second ESC opens recap.
        if (!document.pointerLockElement) {
          if (escArmedRef.current) {
            void generateSummary()
          } else {
            escArmedRef.current = true
            window.setTimeout(() => (escArmedRef.current = false), 1500)
          }
        }
      }
      if (e.code !== 'KeyT' || e.repeat) return
      if (!isActive) startSession()
      else if (isListening) stopListening()
      else void startListening()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isActive, isListening])

  async function startSession() {
    setIsActive(true)
    setSessionActive(true)
    setConversation([])
    conversationRef.current = []
    setStatus('Starting broadcast...')
    isTalkingRef.current = true
    await new Promise((resolve) => window.setTimeout(resolve, 400))
    await triggerBotSpeech('Riya', "Namaste! Welcome to News Pe Charcha. Main hoon Riya, let's decode the headlines together.")
    await new Promise((resolve) => window.setTimeout(resolve, 500))
    await triggerBotSpeech('Arjun', "I'm Arjun. Bring your strongest viewpoint and we'll debate it with real context.")
    isTalkingRef.current = false
    await startListening()
  }

  async function startListening() {
    const SpeechRecognitionCtor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setStatus("Your browser doesn't support voice. Use Chrome for full experience.")
      return
    }
    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'hi-IN'
    recognition.onstart = () => {
      setIsListening(true)
      setCurrentSpeaker('user')
      setStatus('Listening...')
      transcriptRef.current = ''
      setUserTranscript('')
    }
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript || '')
        .join('')
      transcriptRef.current = transcript
      setUserTranscript(transcript)
    }
    recognition.onend = () => {
      setIsListening(false)
      setCurrentSpeaker(null)
      const finalTranscript = transcriptRef.current.trim()
      transcriptRef.current = ''
      setUserTranscript('')
      if (finalTranscript.length > 3) void handleUserInput(finalTranscript)
      else setStatus("Didn't catch that. Press T to speak.")
    }
    recognition.onerror = () => {
      setIsListening(false)
      setStatus('Mic error. Press T to retry.')
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  async function handleUserInput(text: string) {
    const detectedCategory = detectCategory(text)
    track({ type: 'charcha_mention', topic: text.slice(0, 50), category: detectedCategory })
    const userMsg: ConversationMessage = { speaker: 'user', text, timestamp: Date.now() }
    conversationRef.current = [...conversationRef.current, userMsg]
    setConversation([...conversationRef.current])
    setStatus('Riya and Arjun are thinking...')
    isTalkingRef.current = true

    const scene = sceneRef.current as { showActiveNews?: (cat: string) => void; hideActiveNews?: () => void } | null
    scene?.showActiveNews?.(detectedCategory)

    try {
      const riyaResponse = await getBotResponse('Riya', text, conversationRef.current)
      await triggerBotSpeech('Riya', riyaResponse)
      const arjunResponse = await getBotResponse('Arjun', text, conversationRef.current)
      await triggerBotSpeech('Arjun', arjunResponse)
      setStatus('Press T to speak')
      scene?.hideActiveNews?.()
      void analyzeMood(conversationRef.current)
    } catch {
      setStatus('Error getting bot response. Press T to continue.')
      scene?.hideActiveNews?.()
    } finally {
      isTalkingRef.current = false
    }
  }

  function detectCategory(text: string): string {
    const q = text.toLowerCase()
    if (/(rbi|nifty|sensex|market|stocks|inflation|rupee)/.test(q)) return 'business'
    if (/(startup|ai|tech|funding|saas|chip|software)/.test(q)) return 'technology'
    if (/(parliament|policy|election|government|modi|budget)/.test(q)) return 'politics'
    return 'general'
  }

  async function getBotResponse(botName: 'Riya' | 'Arjun', userInput: string, history: ConversationMessage[]) {
    const historyStr = history.slice(-6).map((m) => `${m.speaker}: ${m.text}`).join('\n')
    const response = await callGroq(
      [
        {
          role: 'user',
          content: `Current news context:\n${newsContext}\n\nRecent conversation:\n${historyStr}\n\nUser said: "${userInput}"\nRespond now.`,
        },
      ],
      BOT_PERSONAS[botName].personality
    )
    return response.trim()
  }

  function triggerBotSpeech(botName: 'Riya' | 'Arjun', text: string) {
    return new Promise<void>((resolve) => {
      setCurrentSpeaker(botName)
      setStatus(`${botName} is speaking...`)
      const scene = sceneRef.current as { setBotSpeaking?: (name: 'Riya' | 'Arjun', speaking: boolean) => void } | null
      scene?.setBotSpeaking?.(botName, true)
      const msg: ConversationMessage = { speaker: botName, text, timestamp: Date.now() }
      conversationRef.current = [...conversationRef.current, msg]
      setConversation([...conversationRef.current])
      const synth = window.speechSynthesis
      if (synth) {
        synth.cancel()
        const utt = new SpeechSynthesisUtterance(text)
        utt.lang = BOT_PERSONAS[botName].voice.lang
        utt.pitch = BOT_PERSONAS[botName].voice.pitch
        utt.rate = BOT_PERSONAS[botName].voice.rate
        utt.volume = 1
        const voices = synth.getVoices()
        const preferredVoices =
          botName === 'Riya'
            ? [
                voices.find((v) => v.lang === 'hi-IN'),
                voices.find((v) => v.lang.startsWith('hi')),
                voices.find((v) => v.lang.includes('IN')),
              ]
            : [
                voices.find((v) => v.lang === 'en-IN'),
                voices.find((v) => v.lang.startsWith('en-IN')),
                voices.find((v) => v.lang.startsWith('en')),
              ]
        const selected = preferredVoices.find(Boolean) || voices[0]
        if (selected) utt.voice = selected
        utt.onend = () => {
          scene?.setBotSpeaking?.(botName, false)
          setCurrentSpeaker(null)
          resolve()
        }
        utt.onerror = () => {
          scene?.setBotSpeaking?.(botName, false)
          setCurrentSpeaker(null)
          resolve()
        }
        window.setTimeout(() => synth.speak(utt), 120)
      } else {
        window.setTimeout(() => {
          scene?.setBotSpeaking?.(botName, false)
          setCurrentSpeaker(null)
          resolve()
        }, 2500)
      }
    })
  }

  useEffect(() => {
    if (!chatScrollRef.current) return
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [conversation.length, isListening, userTranscript])

  const quickTopics = useMemo(
    () => ['RBI & inflation', 'Startup funding', 'Budget 2026', 'Geopolitics today'],
    []
  )

  async function handleQuickTopic(topic: string) {
    await handleUserInput(topic)
  }

  async function analyzeMood(recentMessages: ConversationMessage[]) {
    try {
      const text = recentMessages.slice(-4).map((m) => m.text).join(' ')
      const result = await callGroq(
        [
          {
            role: 'user',
            content: `Based on this conversation snippet, what is the discussion mood?\n"${text}"\nReply with ONLY a JSON object: {"label": "one word", "emoji": "one emoji", "sentiment": "positive|neutral|heated|analytical|alarmed"}`,
          },
        ],
        'You analyze conversation mood. Reply only JSON, no markdown.'
      )
      const parsed = parseGroqJSON(result) as { label?: string; emoji?: string; sentiment?: string }
      const colorMap: Record<string, string> = {
        positive: '#2ec4b6',
        neutral: '#9c9a92',
        heated: '#e63946',
        analytical: '#3a86ff',
        alarmed: '#f0a500',
      }
      if (!parsed?.label || !parsed?.emoji) return
      setCharchaMood({
        label: parsed.label,
        emoji: parsed.emoji,
        color: colorMap[String(parsed.sentiment)] || '#9c9a92',
      })
    } catch {
      // ignore
    }
  }

  async function generateSummary() {
    if (conversationRef.current.length < 4) return
    setStatus('Generating recap...')
    try {
      const fullConversation = conversationRef.current
        .map((m) => `${m.speaker === 'user' ? 'User' : m.speaker}: ${m.text}`)
        .join('\n')
      const result = await callGroq(
        [
          {
            role: 'user',
            content: `Summarize this News Pe Charcha session:\n${fullConversation}\n\nReturn JSON: {\n  "topics": ["topic1", "topic2"],\n  "riyaTake": "Riya's final stance in 1 sentence",\n  "arjunTake": "Arjun's final stance in 1 sentence",\n  "keyFacts": ["fact1", "fact2", "fact3"],\n  "headline": "Fun podcast-style headline for this episode"\n}`,
          },
        ],
        'You summarize news podcast sessions. Return only valid JSON.'
      )
      const parsed = parseGroqJSON(result) as {
        topics?: string[]
        riyaTake?: string
        arjunTake?: string
        keyFacts?: string[]
        headline?: string
      }
      if (!parsed?.headline) return
      setSessionSummary({
        headline: parsed.headline,
        topics: parsed.topics || [],
        riyaTake: parsed.riyaTake || '',
        arjunTake: parsed.arjunTake || '',
        keyFacts: parsed.keyFacts || [],
      })
      setShowSummaryModal(true)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const handleGaze = (e: Event) => {
      if (!isActive || isTalkingRef.current) return
      const ce = e as CustomEvent<{ article?: { title?: string } }>
      const title = ce.detail?.article?.title
      if (!title) return
      isTalkingRef.current = true
      void (async () => {
        try {
          const riyaLine = await callGroq(
            [{ role: 'user', content: `Give ONE sharp sentence opinion on this news as Riya (Hinglish): "${title}". No greeting, just your take.` }],
            BOT_PERSONAS.Riya.personality
          )
          await triggerBotSpeech('Riya', riyaLine)
          const arjunLine = await callGroq(
            [{ role: 'user', content: `Riya just said: "${riyaLine}". Give ONE sentence counter-point or agreement as Arjun about: "${title}". Be brief.` }],
            BOT_PERSONAS.Arjun.personality
          )
          await triggerBotSpeech('Arjun', arjunLine)
        } finally {
          isTalkingRef.current = false
        }
      })()
    }

    const handleClick = (e: Event) => {
      if (!isActive || isTalkingRef.current) return
      const ce = e as CustomEvent<{ article?: { title?: string } }>
      const title = ce.detail?.article?.title
      if (!title) return
      void handleUserInput(title)
    }

    window.addEventListener('charcha:gaze', handleGaze)
    window.addEventListener('charcha:click', handleClick)
    return () => {
      window.removeEventListener('charcha:gaze', handleGaze)
      window.removeEventListener('charcha:click', handleClick)
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <div
      className="absolute right-0 top-0 z-50 flex h-full w-[320px] flex-col border-l border-[rgba(240,165,0,0.2)] bg-[rgba(5,10,24,0.92)] font-sans backdrop-blur"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="h-2 w-2 animate-pulse rounded-full bg-[#e63946]" />
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[0.15em] text-[#e63946]">LIVE · NEWS PE CHARCHA</div>
          <div className="mt-1 text-[11px] text-white/45">{status}</div>
          {charchaMood && (
            <div
              className="mt-2 inline-flex items-center gap-2 rounded-md border px-2 py-1"
              style={{ background: `${charchaMood.color}15`, borderColor: `${charchaMood.color}40` }}
            >
              <span className="text-sm">{charchaMood.emoji}</span>
              <span className="font-mono text-[10px] tracking-widest text-white/40">MOOD</span>
              <span className="text-xs font-semibold" style={{ color: charchaMood.color }}>
                {charchaMood.label}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-b border-white/10 px-4 py-3">
        {[
          { name: 'Riya', color: '#ff6b9d', role: 'News Analyst' },
          { name: 'Arjun', color: '#4ecdc4', role: 'Sr. Journalist' },
        ].map((bot) => (
          <div
            key={bot.name}
            className="flex-1 rounded-lg border px-2.5 py-2 transition"
            style={{
              background: currentSpeaker === bot.name ? `${bot.color}22` : 'rgba(255,255,255,0.04)',
              borderColor: currentSpeaker === bot.name ? bot.color : 'rgba(255,255,255,0.08)',
            }}
          >
            <div className="mb-1 flex items-center gap-2">
              {currentSpeaker === bot.name ? (
                <div className="flex h-3 items-center gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-[2px] rounded-sm"
                      style={{
                        height: 8,
                        background: bot.color,
                        animation: `soundbar 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-2 w-2 rounded-full bg-white/20" />
              )}
              <span className="text-[12px] font-semibold" style={{ color: currentSpeaker === bot.name ? bot.color : 'rgba(255,255,255,0.7)' }}>
                {bot.name}
              </span>
            </div>
            <div className="font-mono text-[10px] text-white/35">{bot.role}</div>
          </div>
        ))}
      </div>

      <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-3">
          {conversation.map((msg) => {
            const color = msg.speaker === 'user' ? '#f0a500' : msg.speaker === 'Riya' ? '#ff6b9d' : '#4ecdc4'
            const isUser = msg.speaker === 'user'
            return (
              <div key={msg.timestamp} className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <span className="font-mono text-[9px] tracking-widest" style={{ color }}>
                  {isUser ? 'YOU' : msg.speaker.toUpperCase()}
                </span>
                <div
                  className="max-w-[90%] rounded-2xl border px-3 py-2"
                  style={{
                    background: isUser ? 'rgba(240,165,0,0.12)' : 'rgba(255,255,255,0.05)',
                    borderColor: isUser ? 'rgba(240,165,0,0.25)' : 'rgba(255,255,255,0.08)',
                    borderRadius: isUser ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                  }}
                >
                  <p className="m-0 text-[12px] leading-relaxed text-[rgba(240,237,232,0.9)]">{msg.text}</p>
                </div>
              </div>
            )
          })}

          {isListening && (
            <div className="flex flex-col gap-1 items-end">
              <span className="font-mono text-[9px] tracking-widest text-[#f0a500]">YOU</span>
              <div className="rounded-2xl border border-[rgba(240,165,0,0.2)] bg-[rgba(240,165,0,0.08)] px-3 py-2" style={{ borderRadius: '12px 12px 2px 12px' }}>
                <p className="m-0 text-[12px] italic text-[rgba(240,165,0,0.85)]">{userTranscript || '🎤 Listening...'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 px-4 py-3">
        {conversation.length <= 2 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {quickTopics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => void handleQuickTopic(t)}
                className="rounded-full border border-[rgba(240,165,0,0.25)] bg-[rgba(240,165,0,0.08)] px-3 py-1 text-[10px] text-[var(--accent-gold)]"
              >
                {t}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (isListening ? stopListening() : void startListening())}
            className={`h-11 w-11 shrink-0 rounded-full border-2 ${isListening ? 'animate-pulse border-[#e63946] bg-[#e63946]' : 'border-white/20 bg-white/10'}`}
          >
            <span className="text-lg">🎤</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[11px]" style={{ color: isListening ? '#e63946' : 'rgba(255,255,255,0.5)' }}>
              {isListening ? 'Recording...' : 'Press T or tap mic'}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-white/25">{voiceReady ? 'Start the charcha' : 'Initializing voices...'}</div>
          </div>
          <button
            type="button"
            onClick={() => void generateSummary()}
            className="rounded-lg border border-[rgba(240,165,0,0.25)] bg-[rgba(240,165,0,0.08)] px-3 py-2 text-[10px] text-[var(--accent-gold)]"
          >
            Recap
          </button>
        </div>
      </div>

      {showSummaryModal && sessionSummary && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur">
          <div className="w-[min(520px,92vw)] rounded-2xl border border-[rgba(240,165,0,0.3)] bg-[#050a18] p-7">
            <div className="font-mono text-[10px] tracking-[0.15em] text-[#e63946]">TODAY'S EPISODE</div>
            <div className="mt-2 font-display text-2xl text-[var(--accent-gold)]">{sessionSummary.headline}</div>
            {!!sessionSummary.topics.length && (
              <div className="mt-4">
                <div className="font-mono text-[10px] tracking-widest text-white/35">TOPICS</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sessionSummary.topics.slice(0, 6).map((t) => (
                    <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 grid gap-3 text-sm text-white/75">
              {sessionSummary.riyaTake && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-1 font-mono text-[10px] tracking-widest text-[#ff6b9d]">RIYA</div>
                  {sessionSummary.riyaTake}
                </div>
              )}
              {sessionSummary.arjunTake && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-1 font-mono text-[10px] tracking-widest text-[#4ecdc4]">ARJUN</div>
                  {sessionSummary.arjunTake}
                </div>
              )}
              {!!sessionSummary.keyFacts.length && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 font-mono text-[10px] tracking-widest text-white/40">KEY FACTS</div>
                  <ul className="ml-4 list-disc space-y-1">
                    {sessionSummary.keyFacts.slice(0, 3).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes soundbar {
          from { transform: scaleY(0.3); opacity: 0.5; }
          to { transform: scaleY(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
