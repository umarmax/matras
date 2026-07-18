// Dynamic mattress pricing — single source of truth for the frontend.
// The `create-order` Edge Function re-implements the identical formula server-side
// (it cannot import browser code) and is the authoritative price at checkout.

export interface CategoryPricing {
  price_per_m2: number
  minimum_price: number | null
}

/**
 * Calculate a mattress price from its dimensions and category pricing.
 *
 *   area_m² = (width_cm / 100) × (length_cm / 100)
 *   price   = round(area_m² × price_per_m2)
 *   price   = max(price, minimum_price)   // when a minimum is set
 *
 * @param widthCm  mattress width in centimeters
 * @param lengthCm mattress length in centimeters
 * @param pricing  category price_per_m2 and optional minimum_price (UZS)
 * @returns integer price in UZS
 */
export function calculatePrice(
  widthCm: number,
  lengthCm: number,
  pricing: CategoryPricing,
): number {
  if (
    !Number.isFinite(widthCm) ||
    !Number.isFinite(lengthCm) ||
    widthCm <= 0 ||
    lengthCm <= 0
  ) {
    return pricing.minimum_price ?? 0
  }

  const areaM2 = (widthCm / 100) * (lengthCm / 100)
  const raw = Math.round(areaM2 * pricing.price_per_m2)

  if (pricing.minimum_price != null && raw < pricing.minimum_price) {
    return pricing.minimum_price
  }
  return raw
}
