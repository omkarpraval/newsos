import { motion } from 'framer-motion'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import type { Persona } from '../types'
import { PersonaSelector } from '../components/news/PersonaSelector'

export function Landing() {
  const navigate = useNavigate()
  const setPersona = useUserStore((s) => s.setPersona)
  const token = useUserStore((s) => s.token)
  const [selected, setSelected] = useState<Persona | null>(null)
  const [particlesReady, setParticlesReady] = useState(false)
  const [line2, setLine2] = useState('')

  useEffect(() => {
    void initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setParticlesReady(true))
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      const full = 'Until now.'
      let i = 0
      const id = window.setInterval(() => {
        i += 1
        setLine2(full.slice(0, i))
        if (i >= full.length) window.clearInterval(id)
      }, 100)
    }, 1200)
    return () => window.clearTimeout(t)
  }, [])

  const options = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: 'transparent' } },
      fpsLimit: 60,
      particles: {
        number: { value: 40, density: { enable: true } },
        color: { value: '#f0a500' },
        opacity: { value: 0.12 },
        size: { value: { min: 1, max: 2 } },
        move: { enable: true, speed: 0.35 },
        links: { enable: true, distance: 120, color: '#f0a500', opacity: 0.08 },
      },
      detectRetina: true,
    }),
    []
  )

  const onChoose = async (p: Persona) => {
    setSelected(p)
    setPersona(p)
    document.documentElement.setAttribute('data-persona', p)
    if (token) {
      try {
        await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ persona: p }),
        })
      } catch {
        /* guest */
      }
    }
    window.setTimeout(() => navigate('/dashboard'), 650)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--bg-primary)]">
      {particlesReady && (
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <Particles id="landing-particles" options={options} />
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(240,165,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(240,165,0,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-content flex-1 flex-col justify-center px-6 py-16">
        <motion.h1
          className="font-display text-4xl text-[var(--text-primary)] md:text-6xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          News has always been read.
        </motion.h1>

        <motion.p
          className="mt-4 min-h-[1.2em] font-display text-3xl text-[var(--accent-gold)] md:text-5xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: line2 ? 1 : 0 }}
        >
          {line2}
        </motion.p>

        <motion.p
          className="mt-8 text-lg text-[var(--text-secondary)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: line2.length > 8 ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          Roam. Listen. Understand.
        </motion.p>

        <motion.div
          className="mt-6 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: line2.length > 8 ? 1 : 0, y: line2.length > 8 ? 0 : 8 }}
          transition={{ duration: 0.4 }}
        >
          <span className="rounded-full border border-[var(--border)] bg-black/40 px-3 py-1 font-mono text-[11px] text-[var(--accent-gold)]">
            NewsOS · The world reads. You roam.
          </span>
          <Link
            to="/dashboard"
            className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--accent-gold)] hover:text-[var(--text-primary)]"
          >
            Skip to dashboard
          </Link>
        </motion.div>

        <div className="mt-16">
          <PersonaSelector selected={selected} onSelect={onChoose} />
        </div>
      </div>
    </div>
  )
}
