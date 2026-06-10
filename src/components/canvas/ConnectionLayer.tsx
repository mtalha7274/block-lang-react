import { useEffect, useRef, useState } from 'react'
import type { ConnectionEdge } from '../../types'
import { buildBezierPath, getPortCenter } from './portUtils'
import './ConnectionLayer.css'

interface ConnectionLayerProps {
  edges: ConnectionEdge[]
  blockIds: string[]
}

interface RenderedEdge {
  id: string
  path: string
  valid: boolean
  type: string
}

export function ConnectionLayer({ edges, blockIds }: ConnectionLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderedEdges, setRenderedEdges] = useState<RenderedEdge[]>([])

  useEffect(() => {
    const container = containerRef.current?.parentElement
    if (!container) return

    const measure = () => {
      const next: RenderedEdge[] = []

      for (const edge of edges) {
        const from = getPortCenter(
          container,
          edge.from.blockId,
          edge.from.portId,
        )
        const to = getPortCenter(container, edge.to.blockId, edge.to.portId)

        if (from && to) {
          next.push({
            id: edge.id,
            path: buildBezierPath(from, to),
            valid: edge.valid,
            type: edge.type,
          })
        }
      }

      setRenderedEdges(next)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(container)

    return () => observer.disconnect()
  }, [edges, blockIds])

  return (
    <div ref={containerRef} className="connection-layer" aria-hidden="true">
      <svg className="connection-layer__svg">
        {renderedEdges.map((edge) => (
          <path
            key={edge.id}
            d={edge.path}
            className={`edge ${edge.valid ? 'edge--valid' : 'edge--invalid'} edge--${edge.type}`}
            fill="none"
          />
        ))}
      </svg>
    </div>
  )
}
