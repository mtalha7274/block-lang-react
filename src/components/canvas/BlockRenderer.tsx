import type { BlockNode, RenderChildOptions, ConnectionEdge } from '../../types'
import { isValueSourceBlock } from '../../lib/program/scope'
import { getUsageInPortId } from '../../lib/program/valueRef'
import {
  MainFunctionBlock,
  PrimitiveBlock,
  VariableBlock,
  ExpressionBlock,
  IfBlock,
  ForLoopBlock,
  WhileLoopBlock,
  FunctionBlock,
  FunctionCallBlock,
  TypeBlock,
  PrintBlock,
  ReturnBlock,
  MinimizedBlockChip,
  ValueRefChip,
} from '../blocks'
import { isBlockEditing, useDragContext } from './DragContext'
import './BlockRenderer.css'

export interface BlockRendererProps {
  block: BlockNode
  activeBlockId?: string
  compact?: boolean
  inStatementBody?: boolean
  inEditorPanel?: boolean
  slotFit?: boolean
  nestedView?: boolean
  connections?: ConnectionEdge[]
}

function consumerInputPort(block: BlockNode): { show: boolean; portId: string; type: import('../../types').ValueType } | null {
  if (block.kind === 'print' && block.data.value?.kind === 'valueRef') {
    return {
      show: true,
      portId: getUsageInPortId({ kind: 'print-value', parentBlockId: block.id }),
      type: block.data.value.data.valueType,
    }
  }
  if (block.kind === 'return' && block.data.value?.kind === 'valueRef') {
    return {
      show: true,
      portId: getUsageInPortId({ kind: 'return-value', parentBlockId: block.id }),
      type: block.data.value.data.valueType,
    }
  }
  if (block.kind === 'if' && block.data.condition?.kind === 'valueRef') {
    return {
      show: true,
      portId: getUsageInPortId({ kind: 'if-condition', parentBlockId: block.id }),
      type: block.data.condition.data.valueType,
    }
  }
  return null
}

export function BlockRenderer({
  block,
  activeBlockId,
  compact = false,
  inStatementBody = false,
  inEditorPanel = false,
  slotFit = false,
  nestedView = false,
  connections = [],
}: BlockRendererProps) {
  const ctx = useDragContext()
  const useCompact = compact && !slotFit

  const renderChild = (node: BlockNode, opts?: RenderChildOptions) => {
    const childSlotFit = opts?.slotFit ?? slotFit
    const childInBody = opts?.inStatementBody ?? inStatementBody
    const childNestedView = opts?.nestedView ?? true

    return (
      <BlockRenderer
        block={node}
        activeBlockId={activeBlockId}
        compact={opts?.compact ?? compact}
        inStatementBody={childInBody}
        inEditorPanel={inEditorPanel}
        slotFit={childSlotFit}
        nestedView={childNestedView}
        connections={connections}
      />
    )
  }

  if (block.kind === 'valueRef') {
    return (
      <ValueRefChip
        block={block}
        onRemove={() => ctx.detachNestedBlock(block.id)}
      />
    )
  }

  if (nestedView && block.kind !== 'main') {
    const inputPort = consumerInputPort(block)
    return (
      <MinimizedBlockChip
        block={block}
        isSelected={isBlockEditing(ctx, block.id)}
        onOpenEditor={(anchorEl) => ctx.openBlockEditor(block.id, anchorEl)}
        onRemove={() => ctx.detachNestedBlock(block.id)}
        onChipPointerDown={
          ctx.onNestedChipPointerDown
            ? (e, anchor) =>
                ctx.onNestedChipPointerDown!(
                  block.id,
                  e,
                  anchor,
                  (a) => ctx.openBlockEditor(block.id, a),
                )
            : undefined
        }
        onReferenceDragStart={
          isValueSourceBlock(block)
            ? ctx.onReferenceDragStart(block.id)
            : undefined
        }
        usageOutPort={isValueSourceBlock(block)}
        usageInPortId={inputPort?.show ? inputPort.portId : undefined}
        callOutPort={connections.some(
          (c) => c.purpose === 'wire' && c.from.blockId === block.id,
        )}
        onCallOutOpen={
          block.kind === 'functionCall'
            ? () => ctx.openBlockEditor(ctx.getEditorTargetBlockId(block.id))
            : undefined
        }
      />
    )
  }

  const common = {
    renderChild,
    activeBlockId,
    compact: useCompact,
    inStatementBody,
    inEditorPanel,
    connections,
  }

  const rendererClass = `block-renderer${useCompact ? ' block-renderer--compact' : ''}${slotFit ? ' block-renderer--slot-fit' : ''}`

  switch (block.kind) {
    case 'main':
      return (
        <div className="block-renderer" data-block-id={block.id}>
          <MainFunctionBlock
            block={block}
            renderChild={renderChild}
            activeBlockId={activeBlockId}
            connections={connections}
          />
        </div>
      )
    case 'primitive':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <PrimitiveBlock block={block} activeBlockId={activeBlockId} compact={useCompact} />
        </div>
      )
    case 'variable':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <VariableBlock block={block} {...common} />
        </div>
      )
    case 'type':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <TypeBlock block={block} renderChild={renderChild} activeBlockId={activeBlockId} compact={useCompact} />
        </div>
      )
    case 'expression':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <ExpressionBlock block={block} {...common} />
        </div>
      )
    case 'if':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <IfBlock block={block} {...common} />
        </div>
      )
    case 'for':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <ForLoopBlock block={block} {...common} />
        </div>
      )
    case 'while':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <WhileLoopBlock block={block} {...common} />
        </div>
      )
    case 'function':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <FunctionBlock block={block} {...common} />
        </div>
      )
    case 'functionCall':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <FunctionCallBlock block={block} {...common} />
        </div>
      )
    case 'print':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <PrintBlock block={block} {...common} />
        </div>
      )
    case 'return':
      return (
        <div className={rendererClass} data-block-id={block.id}>
          <ReturnBlock block={block} {...common} />
        </div>
      )
    default:
      return null
  }
}
