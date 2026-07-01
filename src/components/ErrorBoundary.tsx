import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

// Read persisted language from Zustand localStorage key (no store access in class component)
function getStoredLang(): string {
  try {
    const raw = localStorage.getItem('matras-settings')
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { language?: string } }
      return parsed?.state?.language ?? 'ru'
    }
  } catch {}
  return 'ru'
}

const ERROR_STRINGS: Record<string, { title: string; subtitle: string; reload: string }> = {
  uz: { title: 'Nimadir noto\'g\'ri ketdi', subtitle: 'Ilovani qayta ishga tushirishga harakat qiling', reload: 'Qayta yuklash' },
  ru: { title: 'Что-то пошло не так', subtitle: 'Попробуйте перезапустить приложение', reload: 'Перезагрузить' },
  en: { title: 'Something went wrong', subtitle: 'Try restarting the app', reload: 'Reload' },
  kz: { title: 'Бірдеңе дұрыс болмады', subtitle: 'Қолданбаны қайта іске қосып көріңіз', reload: 'Қайта жүктеу' },
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
      const lang = getStoredLang()
      const strings = ERROR_STRINGS[lang] ?? ERROR_STRINGS.ru

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
            {strings.title}
          </h2>
          <p style={{ fontSize: '14px', opacity: 0.6, marginBottom: '24px' }}>
            {strings.subtitle}
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
            {strings.reload}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
