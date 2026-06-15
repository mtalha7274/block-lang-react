export interface Point {
  x: number
  y: number
}

function getAnchorFromBlockEdge(
  blockEl: Element,
  portId: string,
  containerRect: DOMRect,
): Point {
  const blockRect = blockEl.getBoundingClientRect()

  if (portId.endsWith('-in') || portId.includes('-in')) {
    return {
      x: blockRect.left + blockRect.width / 2 - containerRect.left,
      y: blockRect.top - containerRect.top,
    }
  }

  if (portId === 'value-out' || portId.endsWith('-out')) {
    return {
      x: blockRect.left + blockRect.width / 2 - containerRect.left,
      y: blockRect.bottom - containerRect.top,
    }
  }

  return {
    x: blockRect.right - containerRect.left,
    y: blockRect.top + blockRect.height / 2 - containerRect.top,
  }
}

export function getPortCenter(
  container: HTMLElement,
  blockId: string,
  portId: string,
): Point | null {
  const matches = container.querySelectorAll(`[data-block-id="${blockId}"]`)
  if (matches.length === 0) return null

  let blockEl: Element = matches[0]
  for (const el of matches) {
    if (el.querySelector(`[data-port-id="${portId}"]`)) {
      blockEl = el
      break
    }
  }

  if (
    !blockEl.querySelector(`[data-port-id="${portId}"]`) &&
    matches.length > 1
  ) {
    const inner = Array.from(matches).find(
      (el) =>
        el.classList.contains('block-renderer') ||
        el.classList.contains('minimized-chip'),
    )
    if (inner) blockEl = inner
  }

  const portEl = blockEl.querySelector(`[data-port-id="${portId}"]`)
  const containerRect = container.getBoundingClientRect()

  if (portEl) {
    const portRect = portEl.getBoundingClientRect()
    return {
      x: portRect.left + portRect.width / 2 - containerRect.left,
      y: portRect.top + portRect.height / 2 - containerRect.top,
    }
  }

  return getAnchorFromBlockEdge(blockEl, portId, containerRect)
}

export function buildBezierPath(from: Point, to: Point): string {
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  const controlOffset = Math.max(dx * 0.5, dy * 0.35, 24)

  return `M ${from.x} ${from.y} C ${from.x} ${from.y + controlOffset}, ${to.x} ${to.y - controlOffset}, ${to.x} ${to.y}`
}
