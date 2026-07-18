import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { TelegramMainButtonSync } from './components/TelegramMainButtonSync'
import { CartPage } from './pages/CartPage'
import { CatalogPage } from './pages/CatalogPage'
import { HomePage } from './pages/HomePage'
import { OrderFormPage } from './pages/OrderFormPage'
import { ProductPage } from './pages/ProductPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminPage } from './pages/AdminPage'
import { useSettingsStore } from './store/settingsStore'
import { useAuthStore } from './store/authStore'
import { useAppStore } from './store/appStore'
import { WebApp } from './lib/telegram'

function ThemeManager() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'light') {
      root.dataset.colorScheme = 'light'
      root.style.setProperty('--tg-theme-bg-color', '#faf8f5')
      root.style.setProperty('--tg-theme-text-color', '#0f172a')
      root.style.setProperty('--tg-theme-hint-color', '#64748b')
      root.style.setProperty('--tg-theme-secondary-bg-color', '#f1f5f9')
      root.style.setProperty('--tg-theme-button-color', '#0f172a')
      root.style.setProperty('--tg-theme-button-text-color', '#faf8f5')
      root.style.setProperty('--tg-theme-accent-text-color', '#b8944f')
      root.style.setProperty('--tg-theme-link-color', '#b8944f')
    } else if (theme === 'dark') {
      root.dataset.colorScheme = 'dark'
      root.style.setProperty('--tg-theme-bg-color', '#1c1c1e')
      root.style.setProperty('--tg-theme-text-color', '#f5f5f7')
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93')
      root.style.setProperty('--tg-theme-secondary-bg-color', '#2c2c2e')
      root.style.setProperty('--tg-theme-button-color', '#c9a962')
      root.style.setProperty('--tg-theme-button-text-color', '#1c1c1e')
      root.style.setProperty('--tg-theme-accent-text-color', '#c9a962')
      root.style.setProperty('--tg-theme-link-color', '#c9a962')
    } else {
      // auto - use Telegram theme
      try {
        const tgColorScheme = WebApp.colorScheme
        root.dataset.colorScheme = tgColorScheme ?? 'light'
      } catch {
        root.dataset.colorScheme = 'light'
      }
    }
  }, [theme])

  return null
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:categorySlug" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order" element={<OrderFormPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/:tab" element={<AdminPage />} />
      </Routes>
    </AnimatePresence>
  )
}

function AuthInit() {
  const initAuth = useAuthStore((s) => s.initAuth)
  const loadCategories = useAppStore((s) => s.loadCategories)
  useEffect(() => {
    void initAuth()
    void loadCategories()
  }, [initAuth, loadCategories])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeManager />
      <AuthInit />
      <TelegramMainButtonSync />
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
