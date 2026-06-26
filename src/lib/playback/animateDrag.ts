import { getElementCenter } from './slotSelectors'
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export async function animatePointerMove(
  from: { x: number; y: number },
  to: { x: number; y: number },
  durationMs: number,
  onFrame: (point: { x: number; y: number }) => void,
  shouldCancel?: () => boolean,
): Promise<void> {
  const start = performance.now()
  return new Promise((resolve) => {
    const tick = (now: number) => {
      if (shouldCancel?.()) {
        resolve()
        return
      }
      const elapsed = now - start
      const t = Math.min(1, elapsed / durationMs)
      const e = easeInOut(t)
      onFrame({
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
      })
      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(tick)
  })
}

export async function animateDragBetweenElements(
  fromEl: Element,
  toEl: Element,
  durationMs: number,
  onFrame: (point: { x: number; y: number }) => void,
  shouldCancel?: () => boolean,
): Promise<void> {
  const from = getElementCenter(fromEl)
  const to = getElementCenter(toEl)
  await animatePointerMove(from, to, durationMs, onFrame, shouldCancel)
}

export function pulseSlotHover(slotEl: Element | null, on: boolean): void {
  if (!slotEl) return
  slotEl.classList.toggle('slot--playback-hover', on)
}
