import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '../types'

interface CartState {
  items: CartItem[]
  addItem: (
    product: Product,
    width: number,
    length: number,
    unitPrice: number,
    quantity?: number,
  ) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

// Backward-compatible unit price for carts persisted before dynamic pricing.
export function itemUnitPrice(item: CartItem): number {
  return item.unitPrice ?? item.product.price
}

function makeCartItemId(productId: string, width: number, length: number) {
  return `${productId}-${width}x${length}`
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, width, length, unitPrice, quantity = 1) => {
        const id = makeCartItemId(product.id, width, length)
        const existing = get().items.find((item) => item.id === id)

        if (existing) {
          set({
            items: get().items.map((item) =>
              item.id === id
                ? { ...item, quantity: item.quantity + quantity, unitPrice }
                : item,
            ),
          })
          return
        }

        set({
          items: [
            ...get().items,
            { id, productId: product.id, product, width, length, quantity, unitPrice },
          ],
        })
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item,
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + itemUnitPrice(item) * item.quantity,
          0,
        ),
    }),
    { name: 'matras-cart' },
  ),
)
