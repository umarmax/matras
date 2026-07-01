import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { Mattress3DLazy } from '../components/Mattress3DLazy'
import { PageHeaderWithBack } from '../components/PageHeader'
import { RigidityBadge } from '../components/RigidityBadge'
import { SizePicker } from '../components/SizePicker'
import { useTelegramBackButton } from '../hooks/useTelegramBackButton'
import { WebApp } from '../lib/telegram'
import { useAppStore } from '../store/appStore'
import { useCartStore } from '../store/cartStore'
import { useSettingsStore, formatPrice } from '../store/settingsStore'
import { t } from '../lib/i18n'
import type { Product } from '../types'

export function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const getProductById = useAppStore((s) => s.getProductById)
  const addItem = useCartStore((s) => s.addItem)
  const lang = useSettingsStore((s) => s.language)
  const currency = useSettingsStore((s) => s.currency)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [width, setWidth] = useState(160)
  const [length, setLength] = useState(200)

  useTelegramBackButton(true, '/catalog')

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const data = await getProductById(id!)
      if (!cancelled && data) {
        setProduct(data)
        setWidth(data.width_options[0] ?? 160)
        setLength(data.length_options[0] ?? 200)
      }
      if (!cancelled) setLoading(false)
    }

    void load()
    return () => { cancelled = true }
  }, [id, getProductById])

  const handleAddToCart = () => {
    if (!product) return
    addItem(product, width, length)
    try {
      WebApp.HapticFeedback.impactOccurred('medium')
      WebApp.showConfirm(
        `${product.name}, ${width}×${length} см — ${t(lang, 'added_to_cart')}`,
        (confirmed) => { if (confirmed) navigate('/cart') },
      )
    } catch {
      navigate('/cart')
    }
  }

  if (loading) {
    return (
      <Layout hideNav>
        <div className="mx-4 mt-6 h-64 animate-pulse rounded-3xl" style={{ background: 'var(--tg-theme-secondary-bg-color)' }} />
      </Layout>
    )
  }

  if (!product) {
    return (
      <Layout>
        <PageHeaderWithBack title={t(lang, 'no_products')} onBack={() => navigate('/catalog')} />
      </Layout>
    )
  }

  const modelWidth = width / 100
  const modelLength = length / 100

  return (
    <Layout hideNav>
      <PageHeaderWithBack
        title={product.name}
        subtitle={formatPrice(product.price, currency)}
        onBack={() => navigate(-1)}
      />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 overflow-hidden rounded-3xl"
        style={{ background: 'radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--tg-theme-secondary-bg-color) 80%, white), transparent)' }}
      >
        <Mattress3DLazy width={modelWidth} height={modelLength} thickness={0.35} rigidity={product.rigidity} />
      </motion.section>

      <section className="space-y-5 px-4 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <RigidityBadge rigidity={product.rigidity} />
          <span
            className="rounded-full px-3 py-1 text-xs"
            style={{ background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-hint-color)' }}
          >
            {t(lang, 'production_time')}
          </span>
        </div>

        {product.description && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {product.description}
          </p>
        )}

        <SizePicker label={t(lang, 'width')} options={product.width_options} value={width} onChange={setWidth} />
        <SizePicker label={t(lang, 'length')} options={product.length_options} value={length} onChange={setLength} />
      </section>

      <div
        className="sticky bottom-0 px-4 pb-4 pt-2"
        style={{
          paddingBottom: 'calc(var(--app-safe-bottom) + 16px)',
          background: 'linear-gradient(to top, var(--tg-theme-bg-color) 70%, transparent)',
        }}
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl text-base font-semibold"
          style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
        >
          {t(lang, 'add_to_cart')} · {formatPrice(product.price, currency)}
        </motion.button>
      </div>
    </Layout>
  )
}
