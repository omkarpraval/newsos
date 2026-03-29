import { useEffect, useRef } from 'react'
import createGlobe from 'cobe'

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  
  useEffect(() => {
    let phi = 0
    let width = 0
    let currentPhi = 0
    let currentTheta = 0
    const doublePi = Math.PI * 2

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth
      }
    }
    window.addEventListener('resize', onResize)
    onResize()

    if (!canvasRef.current) return

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [1, 1, 1],
      markerColor: [0.176, 0.831, 0.749], // Teal (#2dd4bf)
      glowColor: [1, 1, 1],
      markers: [
        { location: [19.0760, 72.8777], size: 0.1 }, // Mumbai
        { location: [40.7128, -74.0060], size: 0.08 }, // NY
        { location: [1.3521, 103.8198], size: 0.08 }, // SG
        { location: [51.5074, -0.1278], size: 0.07 }, // London
      ],
      onRender: (state) => {
        // Auto-rotation
        if (!pointerInteracting.current) {
          phi += 0.005
        }
        state.phi = phi + currentPhi
        state.theta = currentTheta
        
        // Handle pointer interaction smoothing
        const targetPhi = pointerInteracting.current !== null ? pointerInteractionMovement.current : 0
        currentPhi += (targetPhi - currentPhi) * 0.1
        
        state.width = width * 2
        state.height = width * 2
      }
    })

    return () => {
      globe.destroy()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div style={{
      width: '100%',
      maxWidth: 600,
      aspectRatio: 1,
      margin: 'auto',
      position: 'relative',
    }}>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX
          canvasRef.current!.style.cursor = 'grabbing'
        }}
        onPointerUp={() => {
          pointerInteracting.current = null
          canvasRef.current!.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          pointerInteracting.current = null
          canvasRef.current!.style.cursor = 'grab'
        }}
        onPointerMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current
            pointerInteractionMovement.current = delta * 0.01
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          contain: 'layout paint size',
          opacity: 0,
          animation: 'fade-in 1s ease forwards',
        }}
      />
      
      {/* Glow overlay to fade out the edges for that specific 3D space look */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at center, transparent 30%, #000 70%)',
      }} />
      
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 0.8; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
