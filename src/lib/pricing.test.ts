import { describe, expect, it } from 'vitest'
import { calculatePrice } from './pricing'

describe('calculatePrice', () => {
  it('computes area × price_per_m2 (160×200 = 3.2 m²)', () => {
    // 1.6 × 2.0 = 3.2 m² × 1,000,000 = 3,200,000
    expect(
      calculatePrice(160, 200, { price_per_m2: 1_000_000, minimum_price: null }),
    ).toBe(3_200_000)
  })

  it('applies minimum_price when the computed price is lower', () => {
    // 60×120 = 0.72 m² × 1,000,000 = 720,000 → floored to 1,000,000
    expect(
      calculatePrice(60, 120, { price_per_m2: 1_000_000, minimum_price: 1_000_000 }),
    ).toBe(1_000_000)
  })

  it('does not apply minimum_price when the computed price is higher', () => {
    expect(
      calculatePrice(200, 220, { price_per_m2: 1_000_000, minimum_price: 1_000_000 }),
    ).toBe(4_400_000)
  })

  it('supports arbitrary custom sizes without extra config', () => {
    // 143×197 = 1.43 × 1.97 = 2.8171 m² × 1,300,000 = 3,662,230
    expect(
      calculatePrice(143, 197, { price_per_m2: 1_300_000, minimum_price: null }),
    ).toBe(3_662_230)
  })

  it('rounds to the nearest integer', () => {
    // 101×101 = 1.0201 m² × 999 = 1019.0799 → 1019
    expect(
      calculatePrice(101, 101, { price_per_m2: 999, minimum_price: null }),
    ).toBe(1019)
  })

  it('falls back to minimum_price for non-positive dimensions', () => {
    expect(
      calculatePrice(0, 200, { price_per_m2: 1_000_000, minimum_price: 500_000 }),
    ).toBe(500_000)
    expect(
      calculatePrice(-10, 200, { price_per_m2: 1_000_000, minimum_price: null }),
    ).toBe(0)
  })
})
