import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { PageHeaderWithBack } from '../components/PageHeader'
import { useSettingsStore } from '../store/settingsStore'
import { LANGUAGES, t } from '../lib/i18n'
import type { ThemeMode, Currency } from '../store/settingsStore'

const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: 'UZS', label: "So'm", symbol: "so'm" },
  { code: 'USD', label: 'Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
]

export function SettingsPage() {
  const navigate = useNavigate()
  const { language, theme, currency, setLanguage, setTheme, setCurrency } = useSettingsStore()
  const lang = language

  const THEMES: { code: ThemeMode; label: string; icon: string }[] = [
    { code: 'light', label: t(lang, 'theme_light'), icon: '☀️' },
    { code: 'dark', label: t(lang, 'theme_dark'), icon: '🌙' },
    { code: 'auto', label: t(lang, 'theme_auto'), icon: '🔄' },
  ]

  return (
    <Layout hideNav>
      <PageHeaderWithBack
        title={t(lang, 'settings')}
        onBack={() => navigate('/profile')}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 px-4 pb-8"
      >
        {/* Language */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--tg-theme-hint-color)' }}
          >
            {t(lang, 'language')}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all"
                style={{
                  background: language === l.code
                    ? 'var(--tg-theme-button-color)'
                    : 'var(--tg-theme-secondary-bg-color)',
                  color: language === l.code
                    ? 'var(--tg-theme-button-text-color)'
                    : 'var(--tg-theme-text-color)',
                  border: language === l.code
                    ? '2px solid var(--tg-theme-accent-text-color)'
                    : '2px solid transparent',
                }}
              >
                <span className="text-xl">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--tg-theme-hint-color)' }}
          >
            {t(lang, 'theme')}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((th) => (
              <button
                key={th.code}
                type="button"
                onClick={() => setTheme(th.code)}
                className="flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-xs font-medium"
                style={{
                  background: theme === th.code
                    ? 'var(--tg-theme-button-color)'
                    : 'var(--tg-theme-secondary-bg-color)',
                  color: theme === th.code
                    ? 'var(--tg-theme-button-text-color)'
                    : 'var(--tg-theme-text-color)',
                  border: theme === th.code
                    ? '2px solid var(--tg-theme-accent-text-color)'
                    : '2px solid transparent',
                }}
              >
                <span className="text-2xl">{th.icon}</span>
                <span>{th.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Currency */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--tg-theme-hint-color)' }}
          >
            {t(lang, 'currency')}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium"
                style={{
                  background: currency === c.code
                    ? 'var(--tg-theme-button-color)'
                    : 'var(--tg-theme-secondary-bg-color)',
                  color: currency === c.code
                    ? 'var(--tg-theme-button-text-color)'
                    : 'var(--tg-theme-text-color)',
                  border: currency === c.code
                    ? '2px solid var(--tg-theme-accent-text-color)'
                    : '2px solid transparent',
                }}
              >
                <span className="text-lg font-bold">{c.symbol}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </section>
      </motion.div>
    </Layout>
  )
}
