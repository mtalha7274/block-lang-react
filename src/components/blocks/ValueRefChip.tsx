import type { BlockNode } from '../../types'
import { typeColorMap } from '../../constants'
import { NodePort } from '../ui/NodePort'
import './ValueRefChip.css'

interface ValueRefChipProps {
  block: Extract<BlockNode, { kind: 'valueRef' }>
  onRemove?: () => void
  showInputPort?: boolean
  inputPortId?: string
}

export function ValueRefChip({
  block,
  onRemove,
  showInputPort = false,
  inputPortId = 'value-in',
}: ValueRefChipProps) {
  const { label, valueType } = block.data
  const isError = block.visual?.state === 'error'
  const color = typeColorMap[valueType]

  return (
    <div
      className={`value-ref-chip${isError ? ' value-ref-chip--error' : ''}`}
      style={{ '--chip-color': color } as React.CSSProperties}
      data-block-id={block.id}
      title={block.visual?.errorMessage}
    >
      {showInputPort && (
        <NodePort
          portId={inputPortId}
          type={valueType}
          direction="in"
          connected
          invalid={isError}
        />
      )}
      <span className="value-ref-chip__type">{valueType}</span>
      <span className="value-ref-chip__label">{label}</span>
      <span className="value-ref-chip__ref" aria-hidden>
        ↗
      </span>
      {onRemove && (
        <button
          type="button"
          className="value-ref-chip__remove"
          aria-label="Remove reference"
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </div>
  )
}
