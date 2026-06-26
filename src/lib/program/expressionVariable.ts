import type { BlockNode, OperatorSymbol, SlotTarget, ValueType } from '../../types'
import { operators } from '../../constants/operators'
import { findBlockInTree } from './blockTree'

export function inferExpressionResultType(operator: OperatorSymbol): ValueType {
  return operators.find((op) => op.symbol === operator)?.resultType ?? 'number'
}

export function defaultOperatorForValueType(type: ValueType): OperatorSymbol {
  switch (type) {
    case 'boolean':
      return '=='
    case 'string':
      return '+'
    default:
      return '+'
  }
}

function collectBoundNames(blocks: BlockNode[]): Set<string> {
  const names = new Set<string>()

  const visit = (block: BlockNode) => {
    if (block.kind === 'variable') {
      names.add(block.data.name)
    }
    if (block.kind === 'expression' && block.data.resultName) {
      names.add(block.data.resultName)
    }

    switch (block.kind) {
      case 'main':
        block.data.body.forEach(visit)
        break
      case 'variable':
        if (block.data.value) visit(block.data.value)
        break
      case 'print':
        if (block.data.value) visit(block.data.value)
        break
      case 'return':
        if (block.data.value) visit(block.data.value)
        break
      case 'functionCall':
        block.data.arguments.forEach((arg) => {
          if (arg.value) visit(arg.value)
        })
        break
      case 'expression':
        if (block.data.left) visit(block.data.left)
        if (block.data.right) visit(block.data.right)
        break
      case 'if':
        if (block.data.condition) visit(block.data.condition)
        block.data.trueBranch.forEach(visit)
        block.data.falseBranch?.forEach(visit)
        break
      case 'for':
        if (block.data.init) visit(block.data.init)
        if (block.data.condition) visit(block.data.condition)
        if (block.data.increment) visit(block.data.increment)
        block.data.body.forEach(visit)
        break
      case 'while':
        if (block.data.condition) visit(block.data.condition)
        block.data.body.forEach(visit)
        break
      case 'function':
        if (block.data.signature) visit(block.data.signature)
        block.data.body.forEach(visit)
        break
      default:
        break
    }
  }

  blocks.forEach(visit)
  return names
}

export function uniqueExpressionResultName(
  blocks: BlockNode[],
  base: string,
  excludeBlockId?: string,
): string {
  const used = collectBoundNames(blocks)
  if (excludeBlockId) {
    const self = findBlockInTree(blocks, excludeBlockId)
    if (self?.kind === 'expression' && self.data.resultName) {
      used.delete(self.data.resultName)
    }
  }

  if (!used.has(base)) return base
  let suffix = 2
  while (used.has(`${base}${suffix}`)) suffix += 1
  return `${base}${suffix}`
}

function defaultResultNameBase(target: SlotTarget): string {
  switch (target.kind) {
    case 'if-condition':
    case 'for-condition':
    case 'while-condition':
      return 'cond'
    case 'for-increment':
      return 'inc'
    case 'expression-operand':
      return 'operand'
    default:
      return 'result'
  }
}

export function normalizeExpressionForSlot(
  block: Extract<BlockNode, { kind: 'expression' }>,
  target: SlotTarget,
  expectedType: ValueType | null | undefined,
  getBlocks: () => BlockNode[],
): Extract<BlockNode, { kind: 'expression' }> {
  let operator = block.data.operator
  let resultType = inferExpressionResultType(operator)

  if (expectedType && expectedType !== 'void' && resultType !== expectedType) {
    operator = defaultOperatorForValueType(expectedType)
    resultType = inferExpressionResultType(operator)
  }

  const baseName = defaultResultNameBase(target)
  const resultName = uniqueExpressionResultName(getBlocks(), baseName, block.id)

  return {
    ...block,
    data: {
      ...block.data,
      operator,
      resultType,
      resultName,
    },
  }
}
