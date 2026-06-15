import type { BlockNode } from '../../types'
import type { CompileContext } from './compileContext'
import type { CompileError, EmitMode } from './types'
import { emitExpression } from './emitExpression'
import { emitStatement, emitFunction } from './emitStatement'

export function emitBlock(
  block: BlockNode,
  ctx: CompileContext,
  errors: CompileError[],
  depth: number,
  mode: EmitMode,
): string[] {
  if (mode === 'expression') {
    const expr = emitExpression(block, ctx, errors, depth)
    return expr !== null ? [expr] : []
  }

  switch (block.kind) {
    case 'function':
      return emitFunction(block, ctx, errors)
    case 'main':
    case 'type':
      return []
    default:
      return emitStatement(block, ctx, errors, depth)
  }
}
