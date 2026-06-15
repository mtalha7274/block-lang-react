import './SelectField.css'

interface SelectFieldProps {
  value: string
  options: { value: string; label: string }[]
  className?: string
  onChange?: (value: string) => void
}

export function SelectField({ value, options, className = '', onChange }: SelectFieldProps) {
  return (
    <select
      className={`select-field ${className}`.trim()}
      value={value}
      disabled={!onChange}
      tabIndex={onChange ? 0 : -1}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
