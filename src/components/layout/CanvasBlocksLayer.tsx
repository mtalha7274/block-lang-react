import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import type { BlockNode, ProgramDocument } from '../../types'
import { blockRegistry } from '../../constants'
import { mergeCanvasConnections } from '../../lib/program/callWire'
import { computeCenteredMainPlacement } from '../../lib/workspace/centerMainBlock'
import { BlockRenderer, CanvasBlockContext, ConnectionLayer, useDragContext } from '../canvas'
import { ResizableContainer } from '../ui'
import './CanvasBlocksLayer.css'
import './WorkspaceCanvas.css'

export interface ScrollOffset {
  left: number
  top: number
}

interface CanvasBlocksLayerProps {
  program: ProgramDocument
  activeBlockId?: string
  scrollOffset: ScrollOffset
  scrollRef: RefObject<HTMLDivElement | null>
  centerMainTrigger?: number
  getBlockZ: (blockId: string) => number
  onBlockPointerDown?: (
    blockId: string,
    x: number,
    y: number,
  ) => (e: React.PointerEvent) => void
  onRaiseBlock?: (blockId: string) => void
  onCenterMain?: (x: number, y: number) => void
}

function canvasBlockTitle(block: BlockNode): string {
  if (block.kind === 'function') return block.data.name
  return blockRegistry[block.kind]?.label ?? 'Block'
}

export function canvasBlockStackId(blockId: string): string {
  return `canvas-${blockId}`
}

export function CanvasBlocksLayer({
  program,
  activeBlockId,
  scrollOffset,
  scrollRef,
  centerMainTrigger = 0,
  getBlockZ,
  onBlockPointerDown,
  onRaiseBlock,
  onCenterMain,
}: CanvasBlocksLayerProps) {
  const dragContext = useDragContext()
  const mainBlockRef = useRef<HTMLDivElement>(null)

  const placementMap = new Map(
    program.placements.map((p) => [p.blockId, p]),
  )

  const topLevelBlocks = program.blocks
    .filter((b) => b.kind === 'main' && placementMap.has(b.id))
    .sort((a, b) => {
      const za = getBlockZ(a.id)
      const zb = getBlockZ(b.id)
      if (za !== zb) return za - zb
      return program.blocks.indexOf(a) - program.blocks.indexOf(b)
    })

  const blockIds = topLevelBlocks.map((b) => b.id)
  const allCanvasEdges = useMemo(() => mergeCanvasConnections(program), [program])

  const handleBlockFocus = (blockId: string) => (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) {
      return
    }
    onRaiseBlock?.(blockId)
  }

  useLayoutEffect(() => {
    if (!centerMainTrigger || !onCenterMain) return

    const mainEl = mainBlockRef.current
    const scrollEl = scrollRef.current
    if (!mainEl || !scrollEl) return

    let centered = false

    const applyCenter = () => {
      if (centered) return
      if (mainEl.offsetWidth === 0 && mainEl.offsetHeight === 0) return
      const { x, y } = computeCenteredMainPlacement(scrollEl, mainEl)
      onCenterMain(x, y)
      centered = true
      observer.disconnect()
    }

    const observer = new ResizeObserver(applyCenter)
    observer.observe(mainEl)
    applyCenter()

    return () => observer.disconnect()
  }, [centerMainTrigger, onCenterMain, scrollRef])

  return (
    <div className="canvas-blocks-layer" aria-label="Canvas blocks">
      <ConnectionLayer
        edges={allCanvasEdges}
        blockIds={blockIds}
        useCanvasCoordinates
      />

      {topLevelBlocks.map((block) => {
        const placement = placementMap.get(block.id)!
        const isDragging = dragContext.draggingBlockId === block.id

        return (
          <div
            key={block.id}
            ref={mainBlockRef}
            className={`canvas-blocks-layer__block${isDragging ? ' canvas-blocks-layer__block--dragging' : ''}`}
            data-block-id={block.id}
            style={{
              left: placement.x - scrollOffset.left,
              top: placement.y - scrollOffset.top,
              zIndex: getBlockZ(block.id),
            }}
            onPointerDown={handleBlockFocus(block.id)}
          >
            <ResizableContainer
              blockId={block.id}
              layoutOverride={block.visual?.layout}
            >
              <div className="canvas-block">
                <header
                  className="canvas-block__header"
                  onPointerDown={onBlockPointerDown?.(
                    block.id,
                    placement.x,
                    placement.y,
                  )}
                >
                  <span className="canvas-block__grip">⠿</span>
                  <span className="canvas-block__title">
                    {canvasBlockTitle(block)}
                  </span>
                </header>
                <div className="canvas-block__body">
                  <CanvasBlockContext.Provider value={{ isTopLevel: true }}>
                    <BlockRenderer
                      block={block}
                      activeBlockId={activeBlockId}
                      connections={allCanvasEdges}
                    />
                  </CanvasBlockContext.Provider>
                </div>
              </div>
            </ResizableContainer>
          </div>
        )
      })}
    </div>
  )
}
