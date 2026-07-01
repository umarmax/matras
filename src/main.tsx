import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTelegramApp } from './lib/telegram'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

try {
  initTelegramApp()
} catch (e) {
  console.warn('[main] initTelegramApp failed:', e)
}

// Remove initial loader once JS runs
const loader = document.getElementById('initial-loader')
if (loader) loader.style.display = 'none'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
