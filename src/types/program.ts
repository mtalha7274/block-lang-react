import type { BlockId, ValueType } from './block'

export interface BlockPlacement {
  blockId: BlockId
  x: number
  y: number
}

export interface PortRef {
  blockId: BlockId
  portId: string
}

export interface ConnectionEdge {
  id: string
  from: PortRef
  to: PortRef
  type: ValueType
  valid: boolean
  purpose?: 'usage' | 'wire'
}

export interface ProgramDocument {
  blocks: import('./block').BlockNode[]
  placements: BlockPlacement[]
  connections: ConnectionEdge[]
}

export type StatementBodyRegion =
  | 'main'
  | 'function'
  | 'if-true'
  | 'if-false'
  | 'for'
  | 'while'

export type SlotTarget =
  | { kind: 'variable-value'; parentBlockId: BlockId }
  | {
      kind: 'statement-body'
      parentBlockId: BlockId
      region: StatementBodyRegion
      index?: number
    }
  | { kind: 'type-variable'; parentBlockId: BlockId }
  | { kind: 'function-signature'; parentBlockId: BlockId }
  | { kind: 'call-arg'; parentBlockId: BlockId; argPortId: string }
  | { kind: 'print-value'; parentBlockId: BlockId }
  | { kind: 'return-value'; parentBlockId: BlockId }
  | { kind: 'if-condition'; parentBlockId: BlockId }
  | {
      kind: 'expression-operand'
      parentBlockId: BlockId
      side: 'left' | 'right'
    }
  | { kind: 'for-init'; parentBlockId: BlockId }
  | { kind: 'for-condition'; parentBlockId: BlockId }
  | { kind: 'for-increment'; parentBlockId: BlockId }
  | { kind: 'while-condition'; parentBlockId: BlockId }
