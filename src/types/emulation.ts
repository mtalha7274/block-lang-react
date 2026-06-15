import type { BlockId, ValueType } from './block'

export type EmulationStatus = 'idle' | 'running' | 'paused' | 'finished' | 'error'

export interface VariableSnapshot {
  name: string
  type: ValueType
  value: string
  active?: boolean
}

export interface StackFrame {
  id: string
  label: string
  active?: boolean
}

export interface EmulationHighlight {
  activeBlockId?: BlockId
  activeVariable?: string
  activeFrameId?: string
}

export interface OutputLine {
  blockId: BlockId
  line: string
}
