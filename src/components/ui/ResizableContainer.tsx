import { useCallback, useEffect, useRef } from 'react'
import type { BlockLayoutOverride } from '../../types'
import { useDragContext } from '../canvas/DragContext'
import { useMeasuredSize } from '../../hooks/useMeasuredSize'
import { ResizeHandle } from './ResizeHandle'
import './ResizableContainer.css'

interface ResizableContainerProps {
  blockId?: string
  layoutOverride?: BlockLayoutOverride
  resizable?: boolean
  className?: string
  children: React.ReactNode
}

export function ResizableContainer({
  blockId,
  layoutOverride,
  resizable = true,
  className = '',
  children,
}: ResizableContainerProps) {
  const { updateBlockLayout, draggingBlockId, draggingPaletteKind } = useDragContext()
  const { ref: measureRef, size: contentSize } = useMeasuredSize<HTMLDivElement>()
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(
    null,
  )

  const isDragging = draggingBlockId !== null || draggingPaletteKind !== null
  const showHandle = Boolean(blockId && resizable && !isDragging)

  const manualWidth = layoutOverride?.width
  const manualHeight = layoutOverride?.height
  const hasManualSize = manualWidth !== undefined || manualHeight !== undefined

  useEffect(() => {
    if (!blockId) return
    if (manualWidth === undefined && manualHeight === undefined) return
    const needsWidthBump =
      manualWidth !== undefined && contentSize.width > 0 && manualWidth < contentSize.width
    const needsHeightBump =
      manualHeight !== undefined && contentSize.height > 0 && manualHeight < contentSize.height
    if (!needsWidthBump && !needsHeightBump) return
    updateBlockLayout(blockId, {
      width: needsWidthBump
        ? Math.max(manualWidth ?? 0, contentSize.width)
        : manualWidth,
      height: needsHeightBump
        ? Math.max(manualHeight ?? 0, contentSize.height)
        : manualHeight,
    })
  }, [
    blockId,
    contentSize.width,
    contentSize.height,
    manualWidth,
    manualHeight,
    updateBlockLayout,
  ])

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!blockId) return
      e.preventDefault()
      e.stopPropagation()

      const minW = contentSize.width || 160
      const minH = contentSize.height || 80
      const startW = Math.max(minW, manualWidth ?? minW)
      const startH = Math.max(minH, manualHeight ?? minH)
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startW,
        startH,
      }

      const onMove = (ev: PointerEvent) => {
        if (!resizeRef.current || !blockId) return
        const dx = ev.clientX - resizeRef.current.startX
        const dy = ev.clientY - resizeRef.current.startY
        updateBlockLayout(blockId, {
          width: Math.max(minW, resizeRef.current.startW + dx),
          height: Math.max(minH, resizeRef.current.startH + dy),
        })
      }

      const onUp = () => {
        resizeRef.current = null
        window.removeEventListener('pointermove', onMove)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp, { once: true })
    },
    [blockId, contentSize.width, contentSize.height, manualWidth, manualHeight, updateBlockLayout],
  )

  const handleResizeDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (blockId) updateBlockLayout(blockId, null)
    },
    [blockId, updateBlockLayout],
  )

  const classes = [
    'resizable-container',
    hasManualSize ? 'resizable-container--manual' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const style: React.CSSProperties = {}
  if (manualWidth !== undefined) {
    style.width = Math.max(contentSize.width || 0, manualWidth)
  }
  if (manualHeight !== undefined) {
    const resolvedHeight = Math.max(contentSize.height || 0, manualHeight)
    style.height = resolvedHeight
    style.minHeight = resolvedHeight
  }

  return (
    <div className={classes} style={style}>
      <div ref={measureRef} className="resizable-container__measure">
        {children}
      </div>
      <ResizeHandle
        visible={showHandle}
        onPointerDown={handleResizePointerDown}
        onDoubleClick={handleResizeDoubleClick}
      />
    </div>
  )
}
