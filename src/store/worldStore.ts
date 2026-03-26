import mitt from 'mitt'
import { create } from 'zustand'
import type { ZoneId } from '../types'

export type WorldEvents = {
  'zone:enter': { zoneId: ZoneId; zoneName: string }
  'zone:exit': { zoneId: ZoneId }
  'breaking:owl': { headline: string }
  'player:pos': { x: number; y: number }
}

export const worldEvents = mitt<WorldEvents>()

interface WorldUiState {
  activeZoneId: ZoneId | null
  activeZoneName: string | null
  overlayOpen: boolean
  tintColor: string | null
  playerPos: { x: number; y: number }
  setZone: (id: ZoneId | null, name: string | null, open: boolean, tint: string | null) => void
  setPlayerPos: (p: { x: number; y: number }) => void
}

export const useWorldStore = create<WorldUiState>((set) => ({
  activeZoneId: null,
  activeZoneName: null,
  overlayOpen: false,
  tintColor: null,
  playerPos: { x: 600, y: 400 },
  setZone: (activeZoneId, activeZoneName, overlayOpen, tintColor) =>
    set({ activeZoneId, activeZoneName, overlayOpen, tintColor }),
  setPlayerPos: (playerPos) => set({ playerPos }),
}))
