import type { ButtonHTMLAttributes } from 'react'

export function GoldButton({ className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-xl bg-[var(--accent-gold)] px-4 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(240,165,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)] ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
