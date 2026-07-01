import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { WebApp } from '../lib/telegram'

export function useTelegramBackButton(active: boolean, fallbackPath = '/') {
  const navigate = useNavigate()

  useEffect(() => {
    try {
      if (!active) {
        WebApp.BackButton.hide()
        return
      }

      const handleBack = () => {
        if (window.history.length > 1) {
          navigate(-1)
        } else {
          navigate(fallbackPath)
        }
      }

      WebApp.BackButton.show()
      WebApp.BackButton.onClick(handleBack)

      return () => {
        try {
          WebApp.BackButton.offClick(handleBack)
          WebApp.BackButton.hide()
        } catch {}
      }
    } catch (e) {
      console.warn('[useTelegramBackButton] error:', e)
    }
  }, [active, navigate, fallbackPath])
}
