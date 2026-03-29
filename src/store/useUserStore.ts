import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Persona, UiLanguage } from '../types'

export type UserRole = 'basic' | 'premium' | 'admin'

interface UserState {
  persona: Persona
  language: UiLanguage
  token: string | null
  role: UserRole
  preferences: string[]
  guest: boolean
  setPersona: (p: Persona) => void
  setLanguage: (l: UiLanguage) => void
  setToken: (t: string | null) => void
  setRole: (r: UserRole) => void
  setPreferences: (p: string[]) => void
  setGuest: (g: boolean) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      persona: 'founder',
      language: 'en',
      token: null,
      role: 'basic',
      preferences: ['markets', 'politics', 'startup'],
      guest: true,
      setPersona: (persona) => set({ persona }),
      setLanguage: (language) => set({ language }),
      setToken: (token) => set({ token }),
      setRole: (role) => set({ role }),
      setPreferences: (preferences) => set({ preferences }),
      setGuest: (guest) => set({ guest }),
      logout: () => set({ token: null, role: 'basic', guest: true }),
    }),
    { name: 'newsos-user' }
  )
)
