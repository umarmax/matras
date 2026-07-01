import { motion } from 'framer-motion'
import { Mattress3DLazy } from './Mattress3DLazy'
import { useSettingsStore } from '../store/settingsStore'
import { t } from '../lib/i18n'

export function HeroSection() {
  const lang = useSettingsStore((s) => s.language)

  return (
    <section className="gradient-hero px-4 pb-6 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium tracking-wide"
          style={{
            background: 'color-mix(in srgb, var(--tg-theme-accent-text-color) 15%, transparent)',
            color: 'var(--tg-theme-accent-text-color)',
          }}
        >
          {t(lang, 'hero_badge')}
        </motion.span>

        <h1
          className="mb-2 text-[1.75rem] font-semibold leading-tight tracking-tight"
          style={{ color: 'var(--tg-theme-text-color)' }}
        >
          {t(lang, 'hero_title')}
          <br />
          <span style={{ color: 'var(--tg-theme-accent-text-color)' }}>
            {t(lang, 'hero_title_accent')}
          </span>
        </h1>

        <p
          className="mx-auto mb-4 max-w-[280px] text-sm leading-relaxed"
          style={{ color: 'var(--tg-theme-hint-color)' }}
        >
          {t(lang, 'hero_subtitle')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-sm overflow-hidden rounded-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--tg-theme-secondary-bg-color) 90%, white), transparent)',
        }}
      >
        <Mattress3DLazy
          width={2}
          height={2.2}
          thickness={0.35}
          rigidity="soft"
          className="w-full"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pb-3 text-center text-[11px]"
          style={{ color: 'var(--tg-theme-hint-color)' }}
        >
          {t(lang, 'hero_hint')}
        </motion.p>
      </motion.div>
    </section>
  )
}
