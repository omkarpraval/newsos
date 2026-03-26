import { create } from 'zustand'

type CharchaState = {
  sessionActive: boolean
  setSessionActive: (active: boolean) => void
}

export const useCharchaStore = create<CharchaState>((set) => ({
  sessionActive: false,
  setSessionActive: (active) => set({ sessionActive: active }),
}))
