import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { PageHeader } from '../components/PageHeader'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useAdminStore } from '../store/adminStore'
import { useSettingsStore, formatPrice } from '../store/settingsStore'
import { t } from '../lib/i18n'
import type { Order } from '../types'

export function ProfilePage() {
  const { initAuth } = useAuthStore()
  const adminRole = useAdminStore((s) => s.role)
  const checkAdmin = useAdminStore((s) => s.checkAdmin)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const lang = useSettingsStore((s) => s.language)
  const currency = useSettingsStore((s) => s.currency)
  const navigate = useNavigate()

  // Phone login state
  const [phoneInput, setPhoneInput] = useState('')
  const [loggedInPhone, setLoggedInPhone] = useState<string | null>(() => {
    try { return localStorage.getItem('matras-login-phone') } catch { return null }
  })
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  useEffect(() => {
    void initAuth()
    void checkAdmin()
  }, [initAuth, checkAdmin])

  // Load orders by phone
  useEffect(() => {
    if (!isSupabaseConfigured || !loggedInPhone) return
    let cancelled = false

    async function loadOrders() {
      setOrdersLoading(true)
      try {
        const cleaned = loggedInPhone!.replace(/[\s\-\(\)]/g, '')
        const { data } = await supabase
          .from('orders')
          .select('*')
          .or(`customer_phone.eq.${loggedInPhone},customer_phone.eq.${cleaned}`)
          .order('created_at', { ascending: false })
        if (!cancelled) setOrders((data ?? []) as Order[])
      } catch {
        if (!cancelled) setOrders([])
      } finally {
        if (!cancelled) setOrdersLoading(false)
      }
    }

    void loadOrders()
    return () => { cancelled = true }
  }, [loggedInPhone])

  const handlePhoneLogin = async () => {
    const cleaned = phoneInput.trim()
    if (!cleaned || cleaned.length < 9) {
      setPhoneError(t(lang, 'val_phone_invalid'))
      return
    }
    setPhoneLoading(true)
    setPhoneError('')
    try {
      try { localStorage.setItem('matras-login-phone', cleaned) } catch {}
      setLoggedInPhone(cleaned)
    } finally {
      setPhoneLoading(false)
    }
  }

  const handlePhoneLogout = () => {
    try { localStorage.removeItem('matras-login-phone') } catch {}
    setLoggedInPhone(null)
    setOrders([])
    setPhoneInput('')
  }

  const statusLabel: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    in_production: '🏭',
    ready: '📦',
    delivered: '🎉',
    completed: '🎉',
    cancelled: '❌',
  }

  return (
    <Layout>
      <PageHeader title={t(lang, 'profile_title')} subtitle={t(lang, 'profile_subtitle')} />

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

      {/* Admin Panel — rendered only for verified admins (backend-validated). */}
      {adminRole && (
        <section className="px-4 pb-4">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="flex min-h-[48px] w-full items-center justify-between rounded-2xl px-4 text-sm font-semibold"
            style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
          >
            <span>🛠 {t(lang, 'admin_panel')}</span>
            <span style={{ opacity: 0.7 }}>
              {adminRole === 'owner' ? t(lang, 'role_owner') : t(lang, 'role_manager')} ›
            </span>
          </button>
        </section>
      )}

      {/* Phone login to see orders */}
      {!loggedInPhone ? (
        <section className="px-4 pb-4">
          <div
            className="glass-card rounded-2xl p-4"
            style={{ borderColor: 'color-mix(in srgb, var(--tg-theme-accent-text-color) 20%, transparent)' }}
          >
            <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--tg-theme-text-color)' }}>
              📱 {t(lang, 'order_phone_label')}
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => { setPhoneInput(e.target.value); setPhoneError('') }}
                placeholder="+998 90 123 45 67"
                className="flex-1 rounded-xl border-0 px-3 py-2.5 text-sm outline-none"
                style={{ background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}
                onKeyDown={(e) => { if (e.key === 'Enter') void handlePhoneLogin() }}
              />
              <button
                type="button"
                onClick={() => void handlePhoneLogin()}
                disabled={phoneLoading}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
              >
                {phoneLoading ? '...' : '→'}
              </button>
            </div>
            {phoneError && <p className="mt-2 text-xs text-red-500">{phoneError}</p>}
          </div>
        </section>
      ) : (
        <section className="px-4 pb-2">
          <div className="flex items-center justify-between rounded-2xl px-4 py-2"
            style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
            <span className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
              📱 {loggedInPhone}
            </span>
            <button
              type="button"
              onClick={handlePhoneLogout}
              className="text-xs"
              style={{ color: 'var(--tg-theme-destructive-text-color)' }}
            >
              ✕
            </button>
          </div>
        </section>
      )}

      {/* Orders */}
      <section className="px-4 py-2 pb-6">
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
    </Layout>
  )
}
