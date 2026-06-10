export function computeCenteredMainPlacement(
  scrollEl: HTMLElement,
  mainBlockEl: HTMLElement,
  margin = 24,
): { x: number; y: number } {
  const blockWidth = mainBlockEl.offsetWidth
  const blockHeight = mainBlockEl.offsetHeight
  const x = Math.max(
    margin,
    scrollEl.scrollLeft + (scrollEl.clientWidth - blockWidth) / 2,
  )
  const y = Math.max(
    margin,
    scrollEl.scrollTop + (scrollEl.clientHeight - blockHeight) / 2,
  )
  return { x, y }
}
