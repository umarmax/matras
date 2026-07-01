import { motion } from 'framer-motion'
import type { Category } from '../types'
import { useSettingsStore } from '../store/settingsStore'
import { t } from '../lib/i18n'

export const CATEGORIES: Category[] = [
  { id: 'orthopedic', name: 'Ортопедические', slug: 'orthopedic', icon: '🦴', description: 'Для здорового сна' },
  { id: 'spring', name: 'Пружинные', slug: 'spring', icon: '🌀', description: 'Классический комфорт' },
  { id: 'foam', name: 'Беспружинные', slug: 'foam', icon: '☁️', description: 'Эффект памяти' },
  { id: 'kids', name: 'Детские', slug: 'kids', icon: '🧸', description: 'Для детей' },
  { id: 'custom', name: 'На заказ', slug: 'custom', icon: '✂️', description: 'Любой размер' },
]

const CAT_KEYS: Record<string, 'cat_orthopedic' | 'cat_spring' | 'cat_foam' | 'cat_kids' | 'cat_custom'> = {
  orthopedic: 'cat_orthopedic',
  spring: 'cat_spring',
  foam: 'cat_foam',
  kids: 'cat_kids',
  custom: 'cat_custom',
}

interface CategoryListProps {
  onSelect: (category: Category) => void
}

export function CategoryList({ onSelect }: CategoryListProps) {
  const lang = useSettingsStore((s) => s.language)

  return (
    <section className="px-4 pb-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat.id}
            type="button"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.04 }}
            onClick={() => onSelect(cat)}
            className="glass-card shrink-0 rounded-2xl p-3 text-left active:opacity-80"
            style={{ minWidth: '100px' }}
          >
            <div className="mb-1 text-2xl">{cat.icon}</div>
            <p
              className="text-xs font-semibold leading-snug"
              style={{ color: 'var(--tg-theme-text-color)' }}
            >
              {t(lang, CAT_KEYS[cat.slug] ?? 'cat_all')}
            </p>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
