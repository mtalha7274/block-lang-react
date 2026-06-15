import { useCallback, useRef, useState } from 'react'
import type { OutputLine } from '../../types'
import './OutputPanel.css'

const DEFAULT_HEIGHT = 32
const MIN_HEIGHT = 32
const MAX_HEIGHT_RATIO = 0.6

interface OutputPanelProps {
  lines: OutputLine[]
  visible?: boolean
}

export function OutputPanel({ lines, visible = true }: OutputPanelProps) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null)

  const maxHeight = Math.floor(window.innerHeight * MAX_HEIGHT_RATIO)
  const collapsed = height <= MIN_HEIGHT + 4

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      dragRef.current = { startY: e.clientY, startHeight: height }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [height],
  )

  const onHandlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return
      const delta = dragRef.current.startY - e.clientY
      const next = Math.min(
        maxHeight,
        Math.max(MIN_HEIGHT, dragRef.current.startHeight + delta),
      )
      setHeight(next)
    },
    [maxHeight],
  )

  const onHandlePointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  if (!visible) return null

  return (
    <div
      className={`output-panel${collapsed ? ' output-panel--collapsed' : ''}`}
      style={{ height }}
    >
      <div
        className="output-panel__handle"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize output panel"
      >
        <span className="output-panel__handle-bar" />
        <span className="output-panel__title">Output</span>
      </div>
      {!collapsed && (
        <div className="output-panel__body">
          {lines.length === 0 ? (
            <p className="output-panel__empty">Run Emulate to see output</p>
          ) : (
            <ul className="output-panel__lines">
              {lines.map((entry, i) => (
                <li key={`${entry.blockId}-${i}`} className="output-panel__line">
                  {entry.line}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
