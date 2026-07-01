import WebApp from '@twa-dev/sdk'

const THEME_VARS: Record<string, keyof typeof WebApp.themeParams> = {
  '--tg-theme-bg-color': 'bg_color',
  '--tg-theme-text-color': 'text_color',
  '--tg-theme-hint-color': 'hint_color',
  '--tg-theme-link-color': 'link_color',
  '--tg-theme-button-color': 'button_color',
  '--tg-theme-button-text-color': 'button_text_color',
  '--tg-theme-secondary-bg-color': 'secondary_bg_color',
  '--tg-theme-accent-text-color': 'accent_text_color',
  '--tg-theme-destructive-text-color': 'destructive_text_color',
}

function applyTelegramTheme() {
  try {
    const root = document.documentElement

    for (const [cssVar, paramKey] of Object.entries(THEME_VARS)) {
      const value = WebApp.themeParams[paramKey]
      if (value) {
        root.style.setProperty(cssVar, value)
      }
    }

    root.dataset.colorScheme = WebApp.colorScheme ?? 'light'
  } catch (e) {
    console.warn('[Telegram] applyTelegramTheme error:', e)
  }
}

export function initTelegramApp() {
  try {
    WebApp.ready()
  } catch (e) {
    console.warn('[Telegram] WebApp.ready() error:', e)
  }

  try {
    WebApp.expand()
  } catch (e) {
    console.warn('[Telegram] WebApp.expand() error:', e)
  }

  applyTelegramTheme()

  try {
    WebApp.onEvent('themeChanged', applyTelegramTheme)
  } catch (e) {
    console.warn('[Telegram] onEvent error:', e)
  }

  return WebApp
}

export { WebApp }
