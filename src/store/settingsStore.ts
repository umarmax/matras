import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../lib/i18n'

export type ThemeMode = 'auto' | 'light' | 'dark'
export type Currency = 'UZS' | 'RUB' | 'USD' | 'EUR'

// Exchange rates relative to UZS (approximate)
export const EXCHANGE_RATES: Record<Currency, number> = {
  UZS: 1,
  RUB: 0.0083,   // 1 UZS ≈ 0.0083 RUB
  USD: 0.000079, // 1 UZS ≈ 0.000079 USD
  EUR: 0.000073, // 1 UZS ≈ 0.000073 EUR
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  UZS: "so'm",
  RUB: '₽',
  USD: '$',
  EUR: '€',
}

// Product prices are stored in UZS in the database
export function convertPrice(priceInUZS: number, currency: Currency): number {
  return Math.round(priceInUZS * EXCHANGE_RATES[currency])
}

export function formatPrice(priceInUZS: number, currency: Currency): string {
  const converted = convertPrice(priceInUZS, currency)
  const symbol = CURRENCY_SYMBOLS[currency]
  
  if (currency === 'UZS') {
    return `${converted.toLocaleString('ru-RU')} ${symbol}`
  }
  if (currency === 'USD' || currency === 'EUR') {
    return `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
  }
  return `${converted.toLocaleString('ru-RU')} ${symbol}`
}

interface SettingsState {
  language: Language
  theme: ThemeMode
  currency: Currency
  setLanguage: (lang: Language) => void
  setTheme: (theme: ThemeMode) => void
  setCurrency: (currency: Currency) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'uz',
      theme: 'auto',
      currency: 'UZS',
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
    }),
    { name: 'matras-settings' },
  ),
)
