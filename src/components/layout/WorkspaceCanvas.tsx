import { useRef, useLayoutEffect, type RefObject } from 'react'
import type { ScrollOffset } from './CanvasBlocksLayer'
import './WorkspaceCanvas.css'

interface WorkspaceCanvasProps {
  isDragOver?: boolean
  onScrollOffsetChange?: (offset: ScrollOffset) => void
  surfaceRef?: RefObject<HTMLDivElement | null>
  scrollRef?: RefObject<HTMLDivElement | null>
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
}

export function WorkspaceCanvas({
  isDragOver = false,
  onScrollOffsetChange,
  surfaceRef: externalSurfaceRef,
  scrollRef: externalScrollRef,
  onDragOver,
  onDragLeave,
  onDrop,
}: WorkspaceCanvasProps) {
  const internalSurfaceRef = useRef<HTMLDivElement>(null)
  const internalScrollRef = useRef<HTMLDivElement>(null)
  const surfaceRef = externalSurfaceRef ?? internalSurfaceRef
  const scrollRef = externalScrollRef ?? internalScrollRef

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl || !onScrollOffsetChange) return

    const publish = () => {
      onScrollOffsetChange({
        left: scrollEl.scrollLeft,
        top: scrollEl.scrollTop,
      })
    }

    publish()
    scrollEl.addEventListener('scroll', publish, { passive: true })

    const observer = new ResizeObserver(publish)
    observer.observe(scrollEl)
    if (surfaceRef.current) observer.observe(surfaceRef.current)

    return () => {
      scrollEl.removeEventListener('scroll', publish)
      observer.disconnect()
    }
  }, [onScrollOffsetChange, scrollRef, surfaceRef])

  return (
    <div className="workspace">
      <div ref={scrollRef} className="workspace__scroll">
        <div
          ref={surfaceRef}
          className={`workspace__surface${isDragOver ? ' workspace__surface--drag-over' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      </div>
    </div>
  )
}
