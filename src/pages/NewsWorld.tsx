import * as THREE from 'three'
import * as React from 'react'
import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Image, Text, ScrollControls, useScroll, Environment, MeshReflectorMaterial } from '@react-three/drei'
import { fetchHeadlines } from '../services/newsapi'
import { AnimatePresence, motion } from 'framer-motion'

const ART_SPACING = 3.5

function ArticleFrame({ url, title, position, onClick }: any) {
  const ref = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  useFrame((state, delta) => {
    if (ref.current) {
      const y = Math.sin(state.clock.elapsedTime + position[2]) * 0.1
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, position[1] + y + (hovered ? 0.2 : 0), 4 * delta)
      ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, hovered ? 1.05 : 1, 4 * delta))
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[2.5, 1.5]} />
        <meshStandardMaterial color={hovered ? '#ffffff' : '#dddddd'} roughness={0.1} metalness={0.8} />
        {url && (
          <React.Suspense fallback={null}>
            <Image url={url} transparent scale={[2.4, 1.4, 1]} position={[0, 0, 0.05]} />
          </React.Suspense>
        )}
        <Text
          position={[0, -0.9, 0.05]}
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="top"
          maxWidth={2.4}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        >
          {title || "Loading..."}
        </Text>
      </mesh>
    </group>
  )
}

function Gallery({ articles, onSelect }: any) {
  const scroll = useScroll()
  const group = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (group.current) {
      // The scroll offset is between 0 and 1
      const zOffset = scroll.offset * articles.length * ART_SPACING
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, zOffset, 4 * delta)
    }
  })

  return (
    <group ref={group}>
      {articles.map((article: any, i: number) => {
        // Place items in a zig-zag alternating left and right
        const x = i % 2 === 0 ? -1.8 : 1.8
        const z = -i * ART_SPACING
        const imgUrl = article.urlToImage || `https://picsum.photos/seed/${i}/600/400`
        return (
          <ArticleFrame 
            key={i} 
            url={imgUrl} 
            title={article.title} 
            position={[x, 0, z]} 
            onClick={() => onSelect(article)}
          />
        )
      })}
    </group>
  )
}

export function NewsWorld() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await fetchHeadlines('business', 15)
        setArticles(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full min-h-[calc(100vh-6rem)] items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    )
  }

  // Linear app style page structure
  return (
    <div className="relative mt-8 h-[calc(100vh-14rem)] bg-black overflow-hidden font-sans rounded-3xl border border-white/10 shadow-2xl">
      <div className="absolute top-24 left-14 z-10 w-full">
        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-2xl">
          Global Exhibition
        </h1>
        <p className="mt-4 text-sm text-white/50 tracking-[0.3em] uppercase font-bold">Scroll to explore narratives</p>
      </div>
      
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 0.5, 7], fov: 35 }}>
          <color attach="background" args={['#000000']} />
          <fog attach="fog" args={['#000000', 5, 25]} />
          
          <ambientLight intensity={0.4} />
          <spotLight position={[0, 10, 0]} intensity={1.5} penumbra={1} castShadow angle={0.6} />
          
          <ScrollControls pages={articles.length ? Math.max(articles.length / 3, 2) : 2} damping={0.25} distance={1.5}>
            <Gallery articles={articles} onSelect={setSelected} />
          </ScrollControls>

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
            <planeGeometry args={[50, 200]} />
            <MeshReflectorMaterial
              blur={[300, 100]}
              resolution={1024}
              mixBlur={1}
              mixStrength={40}
              roughness={0.4}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#0a0a0a"
              metalness={0.5}
            />
          </mesh>
          <Environment preset="city" />
        </Canvas>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl"
            >
              {selected.urlToImage && (
                <div className="h-64 w-full">
                  <img src={selected.urlToImage} alt={selected.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-8">
                <span className="text-xs font-medium uppercase tracking-widest text-[#5e6ad2]">
                  {selected.source?.name || 'NewsOS'}
                </span>
                <h2 className="mt-3 font-display text-2xl font-semibold leading-snug text-white">
                  {selected.title}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-white/60">
                  {selected.description || 'No detailed description available.'}
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <a href={selected.url} target="_blank" rel="noreferrer" className="btn-primary">
                    Read Source Article
                  </a>
                  <button onClick={() => setSelected(null)} className="btn-ghost">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-10 flex justify-center">
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-ms text-xs font-mono text-white/40 tracking-widest">
          SCROLL TO NAVIGATE · CLICK IMAGE TO EXPAND
        </div>
      </div>
    </div>
  )
}
