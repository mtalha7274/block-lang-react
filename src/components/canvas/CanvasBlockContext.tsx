import { createContext, useContext } from 'react'

interface CanvasBlockContextValue {
  isTopLevel: boolean
}

export const CanvasBlockContext = createContext<CanvasBlockContextValue | null>(null)

export function useCanvasBlockContext(): CanvasBlockContextValue | null {
  return useContext(CanvasBlockContext)
}
