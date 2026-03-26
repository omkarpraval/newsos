import { useUserStore } from '../store/useUserStore'
import type { Persona } from '../types'

export function usePersona() {
  const persona = useUserStore((s) => s.persona)
  const setPersona = useUserStore((s) => s.setPersona)
  return { persona, setPersona: setPersona as (p: Persona) => void }
}
