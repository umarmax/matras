import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { PageHeader } from '../components/PageHeader'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { WebApp } from '../lib/telegram'
import { useTelegramBackButton } from '../hooks/useTelegramBackButton'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { useSettingsStore, formatPrice } from '../store/settingsStore'
import { t } from '../lib/i18n'

const PHONE_REGEX = /^[\+]?[0-9\s\-\(\)]{9,20}$/

export function OrderFormPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const items = useCartStore((s) => s.items)
  const totalPrice = useCartStore((s) => s.totalPrice())
  const clearCart = useCartStore((s) => s.clearCart)
  const lang = useSettingsStore((s) => s.language)
  const currency = useSettingsStore((s) => s.currency)

  // Get Telegram user data directly from WebApp
  const tgUser = (() => {
    try { return WebApp.initDataUnsafe?.user } catch { return null }
  })()

  // Get real telegram ID (from auth store or directly from WebApp)
  const telegramUserId = user?.telegram_id && user.telegram_id !== 0
    ? user.telegram_id
    : tgUser?.id ?? undefined

  const telegramUsername = user?.username ?? tgUser?.username ?? undefined

  const savedName = (() => {
    try { return localStorage.getItem('matras-last-name') ?? '' } catch { return '' }
  })()
  const savedPhone = (() => {
    try { return localStorage.getItem('matras-last-phone') ?? '' } catch { return '' }
  })()

  const defaultName = user && user.id !== 'dev-user'
    ? [user.first_name, user.last_name].filter(Boolean).join(' ')
    : tgUser
      ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
      : savedName

  const [name, setName] = useState(defaultName || savedName)
  const [phone, setPhone] = useState(savedPhone)
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useTelegramBackButton(true, '/cart')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      try { WebApp.showAlert(t(lang, 'cart_is_empty')) } catch {}
      navigate('/cart')
      return
    }

    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = t(lang, 'val_name_required')
    else if (name.length > 100) newErrors.name = t(lang, 'val_name_long')
    if (!phone.trim()) newErrors.phone = t(lang, 'val_phone_required')
    else if (!PHONE_REGEX.test(phone)) newErrors.phone = t(lang, 'val_phone_invalid')
    else if (phone.length > 20) newErrors.phone = t(lang, 'val_phone_long')
    if (address && address.length > 500) newErrors.address = t(lang, 'val_address_long')
    if (comment && comment.length > 1000) newErrors.comment = t(lang, 'val_comment_long')

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      try { WebApp.showAlert(t(lang, 'val_fix_errors')) } catch {}
      return
    }

    setErrors({})
    setSubmitting(true)
    try { WebApp.MainButton.showProgress() } catch {}

    try {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          items: items.map((item) => ({
            product_id: item.productId,
            width: item.width,
            length: item.length,
            quantity: item.quantity,
          })),
          telegram_user_id: telegramUserId,
          telegram_username: telegramUsername,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          delivery_address: address.trim() || undefined,
          comment: comment.trim() || undefined,
        },
      })

      if (error) throw new Error(error.message || 'Failed to create order')
      const order = data?.order
      if (!order) throw new Error('Order creation failed')

      if (isSupabaseConfigured) {
        try {
          await supabase.functions.invoke('telegram-bot/notify-order', {
            body: {
              id: order.id,
              total: order.total,
              customer_name: order.customer_name,
              customer_phone: order.customer_phone,
              delivery_address: order.delivery_address,
              comment: order.comment,
              telegram_username: user?.username ?? null,
              items: order.items,
            },
          })
        } catch (notifyError) {
          console.warn('[OrderForm] Admin notification failed:', notifyError)
        }
      }

      // Save name/phone for next order
      try {
        localStorage.setItem('matras-last-name', name.trim())
        localStorage.setItem('matras-last-phone', phone.trim())
      } catch {}

      clearCart()
      try { WebApp.HapticFeedback.notificationOccurred('success') } catch {}
      try {
        WebApp.showAlert(
          `№${order.id.slice(0, 8)} — ${t(lang, 'order_success')}`,
          () => navigate('/profile'),
        )
      } catch {
        navigate('/profile')
      }
    } catch (error) {
      try { WebApp.HapticFeedback.notificationOccurred('error') } catch {}
      try {
        WebApp.showAlert(error instanceof Error ? error.message : 'Не удалось оформить заказ')
      } catch {
        alert(error instanceof Error ? error.message : 'Error')
      }
    } finally {
      setSubmitting(false)
      try { WebApp.MainButton.hideProgress() } catch {}
    }
  }

  if (items.length === 0) {
    return (
      <Layout hideNav>
        <PageHeader title={t(lang, 'order_title')} subtitle={t(lang, 'order_cart_empty')} />
        <section className="px-4 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <p className="mb-4 text-4xl">🛒</p>
            <p className="mb-4 text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
              {t(lang, 'order_cart_empty_text')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/catalog')}
              className="inline-flex min-h-[44px] items-center rounded-xl px-5 text-sm font-semibold"
              style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
            >
              {t(lang, 'go_to_catalog')}
            </button>
          </motion.div>
        </section>
      </Layout>
    )
  }

  const inputStyle = {
    background: 'var(--tg-theme-secondary-bg-color)',
    color: 'var(--tg-theme-text-color)',
  }

  return (
    <Layout hideNav>
      <PageHeader
        title={t(lang, 'order_title')}
        subtitle={`${items.length} поз. · ${formatPrice(totalPrice, currency)}`}
      />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 px-4 pb-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
              {t(lang, 'order_name_label')} <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }) }}
              placeholder={t(lang, 'order_name_placeholder')}
              required
              maxLength={100}
              className={`w-full rounded-xl border-0 px-4 py-3 text-base outline-none ${errors.name ? 'ring-2 ring-red-500' : ''}`}
              style={inputStyle}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
              {t(lang, 'order_phone_label')} <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors({ ...errors, phone: '' }) }}
              placeholder={t(lang, 'order_phone_placeholder')}
              required
              maxLength={20}
              className={`w-full rounded-xl border-0 px-4 py-3 text-base outline-none ${errors.phone ? 'ring-2 ring-red-500' : ''}`}
              style={inputStyle}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
              {t(lang, 'order_address_label')}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); if (errors.address) setErrors({ ...errors, address: '' }) }}
              placeholder={t(lang, 'order_address_placeholder')}
              maxLength={500}
              className={`w-full rounded-xl border-0 px-4 py-3 text-base outline-none ${errors.address ? 'ring-2 ring-red-500' : ''}`}
              style={inputStyle}
            />
            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
          </div>

          {/* Comment */}
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
              {t(lang, 'order_comment_label')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => { setComment(e.target.value); if (errors.comment) setErrors({ ...errors, comment: '' }) }}
              placeholder={t(lang, 'order_comment_placeholder')}
              rows={3}
              maxLength={1000}
              className={`w-full resize-none rounded-xl border-0 px-4 py-3 text-base outline-none ${errors.comment ? 'ring-2 ring-red-500' : ''}`}
              style={inputStyle}
            />
            {errors.comment && <p className="mt-1 text-xs text-red-500">{errors.comment}</p>}
          </div>

          {/* Total */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
            <p className="mb-1 text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
              {t(lang, 'order_total')}
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--tg-theme-text-color)' }}>
              {formatPrice(totalPrice, currency)}
            </p>
          </div>

          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={submitting ? {} : { scale: 0.98 }}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl text-base font-semibold disabled:opacity-50"
            style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
          >
            {submitting ? t(lang, 'order_submitting') : t(lang, 'order_submit')}
          </motion.button>

          <p className="text-center text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {t(lang, 'order_privacy')}
          </p>
        </form>
      </motion.section>
    </Layout>
  )
}
