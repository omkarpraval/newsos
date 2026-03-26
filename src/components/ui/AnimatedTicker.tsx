type Props = { items: string[]; className?: string }

export function AnimatedTicker({ items, className = '' }: Props) {
  const doubled = [...items, ...items]
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <div className="animate-marquee flex whitespace-nowrap font-mono text-xs text-[var(--accent-gold)]">
        {doubled.map((t, i) => (
          <span key={i} className="mx-8 inline-block">
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
