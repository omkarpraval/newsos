import type { ZoneConfig } from '../../types'

export const WORLD_WIDTH = 1200
export const WORLD_HEIGHT = 800

/** Spawn at Daily Prophet HQ (center plaza) */
export const SPAWN = { x: 600, y: 400 }

export const ZONES: ZoneConfig[] = [
  {
    id: 'markets',
    name: 'Markets Plaza',
    category: 'business',
    color: '#f0a500',
    x: 40,
    y: 40,
    w: 320,
    h: 240,
  },
  {
    id: 'politics',
    name: 'Parliament Hall',
    category: 'general',
    color: '#3a86ff',
    x: 420,
    y: 40,
    w: 320,
    h: 240,
  },
  {
    id: 'startup',
    name: 'Startup District',
    category: 'technology',
    color: '#a855f7',
    x: 800,
    y: 40,
    w: 340,
    h: 240,
  },
  {
    id: 'world',
    name: 'World Events Arena',
    category: 'general',
    color: '#2ec4b6',
    x: 40,
    y: 360,
    w: 340,
    h: 240,
  },
  {
    id: 'bharat',
    name: 'Bharat Corner',
    category: 'business',
    color: '#ff7f50',
    x: 420,
    y: 360,
    w: 320,
    h: 240,
  },
  {
    id: 'breaking',
    name: 'Daily Prophet HQ',
    category: 'general',
    color: '#9ca3af',
    x: 800,
    y: 360,
    w: 360,
    h: 240,
  },
]
