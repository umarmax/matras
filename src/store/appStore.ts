import { create } from 'zustand'
import { MOCK_PRODUCTS } from '../data/mockProducts'
import { MOCK_CATEGORIES } from '../data/mockCategories'
import {
  fetchCategories,
  fetchProductById,
  fetchProducts,
  fetchProductsByCategory,
  isSupabaseConfigured,
} from '../lib/supabase'
import type { CategoryPricing } from '../lib/pricing'
import type { MattressCategory, Product } from '../types'

interface AppState {
  products: Product[]
  productsLoading: boolean
  productsError: string | null
  usingMockData: boolean
  categories: MattressCategory[]
  categoriesLoading: boolean
  loadProducts: () => Promise<void>
  loadCategories: () => Promise<void>
  loadProductsByCategory: (category: string) => Promise<Product[]>
  getProductById: (id: string) => Promise<Product | null>
  getPricingForCategory: (slug: string) => CategoryPricing
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

// Sensible default when a product references a category we couldn't load.
const DEFAULT_PRICING: CategoryPricing = { price_per_m2: 0, minimum_price: null }

export const useAppStore = create<AppState>((set, get) => ({
  products: [],
  productsLoading: false,
  productsError: null,
  usingMockData: false,
  categories: [],
  categoriesLoading: false,

  loadProducts: async () => {
    set({ productsLoading: true, productsError: null })

    const { data, mock } = await withFallback(fetchProducts, MOCK_PRODUCTS)

    set({
      products: data,
      productsLoading: false,
      usingMockData: mock,
      productsError: null,
    })
  },

  loadCategories: async () => {
    if (get().categories.length > 0 || get().categoriesLoading) return
    set({ categoriesLoading: true })
    const { data } = await withFallback(fetchCategories, MOCK_CATEGORIES)
    set({
      categories: data.length > 0 ? data : MOCK_CATEGORIES,
      categoriesLoading: false,
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

  getPricingForCategory: (slug) => {
    const list = get().categories.length > 0 ? get().categories : MOCK_CATEGORIES
    const cat = list.find((c) => c.slug === slug)
    if (!cat) return DEFAULT_PRICING
    return { price_per_m2: cat.price_per_m2, minimum_price: cat.minimum_price }
  },
}))
