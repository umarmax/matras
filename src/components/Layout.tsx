import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useSettingsStore } from '../store/settingsStore'
import { t } from '../lib/i18n'

interface LayoutProps {
  children: ReactNode
  hideNav?: boolean
}

export function Layout({ children, hideNav = false }: LayoutProps) {
  const cartCount = useCartStore((s) => s.totalItems())
  const lang = useSettingsStore((s) => s.language)

  const TABS = [
    { to: '/', label: t(lang, 'home'), icon: '🏠', end: true },
    { to: '/catalog', label: t(lang, 'catalog'), icon: '🛏', end: false },
    { to: '/cart', label: t(lang, 'cart'), icon: '🛒', end: false },
    { to: '/profile', label: t(lang, 'profile'), icon: '👤', end: false },
  ] as const

  return (
    <div className="app-shell mx-auto max-w-md">
      <main>{children}</main>

      {!hideNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t px-2 py-1"
          style={{
            paddingBottom: 'calc(var(--app-safe-bottom) + 6px)',
            background:
              'color-mix(in srgb, var(--tg-theme-bg-color) 95%, transparent)',
            borderColor:
              'color-mix(in srgb, var(--tg-theme-text-color) 8%, transparent)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center justify-around">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className="relative flex min-h-[48px] min-w-[60px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[10px] font-medium"
                style={({ isActive }) => ({
                  color: isActive
                    ? 'var(--tg-theme-accent-text-color)'
                    : 'var(--tg-theme-hint-color)',
                  background: isActive
                    ? 'color-mix(in srgb, var(--tg-theme-accent-text-color) 10%, transparent)'
                    : 'transparent',
                })}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.to === '/cart' && cartCount > 0 && (
                  <span
                    className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                    style={{
                      background: 'var(--tg-theme-accent-text-color)',
                      color: 'var(--tg-theme-bg-color)',
                    }}
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
