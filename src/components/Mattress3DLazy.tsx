import { Component, Suspense, lazy, type ReactNode } from 'react'
import type { Mattress3DProps } from './Mattress3D'

const Mattress3DComponent = lazy(() =>
  import('./Mattress3D').then((module) => ({ default: module.Mattress3D })),
)

function Mattress3DFallback({ className = '' }: { className?: string }) {
  return (
    <div
      className={`mattress-canvas flex items-center justify-center ${className}`}
      style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
        style={{
          borderTopColor: 'var(--tg-theme-accent-text-color)',
          borderRightColor: 'var(--tg-theme-accent-text-color)',
        }}
      />
    </div>
  )
}

function Mattress3DPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`mattress-canvas flex items-center justify-center ${className}`}
      style={{
        background: 'var(--tg-theme-secondary-bg-color)',
        borderRadius: '16px',
      }}
    >
      <div style={{ textAlign: 'center', opacity: 0.5 }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🛏</div>
        <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
          Матрас
        </div>
      </div>
    </div>
  )
}

// Error boundary specifically for 3D canvas crashes
class Canvas3DErrorBoundary extends Component<
  { children: ReactNode; className?: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; className?: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn('[Mattress3D] WebGL/3D error, showing fallback:', error.message)
  }

  render() {
    if (this.state.hasError) {
      return <Mattress3DPlaceholder className={this.props.className} />
    }
    return this.props.children
  }
}

function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

export function Mattress3DLazy(props: Mattress3DProps) {
  // Skip 3D if WebGL not supported (some Telegram WebViews)
  if (!isWebGLSupported()) {
    return <Mattress3DPlaceholder className={props.className} />
  }

  return (
    <Canvas3DErrorBoundary className={props.className}>
      <Suspense fallback={<Mattress3DFallback className={props.className} />}>
        <Mattress3DComponent {...props} />
      </Suspense>
    </Canvas3DErrorBoundary>
  )
}

export default Mattress3DLazy
