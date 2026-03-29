import { useEffect, useState } from 'react'

const visitors = [
  { emoji: '🦊', name: 'Olivia Patel', act: 'just became a customer', amt: '$199' },
  { emoji: '🐰', name: 'Speedy Rabbit', act: 'is browsing your site', amt: '' },
  { emoji: '🐳', name: 'Sarah Mitchell', act: 'upgraded to Pro', amt: '$249/mo' },
  { emoji: '🦁', name: 'James Chen', act: 'just purchased', amt: '$99' },
  { emoji: '🐧', name: 'Quirky Penguin', act: 'visited from Twitter', amt: '' },
  { emoji: '🦄', name: 'Emma Rodriguez', act: 'became a customer', amt: '$149' },
  { emoji: '🐊', name: 'Fluffy Koala', act: 'came from GitHub', amt: '' },
]

export function Ticker() {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('in')
  const [boot, setBoot] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBoot(true), 2000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setPhase('out')
      setTimeout(() => {
        setIdx((i) => (i + 1) % visitors.length)
        setPhase('in')
      }, 300)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const v = visitors[idx]

  const opacity = !boot ? 0 : phase === 'in' ? 1 : 0
  const transform = !boot ? 'translateX(60px)' : phase === 'in' ? 'translateX(0)' : 'translateX(40px)'

  return (
    <div
      className="ticker"
      id="ticker"
      style={{
        opacity,
        transform,
        transition: 'opacity .5s ease, transform .5s ease',
      }}
    >
      <div className="tick-av" style={{ background: 'linear-gradient(135deg,#f472b6,#fb923c)' }}>
        {v.emoji}
      </div>
      <div>
        <div className="tick-name">{v.name}</div>
        <div className="tick-act">{v.amt ? `${v.act} • ${v.amt}` : v.act}</div>
        <div className="tick-t">just now</div>
      </div>
    </div>
  )
}
