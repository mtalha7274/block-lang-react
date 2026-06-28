import type { SlotTarget, StatementBodyRegion } from '../../types'

export function slotTargetFromElement(el: Element | null): SlotTarget | null {
  if (!el || !(el instanceof HTMLElement)) return null
  const slot = el.closest('[data-slot-kind]') as HTMLElement | null
  if (!slot) return null

  const kind = slot.dataset.slotKind
  const parentBlockId = slot.dataset.slotParentId
  if (!kind || !parentBlockId) return null

  switch (kind) {
    case 'variable-value':
      return { kind: 'variable-value', parentBlockId }
    case 'print-value':
      return { kind: 'print-value', parentBlockId }
    case 'return-value':
      return { kind: 'return-value', parentBlockId }
    case 'if-condition':
      return { kind: 'if-condition', parentBlockId }
    case 'type-variable':
      return { kind: 'type-variable', parentBlockId }
    case 'function-signature':
      return { kind: 'function-signature', parentBlockId }
    case 'statement-body': {
      const region = slot.dataset.slotRegion as StatementBodyRegion | undefined
      if (!region) return null
      return { kind: 'statement-body', parentBlockId, region }
    }
    case 'call-arg': {
      const argPortId = slot.dataset.slotArgPortId
      if (!argPortId) return null
      return { kind: 'call-arg', parentBlockId, argPortId }
    }
    case 'expression-operand': {
      const side = slot.dataset.slotSide as 'left' | 'right' | undefined
      if (side !== 'left' && side !== 'right') return null
      return { kind: 'expression-operand', parentBlockId, side }
    }
    case 'for-init':
      return { kind: 'for-init', parentBlockId }
    case 'for-condition':
      return { kind: 'for-condition', parentBlockId }
    case 'for-increment':
      return { kind: 'for-increment', parentBlockId }
    case 'while-condition':
      return { kind: 'while-condition', parentBlockId }
    default:
      return null
  }
}

function shouldSkipHitTestElement(
  el: Element,
  ignoreBlockId?: string,
): boolean {
  if (!(el instanceof HTMLElement)) return true
  if (el.closest('.resize-handle')) return true
  if (ignoreBlockId) {
    const draggingBlock = el.closest(
      `[data-block-id="${ignoreBlockId}"]`,
    ) as HTMLElement | null
    if (draggingBlock) return true
  }
  return false
}

function floatingPanelZIndex(el: Element): number {
  const panel = el.closest('.floating-panel') as HTMLElement | null
  if (!panel) return 0
  const parsed = Number.parseInt(panel.style.zIndex ?? '', 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export function slotTargetFromPoint(
  x: number,
  y: number,
  ignoreBlockId?: string,
): SlotTarget | null {
  let best: { target: SlotTarget; z: number } | null = null

  for (const el of document.elementsFromPoint(x, y)) {
    if (shouldSkipHitTestElement(el, ignoreBlockId)) continue
    const target = slotTargetFromElement(el)
    if (!target) continue

    const z = floatingPanelZIndex(el)
    if (!best || z >= best.z) {
      best = { target, z }
    }
  }

  return best?.target ?? null
}

export function pickTopmostElement(elements: Element[]): Element | null {
  if (elements.length === 0) return null
  let best = elements[0]
  let bestZ = floatingPanelZIndex(best)
  for (const el of elements.slice(1)) {
    const z = floatingPanelZIndex(el)
    if (z >= bestZ) {
      best = el
      bestZ = z
    }
  }
  return best
}
