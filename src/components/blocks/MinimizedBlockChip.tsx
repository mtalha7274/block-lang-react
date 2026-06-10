import type { BlockNode, ValueType } from '../../types'
import { typeColorMap } from '../../constants'
import { getLabelFromSource, isValueSourceBlock } from '../../lib/program/scope'
import './MinimizedBlockChip.css'

interface MinimizedBlockChipProps {
  block: BlockNode
  onClick: (anchorEl: HTMLElement) => void
  onRemove: () => void
  onReferenceDragStart?: (e: React.PointerEvent) => void
  isSelected?: boolean
  usageOutPort?: boolean
  usageInPortId?: string
}

function formatPrimitiveValue(value: string | number | boolean, type: ValueType): string {
  if (type === 'string') return `"${value}"`
  if (type === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function chipLabel(block: BlockNode): string {
  switch (block.kind) {
    case 'primitive':
      return formatPrimitiveValue(block.data.value, block.data.valueType)
    case 'variable': {
      const { name, value } = block.data
      if (!value) return name
      if (value.kind === 'primitive') {
        return `${name} = ${formatPrimitiveValue(value.data.value, value.data.valueType)}`
      }
      if (value.kind === 'valueRef') return `${name} = ${value.data.label}`
      return `${name} = …`
    }
    case 'print':
      if (block.data.value?.kind === 'valueRef') {
        return `PRINT ${block.data.value.data.label}`
      }
      return block.data.value ? 'PRINT …' : 'PRINT'
    case 'expression':
      return `${block.data.resultName} = …`
    case 'functionCall':
      return `${block.data.functionName}(…)`
    case 'type':
      return 'Type'
    case 'if':
      if (block.data.condition?.kind === 'valueRef') {
        return `If ${block.data.condition.data.label}`
      }
      return 'If / Else'
    case 'for':
      return 'For'
    case 'while':
      return 'While'
    case 'function':
      return block.data.name
    default:
      return block.kind
  }
}

function chipColor(block: BlockNode): string {
  switch (block.kind) {
    case 'primitive':
      return typeColorMap[block.data.valueType]
    case 'variable':
      return typeColorMap[block.data.valueType]
    case 'print':
      return typeColorMap.string
    case 'expression':
      return typeColorMap[block.data.resultType]
    case 'functionCall':
    case 'function':
      return typeColorMap.void
    case 'type':
      return typeColorMap.boolean
    case 'if':
    case 'for':
    case 'while':
      return typeColorMap.boolean
    default:
      return typeColorMap.void
  }
}

function chipTypeLabel(block: BlockNode): ValueType | null {
  switch (block.kind) {
    case 'primitive':
      return block.data.valueType
    case 'variable':
      return block.data.valueType
    case 'expression':
      return block.data.resultType
    case 'functionCall':
      return block.data.returnType
    default:
      return null
  }
}

export function MinimizedBlockChip({
  block,
  onClick,
  onRemove,
  onReferenceDragStart,
  isSelected = false,
  usageOutPort = false,
  usageInPortId,
}: MinimizedBlockChipProps) {
  const typeLabel = chipTypeLabel(block)
  const color = chipColor(block)
  const showReferenceGrip = isValueSourceBlock(block) && !!onReferenceDragStart

  return (
    <div
      className={`minimized-chip${isSelected ? ' minimized-chip--selected' : ''}`}
      style={{ '--chip-color': color } as React.CSSProperties}
      data-block-id={block.id}
    >
      {usageInPortId && (
        <span
          className="usage-anchor usage-anchor--in"
          data-port-id={usageInPortId}
          aria-hidden
        />
      )}
      {usageOutPort && (
        <span className="usage-anchor usage-anchor--out" data-port-id="value-out" aria-hidden />
      )}
      <button
        type="button"
        className="minimized-chip__main"
        onClick={(e) => {
          const anchor = e.currentTarget.closest('[data-block-id]') as HTMLElement
          if (anchor) onClick(anchor)
        }}
      >
        {typeLabel && (
          <span className="minimized-chip__type">{typeLabel}</span>
        )}
        <span className="minimized-chip__label">{chipLabel(block)}</span>
      </button>
      {showReferenceGrip && (
        <button
          type="button"
          className="minimized-chip__link-grip"
          aria-label={`Drag ${getLabelFromSource(block) ?? 'value'} to link`}
          title="Drag to use in another block"
          onPointerDown={(e) => {
            e.stopPropagation()
            onReferenceDragStart?.(e)
          }}
        >
          ⠿
        </button>
      )}
      <button
        type="button"
        className="minimized-chip__remove"
        aria-label="Remove block"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
      >
        ×
      </button>
    </div>
  )
}
