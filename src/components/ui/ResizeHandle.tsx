import './ResizableContainer.css'

interface ResizeHandleProps {
  visible: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

export function ResizeHandle({
  visible,
  onPointerDown,
  onDoubleClick,
}: ResizeHandleProps) {
  if (!visible) return null

  return (
    <div
      className="resize-handle"
      role="separator"
      aria-label="Resize block"
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
    />
  )
}
