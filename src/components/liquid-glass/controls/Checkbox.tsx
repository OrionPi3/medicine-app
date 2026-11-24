// src/components/liquid-glass/controls/Checkbox.tsx
type CheckboxProps = {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  theme?: 'dark' | 'light'
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  color = '#34c759',
  size = 'md',
}: CheckboxProps) {
  const boxSize = size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <label
      className={`inline-flex select-none items-center gap-2.5 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        style={checked ? { backgroundColor: color, borderColor: color } : undefined}
        className={`flex items-center justify-center rounded-lg border border-white/25 bg-white/10 backdrop-blur-md transition-all ${boxSize}`}
      >
        {checked && (
          <svg
            viewBox="0 0 14 14"
            fill="none"
            className="h-3.5 w-3.5 text-white"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
          </svg>
        )}
      </span>
      {label && <span className="text-sm font-medium text-white">{label}</span>}
    </label>
  )
}
