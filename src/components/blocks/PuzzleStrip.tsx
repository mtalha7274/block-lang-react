import type { BlockLayoutOverride } from '../../types'
import { useCanvasBlockContext } from '../canvas/CanvasBlockContext'
import { ResizableContainer } from '../ui'
import './PuzzleStrip.css'

interface PuzzleStripProps {
  blockId?: string
  layoutOverride?: BlockLayoutOverride
  resizable?: boolean
  typeColor?: string
  state?: 'default' | 'dragging' | 'reject' | 'active'
  isMain?: boolean
  nested?: boolean
  children: React.ReactNode
  className?: string
}

export function PuzzleStrip({
  blockId,
  layoutOverride,
  resizable = true,
  typeColor = 'var(--type-void)',
  state = 'default',
  isMain = false,
  nested = false,
  children,
  className = '',
}: PuzzleStripProps) {
  const canvasCtx = useCanvasBlockContext()
  const isTopLevelCanvas = canvasCtx?.isTopLevel ?? false
  const classes = [
    'puzzle-strip',
    isMain ? 'puzzle-strip--main' : '',
    nested ? 'puzzle-strip--nested' : '',
    state !== 'default' ? `puzzle-strip--${state}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const strip = (
    <div
      className={classes}
      style={{ '--puzzle-color': typeColor } as React.CSSProperties}
    >
      {!isTopLevelCanvas && <div className="puzzle-strip__cap" />}
      <div className="puzzle-strip__content">{children}</div>
    </div>
  )

  if (!blockId || nested || isTopLevelCanvas) {
    return strip
  }

  return (
    <ResizableContainer
      blockId={blockId}
      layoutOverride={layoutOverride}
      resizable={resizable}
    >
      {strip}
    </ResizableContainer>
  )
}
