import type { ComponentType } from 'react'
import { Suspense, lazy } from 'react'

type SafeLottieProps = {
  animationData: object
  loop?: boolean
  className?: string
}

const LazyLottie = lazy(async () => {
  const mod = await import('lottie-react')
  const candidate = mod as unknown as {
    default?: { default?: ComponentType<SafeLottieProps> } | ComponentType<SafeLottieProps>
  }
  const resolved =
    (candidate.default as { default?: ComponentType<SafeLottieProps> })?.default ??
    (candidate.default as ComponentType<SafeLottieProps>)
  return { default: resolved }
})

export function SafeLottie({ animationData, loop = true, className }: SafeLottieProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center text-xs text-[var(--text-muted)]">
          Loading animation…
        </div>
      }
    >
      <LazyLottie animationData={animationData} loop={loop} className={className} />
    </Suspense>
  )
}
