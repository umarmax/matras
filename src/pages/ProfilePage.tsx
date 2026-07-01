import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { PageHeader } from '../components/PageHeader'
import { fetchUserOrders, isSupabaseConfigured } from '../lib/supabase'
import { WebApp } from '../lib/telegram'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore, formatPrice } from '../store/settingsStore'
import { t } from '../lib/i18n'
import type { Order } from '../types'

const CONTACT_PHONE = '+998909583231'
const CONTACT_BOT = 'wellsleepuz'

export function ProfilePage() {
  const { user, loading, initAuth, logout } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const lang = useSettingsStore((s) => s.language)
  const currency = useSettingsStore((s) => s.currency)
  const navigate = useNavigate()

  useEffect(() => {
    void initAuth()
  }, [initAuth])

  // Get display name from Telegram user data
  const tgUser = (() => {
    try { return WebApp.initDataUnsafe?.user } catch { return null }
  })()

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false

    async function loadOrders() {
      setOrdersLoading(true)
      try {
        // Get telegram ID from WebApp or user profile
        const tgId = user?.telegram_id ?? tgUser?.id
        const userId = user?.id ?? 'dev-user'
        const data = await fetchUserOrders(userId, tgId)
        if (!cancelled) setOrders(data)
      } catch {
        if (!cancelled) setOrders([])
      } finally {
        if (!cancelled) setOrdersLoading(false)
      }
    }

    void loadOrders()
    return () => { cancelled = true }
  }, [user, tgUser])

  // Build display name from all available sources
  const displayName = (() => {
    // From auth store (includes Telegram data via buildDevProfile)
    if (user?.first_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ')
    }
    // Direct from WebApp
    if (tgUser?.first_name) {
      return [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
    }
    return null
  })()

  const username = user?.username ?? tgUser?.username ?? null
  const photoUrl = user?.photo_url ?? tgUser?.photo_url ?? null

  const statusLabel: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    completed: '🎉',
    cancelled: '❌',
  }

  return (
    <Layout>
      <PageHeader title={t(lang, 'profile_title')} subtitle={t(lang, 'profile_subtitle')} />

      {/* User card */}
      <section className="px-4 pb-4">
        <div className="glass-card flex items-center gap-4 rounded-2xl p-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl overflow-hidden"
            style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="h-5 w-32 animate-pulse rounded" style={{ background: 'var(--tg-theme-secondary-bg-color)' }} />
            ) : (
              <>
                <p className="truncate font-semibold" style={{ color: 'var(--tg-theme-text-color)' }}>
                  {displayName ?? 'Guest'}
                </p>
                {username && (
                  <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
                    @{username}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Settings button */}
      <section className="px-4 pb-4">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex min-h-[48px] w-full items-center justify-between rounded-2xl px-4 text-sm font-medium"
          style={{ background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}
        >
          <span>⚙️ {t(lang, 'settings')}</span>
          <span style={{ color: 'var(--tg-theme-hint-color)' }}>›</span>
        </button>
      </section>

      {/* Orders */}
      <section className="px-4 py-2">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: 'var(--tg-theme-text-color)' }}>
          {t(lang, 'my_orders')}
        </h2>

        {ordersLoading && (
          <div className="h-20 animate-pulse rounded-2xl" style={{ background: 'var(--tg-theme-secondary-bg-color)' }} />
        )}

        {!ordersLoading && orders.length === 0 && (
          <div
            className="rounded-2xl p-5 text-center text-sm"
            style={{ background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-hint-color)' }}
          >
            {t(lang, 'no_orders')}{' '}
            <Link to="/catalog" style={{ color: 'var(--tg-theme-link-color)' }}>
              {t(lang, 'choose_mattress')}
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
                  #{order.id.slice(0, 8)}
                </span>
                <span className="text-sm">
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>
              <p className="text-base font-semibold" style={{ color: 'var(--tg-theme-accent-text-color)' }}>
                {formatPrice(order.total, currency)}
              </p>
              {order.customer_name && (
                <p className="mt-1 text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  {order.customer_name} · {order.customer_phone}
                </p>
              )}
              <p className="mt-1 text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                {new Date(order.created_at).toLocaleDateString('ru-RU')}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact + Logout */}
      <section className="px-4 py-4 pb-6">
        {/* Contact us button - calls phone */}
        <a
          href={`tel:${CONTACT_PHONE}`}
          className="mb-2 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold"
          style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
        >
          📞 {t(lang, 'contact_us')} · {CONTACT_PHONE}
        </a>

        {/* Telegram contact button */}
        <button
          type="button"
          onClick={() => {
            try { WebApp.openTelegramLink(`https://t.me/${CONTACT_BOT}`) } catch {
              window.open(`https://t.me/${CONTACT_BOT}`, '_blank')
            }
          }}
          className="mb-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium"
          style={{ background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}
        >
          ✈️ @{CONTACT_BOT}
        </button>

        {user && user.id !== 'dev-user' && (
          <button
            type="button"
            onClick={() => void logout()}
            className="flex min-h-[44px] w-full items-center justify-center rounded-2xl text-sm font-medium"
            style={{ color: 'var(--tg-theme-destructive-text-color)' }}
          >
            {t(lang, 'logout')}
          </button>
        )}
      </section>
    </Layout>
  )
}
