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

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string
}

export interface CartItem {
  id: string
  productId: string
  product: Product
  width: number
  length: number
  quantity: number
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

export interface Order {
  id: string
  user_id: string | null
  items: OrderPayload['items']
  total: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  customer_name: string | null
  customer_phone: string | null
  delivery_address: string | null
  comment: string | null
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
