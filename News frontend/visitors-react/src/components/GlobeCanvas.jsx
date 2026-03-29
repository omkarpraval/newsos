import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function GlobeCanvas({ onLiveCount }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.z = 2.8

    const geo = new THREE.SphereGeometry(1, 64, 64)
    const mat = new THREE.MeshPhongMaterial({
      color: 0x1a1a3e,
      emissive: 0x080820,
      shininess: 15,
      transparent: true,
      opacity: 0.95,
    })
    const globe = new THREE.Mesh(geo, mat)
    scene.add(globe)

    const wmat = new THREE.MeshBasicMaterial({
      color: 0x3730a3,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    })
    const wglobe = new THREE.Mesh(new THREE.SphereGeometry(1.002, 22, 22), wmat)
    scene.add(wglobe)

    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(1.09, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x4f46e5,
        transparent: true,
        opacity: 0.07,
        side: THREE.BackSide,
      }),
    )
    scene.add(atm)

    scene.add(new THREE.AmbientLight(0x404080, 0.6))
    const dl = new THREE.DirectionalLight(0x8080ff, 1.3)
    dl.position.set(5, 3, 5)
    scene.add(dl)
    const bl = new THREE.DirectionalLight(0x4040cc, 0.3)
    bl.position.set(-5, -3, -5)
    scene.add(bl)

    const locs = [
      [51.5, -0.1],
      [40.7, -74],
      [35.7, 139.7],
      [48.9, 2.3],
      [-33.9, 151.2],
      [19.1, 72.9],
      [37.8, -122.4],
      [55.8, 37.6],
      [-23.5, -46.6],
      [1.3, 103.8],
      [52.5, 13.4],
      [41, 28.9],
      [30, 31.2],
      [-1.3, 36.8],
      [34, -118.2],
      [45.5, -73.6],
      [59.9, 10.7],
      [25.2, 55.3],
      [13.8, 100.5],
      [-26.2, 28],
      [43.7, -79.4],
      [28.6, 77.2],
      [31.2, 121.5],
      [-34.6, -58.4],
      [6.5, 3.4],
      [3.1, 101.7],
      [64.1, -21.9],
      [-36.9, 174.8],
      [50.1, 14.4],
      [39.9, 116.4],
    ]
    const colors = [
      0x7c3aed, 0x3b82f6, 0x22c55e, 0xec4899, 0xeab308, 0xf97316, 0x06b6d4,
    ]

    function ll2v(lat, lon, r) {
      const phi = ((90 - lat) * Math.PI) / 180
      const theta = ((lon + 180) * Math.PI) / 180
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      )
    }

    const dotG = new THREE.Group()
    scene.add(dotG)

    locs.forEach(([lat, lon], i) => {
      const c = colors[i % colors.length]
      const sz = 0.024 + Math.random() * 0.018
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(sz, 8, 8),
        new THREE.MeshBasicMaterial({ color: c }),
      )
      const pos = ll2v(lat, lon, 1.013)
      dot.position.copy(pos)
      dotG.add(dot)

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(sz * 1.6, sz * 2.8, 14),
        new THREE.MeshBasicMaterial({
          color: c,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        }),
      )
      ring.position.copy(pos)
      ring.lookAt(new THREE.Vector3(0, 0, 0))
      ring.userData.phase = Math.random() * Math.PI * 2
      dotG.add(ring)
    })

    let rafId = 0
    let t = 0
    let liveCount = 66

    function rsz() {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    rsz()
    const onResize = () => rsz()
    window.addEventListener('resize', onResize)

    function anim() {
      rafId = requestAnimationFrame(anim)
      t += 0.009
      globe.rotation.y += 0.0045
      wglobe.rotation.y += 0.0045
      dotG.rotation.y += 0.0045
      dotG.children.forEach((child) => {
        if (child.userData.phase !== undefined) {
          child.material.opacity = Math.sin(t * 2 + child.userData.phase) * 0.3 + 0.35
          const s = 1 + Math.sin(t * 1.5 + child.userData.phase) * 0.3
          child.scale.set(s, s, s)
        }
      })
      renderer.render(scene, camera)
    }
    anim()

    const countId = setInterval(() => {
      liveCount += Math.floor(Math.random() * 5) - 2
      liveCount = Math.max(40, Math.min(100, liveCount))
      onLiveCount?.(liveCount)
    }, 3000)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      clearInterval(countId)
      renderer.dispose()
    }
  }, [onLiveCount])

  return <canvas id="globe-canvas" ref={canvasRef} />
}
