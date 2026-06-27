import { useCallback, useRef, useState } from 'react'

export function useStackZOrder(baseZ = 10) {
  const counterRef = useRef(baseZ)
  const [zOrder, setZOrder] = useState<Record<string, number>>({})

  const raise = useCallback((id: string) => {
    let next = 0
    setZOrder((prev) => {
      next = Math.max(counterRef.current, ...Object.values(prev)) + 1
      counterRef.current = next
      return { ...prev, [id]: next }
    })
    return next
  }, [])

  const getZ = useCallback(
    (id: string, fallback = baseZ) => zOrder[id] ?? fallback,
    [zOrder, baseZ],
  )

  return { raise, getZ, zOrder }
}
