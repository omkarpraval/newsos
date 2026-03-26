import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Persona, UiLanguage } from '../types'

interface UserState {
  persona: Persona
  language: UiLanguage
  token: string | null
  guest: boolean
  setPersona: (p: Persona) => void
  setLanguage: (l: UiLanguage) => void
  setToken: (t: string | null) => void
  setGuest: (g: boolean) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      persona: 'founder',
      language: 'en',
      token: null,
      guest: true,
      setPersona: (persona) => set({ persona }),
      setLanguage: (language) => set({ language }),
      setToken: (token) => set({ token }),
      setGuest: (guest) => set({ guest }),
    }),
    { name: 'newsos-user' }
  )
)
