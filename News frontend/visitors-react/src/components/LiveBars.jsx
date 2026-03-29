import { useEffect, useState } from 'react'

const N = 16

function randomBar() {
  const h = Math.random() * 40 + 4
  return {
    height: h,
    background: h > 30 ? '#7C3AED' : '#C4B5FD',
  }
}

export function LiveBars({ onLiveCount }) {
  const [bars, setBars] = useState(() => Array.from({ length: N }, randomBar))

  useEffect(() => {
    const id = setInterval(() => {
      setBars(
        Array.from({ length: N }, () => {
          const h = Math.random() * 44 + 4
          return {
            height: h,
            background: h > 32 ? '#7C3AED' : '#C4B5FD',
          }
        }),
      )
      const n2 = Math.floor(Math.random() * 10) + 20
      onLiveCount?.(n2)
    }, 800)
    return () => clearInterval(id)
  }, [onLiveCount])

  return (
    <div className="live-bars-wrap" id="liveBars">
      {bars.map((b, i) => (
        <div
          key={i}
          className="lbar"
          style={{ height: `${b.height}px`, background: b.background }}
        />
      ))}
    </div>
  )
}
