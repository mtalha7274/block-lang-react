import type { BlockNode } from '../../types'
import { findBlockInTree } from '../program/blockTree'
import type { CompileContext } from './compileContext'
import type { CompileError } from './types'
import { resolveFunctionCall } from '../program/resolveFunctionCall'

function formatPrimitive(block: Extract<BlockNode, { kind: 'primitive' }>): string {
  const { valueType, value } = block.data
  if (valueType === 'string') {
    if (typeof value === 'string') {
      if (value.startsWith('"') && value.endsWith('"')) return value
      return `"${value.replace(/"/g, '\\"')}"`
    }
    return `"${String(value)}"`
  }
  if (valueType === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

export function emitExpression(
  block: BlockNode,
  ctx: CompileContext,
  errors: CompileError[],
  depth = 0,
): string | null {
  if (block.visual?.state === 'error') {
    errors.push({
      blockId: block.id,
      message: block.visual.errorMessage ?? 'Block has an error',
    })
    return null
  }

  switch (block.kind) {
    case 'primitive':
      return formatPrimitive(block)

    case 'variable':
      return ctx.sanitizeIdentifier(block.data.name)

    case 'expression': {
      const left = block.data.left
        ? emitExpression(block.data.left, ctx, errors, depth)
        : null
      const right = block.data.right
        ? emitExpression(block.data.right, ctx, errors, depth)
        : null
      if (left === null || right === null) return null
      return `${left} ${block.data.operator} ${right}`
    }

    case 'functionCall': {
      const resolved = resolveFunctionCall(block, ctx.doc)
      if (!resolved) {
        errors.push({
          blockId: block.id,
          message: `Unknown function: ${block.data.functionName}`,
        })
        return null
      }
      const argExprs = resolved.args.map((arg) => {
        if (arg.value) {
          const expr = emitExpression(arg.value, ctx, errors, depth)
          return expr ?? arg.name
        }
        return ctx.sanitizeIdentifier(arg.name)
      })
      return `${resolved.functionBlock.data.name}(${argExprs.join(', ')})`
    }

    case 'valueRef': {
      const source = findBlockInTree(ctx.doc.blocks, block.data.sourceBlockId)
      if (!source) {
        errors.push({
          blockId: block.id,
          message: block.visual?.errorMessage ?? 'Referenced value was removed',
        })
        return null
      }
      return emitExpression(source, ctx, errors, depth)
    }

    default:
      return null
  }
}

export function emitExpressionWrapped(
  block: BlockNode,
  ctx: CompileContext,
  errors: CompileError[],
): string | null {
  const expr = emitExpression(block, ctx, errors)
  if (expr === null) return null
  if (block.kind === 'expression') return expr
  return expr
}
