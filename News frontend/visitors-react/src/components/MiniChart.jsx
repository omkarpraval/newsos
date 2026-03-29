import { useEffect, useRef } from 'react'

export function MiniChart() {
  const canvasRef = useRef(null)
  const ptsRef = useRef([
    0.55, 0.75, 0.65, 0.5, 0.4, 0.5, 0.35, 0.3, 0.45, 0.55, 0.4, 0.5, 0.65, 0.8, 0.9, 0.72, 0.62, 0.78, 1, 0.88, 0.65,
  ])
  const revRef = useRef([
    0.2, 0.1, 0.15, 0.3, 0.2, 0.1, 0.08, 0.22, 0.35, 0.15, 0.1, 0.28, 0.4, 0.5, 0.3, 0.2, 0.15, 0.35, 0.75, 0.85, 0.55,
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    function resize() {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw() {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const pts = ptsRef.current
      const rev = revRef.current
      ctx.clearRect(0, 0, w, h)

      function line(ps, stroke, fill) {
        const step = w / (ps.length - 1)
        ctx.beginPath()
        ps.forEach((p, i) => {
          const x = i * step
          const y = h - p * h * 0.83 - h * 0.05
          if (!i) {
            ctx.moveTo(x, y)
          } else {
            const px = (i - 1) * step
            const py = h - ps[i - 1] * h * 0.83 - h * 0.05
            ctx.bezierCurveTo(px + step / 3, py, x - step / 3, y, x, y)
          }
        })
        ctx.strokeStyle = stroke
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.lineTo(w, h)
        ctx.lineTo(0, h)
        ctx.closePath()
        ctx.fillStyle = fill
        ctx.fill()
      }

      line(pts, 'rgba(167,139,250,.85)', 'rgba(167,139,250,.07)')
      line(rev, 'rgba(34,197,94,.9)', 'rgba(34,197,94,.07)')

      const lx = w * 0.85
      ctx.beginPath()
      ctx.setLineDash([3, 3])
      ctx.moveTo(lx, 0)
      ctx.lineTo(lx, h)
      ctx.strokeStyle = 'rgba(180,180,200,.5)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.arc(lx, h - 0.88 * h * 0.83 - h * 0.05, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#22C55E'
      ctx.fill()

      ctx.fillStyle = '#9CA3AF'
      ctx.font = '10px Inter'
      ;['00:00', '08:00', '16:00', '20:00', '23:00'].forEach((l, i) => {
        ctx.fillText(l, (i / 4) * w, h - 2)
      })
    }

    resize()
    draw()

    const onResize = () => {
      resize()
      draw()
    }
    window.addEventListener('resize', onResize)

    const id = setInterval(() => {
      ptsRef.current = ptsRef.current.map((p) =>
        Math.max(0.1, Math.min(1, p + (Math.random() - 0.5) * 0.06)),
      )
      revRef.current = revRef.current.map((p) =>
        Math.max(0.05, Math.min(1, p + (Math.random() - 0.5) * 0.04)),
      )
      draw()
    }, 1200)

    return () => {
      window.removeEventListener('resize', onResize)
      clearInterval(id)
    }
  }, [])

  return <canvas id="miniChart" ref={canvasRef} />
}
