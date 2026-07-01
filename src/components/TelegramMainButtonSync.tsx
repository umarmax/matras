import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { WebApp } from '../lib/telegram'
import { useCartStore } from '../store/cartStore'
import { useSettingsStore, formatPrice } from '../store/settingsStore'
import { t } from '../lib/i18n'

export function TelegramMainButtonSync() {
  const navigate = useNavigate()
  const location = useLocation()
  const items = useCartStore((s) => s.items)
  const totalPrice = useCartStore((s) => s.totalPrice())
  const lang = useSettingsStore((s) => s.language)
  const currency = useSettingsStore((s) => s.currency)

  const handleCheckout = useCallback(() => {
    if (items.length === 0) return
    try { WebApp.HapticFeedback.impactOccurred('medium') } catch {}
    navigate('/order')
  }, [items.length, navigate])

  useEffect(() => {
    try {
      if (location.pathname === '/order') {
        WebApp.MainButton.hide()
        return
      }

      if (items.length === 0) {
        WebApp.MainButton.hide()
        return
      }

      const btnText = `${t(lang, 'checkout_btn')} · ${formatPrice(totalPrice, currency)}`
      WebApp.MainButton.setText(btnText)
      WebApp.MainButton.color = WebApp.themeParams.button_color ?? '#0f172a'
      WebApp.MainButton.textColor = WebApp.themeParams.button_text_color ?? '#faf8f5'
      WebApp.MainButton.show()
      WebApp.MainButton.onClick(handleCheckout)

      return () => {
        try { WebApp.MainButton.offClick(handleCheckout) } catch {}
      }
    } catch (e) {
      console.warn('[TelegramMainButtonSync] error:', e)
    }
  }, [items.length, totalPrice, handleCheckout, location.pathname, lang, currency])

  return null
}
