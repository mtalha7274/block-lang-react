import type { BlockNode } from '../../types'
import type { CompileContext } from './compileContext'
import type { CompileError } from './types'
import { deriveFunctionParams } from '../program/functionParams'
import { emitExpression } from './emitExpression'
import { emitBlock } from './emitBlock'

export function emitStatement(
  block: BlockNode,
  ctx: CompileContext,
  errors: CompileError[],
  depth = 0,
): string[] {
  if (block.visual?.state === 'error') {
    const msg = block.visual.errorMessage ?? 'Block has an error'
    errors.push({ blockId: block.id, message: msg })
    return [`// Error: ${msg}`]
  }

  const ind = ctx.indent(depth)

  switch (block.kind) {
    case 'variable': {
      const name = ctx.sanitizeIdentifier(block.data.name)
      const { valueType, value } = block.data
      if (!value) {
        if (ctx.declaredNames.has(name)) {
          return [`${ind}// ${name} already declared`]
        }
        ctx.declaredNames.add(name)
        return [`${ind}let ${name}: ${valueType};`]
      }
      const expr = emitExpression(value, ctx, errors, depth)
      if (expr === null) {
        return [`${ind}// Error: missing value for variable ${name}`]
      }
      if (ctx.declaredNames.has(name)) {
        return [`${ind}${name} = ${expr};`]
      }
      ctx.declaredNames.add(name)
      return [`${ind}let ${name}: ${valueType} = ${expr};`]
    }

    case 'expression': {
      const expr = emitExpression(block, ctx, errors, depth)
      if (expr === null) return []
      if (block.data.resultName) {
        const name = ctx.sanitizeIdentifier(block.data.resultName)
        return [`${ind}let ${name}: ${block.data.resultType} = ${expr};`]
      }
      return [`${ind}${expr};`]
    }

    case 'functionCall': {
      const expr = emitExpression(block, ctx, errors, depth)
      if (expr === null) return []
      return [`${ind}${expr};`]
    }

    case 'print': {
      if (!block.data.value) {
        return [`${ind}// Error: print block missing value`]
      }
      const expr = emitExpression(block.data.value, ctx, errors, depth)
      if (expr === null) {
        return [`${ind}// Error: print block missing value`]
      }
      return [`${ind}console.log(${expr});`]
    }

    case 'return': {
      if (!ctx.inFunctionBody) {
        errors.push({ blockId: block.id, message: 'Return outside function' })
        return [`${ind}// Error: return outside function`]
      }
      if (ctx.currentFunctionReturnType === 'void' || !block.data.value) {
        return [`${ind}return;`]
      }
      const expr = emitExpression(block.data.value, ctx, errors, depth)
      if (expr === null) {
        return [`${ind}// Error: return missing value`]
      }
      return [`${ind}return ${expr};`]
    }

    case 'if': {
      const cond = block.data.condition
        ? emitExpression(block.data.condition, ctx, errors, depth)
        : null
      if (cond === null) {
        return [`${ind}// Error: if block missing condition`]
      }
      const lines: string[] = [`${ind}if (${cond}) {`]
      for (const stmt of block.data.trueBranch) {
        lines.push(...emitStatement(stmt, ctx, errors, depth + 1))
      }
      if (block.data.falseBranch && block.data.falseBranch.length > 0) {
        lines.push(`${ind}} else {`)
        for (const stmt of block.data.falseBranch) {
          lines.push(...emitStatement(stmt, ctx, errors, depth + 1))
        }
      }
      lines.push(`${ind}}`)
      return lines
    }

    case 'for': {
      const initLines = block.data.init
        ? emitForInit(block.data.init, ctx, errors)
        : ''
      const cond = block.data.condition
        ? emitExpression(block.data.condition, ctx, errors, depth)
        : 'true'
      const inc = block.data.increment
        ? emitForIncrement(block.data.increment, ctx, errors)
        : ''
      const lines: string[] = [
        `${ind}for (${initLines}; ${cond ?? 'true'}; ${inc}) {`,
      ]
      for (const stmt of block.data.body) {
        lines.push(...emitStatement(stmt, ctx, errors, depth + 1))
      }
      lines.push(`${ind}}`)
      return lines
    }

    case 'while': {
      const cond = block.data.condition
        ? emitExpression(block.data.condition, ctx, errors, depth)
        : null
      if (cond === null) {
        return [`${ind}// Error: while block missing condition`]
      }
      const lines: string[] = [`${ind}while (${cond}) {`]
      for (const stmt of block.data.body) {
        lines.push(...emitStatement(stmt, ctx, errors, depth + 1))
      }
      lines.push(`${ind}}`)
      return lines
    }

    default:
      return emitBlock(block, ctx, errors, depth, 'statement')
  }
}

function emitForInit(
  block: BlockNode,
  ctx: CompileContext,
  errors: CompileError[],
): string {
  if (block.kind === 'variable') {
    const name = ctx.sanitizeIdentifier(block.data.name)
    const expr = block.data.value
      ? emitExpression(block.data.value, ctx, errors)
      : '0'
    return `let ${name}: ${block.data.valueType} = ${expr ?? '0'}`
  }
  return ''
}

function emitForIncrement(
  block: BlockNode,
  ctx: CompileContext,
  errors: CompileError[],
): string {
  if (block.kind === 'expression') {
    const expr = emitExpression(block, ctx, errors)
    if (expr && block.data.resultName) {
      const name = ctx.sanitizeIdentifier(block.data.resultName)
      return `${name} = ${expr}`
    }
    return expr ?? ''
  }
  return ''
}

export function emitFunction(
  block: Extract<BlockNode, { kind: 'function' }>,
  ctx: CompileContext,
  errors: CompileError[],
): string[] {
  const name = ctx.sanitizeIdentifier(block.data.name)
  const params = deriveFunctionParams(block)
  const paramStr = params.map((p) => `${p.name}: ${p.type}`).join(', ')
  const lines: string[] = [
    `function ${name}(${paramStr}): ${block.data.returnType} {`,
  ]

  const prevInFunction = ctx.inFunctionBody
  const prevReturnType = ctx.currentFunctionReturnType
  const prevDeclaredNames = new Set(ctx.declaredNames)
  ctx.inFunctionBody = true
  ctx.currentFunctionReturnType = block.data.returnType
  params.forEach((p) => ctx.declaredNames.add(ctx.sanitizeIdentifier(p.name)))
  for (const stmt of block.data.body) {
    lines.push(...emitStatement(stmt, ctx, errors, 1))
  }
  ctx.inFunctionBody = prevInFunction
  ctx.currentFunctionReturnType = prevReturnType
  ctx.declaredNames.clear()
  prevDeclaredNames.forEach((n) => ctx.declaredNames.add(n))

  if (block.data.body.length === 0 && block.data.returnType === 'void') {
    lines.push('  // empty')
  }

  lines.push('}')
  return lines
}
