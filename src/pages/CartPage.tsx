import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { PageHeader } from '../components/PageHeader'
import { WebApp } from '../lib/telegram'
import { useCartStore, itemUnitPrice } from '../store/cartStore'
import { useSettingsStore, formatPrice } from '../store/settingsStore'
import { t } from '../lib/i18n'

export function CartPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const totalPrice = useCartStore((s) => s.totalPrice())
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const lang = useSettingsStore((s) => s.language)
  const currency = useSettingsStore((s) => s.currency)

  return (
    <Layout>
      <PageHeader
        title={t(lang, 'cart_title')}
        subtitle={
          items.length > 0
            ? `${items.length} ${t(lang, 'items_count')} · ${formatPrice(totalPrice, currency)}`
            : t(lang, 'cart_empty')
        }
      />

      {items.length === 0 ? (
        <section className="px-4 pb-6">
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
            <p className="mb-2 text-4xl">🛒</p>
            <p className="mb-4 text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
              {t(lang, 'cart_empty_text')}
            </p>
            <Link
              to="/catalog"
              className="inline-flex min-h-[44px] items-center rounded-xl px-5 text-sm font-semibold"
              style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
            >
              {t(lang, 'go_to_catalog')}
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-3 px-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass-card rounded-2xl p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/product/${item.productId}`}
                      className="text-sm font-semibold"
                      style={{ color: 'var(--tg-theme-text-color)' }}
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                      {item.width}×{item.length} см
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold" style={{ color: 'var(--tg-theme-accent-text-color)' }}>
                    {formatPrice(itemUnitPrice(item) * item.quantity, currency)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateQuantity(item.id, item.quantity - 1)
                        try { WebApp.HapticFeedback.selectionChanged() } catch {}
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
                      style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
                    >
                      −
                    </button>
                    <span className="min-w-[24px] text-center text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateQuantity(item.id, item.quantity + 1)
                        try { WebApp.HapticFeedback.selectionChanged() } catch {}
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
                      style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-xs font-medium"
                    style={{ color: 'var(--tg-theme-destructive-text-color)' }}
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </section>

          <section className="px-4 py-6">
            <div
              className="glass-card rounded-2xl p-4"
              style={{ borderColor: 'color-mix(in srgb, var(--tg-theme-accent-text-color) 20%, transparent)' }}
            >
              <div className="mb-2 flex justify-between text-sm">
                <span style={{ color: 'var(--tg-theme-hint-color)' }}>{t(lang, 'free_measure')}</span>
                <span style={{ color: 'var(--tg-theme-accent-text-color)' }}>0</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span style={{ color: 'var(--tg-theme-text-color)' }}>{t(lang, 'total')}</span>
                <span style={{ color: 'var(--tg-theme-text-color)' }}>{formatPrice(totalPrice, currency)}</span>
              </div>
            </div>
            {/* Visible checkout button - fallback for Telegram MainButton */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                try { WebApp.HapticFeedback.impactOccurred('medium') } catch {}
                navigate('/order')
              }}
              className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-2xl text-base font-semibold"
              style={{
                background: 'var(--tg-theme-button-color)',
                color: 'var(--tg-theme-button-text-color)',
              }}
            >
              {t(lang, 'checkout_btn')} · {formatPrice(totalPrice, currency)}
            </motion.button>
          </section>
        </>
      )}
    </Layout>
  )
}
