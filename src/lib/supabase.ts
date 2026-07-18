import { createClient } from '@supabase/supabase-js'
import type { MattressCategory, Order, OrderPayload, Product } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Укажите VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env',
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
)

export async function fetchCategories(): Promise<MattressCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(`Не удалось загрузить категории: ${error.message}`)
  }

  return (data ?? []) as MattressCategory[]
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Не удалось загрузить товары: ${error.message}`)
  }

  return (data ?? []) as Product[]
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Не удалось загрузить товар: ${error.message}`)
  }

  return data as Product | null
}

export async function fetchProductsByCategory(
  category: string,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .order('price', { ascending: true })

  if (error) {
    throw new Error(`Не удалось загрузить категорию: ${error.message}`)
  }

  return (data ?? []) as Product[]
}

export async function createOrder(
  payload: OrderPayload,
  userId?: string | null,
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId ?? null,
      items: payload.items,
      total: payload.total,
      status: 'pending',
      telegram_user_id: payload.telegram_user_id ?? null,
      telegram_username: payload.telegram_username ?? null,
      customer_name: payload.customer_name ?? null,
      customer_phone: payload.customer_phone ?? null,
      delivery_address: payload.delivery_address ?? null,
      comment: payload.comment ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Не удалось создать заказ: ${error.message}`)
  }

  return data as Order
}

export async function fetchUserOrders(userId: string, telegramId?: number): Promise<Order[]> {
  // Try by user_id first
  if (userId && userId !== 'dev-user') {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      return data as Order[]
    }
  }

  // Fallback: fetch by telegram_user_id
  if (telegramId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('telegram_user_id', telegramId)
      .order('created_at', { ascending: false })

    if (!error) {
      return (data ?? []) as Order[]
    }
  }

  return []
}
