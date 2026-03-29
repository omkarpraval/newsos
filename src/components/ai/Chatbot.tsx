import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../../store/useUserStore'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatbotProps {
  newsContext?: string  // optional article being read
  onClose?: () => void
  isFloating?: boolean
}

export function Chatbot({ newsContext, onClose, isFloating = false }: ChatbotProps) {
  const { persona, token } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello! I'm **ET-IQ**, your AI news intelligence assistant. ${persona === 'trader' ? 'I\'m configured for executive-level market analysis.' : persona === 'founder' ? 'I\'m scoped for startup ecosystem insights.' : 'I\'m here to help you understand finance simply.'}

${newsContext ? '📰 I can see you\'re reading an article — ask me anything about it!' : 'Ask me to explain any news, simulate portfolio impact, or run a Shadow Board debate.'}`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyCount, setHistoryCount] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const userId = token ? `user-${token.slice(-8)}` : 'guest'
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, persona, userId, newsContext }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])
      setHistoryCount(data.historyLength || historyCount + 2)
    } catch (e: any) {
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: `❌ Error: ${e.message}`, timestamp: new Date() }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const quickPrompts = [
    { label: 'Explain simply', prompt: 'Explain this news in simple terms for me' },
    { label: 'Shadow Board', prompt: 'Run a Shadow Board debate on this topic' },
    { label: 'Portfolio impact', prompt: 'Simulate the portfolio impact of this news on a ₹5L investment' },
    { label: 'Bull vs Bear', prompt: 'What are the bull and bear cases here?' },
  ]

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user'
    // Basic markdown bold formatting
    const formatted = msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
    
    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      >
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-sm text-white font-black shadow-md">
            AI
          </div>
        )}
        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? 'bg-[#7c3aed] text-white' : 'bg-gray-50 text-black border border-gray-100'}`}>
          <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
          <span className="mt-1 block text-[9px] font-bold opacity-40">{msg.timestamp.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
        </div>
      </motion.div>
    )
  }

  const Container = isFloating ? motion.div : 'div'

  return (
    <Container
      initial={isFloating ? { opacity: 0, y: 20, scale: 0.95 } : undefined}
      animate={isFloating ? { opacity: 1, y: 0, scale: 1 } : undefined}
      exit={isFloating ? { opacity: 0, y: 20, scale: 0.95 } : undefined}
      className={`flex flex-col bg-white ${isFloating ? 'fixed bottom-24 right-6 z-50 h-[600px] w-[400px] rounded-3xl shadow-2xl ring-1 ring-gray-100 overflow-hidden' : 'h-full min-h-screen'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-50 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7c3aed] text-xs font-black text-white shadow-md">AI</div>
          <div>
            <div className="text-[13px] font-black text-black">ET-IQ Assistant</div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {persona} mode · {historyCount} turns
              </span>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-50 hover:text-black transition-colors text-xl">&times;</button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map(renderMessage)}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-sm text-white font-black">AI</div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-2 w-2 rounded-full bg-[#7c3aed] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts - only show when there's a newsContext */}
      {newsContext && messages.length === 1 && (
        <div className="flex gap-2 overflow-x-auto px-5 pb-3 scrollbar-hide">
          {quickPrompts.map(p => (
            <button
              key={p.label}
              onClick={() => { setInput(p.prompt); setTimeout(() => sendMessage(), 100) }}
              className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-600 transition-all hover:border-[#7c3aed] hover:text-[#7c3aed]"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-50 p-4">
        <div className="flex items-center gap-3 rounded-2xl border-2 border-gray-100 bg-gray-50/50 px-4 py-2 transition-all focus-within:border-[#7c3aed] focus-within:bg-white">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about any news…"
            className="flex-1 bg-transparent text-sm font-medium text-black outline-none placeholder:text-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7c3aed] text-white transition-all hover:bg-[#6d28d9] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ➤
          </button>
        </div>
      </div>
    </Container>
  )
}

// Floating chat button + widget
export function FloatingChat() {
  const [open, setOpen] = useState(false)
  
  return (
    <>
      <AnimatePresence>
        {open && <Chatbot isFloating onClose={() => setOpen(false)} />}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#7c3aed] text-white shadow-[0_8px_30px_rgba(124,58,237,0.4)] transition-all hover:bg-[#6d28d9]"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="text-xl">✕</motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="text-xl">🤖</motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}
