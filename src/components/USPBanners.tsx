import { motion } from 'framer-motion'
import { useSettingsStore } from '../store/settingsStore'
import { t } from '../lib/i18n'

const USP_ITEMS = [
  { icon: '📏', key_title: 'usp_measure', key_sub: 'usp_measure_sub' },
  { icon: '⏱️', key_title: 'usp_production', key_sub: 'usp_production_sub' },
  { icon: '🛡️', key_title: 'usp_warranty', key_sub: 'usp_warranty_sub' },
] as const

export function USPBanners() {
  const lang = useSettingsStore((s) => s.language)

  return (
    <section className="px-4 pb-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {USP_ITEMS.map((item, i) => (
          <motion.div
            key={item.key_title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass-card shrink-0 rounded-2xl p-3"
            style={{ minWidth: '140px' }}
          >
            <div className="mb-1 text-xl">{item.icon}</div>
            <p
              className="text-xs font-semibold leading-snug"
              style={{ color: 'var(--tg-theme-text-color)' }}
            >
              {t(lang, item.key_title)}
            </p>
            <p
              className="mt-0.5 text-[11px] leading-snug"
              style={{ color: 'var(--tg-theme-hint-color)' }}
            >
              {t(lang, item.key_sub)}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
