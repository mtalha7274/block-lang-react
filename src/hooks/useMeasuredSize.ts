import { useEffect, useRef, useState, useCallback } from 'react'

export interface MeasuredSize {
  width: number
  height: number
}

export function useMeasuredSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState<MeasuredSize>({ width: 0, height: 0 })

  const measure = useCallback(() => {
    const node = ref.current
    if (!node) return

    const previousWidth = node.style.width
    const previousMaxWidth = node.style.maxWidth
    node.style.width = 'fit-content'
    node.style.maxWidth = 'none'

    const width = node.scrollWidth
    const height = node.scrollHeight

    node.style.width = previousWidth
    node.style.maxWidth = previousMaxWidth

    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    )
  }, [])

  const setRef = useCallback(
    (node: T | null) => {
      ref.current = node
      if (node) measure()
    },
    [measure],
  )

  useEffect(() => {
    const node = ref.current
    if (!node) return

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [measure])

  return { ref: setRef, size }
}
