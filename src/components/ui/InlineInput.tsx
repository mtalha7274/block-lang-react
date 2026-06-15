import './InlineInput.css'

interface InlineInputProps {
  value: string
  mono?: boolean
  className?: string
}

export function InlineInput({ value, mono = true, className = '' }: InlineInputProps) {
  return (
    <input
      type="text"
      className={`inline-input${mono ? ' inline-input--mono' : ''} ${className}`.trim()}
      value={value}
      readOnly
      tabIndex={-1}
    />
  )
}
