import { useCallback, useLayoutEffect, useRef } from 'react'
import type { PanelPosition } from '../../hooks/useEditorState'
import './FloatingPanel.css'

function MinimizeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M2 10h10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M2.5 4.5h9M5.5 4.5V3.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75V4.5m1.75 0V11a1 1 0 0 1-1 1h-4.5a1 1 0 0 1-1-1V4.5h6.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface FloatingPanelProps {
  id: string
  title: string
  subtitle?: string
  dock?: 'top-left' | 'top-right'
  position: PanelPosition
  onMove: (id: string, x: number, y: number) => void
  minWidth?: number
  zIndex?: number
  workspaceContainerRef?: React.RefObject<HTMLElement | null>
  onHeaderClose?: () => void
  onHeaderRemove?: () => void
  onFocus?: () => void
  children: React.ReactNode
}

export function FloatingPanel({
  id,
  title,
  subtitle,
  dock,
  position,
  onMove,
  minWidth = 260,
  zIndex = 20,
  workspaceContainerRef,
  onHeaderClose,
  onHeaderRemove,
  onFocus,
  children,
}: FloatingPanelProps) {
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const userMovedRef = useRef(false)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  useLayoutEffect(() => {
    if (!dock || userMovedRef.current) return

    const snap = () => {
      const panel = panelRef.current
      const parent = panel?.parentElement
      if (!panel || !parent) return

      const panelWidth = panel.offsetWidth
      const x =
        dock === 'top-right'
          ? Math.max(0, parent.clientWidth - panelWidth)
          : 0

      if (position.x !== x || position.y !== 0) {
        onMoveRef.current(id, x, 0)
      }
    }

    snap()
    const parent = panelRef.current?.parentElement
    if (!parent) return

    const observer = new ResizeObserver(snap)
    observer.observe(parent)
    if (panelRef.current) observer.observe(panelRef.current)
    return () => observer.disconnect()
  }, [dock, id, position.x, position.y, minWidth])

  const getWorkspaceRect = useCallback(() => {
    const el = workspaceContainerRef?.current ?? panelRef.current?.parentElement
    return el?.getBoundingClientRect() ?? null
  }, [workspaceContainerRef])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return

      e.preventDefault()
      onFocus?.()

      const workspaceRect = getWorkspaceRect()
      if (!workspaceRect) return

      dragRef.current = {
        offsetX: e.clientX - workspaceRect.left - position.x,
        offsetY: e.clientY - workspaceRect.top - position.y,
      }
      userMovedRef.current = true

      const onPointerMove = (ev: PointerEvent) => {
        if (!dragRef.current) return
        const rect = getWorkspaceRect()
        if (!rect) return

        const x = Math.max(
          0,
          ev.clientX - rect.left - dragRef.current.offsetX,
        )
        const y = Math.max(
          0,
          ev.clientY - rect.top - dragRef.current.offsetY,
        )
        onMoveRef.current(id, x, y)
      }

      const onPointerUp = () => {
        dragRef.current = null
        window.removeEventListener('pointermove', onPointerMove)
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp, { once: true })
    },
    [getWorkspaceRect, id, onFocus, position.x, position.y],
  )

  const stopDrag = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      ref={panelRef}
      className="floating-panel"
      style={{
        left: position.x,
        top: position.y,
        minWidth,
        zIndex,
      }}
    >
      <header
        className="floating-panel__header"
        onPointerDown={handlePointerDown}
      >
        <span className="floating-panel__grip">⠿</span>
        <div className="floating-panel__titles">
          <span className="floating-panel__title">{title}</span>
          {subtitle && (
            <span className="floating-panel__subtitle">{subtitle}</span>
          )}
        </div>
        {(onHeaderClose || onHeaderRemove) && (
          <div className="floating-panel__header-actions">
            {onHeaderClose && (
              <button
                type="button"
                className="floating-panel__header-btn floating-panel__header-btn--minimize"
                aria-label="Minimize editor"
                onPointerDown={stopDrag}
                onClick={onHeaderClose}
              >
                <MinimizeIcon />
              </button>
            )}
            {onHeaderRemove && (
              <button
                type="button"
                className="floating-panel__header-btn floating-panel__header-btn--delete"
                aria-label="Delete block"
                onPointerDown={stopDrag}
                onClick={onHeaderRemove}
              >
                <DeleteIcon />
              </button>
            )}
          </div>
        )}
      </header>
      <div className="floating-panel__body">{children}</div>
    </div>
  )
}
