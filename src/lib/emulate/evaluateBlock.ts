import type { BlockNode, OperatorSymbol, ProgramDocument, ValueType } from '../../types'
import { findBlockInTree } from '../program/blockTree'
import { resolveFunctionCall } from '../program/resolveFunctionCall'
import { deriveTypeParams } from '../program/typeParams'
import type { Runtime, RuntimeValue } from './runtime'
import { EmulationError } from './types'

function assertType(value: RuntimeValue, expected: ValueType, context: string): void {
  const actual =
    typeof value === 'number'
      ? 'number'
      : typeof value === 'string'
        ? 'string'
        : 'boolean'
  if (actual !== expected) {
    throw new EmulationError(`${context}: expected ${expected}, got ${actual}`)
  }
}

function primitiveValue(
  block: Extract<BlockNode, { kind: 'primitive' }>,
): RuntimeValue {
  const { valueType, value } = block.data
  if (valueType === 'number') return Number(value)
  if (valueType === 'boolean') return Boolean(value)
  if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }
  return String(value)
}

function applyOperator(
  op: OperatorSymbol,
  left: RuntimeValue,
  right: RuntimeValue,
): RuntimeValue {
  switch (op) {
    case '+':
      if (typeof left === 'string' || typeof right === 'string') {
        return String(left) + String(right)
      }
      return Number(left) + Number(right)
    case '-':
      return Number(left) - Number(right)
    case '*':
      return Number(left) * Number(right)
    case '/':
      return Number(left) / Number(right)
    case '%':
      return Number(left) % Number(right)
    case '==':
      return left === right
    case '!=':
      return left !== right
    case '>':
      return Number(left) > Number(right)
    case '<':
      return Number(left) < Number(right)
    case '>=':
      return Number(left) >= Number(right)
    case '<=':
      return Number(left) <= Number(right)
    default:
      throw new EmulationError(`Unsupported operator: ${op}`)
  }
}

export function evaluateExpression(
  block: BlockNode,
  runtime: Runtime,
  doc: ProgramDocument,
): RuntimeValue {
  if (block.visual?.state === 'error') {
    throw new EmulationError(
      block.visual.errorMessage ?? 'Block has an error',
      block.id,
    )
  }

  runtime.lastBlockId = block.id

  switch (block.kind) {
    case 'primitive':
      return primitiveValue(block)

    case 'variable':
      return runtime.get(block.data.name).value

    case 'expression': {
      if (!block.data.left || !block.data.right) {
        throw new EmulationError('Expression is incomplete', block.id)
      }
      const left = evaluateExpression(block.data.left, runtime, doc)
      const right = evaluateExpression(block.data.right, runtime, doc)
      return applyOperator(block.data.operator, left, right)
    }

    case 'functionCall': {
      const resolved = resolveFunctionCall(block, doc)
      if (!resolved) {
        throw new EmulationError(
          `Unknown function: ${block.data.functionName}`,
          block.id,
        )
      }
      const argValues = resolved.args.map((arg) => {
        if (!arg.value) {
          throw new EmulationError(
            `Missing argument: ${arg.name}`,
            block.id,
          )
        }
        return evaluateExpression(arg.value, runtime, doc)
      })
      return callFunction(resolved.functionBlock, argValues, runtime, doc)
    }

    case 'valueRef': {
      const source = findBlockInTree(doc.blocks, block.data.sourceBlockId)
      if (!source) {
        throw new EmulationError(
          block.visual?.errorMessage ?? 'Referenced value was removed',
          block.id,
        )
      }
      return evaluateExpression(source, runtime, doc)
    }

    default:
      throw new EmulationError(`Cannot use ${block.kind} as expression`, block.id)
  }
}

function callFunction(
  fn: Extract<BlockNode, { kind: 'function' }>,
  argValues: RuntimeValue[],
  runtime: Runtime,
  doc: ProgramDocument,
): RuntimeValue {
  const params = fn.data.signature ? deriveTypeParams(fn.data.signature) : []
  const locals: Record<string, import('./runtime').RuntimeEntry> = {}
  params.forEach((p, i) => {
    const val = argValues[i] ?? 0
    locals[p.name] = { value: val, type: p.type }
  })

  const argLabel = params
    .map((p, i) => `${p.name}=${runtime.formatValue(argValues[i] ?? 0)}`)
    .join(', ')
  runtime.pushFrame(fn.id, `${fn.data.name}(${argLabel})`, locals)

  let returnValue: RuntimeValue =
    fn.data.returnType === 'void' ? false : defaultForType(fn.data.returnType)

  try {
    const bodyResult = executeBlockList(fn.data.body, runtime, doc, true)
    if (bodyResult !== undefined) {
      returnValue = bodyResult
    }
  } finally {
    runtime.popFrame()
  }

  if (fn.data.returnType !== 'void') {
    assertType(returnValue, fn.data.returnType, `Return type for ${fn.data.name}`)
  }

  return returnValue
}

export function executeStatement(
  block: BlockNode,
  runtime: Runtime,
  doc: ProgramDocument,
  inFunction = false,
): RuntimeValue | undefined {
  if (block.visual?.state === 'error') {
    throw new EmulationError(
      block.visual.errorMessage ?? 'Block has an error',
      block.id,
    )
  }

  runtime.lastBlockId = block.id

  switch (block.kind) {
    case 'variable': {
      const { name, valueType, value } = block.data
      if (!value) {
        runtime.set(name, defaultForType(valueType), valueType)
        return undefined
      }
      const val = evaluateExpression(value, runtime, doc)
      assertType(val, valueType, `Variable ${name}`)
      runtime.set(name, val, valueType)
      return undefined
    }

    case 'expression': {
      const val = evaluateExpression(block, runtime, doc)
      if (block.data.resultName) {
        runtime.set(block.data.resultName, val, block.data.resultType)
      }
      return undefined
    }

    case 'functionCall': {
      evaluateExpression(block, runtime, doc)
      return undefined
    }

    case 'print': {
      if (!block.data.value) {
        throw new EmulationError('Print block missing value', block.id)
      }
      const val = evaluateExpression(block.data.value, runtime, doc)
      runtime.appendOutput(block.id, runtime.formatValue(val))
      return undefined
    }

    case 'return': {
      if (!inFunction) {
        throw new EmulationError('Return outside function', block.id)
      }
      if (block.data.value) {
        return evaluateExpression(block.data.value, runtime, doc)
      }
      return undefined
    }

    case 'if': {
      if (!block.data.condition) {
        throw new EmulationError('If block missing condition', block.id)
      }
      const cond = evaluateExpression(block.data.condition, runtime, doc)
      let branchResult: RuntimeValue | undefined
      if (cond) {
        branchResult = executeBlockList(block.data.trueBranch, runtime, doc, inFunction)
      } else if (block.data.falseBranch) {
        branchResult = executeBlockList(block.data.falseBranch, runtime, doc, inFunction)
      }
      if (branchResult !== undefined && inFunction) return branchResult
      return undefined
    }

    case 'for': {
      if (block.data.init) {
        executeStatement(block.data.init, runtime, doc, inFunction)
      }
      while (true) {
        if (block.data.condition) {
          const cond = evaluateExpression(block.data.condition, runtime, doc)
          if (!cond) break
        }
        const bodyResult = executeBlockList(block.data.body, runtime, doc, inFunction)
        if (bodyResult !== undefined && inFunction) return bodyResult
        if (block.data.increment) {
          applyForIncrement(block.data.increment, runtime, doc)
        }
      }
      return undefined
    }

    case 'while': {
      if (!block.data.condition) {
        throw new EmulationError('While block missing condition', block.id)
      }
      while (evaluateExpression(block.data.condition, runtime, doc)) {
        const bodyResult = executeBlockList(block.data.body, runtime, doc, inFunction)
        if (bodyResult !== undefined && inFunction) return bodyResult
      }
      return undefined
    }

    default:
      throw new EmulationError(`Unsupported statement: ${block.kind}`, block.id)
  }
}

function executeBlockList(
  blocks: BlockNode[],
  runtime: Runtime,
  doc: ProgramDocument,
  inFunction: boolean,
): RuntimeValue | undefined {
  for (const block of blocks) {
    const result = executeStatement(block, runtime, doc, inFunction)
    if (result !== undefined && inFunction) return result
  }
  return undefined
}

function applyForIncrement(
  block: BlockNode,
  runtime: Runtime,
  doc: ProgramDocument,
): void {
  if (block.kind === 'expression' && block.data.resultName) {
    const val = evaluateExpression(block, runtime, doc)
    runtime.set(block.data.resultName, val, block.data.resultType)
  }
}

function defaultForType(type: ValueType): RuntimeValue {
  switch (type) {
    case 'number':
      return 0
    case 'string':
      return ''
    case 'boolean':
      return false
    default:
      return 0
  }
}
