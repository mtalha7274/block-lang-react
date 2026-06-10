import type { BlockId } from '../../types'

export interface CompileError {
  blockId: BlockId
  message: string
}

export interface CompileResult {
  code: string
  errors: CompileError[]
}

export type EmitMode = 'expression' | 'statement'
