import type { BlockNode, ValueType } from '../../types'
import { getValueTypeFromSource } from '../../lib/program/scope'
import { NodePort } from '../ui'
import './ValueSourceOutPort.css'

interface ValueSourceOutPortProps {
  block: BlockNode
  onPointerDown: (e: React.PointerEvent) => void
}

export function ValueSourceOutPort({ block, onPointerDown }: ValueSourceOutPortProps) {
  const valueType = getValueTypeFromSource(block) as ValueType | null
  if (!valueType) return null

  return (
    <div
      className="value-source-out-port"
      onPointerDown={(e) => {
        e.stopPropagation()
        onPointerDown(e)
      }}
    >
      <NodePort
        portId="value-out"
        type={valueType}
        direction="out"
        connected
      />
    </div>
  )
}
