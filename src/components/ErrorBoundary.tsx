import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Caught error:', error.message, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'var(--tg-theme-bg-color, #faf8f5)',
            color: 'var(--tg-theme-text-color, #0f172a)',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Что-то пошло не так / Something went wrong
          </h2>
          <p style={{ fontSize: '14px', opacity: 0.6, marginBottom: '24px' }}>
            Попробуйте перезапустить / Try restarting
          </p>
          {this.state.error && (
            <p style={{ fontSize: '12px', opacity: 0.4, marginBottom: '16px', maxWidth: '300px', wordBreak: 'break-word' }}>
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--tg-theme-button-color, #0f172a)',
              color: 'var(--tg-theme-button-text-color, #fff)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Перезагрузить / Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
