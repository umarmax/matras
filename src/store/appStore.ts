import { create } from 'zustand'
import { MOCK_PRODUCTS } from '../data/mockProducts'
import {
  fetchProductById,
  fetchProducts,
  fetchProductsByCategory,
  isSupabaseConfigured,
} from '../lib/supabase'
import type { Product } from '../types'

interface AppState {
  products: Product[]
  productsLoading: boolean
  productsError: string | null
  usingMockData: boolean
  loadProducts: () => Promise<void>
  loadProductsByCategory: (category: string) => Promise<Product[]>
  getProductById: (id: string) => Promise<Product | null>
}

async function withFallback<T>(
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<{ data: T; mock: boolean }> {
  if (!isSupabaseConfigured) {
    return { data: fallback, mock: true }
  }

  try {
    const data = await fetcher()
    return { data, mock: false }
  } catch {
    return { data: fallback, mock: true }
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  products: [],
  productsLoading: false,
  productsError: null,
  usingMockData: false,

  loadProducts: async () => {
    set({ productsLoading: true, productsError: null })

    const { data, mock } = await withFallback(fetchProducts, MOCK_PRODUCTS)

    set({
      products: data,
      productsLoading: false,
      usingMockData: mock,
      productsError: mock && !isSupabaseConfigured ? null : null,
    })
  },

  loadProductsByCategory: async (category) => {
    const fallback = MOCK_PRODUCTS.filter((p) => p.category === category)
    const { data } = await withFallback(
      () => fetchProductsByCategory(category),
      fallback,
    )
    return data
  },

  getProductById: async (id) => {
    const cached = get().products.find((p) => p.id === id)
    if (cached) return cached

    const mock = MOCK_PRODUCTS.find((p) => p.id === id) ?? null
    const { data } = await withFallback(() => fetchProductById(id), mock)
    return data
  },
}))
