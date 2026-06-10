import './Tooltip.css'

interface TooltipProps {
  message: string
  visible?: boolean
}

export function Tooltip({ message, visible = true }: TooltipProps) {
  if (!visible || !message) return null

  return (
    <div className="tooltip" role="tooltip">
      {message}
    </div>
  )
}
