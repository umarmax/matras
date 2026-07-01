import type { Rigidity } from '../types'
import { useSettingsStore } from '../store/settingsStore'
import { t } from '../lib/i18n'

interface RigidityBadgeProps {
  rigidity: Rigidity
}

const COLORS: Record<Rigidity, string> = {
  soft: '#86efac',
  medium: '#fcd34d',
  hard: '#94a3b8',
}

const RIGIDITY_KEYS: Record<Rigidity, 'soft' | 'medium' | 'hard'> = {
  soft: 'soft',
  medium: 'medium',
  hard: 'hard',
}

export function RigidityBadge({ rigidity }: RigidityBadgeProps) {
  const lang = useSettingsStore((s) => s.language)

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{
        background: `color-mix(in srgb, ${COLORS[rigidity]} 20%, var(--tg-theme-secondary-bg-color))`,
        color: 'var(--tg-theme-text-color)',
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[rigidity] }} />
      {t(lang, RIGIDITY_KEYS[rigidity])}
    </span>
  )
}
