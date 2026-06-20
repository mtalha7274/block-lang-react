import { useCallback, useRef, useState, type RefObject } from 'react'
import type { BlockKind, BlockNode, SlotTarget, ValueType } from '../types'
import {
  canAttachBlockToSlot,
  canAttachPaletteKindToSlot,
  slotRejectMessage,
} from '../lib/validation/slotRules'
import { createValueRefFromSource } from '../lib/program/valueRef'
import { getInScopeValuesForConsumer, isValueSourceBlock } from '../lib/program/scope'

import type { HoverPreviewSize } from '../components/canvas/DragContext'
import { slotTargetKey } from '../components/canvas/DragContext'
import { slotTargetFromPoint } from '../lib/drag/slotTargetFromElement'

export const PALETTE_DRAG_TYPE = 'application/blocklang-block'

const BLOCK_KIND_PREVIEW: Record<BlockKind, HoverPreviewSize> = {
  main: { width: 300, height: 140 },
  primitive: { width: 120, height: 32 },
  variable: { width: 140, height: 32 },
  type: { width: 220, height: 120 },
  expression: { width: 140, height: 32 },
  if: { width: 340, height: 220 },
  for: { width: 300, height: 240 },
  while: { width: 260, height: 180 },
  function: { width: 300, height: 260 },
  functionCall: { width: 140, height: 32 },
  print: { width: 120, height: 32 },
  return: { width: 120, height: 32 },
  valueRef: { width: 100, height: 28 },
}

function resolvePreviewSize(
  block: BlockNode | null,
  kind: BlockKind | null,
  measured: HoverPreviewSize | null,
): HoverPreviewSize | null {
  if (measured) return measured
  if (block) return BLOCK_KIND_PREVIEW[block.kind]
  if (kind) return BLOCK_KIND_PREVIEW[kind]
  return null
}

function evaluateReferenceSlotValidity(
  target: SlotTarget,
  sourceBlockId: string,
  findBlock: (id: string) => BlockNode | undefined,
  getBlocks: () => BlockNode[],
): boolean {
  const source = findBlock(sourceBlockId)
  if (!source || !isValueSourceBlock(source)) return false

  const valueRef = createValueRefFromSource(source)
  if (!valueRef) return false

  const consumerId = target.parentBlockId
  const inScope = getInScopeValuesForConsumer(getBlocks(), consumerId)
  if (!inScope.some((v) => v.blockId === sourceBlockId)) return false

  return canAttachBlockToSlot(target, valueRef, findBlock, {}, getBlocks)
}

function evaluateSlotValidity(
  target: SlotTarget,
  block: BlockNode | null,
  kind: BlockKind | null,
  findBlock: (id: string) => BlockNode | undefined,
  getBlocks: () => BlockNode[],
): boolean {
  if (block) return canAttachBlockToSlot(target, block, findBlock, {}, getBlocks)
  if (kind) return canAttachPaletteKindToSlot(target, kind, findBlock, getBlocks)
  return false
}

function dropRejectMessage(
  target: SlotTarget,
  kind: BlockKind | null,
  block: BlockNode | null,
  expectedType: ValueType | undefined,
  findBlock: (id: string) => BlockNode | undefined,
  getBlocks: () => BlockNode[],
): string {
  return slotRejectMessage(target, kind, block, expectedType, findBlock, getBlocks)
}

function clientToSurfacePoint(
  clientX: number,
  clientY: number,
  surface: HTMLElement,
  scrollEl: HTMLElement,
): { x: number; y: number } {
  const rect = surface.getBoundingClientRect()
  return {
    x: clientX - rect.left + scrollEl.scrollLeft,
    y: clientY - rect.top + scrollEl.scrollTop,
  }
}

interface UseBlockDragOptions {
  onMoveBlock: (blockId: string, x: number, y: number) => void
  onAttachBlockId: (blockId: string, target: SlotTarget) => boolean
  onAttachNewBlock: (
    kind: BlockKind,
    target: SlotTarget,
  ) => { accepted: boolean; createdFunctionId?: string }
  onAssignReference: (sourceBlockId: string, target: SlotTarget) => boolean
  onRaiseCanvasBlock?: (blockId: string) => void
  surfaceRef: RefObject<HTMLElement | null>
  scrollRef: RefObject<HTMLElement | null>
  findBlock: (id: string) => BlockNode | undefined
  getBlocks: () => BlockNode[]
}

export function useBlockDrag({
  onMoveBlock,
  onAttachBlockId,
  onAttachNewBlock,
  onAssignReference,
  onRaiseCanvasBlock,
  surfaceRef,
  scrollRef,
  findBlock,
  getBlocks,
}: UseBlockDragOptions) {
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)
  const [draggingPaletteKind, setDraggingPaletteKind] = useState<BlockKind | null>(
    null,
  )
  const [hoverSlot, setHoverSlot] = useState<SlotTarget | null>(null)
  const [slotValidity, setSlotValidity] = useState<'valid' | 'invalid' | null>(
    null,
  )
  const [rejectBlockId, setRejectBlockId] = useState<string | null>(null)
  const [rejectMessage, setRejectMessage] = useState<string | null>(null)
  const [rejectSlotTarget, setRejectSlotTarget] = useState<SlotTarget | null>(null)
  const [draggingReferenceSourceId, setDraggingReferenceSourceId] = useState<
    string | null
  >(null)
  const draggingReferenceSourceIdRef = useRef<string | null>(null)
  const referenceDragRef = useRef<{ sourceBlockId: string } | null>(null)
  const [hoverPreviewSize, setHoverPreviewSize] = useState<HoverPreviewSize | null>(
    null,
  )
  const [referenceDragPosition, setReferenceDragPosition] = useState<{
    x: number
    y: number
  } | null>(null)

  const blockDragRef = useRef<{
    blockId: string
    offsetX: number
    offsetY: number
    originX: number
    originY: number
    blockWidth: number
    blockHeight: number
  } | null>(null)
  const draggingPaletteKindRef = useRef<BlockKind | null>(null)
  const hoverSlotRef = useRef<SlotTarget | null>(null)

  const clearReject = useCallback(() => {
    window.setTimeout(() => {
      setRejectBlockId(null)
      setRejectMessage(null)
      setRejectSlotTarget(null)
    }, 500)
  }, [])

  const flashSlotReject = useCallback(
    (
      target: SlotTarget,
      message: string,
      blockId: string | null = null,
    ) => {
      setRejectSlotTarget(target)
      setRejectMessage(message)
      if (blockId) setRejectBlockId(blockId)
      clearReject()
    },
    [clearReject],
  )

  const applySlotEvaluation = useCallback(
    (
      target: SlotTarget,
      block: BlockNode | null,
      kind: BlockKind | null,
      measured: HoverPreviewSize | null,
      referenceSourceId: string | null = draggingReferenceSourceIdRef.current,
    ) => {
      if (referenceSourceId) {
        const valid = evaluateReferenceSlotValidity(
          target,
          referenceSourceId,
          findBlock,
          getBlocks,
        )
        hoverSlotRef.current = target
        setHoverSlot(target)
        setSlotValidity(valid ? 'valid' : 'invalid')
        setHoverPreviewSize(valid ? { width: 100, height: 28 } : null)
        return
      }

      const valid = evaluateSlotValidity(target, block, kind, findBlock, getBlocks)
      hoverSlotRef.current = target
      setHoverSlot(target)
      setSlotValidity(valid ? 'valid' : 'invalid')
      setHoverPreviewSize(
        valid ? resolvePreviewSize(block, kind, measured) : null,
      )
    },
    [findBlock, getBlocks],
  )

  const clearSlotHover = useCallback(() => {
    hoverSlotRef.current = null
    setHoverSlot(null)
    setSlotValidity(null)
    setHoverPreviewSize(null)
  }, [])

  const handlePaletteDragStart = useCallback(
    (kind: BlockKind) => (e: React.DragEvent) => {
      e.dataTransfer.setData(PALETTE_DRAG_TYPE, kind)
      e.dataTransfer.effectAllowed = 'copy'
      draggingPaletteKindRef.current = kind
      setDraggingPaletteKind(kind)
    },
    [],
  )

  const handlePaletteDragEnd = useCallback(() => {
    draggingPaletteKindRef.current = null
    setDraggingPaletteKind(null)
    clearSlotHover()
  }, [clearSlotHover])

  const handleBlockPointerDown = useCallback(
    (blockId: string, currentX: number, currentY: number) =>
      (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('button, input, select, textarea')) {
          return
        }

        const surface = surfaceRef.current
        const scrollEl = scrollRef.current
        if (!surface || !scrollEl) return

        e.preventDefault()
        e.stopPropagation()

        onRaiseCanvasBlock?.(blockId)

        const pointer = clientToSurfacePoint(
          e.clientX,
          e.clientY,
          surface,
          scrollEl,
        )
        const blockEl = (e.currentTarget as HTMLElement).closest(
          '.canvas-blocks-layer__block',
        ) as HTMLElement | null

        blockDragRef.current = {
          blockId,
          offsetX: pointer.x - currentX,
          offsetY: pointer.y - currentY,
          originX: currentX,
          originY: currentY,
          blockWidth: blockEl?.offsetWidth ?? BLOCK_KIND_PREVIEW.main.width,
          blockHeight: blockEl?.offsetHeight ?? BLOCK_KIND_PREVIEW.main.height,
        }
        setDraggingBlockId(blockId)

        const onMove = (ev: PointerEvent) => {
          if (!blockDragRef.current) return

          const dropTarget = slotTargetFromPoint(
            ev.clientX,
            ev.clientY,
            blockDragRef.current.blockId,
          )
          if (dropTarget) {
            const block = findBlock(blockDragRef.current.blockId) ?? null
            const measured = {
              width: blockDragRef.current.blockWidth,
              height: blockDragRef.current.blockHeight,
            }
            applySlotEvaluation(dropTarget, block, null, measured)
            return
          }

          clearSlotHover()

          const moveSurface = surfaceRef.current
          const moveScroll = scrollRef.current
          if (!moveSurface || !moveScroll) return

          const movePointer = clientToSurfacePoint(
            ev.clientX,
            ev.clientY,
            moveSurface,
            moveScroll,
          )

          onMoveBlock(
            blockDragRef.current.blockId,
            Math.max(0, movePointer.x - blockDragRef.current.offsetX),
            Math.max(0, movePointer.y - blockDragRef.current.offsetY),
          )
        }

        const onUp = (ev: PointerEvent) => {
          window.removeEventListener('pointermove', onMove)

          if (!blockDragRef.current) return

          const { blockId: draggedId, originX, originY } = blockDragRef.current
          const dropTarget = slotTargetFromPoint(ev.clientX, ev.clientY, draggedId)
          const block = findBlock(draggedId)

          if (dropTarget && block) {
            const valid = evaluateSlotValidity(dropTarget, block, null, findBlock, getBlocks)
            if (valid) {
              const ok = onAttachBlockId(draggedId, dropTarget)
              if (!ok) {
                onMoveBlock(draggedId, originX, originY)
                flashSlotReject(
                  dropTarget,
                  dropRejectMessage(dropTarget, null, block, undefined, findBlock, getBlocks),
                  draggedId,
                )
              }
            } else {
              onMoveBlock(draggedId, originX, originY)
              flashSlotReject(
                dropTarget,
                dropRejectMessage(dropTarget, null, block, undefined, findBlock, getBlocks),
                draggedId,
              )
            }
          }

          onRaiseCanvasBlock?.(draggedId)
          blockDragRef.current = null
          setDraggingBlockId(null)
          clearSlotHover()
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp, { once: true })
      },
    [
      findBlock,
      applySlotEvaluation,
      clearSlotHover,
      onMoveBlock,
      onAttachBlockId,
      flashSlotReject,
      onRaiseCanvasBlock,
      surfaceRef,
      scrollRef,
    ],
  )

  const handleBlockPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!blockDragRef.current) return

      const dropTarget = slotTargetFromPoint(
        e.clientX,
        e.clientY,
        blockDragRef.current.blockId,
      )
      if (dropTarget) {
        const block = findBlock(blockDragRef.current.blockId) ?? null
        const measured = {
          width: blockDragRef.current.blockWidth,
          height: blockDragRef.current.blockHeight,
        }
        applySlotEvaluation(dropTarget, block, null, measured)
        return
      }

      clearSlotHover()

      const surface = surfaceRef.current
      const scrollEl = scrollRef.current
      if (!surface || !scrollEl) return

      const pointer = clientToSurfacePoint(
        e.clientX,
        e.clientY,
        surface,
        scrollEl,
      )

      onMoveBlock(
        blockDragRef.current.blockId,
        Math.max(0, pointer.x - blockDragRef.current.offsetX),
        Math.max(0, pointer.y - blockDragRef.current.offsetY),
      )
    },
    [findBlock, applySlotEvaluation, clearSlotHover, onMoveBlock, surfaceRef, scrollRef],
  )

  const handleBlockPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!blockDragRef.current) return

      const { blockId, originX, originY } = blockDragRef.current
      const dropTarget = slotTargetFromPoint(e.clientX, e.clientY, blockId)
      const block = findBlock(blockId)

      if (dropTarget && block) {
        const valid = evaluateSlotValidity(dropTarget, block, null, findBlock, getBlocks)
        if (valid) {
          const ok = onAttachBlockId(blockId, dropTarget)
          if (!ok) {
            onMoveBlock(blockId, originX, originY)
            flashSlotReject(
              dropTarget,
              dropRejectMessage(dropTarget, null, block, undefined, findBlock, getBlocks),
              blockId,
            )
          }
        } else {
          onMoveBlock(blockId, originX, originY)
          flashSlotReject(
            dropTarget,
            dropRejectMessage(dropTarget, null, block, undefined, findBlock, getBlocks),
            blockId,
          )
        }
      }

      blockDragRef.current = null
      setDraggingBlockId(null)
      clearSlotHover()
      e.currentTarget.releasePointerCapture(e.pointerId)
    },
    [onAttachBlockId, findBlock, onMoveBlock, flashSlotReject, clearSlotHover],
  )

  const handleNestedChipPointerDown = useCallback(
    (
      blockId: string,
      e: React.PointerEvent,
      anchorEl: HTMLElement,
      _openEditor: (_anchor: HTMLElement) => void,
    ) => {
      e.preventDefault()
      e.stopPropagation()

      try {
        anchorEl.setPointerCapture(e.pointerId)
      } catch {
        // Pointer capture may fail in some browsers; window listeners still handle the gesture.
      }

      const startX = e.clientX
      const startY = e.clientY
      let didDrag = false

      const chipWidth = anchorEl.offsetWidth || BLOCK_KIND_PREVIEW.variable.width
      const chipHeight = anchorEl.offsetHeight || BLOCK_KIND_PREVIEW.variable.height

      setDraggingBlockId(blockId)
      blockDragRef.current = {
        blockId,
        offsetX: 0,
        offsetY: 0,
        originX: 0,
        originY: 0,
        blockWidth: chipWidth,
        blockHeight: chipHeight,
      }

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          didDrag = true
        }

        const dropTarget = slotTargetFromPoint(ev.clientX, ev.clientY, blockId)
        if (dropTarget) {
          const block = findBlock(blockId) ?? null
          applySlotEvaluation(dropTarget, block, null, {
            width: chipWidth,
            height: chipHeight,
          })
        } else {
          clearSlotHover()
        }
      }

      const onUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onMove)

        try {
          anchorEl.releasePointerCapture(ev.pointerId)
        } catch {
          // Ignore if capture was not set.
        }

        const dropTarget = slotTargetFromPoint(ev.clientX, ev.clientY, blockId)
        const block = findBlock(blockId)

        if (didDrag && dropTarget && block) {
          const valid = evaluateSlotValidity(dropTarget, block, null, findBlock, getBlocks)
          if (valid) {
            const ok = onAttachBlockId(blockId, dropTarget)
            if (!ok) {
              flashSlotReject(
                dropTarget,
                dropRejectMessage(dropTarget, null, block, undefined, findBlock, getBlocks),
                blockId,
              )
            }
          } else {
            flashSlotReject(
              dropTarget,
              dropRejectMessage(dropTarget, null, block, undefined, findBlock, getBlocks),
              blockId,
            )
          }
        }

        blockDragRef.current = null
        setDraggingBlockId(null)
        clearSlotHover()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp, { once: true })
    },
    [
      findBlock,
      applySlotEvaluation,
      clearSlotHover,
      onAttachBlockId,
      flashSlotReject,
    ],
  )

  const onReferenceDragStart = useCallback(
    (sourceBlockId: string) => (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()

      referenceDragRef.current = { sourceBlockId }
      draggingReferenceSourceIdRef.current = sourceBlockId
      setDraggingReferenceSourceId(sourceBlockId)
      setReferenceDragPosition({ x: e.clientX, y: e.clientY })

      const onMove = (ev: PointerEvent) => {
        setReferenceDragPosition({ x: ev.clientX, y: ev.clientY })
        const dropTarget = slotTargetFromPoint(ev.clientX, ev.clientY, sourceBlockId)
        if (dropTarget) {
          applySlotEvaluation(dropTarget, null, null, null, sourceBlockId)
          return
        }
        clearSlotHover()
      }

      const onUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onMove)

        const dropTarget = slotTargetFromPoint(ev.clientX, ev.clientY, sourceBlockId)
        if (dropTarget) {
          const valid = evaluateReferenceSlotValidity(
            dropTarget,
            sourceBlockId,
            findBlock,
            getBlocks,
          )
          if (valid) {
            const ok = onAssignReference(sourceBlockId, dropTarget)
            if (!ok) {
              flashSlotReject(
                dropTarget,
                'Cannot link to this slot',
                sourceBlockId,
              )
            }
          } else {
            flashSlotReject(
              dropTarget,
              dropRejectMessage(dropTarget, null, findBlock(sourceBlockId) ?? null, undefined, findBlock, getBlocks),
              sourceBlockId,
            )
          }
        }

        referenceDragRef.current = null
        draggingReferenceSourceIdRef.current = null
        setDraggingReferenceSourceId(null)
        setReferenceDragPosition(null)
        clearSlotHover()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp, { once: true })
    },
    [
      applySlotEvaluation,
      clearSlotHover,
      findBlock,
      getBlocks,
      onAssignReference,
      flashSlotReject,
    ],
  )

  const onReferenceDragEnd = useCallback(() => {
    referenceDragRef.current = null
    draggingReferenceSourceIdRef.current = null
    setDraggingReferenceSourceId(null)
    setReferenceDragPosition(null)
    clearSlotHover()
  }, [clearSlotHover])

  const onSlotPointerEnter = useCallback(
    (target: SlotTarget) => {
      const refId = draggingReferenceSourceIdRef.current
      if (refId) {
        applySlotEvaluation(target, null, null, null, refId)
        return
      }

      const block = draggingBlockId ? findBlock(draggingBlockId) ?? null : null
      const measured = blockDragRef.current
        ? { width: blockDragRef.current.blockWidth, height: blockDragRef.current.blockHeight }
        : null
      const kind = draggingPaletteKind ?? draggingPaletteKindRef.current
      applySlotEvaluation(target, block, kind, measured)
    },
    [draggingBlockId, draggingPaletteKind, findBlock, applySlotEvaluation],
  )

  const onSlotPointerLeave = useCallback(
    (target: SlotTarget) => {
      const hovered = hoverSlotRef.current
      if (hovered && slotTargetKey(hovered) === slotTargetKey(target)) {
        clearSlotHover()
      }
    },
    [clearSlotHover],
  )

  const onSlotPointerUp = useCallback(
    (target: SlotTarget) => {
      const refId = draggingReferenceSourceIdRef.current
      if (refId) {
        if (slotValidity === 'valid') {
          const ok = onAssignReference(refId, target)
          if (!ok) {
            flashSlotReject(target, 'Cannot link to this slot', refId)
          }
        } else if (slotValidity === 'invalid') {
          flashSlotReject(
            target,
            dropRejectMessage(target, null, findBlock(refId) ?? null, undefined, findBlock, getBlocks),
            refId,
          )
        }
        draggingReferenceSourceIdRef.current = null
        setDraggingReferenceSourceId(null)
        setHoverSlot(null)
        setSlotValidity(null)
        setHoverPreviewSize(null)
        return
      }

      if (draggingBlockId && slotValidity === 'valid') {
        const ok = onAttachBlockId(draggingBlockId, target)
        if (!ok && blockDragRef.current) {
          onMoveBlock(
            draggingBlockId,
            blockDragRef.current.originX,
            blockDragRef.current.originY,
          )
          const block = findBlock(draggingBlockId)
          flashSlotReject(
            target,
            dropRejectMessage(target, null, block ?? null, undefined, findBlock, getBlocks),
            draggingBlockId,
          )
        }
        blockDragRef.current = null
        setDraggingBlockId(null)
      } else if (draggingBlockId && slotValidity === 'invalid') {
        const block = findBlock(draggingBlockId)
        if (blockDragRef.current) {
          onMoveBlock(
            draggingBlockId,
            blockDragRef.current.originX,
            blockDragRef.current.originY,
          )
        }
        flashSlotReject(
          target,
          dropRejectMessage(target, null, block ?? null, undefined, findBlock, getBlocks),
          draggingBlockId,
        )
        blockDragRef.current = null
        setDraggingBlockId(null)
      }

      if (draggingPaletteKind && slotValidity === 'valid') {
        const result = onAttachNewBlock(draggingPaletteKind, target)
        if (!result.accepted) {
          flashSlotReject(
            target,
            dropRejectMessage(target, draggingPaletteKind, null, undefined, findBlock, getBlocks),
          )
        }
        setDraggingPaletteKind(null)
      } else if (draggingPaletteKind && slotValidity === 'invalid') {
        flashSlotReject(
          target,
          dropRejectMessage(target, draggingPaletteKind, null, undefined, findBlock, getBlocks),
        )
        setDraggingPaletteKind(null)
      }

      setHoverSlot(null)
      setSlotValidity(null)
      setHoverPreviewSize(null)
    },
    [
      draggingBlockId,
      draggingPaletteKind,
      slotValidity,
      onAttachBlockId,
      onAttachNewBlock,
      onAssignReference,
      findBlock,
      onMoveBlock,
      flashSlotReject,
    ],
  )

  const handleSlotDragOver = useCallback(
    (target: SlotTarget, _expectedType?: ValueType) =>
      (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes(PALETTE_DRAG_TYPE)) return
        e.preventDefault()
        e.stopPropagation()
        const kind = draggingPaletteKind ?? draggingPaletteKindRef.current
        if (!kind) return
        applySlotEvaluation(target, null, kind, null)
      },
    [draggingPaletteKind, applySlotEvaluation],
  )

  const handleSlotDrop = useCallback(
    (target: SlotTarget, expectedType?: ValueType) =>
      (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const kind = e.dataTransfer.getData(PALETTE_DRAG_TYPE) as BlockKind
        if (!kind) return

        const valid = evaluateSlotValidity(target, null, kind, findBlock, getBlocks)
        if (!valid) {
          flashSlotReject(
            target,
            dropRejectMessage(target, kind, null, expectedType, findBlock, getBlocks),
          )
        } else {
          const result = onAttachNewBlock(kind, target)
          if (!result.accepted) {
            flashSlotReject(
              target,
              dropRejectMessage(target, kind, null, expectedType, findBlock, getBlocks),
            )
          }
        }

        draggingPaletteKindRef.current = null
        setDraggingPaletteKind(null)
        clearSlotHover()
      },
    [onAttachNewBlock, findBlock, flashSlotReject, clearSlotHover],
  )

  return {
    draggingBlockId,
    draggingPaletteKind,
    draggingReferenceSourceId,
    referenceDragPosition,
    hoverSlot,
    hoverPreviewSize,
    slotValidity,
    rejectBlockId,
    rejectMessage,
    rejectSlotTarget,
    handlePaletteDragStart,
    handlePaletteDragEnd,
    handleBlockPointerDown,
    handleBlockPointerMove,
    handleBlockPointerUp,
    handleNestedChipPointerDown,
    onSlotPointerEnter,
    onSlotPointerLeave,
    onSlotPointerUp,
    onReferenceDragStart,
    onReferenceDragEnd,
    handleSlotDragOver,
    handleSlotDrop,
  }
}
