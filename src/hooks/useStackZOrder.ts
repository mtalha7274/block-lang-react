import { useCallback, useRef, useState } from 'react'

export function useStackZOrder(baseZ = 10) {
  const counterRef = useRef(baseZ)
  const [zOrder, setZOrder] = useState<Record<string, number>>({})

  const raise = useCallback((id: string) => {
    counterRef.current += 1
    const next = counterRef.current
    setZOrder((prev) => ({ ...prev, [id]: next }))
    return next
  }, [])

  const getZ = useCallback(
    (id: string, fallback = baseZ) => zOrder[id] ?? fallback,
    [zOrder, baseZ],
  )

  return { raise, getZ, zOrder }
}
