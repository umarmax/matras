import { describe, expect, it } from 'vitest'
import { convertPrice, formatPrice } from './settingsStore'

describe('currency formatting (UZS-based, no RUB)', () => {
  it('formats UZS with the som suffix', () => {
    const out = formatPrice(3_200_000, 'UZS')
    expect(out).toContain("so'm")
    // Grouped thousands (ru-RU uses a non-breaking space)
    expect(out.replace(/\s/g, '')).toBe("3200000so'm")
  })

  it('keeps UZS unchanged on conversion', () => {
    expect(convertPrice(1_000_000, 'UZS')).toBe(1_000_000)
  })

  it('prefixes USD/EUR with their symbol', () => {
    expect(formatPrice(1_000_000, 'USD').startsWith('$')).toBe(true)
    expect(formatPrice(1_000_000, 'EUR').startsWith('€')).toBe(true)
  })

  it('normalizes a removed/legacy currency (e.g. RUB) back to UZS', () => {
    // @ts-expect-error — RUB is no longer a valid Currency, but persisted state may hold it
    const out = formatPrice(1_000_000, 'RUB')
    expect(out).toContain("so'm")
  })
})
