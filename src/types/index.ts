export type Rigidity = 'soft' | 'medium' | 'hard'

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  width_options: number[]
  length_options: number[]
  rigidity: Rigidity
  created_at: string
}

// Lightweight category used by the home-screen chips (icon comes from the frontend).
export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string
}

// Full mattress category with dynamic pricing, backed by the `categories` table.
export interface MattressCategory {
  id: string
  slug: string
  name: string
  description: string | null
  image_url: string | null
  active: boolean
  price_per_m2: number
  minimum_price: number | null
  sort_order: number
}

export type AdminRole = 'owner' | 'sales_manager'

export interface Admin {
  telegram_user_id: number
  name: string | null
  role: AdminRole
  active: boolean
  created_at?: string
}

export interface CartItem {
  id: string
  productId: string
  product: Product
  width: number
  length: number
  quantity: number
  unitPrice: number // computed from category pricing at add-time (UZS)
}

export interface OrderPayload {
  items: Array<{
    product_id: string
    name: string
    width: number
    length: number
    quantity: number
    price: number
  }>
  total: number
  telegram_user_id?: number
  telegram_username?: string
  customer_name?: string
  customer_phone?: string
  delivery_address?: string
  comment?: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'completed' // legacy

export interface Order {
  id: string
  user_id: string | null
  items: OrderPayload['items']
  total: number
  status: OrderStatus
  telegram_user_id?: number | null
  telegram_username?: string | null
  customer_name: string | null
  customer_phone: string | null
  delivery_address: string | null
  comment: string | null
  admin_note?: string | null
  created_at: string
}

export interface UserProfile {
  id: string
  telegram_id: number
  first_name: string
  last_name: string | null
  username: string | null
  photo_url: string | null
}

export const RIGIDITY_LABELS: Record<Rigidity, string> = {
  soft: 'Мягкий',
  medium: 'Средний',
  hard: 'Жёсткий',
}
