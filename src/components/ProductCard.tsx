import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Product } from '../types'
import { useSettingsStore, formatPrice } from '../store/settingsStore'

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const currency = useSettingsStore((s) => s.currency)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="glass-card block rounded-2xl p-3 active:opacity-90"
      >
        <div
          className="mb-2 flex h-24 items-center justify-center rounded-xl text-4xl"
          style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
        >
          🛏
        </div>
        <p
          className="mb-1 line-clamp-2 text-sm font-semibold leading-snug"
          style={{ color: 'var(--tg-theme-text-color)' }}
        >
          {product.name}
        </p>
        <p
          className="text-sm font-bold"
          style={{ color: 'var(--tg-theme-accent-text-color)' }}
        >
          {formatPrice(product.price, currency)}
        </p>
      </Link>
    </motion.div>
  )
}
