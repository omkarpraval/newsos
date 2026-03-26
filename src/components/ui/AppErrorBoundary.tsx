import type { ReactNode } from 'react'
import { Component } from 'react'

type State = { hasError: boolean; message: string }

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    // Keep logs in dev console for debugging.
    // eslint-disable-next-line no-console
    console.error('App crashed in boundary:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-6">
          <div className="max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Something went wrong</h2>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              We hit an unexpected error. Refresh this page to continue.
            </p>
            {this.state.message && (
              <p className="mt-3 rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-[var(--text-muted)]">
                {this.state.message}
              </p>
            )}
            <button
              type="button"
              className="mt-5 rounded-xl bg-[var(--accent-gold)] px-4 py-2 text-sm font-medium text-black"
              onClick={() => window.location.reload()}
            >
              Reload app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
