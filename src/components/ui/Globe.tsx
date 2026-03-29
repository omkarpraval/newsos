import { useEffect, useRef } from 'react'
import createGlobe from 'cobe'

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  
  useEffect(() => {
    let phi = 0
    let currentPhi = 0
    let currentTheta = 0

    if (!canvasRef.current) return

    let width = canvasRef.current.parentElement?.offsetWidth || 800

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
      baseColor: [0.3, 0.3, 0.3], // Dark grey base
      markerColor: [124/255, 58/255, 237/255], // Purple (#7c3aed)
      glowColor: [1, 1, 1],
      markers: [
        { location: [28.6139, 77.2090], size: 0.1 }, // Delhi
        { location: [19.0760, 72.8777], size: 0.1 }, // Mumbai
        { location: [40.7128, -74.0060], size: 0.08 }, // NY
        { location: [1.3521, 103.8198], size: 0.08 }, // SG
        { location: [51.5074, -0.1278], size: 0.07 }, // London
      ],
      onRender: (state: any) => {
        if (!pointerInteracting.current) {
          phi += 0.005
        }
        state.phi = phi + currentPhi
        state.theta = currentTheta
        
        const targetPhi = pointerInteracting.current !== null ? pointerInteractionMovement.current : 0
        currentPhi += (targetPhi - currentPhi) * 0.1
      }
    } as any)

    const onResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        width = canvasRef.current.parentElement.offsetWidth
      }
    }
    window.addEventListener('resize', onResize)
    onResize()

    return () => {
      globe.destroy()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
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
          opacity: 0,
          animation: 'fade-in-globe 1.5s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        }}
      />
      
      <div style={{
        position: 'absolute',
        inset: '5%',
        pointerEvents: 'none',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 0 100px rgba(124, 58, 237, 0.03) inset'
      }} />
      
      <style>{`
        @keyframes fade-in-globe {
          0% { opacity: 0; transform: scale(0.85) rotateX(10deg); filter: blur(5px); }
          100% { opacity: 1; transform: scale(1) rotateX(0deg); filter: blur(0); }
        }
      `}</style>
    </div>
  )
}
