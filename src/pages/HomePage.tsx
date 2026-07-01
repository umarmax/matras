import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CategoryList } from '../components/CategoryList'
import { HeroSection } from '../components/HeroSection'
import { Layout } from '../components/Layout'
import { USPBanners } from '../components/USPBanners'
import { useAppStore } from '../store/appStore'
import { useSettingsStore, formatPrice } from '../store/settingsStore'
import { t } from '../lib/i18n'
import type { Category } from '../types'

function ProductsPreview() {
  const { products, productsLoading, loadProducts } = useAppStore()
  const lang = useSettingsStore((s) => s.language)
  const currency = useSettingsStore((s) => s.currency)

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  if (productsLoading) {
    return (
      <section className="px-4 pb-6">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 w-36 shrink-0 animate-pulse rounded-2xl"
              style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
            />
          ))}
        </div>
      </section>
    )
  }

  if (products.length === 0) return null

  return (
    <section className="px-4 pb-6">
      <div className="mb-3 flex items-end justify-between">
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--tg-theme-text-color)' }}
        >
          {t(lang, 'popular')}
        </h2>
        <Link
          to="/catalog"
          className="text-xs font-medium"
          style={{ color: 'var(--tg-theme-link-color)' }}
        >
          {t(lang, 'all')}
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {products.slice(0, 6).map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.05 }}
          >
            <Link
              to={`/product/${product.id}`}
              className="glass-card block w-36 shrink-0 rounded-2xl p-3 active:opacity-90"
            >
              <div
                className="mb-2 flex h-16 items-center justify-center rounded-xl text-3xl"
                style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
              >
                🛏
              </div>
              <p
                className="mb-1 line-clamp-2 text-xs font-medium leading-snug"
                style={{ color: 'var(--tg-theme-text-color)' }}
              >
                {product.name}
              </p>
              <p
                className="text-xs font-semibold"
                style={{ color: 'var(--tg-theme-accent-text-color)' }}
              >
                {formatPrice(product.price, currency)}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()

  const handleCategorySelect = (category: Category) => {
    navigate(`/catalog?category=${category.slug}`)
  }

  return (
    <Layout>
      <HeroSection />
      <USPBanners />
      <CategoryList onSelect={handleCategorySelect} />
      <ProductsPreview />
    </Layout>
  )
}
