import { useWorldStore } from '../../store/worldStore'
import { WORLD_HEIGHT, WORLD_WIDTH, ZONES } from './zones'

export function WorldMiniMap() {
  const pos = useWorldStore((s) => s.playerPos)

  return (
    <div
      className="pointer-events-none absolute left-4 top-4 z-20 h-[150px] w-[150px] rounded-xl border border-[var(--border-subtle)] bg-black/60 p-1 backdrop-blur"
      aria-label="Mini map"
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} className="rounded-lg">
        {ZONES.map((z) => (
          <rect
            key={z.id}
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            fill={z.color}
            opacity={0.25}
            stroke="rgba(255,255,255,0.1)"
          />
        ))}
        <circle cx={pos.x} cy={pos.y} r={10} fill="#f0a500" opacity={0.9} />
      </svg>
      <span className="sr-only">
        Player at {Math.round(pos.x)}, {Math.round(pos.y)}
      </span>
    </div>
  )
}
