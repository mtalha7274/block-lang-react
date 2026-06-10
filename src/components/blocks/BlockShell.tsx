import type { BlockCategory, BlockLayoutOverride, BlockVisualState } from '../../types'
import { categoryStripeMap } from '../../constants'
import { useCanvasBlockContext } from '../canvas/CanvasBlockContext'
import { ResizableContainer, Tooltip } from '../ui'
import './BlockShell.css'

interface BlockShellProps {
  blockId?: string
  layoutOverride?: BlockLayoutOverride
  resizable?: boolean
  category: BlockCategory
  title?: string
  subtitle?: string
  state?: BlockVisualState
  errorMessage?: string
  isMain?: boolean
  compact?: boolean
  showTitle?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
}

export function BlockShell({
  blockId,
  layoutOverride,
  resizable = true,
  category,
  title,
  subtitle,
  state = 'default',
  errorMessage,
  isMain = false,
  compact = false,
  showTitle = false,
  children,
  footer,
}: BlockShellProps) {
  const canvasCtx = useCanvasBlockContext()
  const isTopLevelCanvas = canvasCtx?.isTopLevel ?? false
  const classes = [
    'block',
    `block--${category}`,
    state !== 'default' ? `block--${state}` : '',
    isMain ? 'block--main' : '',
    compact ? 'block--compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const showHeader = isMain || showTitle

  const shell = (
    <div
      className={classes}
      style={{ '--block-stripe': categoryStripeMap[category] } as React.CSSProperties}
      data-block-state={state}
    >
      <div className="block__stripe" />
      <div className="block__inner">
        {showHeader && (
          <header className="block__header">
            <div className="block__titles">
              {isMain && (
                <span className="block__main-badge">MAIN FUNCTION</span>
              )}
              {showTitle && title && (
                <span className="block__title">{title}</span>
              )}
              {subtitle && (
                <span className="block__subtitle">{subtitle}</span>
              )}
            </div>
          </header>
        )}
        <div className="block__body">{children}</div>
        {footer && <footer className="block__footer">{footer}</footer>}
      </div>
      {state === 'error' && errorMessage && <Tooltip message={errorMessage} />}
    </div>
  )

  if (!blockId || compact || isTopLevelCanvas) return shell

  return (
    <ResizableContainer
      blockId={blockId}
      layoutOverride={layoutOverride}
      resizable={resizable}
    >
      {shell}
    </ResizableContainer>
  )
}
