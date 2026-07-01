interface SizePickerProps {
  label: string
  options: number[]
  value: number
  onChange: (value: number) => void
  suffix?: string
}

export function SizePicker({
  label,
  options,
  value,
  onChange,
  suffix = 'см',
}: SizePickerProps) {
  return (
    <div>
      <p
        className="mb-2 text-sm font-medium"
        style={{ color: 'var(--tg-theme-text-color)' }}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option === value

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className="min-h-[44px] min-w-[56px] rounded-xl px-3 text-sm font-medium transition-transform active:scale-95"
              style={{
                background: active
                  ? 'var(--tg-theme-button-color)'
                  : 'var(--tg-theme-secondary-bg-color)',
                color: active
                  ? 'var(--tg-theme-button-text-color)'
                  : 'var(--tg-theme-text-color)',
              }}
            >
              {option} {suffix}
            </button>
          )
        })}
      </div>
    </div>
  )
}
