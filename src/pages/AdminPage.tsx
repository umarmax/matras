import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { PageHeaderWithBack } from '../components/PageHeader'
import { useTelegramBackButton } from '../hooks/useTelegramBackButton'
import { useAdminStore } from '../store/adminStore'
import { useSettingsStore, formatPrice } from '../store/settingsStore'
import { callAdmin } from '../lib/adminApi'
import { t, type TranslationKey } from '../lib/i18n'
import type { MattressCategory, Order, Admin, OrderStatus } from '../types'

type Tab = 'dashboard' | 'orders' | 'categories' | 'managers'

const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'in_production',
  'ready',
  'delivered',
  'cancelled',
]

const STATUS_KEY: Record<string, TranslationKey> = {
  pending: 'status_pending',
  confirmed: 'status_confirmed',
  in_production: 'status_in_production',
  ready: 'status_ready',
  delivered: 'status_delivered',
  cancelled: 'status_cancelled',
  completed: 'status_delivered',
}

export function AdminPage() {
  const navigate = useNavigate()
  const { tab } = useParams<{ tab?: Tab }>()
  const active: Tab = (tab as Tab) ?? 'dashboard'
  const role = useAdminStore((s) => s.role)
  const checked = useAdminStore((s) => s.checked)
  const checkAdmin = useAdminStore((s) => s.checkAdmin)
  const lang = useSettingsStore((s) => s.language)

  useTelegramBackButton(true, '/profile')

  useEffect(() => {
    void checkAdmin()
  }, [checkAdmin])

  // Guard: non-admins never see anything here (also enforced server-side).
  if (checked && !role) {
    return (
      <Layout hideNav>
        <PageHeaderWithBack title={t(lang, 'admin_panel')} onBack={() => navigate('/profile')} />
        <p className="px-4 py-10 text-center text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
          {t(lang, 'no_access')}
        </p>
      </Layout>
    )
  }

  const isOwner = role === 'owner'
  const tabs: { id: Tab; key: TranslationKey; ownerOnly?: boolean }[] = [
    { id: 'dashboard', key: 'admin_dashboard' },
    { id: 'orders', key: 'admin_orders' },
    { id: 'categories', key: 'admin_categories', ownerOnly: true },
    { id: 'managers', key: 'admin_managers', ownerOnly: true },
  ]

  return (
    <Layout hideNav>
      <PageHeaderWithBack title={t(lang, 'admin_panel')} onBack={() => navigate('/profile')} />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {tabs
          .filter((tb) => !tb.ownerOnly || isOwner)
          .map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => navigate(tb.id === 'dashboard' ? '/admin' : `/admin/${tb.id}`)}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium"
              style={{
                background: active === tb.id ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-secondary-bg-color)',
                color: active === tb.id ? 'var(--tg-theme-button-text-color)' : 'var(--tg-theme-text-color)',
              }}
            >
              {t(lang, tb.key)}
            </button>
          ))}
      </div>

      {active === 'dashboard' && <DashboardTab lang={lang} onOpenOrders={() => navigate('/admin/orders')} />}
      {active === 'orders' && <OrdersTab lang={lang} />}
      {active === 'categories' && isOwner && <CategoriesTab lang={lang} />}
      {active === 'managers' && isOwner && <ManagersTab lang={lang} />}
    </Layout>
  )
}

// ── Dashboard ──
interface Stats {
  today: number
  week: number
  month: number
  revenue: number
  avg_order_value: number
}

function DashboardTab({ lang, onOpenOrders }: { lang: Parameters<typeof t>[0]; onOpenOrders: () => void }) {
  const currency = useSettingsStore((s) => s.currency)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [s, o] = await Promise.all([
          callAdmin<Stats>('stats'),
          callAdmin<{ orders: Order[] }>('list_orders', {}),
        ])
        if (!cancelled) {
          setStats(s)
          setRecent(o.orders.slice(0, 5))
        }
      } catch {
        /* ignore — guard handles unauthorized */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const cards: { key: TranslationKey; value: string }[] = stats
    ? [
        { key: 'stat_today', value: String(stats.today) },
        { key: 'stat_week', value: String(stats.week) },
        { key: 'stat_month', value: String(stats.month) },
        { key: 'stat_revenue', value: formatPrice(stats.revenue, currency) },
        { key: 'stat_aov', value: formatPrice(stats.avg_order_value, currency) },
      ]
    : []

  return (
    <section className="px-4 pb-6">
      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl" style={{ background: 'var(--tg-theme-secondary-bg-color)' }} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((c) => (
              <div key={c.key} className="rounded-2xl p-4" style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
                <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>{t(lang, c.key)}</p>
                <p className="mt-1 text-lg font-bold" style={{ color: 'var(--tg-theme-text-color)' }}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: 'var(--tg-theme-text-color)' }}>{t(lang, 'recent_orders')}</h2>
            <button type="button" onClick={onOpenOrders} className="text-sm" style={{ color: 'var(--tg-theme-link-color)' }}>
              {t(lang, 'admin_orders')} ›
            </button>
          </div>
          <div className="space-y-2">
            {recent.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>#{o.id.slice(0, 8)} · {o.customer_name}</p>
                  <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>{t(lang, STATUS_KEY[o.status] ?? 'status_pending')}</p>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--tg-theme-accent-text-color)' }}>{formatPrice(o.total, currency)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// ── Orders ──
function OrdersTab({ lang }: { lang: Parameters<typeof t>[0] }) {
  const currency = useSettingsStore((s) => s.currency)
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const { orders } = await callAdmin<{ orders: Order[] }>('list_orders', { status: status || undefined, search: search || undefined })
      setOrders(orders)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() /* eslint-disable-next-line */ }, [status])

  async function changeStatus(orderId: string, newStatus: string) {
    try {
      const { order } = await callAdmin<{ order: Order }>('update_order_status', { order_id: orderId, status: newStatus })
      setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)))
    } catch { /* noop */ }
  }

  return (
    <section className="px-4 pb-6">
      {/* Search */}
      <div className="mb-3 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void load() }}
          placeholder={t(lang, 'search')}
          className="flex-1 rounded-xl border-0 px-3 py-2.5 text-sm outline-none"
          style={{ background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}
        />
        <button type="button" onClick={() => void load()} className="rounded-xl px-4 text-sm font-semibold" style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}>→</button>
      </div>

      {/* Status filter */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {['', ...STATUS_FLOW].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatus(s)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{
              background: status === s ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-secondary-bg-color)',
              color: status === s ? 'var(--tg-theme-button-text-color)' : 'var(--tg-theme-text-color)',
            }}
          >
            {s ? t(lang, STATUS_KEY[s]) : t(lang, 'filter_all')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-20 animate-pulse rounded-2xl" style={{ background: 'var(--tg-theme-secondary-bg-color)' }} />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl p-4" style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--tg-theme-text-color)' }}>#{o.id.slice(0, 8)}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--tg-theme-accent-text-color)' }}>{formatPrice(o.total, currency)}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                {o.customer_name} · {o.customer_phone}
              </p>
              {o.delivery_address && (
                <p className="mt-0.5 text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>📍 {o.delivery_address}</p>
              )}
              <p className="mt-0.5 text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                {new Date(o.created_at).toLocaleString('ru-RU')}
              </p>
              <select
                value={STATUS_FLOW.includes(o.status) ? o.status : 'pending'}
                onChange={(e) => void changeStatus(o.id, e.target.value)}
                className="mt-2 w-full rounded-xl border-0 px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--tg-theme-bg-color)', color: 'var(--tg-theme-text-color)' }}
              >
                {STATUS_FLOW.map((s) => (
                  <option key={s} value={s}>{t(lang, STATUS_KEY[s])}</option>
                ))}
              </select>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>{t(lang, 'no_orders')}</p>
          )}
        </div>
      )}
    </section>
  )
}

// ── Categories (owner only) ──
function CategoriesTab({ lang }: { lang: Parameters<typeof t>[0] }) {
  const [cats, setCats] = useState<MattressCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MattressCategory | null>(null)

  async function load() {
    setLoading(true)
    try {
      const { categories } = await callAdmin<{ categories: MattressCategory[] }>('list_categories')
      setCats(categories)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [])

  async function save(cat: MattressCategory) {
    await callAdmin('upsert_category', cat as unknown as Record<string, unknown>)
    setEditing(null)
    await load()
  }

  if (loading) {
    return <div className="mx-4 mb-6 h-24 animate-pulse rounded-2xl" style={{ background: 'var(--tg-theme-secondary-bg-color)' }} />
  }

  if (editing) {
    return <CategoryForm lang={lang} category={editing} onSave={save} onCancel={() => setEditing(null)} />
  }

  return (
    <section className="px-4 pb-6 space-y-3">
      {cats.map((c) => (
        <div key={c.id} className="rounded-2xl p-4" style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--tg-theme-text-color)' }}>
                {c.name} {!c.active && '⛔'}
              </p>
              <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                {t(lang, 'cat_price_per_m2')}: {c.price_per_m2.toLocaleString('ru-RU')} · {t(lang, 'cat_min_price')}: {(c.minimum_price ?? 0).toLocaleString('ru-RU')}
              </p>
            </div>
            <button type="button" onClick={() => setEditing(c)} className="rounded-xl px-3 py-1.5 text-xs font-semibold" style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}>
              {t(lang, 'edit')}
            </button>
          </div>
        </div>
      ))}
    </section>
  )
}

function CategoryForm({
  lang, category, onSave, onCancel,
}: {
  lang: Parameters<typeof t>[0]
  category: MattressCategory
  onSave: (c: MattressCategory) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<MattressCategory>(category)
  const [saving, setSaving] = useState(false)
  const inputStyle = { background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }

  return (
    <section className="px-4 pb-6 space-y-4">
      <Field label={t(lang, 'manager_name')}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border-0 px-4 py-3 text-sm outline-none" style={inputStyle} />
      </Field>
      <Field label={t(lang, 'order_comment_label')}>
        <textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full resize-none rounded-xl border-0 px-4 py-3 text-sm outline-none" style={inputStyle} />
      </Field>
      <Field label="Image URL">
        <input value={form.image_url ?? ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full rounded-xl border-0 px-4 py-3 text-sm outline-none" style={inputStyle} />
      </Field>
      <Field label={`${t(lang, 'cat_price_per_m2')} (UZS)`}>
        <input type="number" inputMode="numeric" value={form.price_per_m2} onChange={(e) => setForm({ ...form, price_per_m2: Number(e.target.value) })} className="w-full rounded-xl border-0 px-4 py-3 text-sm outline-none" style={inputStyle} />
      </Field>
      <Field label={`${t(lang, 'cat_min_price')} (UZS)`}>
        <input type="number" inputMode="numeric" value={form.minimum_price ?? ''} onChange={(e) => setForm({ ...form, minimum_price: e.target.value === '' ? null : Number(e.target.value) })} className="w-full rounded-xl border-0 px-4 py-3 text-sm outline-none" style={inputStyle} />
      </Field>
      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--tg-theme-text-color)' }}>
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        {t(lang, 'cat_active')}
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={async () => { setSaving(true); try { await onSave(form) } finally { setSaving(false) } }}
          className="flex-1 rounded-2xl py-3 text-sm font-semibold disabled:opacity-50"
          style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
        >
          {saving ? t(lang, 'loading') : t(lang, 'save')}
        </button>
        <button type="button" onClick={onCancel} className="rounded-2xl px-5 py-3 text-sm font-semibold" style={{ background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}>
          {t(lang, 'cancel')}
        </button>
      </div>
    </section>
  )
}

// ── Managers (owner only) ──
function ManagersTab({ lang }: { lang: Parameters<typeof t>[0] }) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [tid, setTid] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'owner' | 'sales_manager'>('sales_manager')

  async function load() {
    setLoading(true)
    try {
      const { admins } = await callAdmin<{ admins: Admin[] }>('list_admins')
      setAdmins(admins)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [])

  async function add() {
    const idNum = Number(tid)
    if (!idNum) return
    await callAdmin('upsert_admin', { telegram_user_id: idNum, name: name || null, role, active: true })
    setTid(''); setName('')
    await load()
  }
  async function remove(id: number) {
    await callAdmin('delete_admin', { telegram_user_id: id })
    await load()
  }

  return (
    <section className="px-4 pb-6 space-y-4">
      <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
        <input value={tid} onChange={(e) => setTid(e.target.value)} placeholder={t(lang, 'manager_tid')} inputMode="numeric" className="w-full rounded-xl border-0 px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--tg-theme-bg-color)', color: 'var(--tg-theme-text-color)' }} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(lang, 'manager_name')} className="w-full rounded-xl border-0 px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--tg-theme-bg-color)', color: 'var(--tg-theme-text-color)' }} />
        <select value={role} onChange={(e) => setRole(e.target.value as 'owner' | 'sales_manager')} className="w-full rounded-xl border-0 px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--tg-theme-bg-color)', color: 'var(--tg-theme-text-color)' }}>
          <option value="sales_manager">{t(lang, 'role_manager')}</option>
          <option value="owner">{t(lang, 'role_owner')}</option>
        </select>
        <button type="button" onClick={() => void add()} className="w-full rounded-xl py-2.5 text-sm font-semibold" style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}>
          {t(lang, 'add')}
        </button>
      </div>

      {loading ? (
        <div className="h-16 animate-pulse rounded-2xl" style={{ background: 'var(--tg-theme-secondary-bg-color)' }} />
      ) : (
        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.telegram_user_id} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
                  {a.name || a.telegram_user_id} {!a.active && '⛔'}
                </p>
                <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  {a.telegram_user_id} · {a.role === 'owner' ? t(lang, 'role_owner') : t(lang, 'role_manager')}
                </p>
              </div>
              <button type="button" onClick={() => void remove(a.telegram_user_id)} className="text-xs font-medium" style={{ color: 'var(--tg-theme-destructive-text-color)' }}>
                {t(lang, 'remove')}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>{label}</label>
      {children}
    </div>
  )
}
