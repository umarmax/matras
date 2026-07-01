import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="px-4 pb-4 pt-3">
      <h1
        className="text-xl font-semibold tracking-tight"
        style={{ color: 'var(--tg-theme-text-color)' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="mt-1 text-sm"
          style={{ color: 'var(--tg-theme-hint-color)' }}
        >
          {subtitle}
        </p>
      )}
    </header>
  )
}

export function PageHeaderWithBack({
  title,
  subtitle,
  onBack,
}: PageHeaderProps & { onBack?: () => void }) {
  const navigate = useNavigate()

  return (
    <header className="flex items-start gap-3 px-4 pb-4 pt-3">
      <button
        type="button"
        onClick={onBack ?? (() => navigate(-1))}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
        aria-label="Назад"
      >
        ←
      </button>
      <div>
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: 'var(--tg-theme-text-color)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--tg-theme-hint-color)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </header>
  )
}
