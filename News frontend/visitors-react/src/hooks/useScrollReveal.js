import { useEffect } from 'react'

export function useScrollReveal() {
  useEffect(() => {
    let obs
    const raf = requestAnimationFrame(() => {
      const els = document.querySelectorAll('.reveal')
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in')
              obs.unobserve(e.target)
            }
          })
        },
        { threshold: 0.08 },
      )
      els.forEach((el) => obs.observe(el))
    })
    return () => {
      cancelAnimationFrame(raf)
      obs?.disconnect()
    }
  }, [])
}
