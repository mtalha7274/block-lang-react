import type { BlockKind, BlockNode, OperatorSymbol, SlotTarget, ValueType } from '../../types'
import { operators } from '../../constants/operators'
import {
  canUseAsStatement,
  getBlockValueType,
  isValueReturningBlock,
} from '../program/blockContract'
import { findEnclosingFunction, isStatementBodyInsideFunction } from '../program/enclosingFunction'

type FindBlock = (id: string) => BlockNode | undefined
type GetBlocks = () => BlockNode[]

export type SlotRequirement =
  | {
      kind: 'value'
      expectedType: ValueType | null
      message: string
    }
  | {
      kind: 'statement'
      message: string
    }
  | {
      kind: 'specific'
      allowedKinds: BlockKind[]
      expectedType?: ValueType
      message: string
    }
  | {
      kind: 'unavailable'
      message: string
    }

export interface AttachOptions {
  allowPrimitiveTypeInit?: boolean
}

const STATEMENT_PALETTE_KINDS = new Set<BlockKind>([
  'variable',
  'print',
  'return',
  'functionCall',
  'if',
  'for',
  'while',
])

const RETURN_VALUE_KINDS: BlockKind[] = [
  'primitive',
  'variable',
  'expression',
  'valueRef',
]

function defaultValueTypeForKind(kind: BlockKind): ValueType | null {
  switch (kind) {
    case 'primitive':
      return 'number'
    case 'variable':
      return 'number'
    case 'expression':
      return 'number'
    case 'functionCall':
      return 'number'
    default:
      return null
  }
}

function paletteKindReturnsValue(kind: BlockKind): boolean {
  return kind === 'primitive' || defaultValueTypeForKind(kind) !== null
}

function defaultValueForType(type: ValueType): string | number | boolean {
  switch (type) {
    case 'number':
      return 0
    case 'string':
      return ''
    case 'boolean':
      return true
    default:
      return 0
  }
}

function isStatementBodyParent(block: BlockNode | undefined, target: SlotTarget): boolean {
  if (!block || target.kind !== 'statement-body') return false
  if (target.region === 'main') return block.kind === 'main'
  if (target.region === 'function') return block.kind === 'function'
  if (target.region === 'if-true' || target.region === 'if-false') {
    return block.kind === 'if'
  }
  if (target.region === 'for') return block.kind === 'for'
  if (target.region === 'while') return block.kind === 'while'
  return false
}

export function getExpressionOperandType(operator: OperatorSymbol): ValueType {
  const entry = operators.find((op) => op.symbol === operator)
  if (!entry) return 'number'
  return entry.resultType === 'boolean' ? 'number' : entry.resultType
}

export function getSlotRequirement(
  target: SlotTarget,
  findBlock: FindBlock,
  _getBlocks: GetBlocks = () => [],
): SlotRequirement {
  if (target.kind === 'variable-value') {
    const parent = findBlock(target.parentBlockId)
    if (parent?.kind !== 'variable') {
      return { kind: 'unavailable', message: 'Variable value slot is unavailable' }
    }
    return {
      kind: 'value',
      expectedType: parent.data.valueType,
      message: `Drop a ${parent.data.valueType} value here`,
    }
  }

  if (target.kind === 'statement-body') {
    const parent = findBlock(target.parentBlockId)
    if (!isStatementBodyParent(parent, target)) {
      return { kind: 'unavailable', message: 'Statement body slot is unavailable' }
    }
    return {
      kind: 'statement',
      message:
        'Drop a Variable, Print, Return, Function Call, or control-flow block here',
    }
  }

  if (target.kind === 'return-value') {
    const parent = findBlock(target.parentBlockId)
    if (parent?.kind !== 'return') {
      return { kind: 'unavailable', message: 'Return value slot is unavailable' }
    }
    const fn = findEnclosingFunction(_getBlocks(), parent.id)
    if (!fn) {
      return { kind: 'unavailable', message: 'Return must be inside a function' }
    }
    if (fn.data.returnType === 'void') {
      return { kind: 'unavailable', message: 'Void functions cannot return a value' }
    }
    return {
      kind: 'specific',
      allowedKinds: RETURN_VALUE_KINDS,
      expectedType: fn.data.returnType,
      message: `Drop a ${fn.data.returnType} value to return`,
    }
  }

  if (target.kind === 'type-variable') {
    const parent = findBlock(target.parentBlockId)
    if (parent?.kind !== 'type') {
      return { kind: 'unavailable', message: 'Type variable slot is unavailable' }
    }
    return {
      kind: 'specific',
      allowedKinds: ['variable'],
      message: 'Drop a Variable here',
    }
  }

  if (target.kind === 'function-signature') {
    const parent = findBlock(target.parentBlockId)
    if (parent?.kind !== 'function' || parent.data.signature) {
      return { kind: 'unavailable', message: 'Function signature slot is unavailable' }
    }
    return {
      kind: 'specific',
      allowedKinds: ['type'],
      message: 'Drop a Type block here',
    }
  }

  if (target.kind === 'call-arg') {
    const parent = findBlock(target.parentBlockId)
    if (parent?.kind !== 'functionCall') {
      return { kind: 'unavailable', message: 'Function argument slot is unavailable' }
    }
    const arg = parent.data.arguments.find((a) => a.portId === target.argPortId)
    if (!arg) {
      return { kind: 'unavailable', message: 'Function argument slot is unavailable' }
    }
    return {
      kind: 'value',
      expectedType: arg.type,
      message: `Drop a ${arg.type} value here`,
    }
  }

  if (target.kind === 'print-value') {
    const parent = findBlock(target.parentBlockId)
    if (parent?.kind !== 'print') {
      return { kind: 'unavailable', message: 'Print value slot is unavailable' }
    }
    return {
      kind: 'value',
      expectedType: null,
      message: 'Drop a value to print here',
    }
  }

  if (target.kind === 'if-condition') {
    const parent = findBlock(target.parentBlockId)
    if (parent?.kind !== 'if') {
      return { kind: 'unavailable', message: 'If condition slot is unavailable' }
    }
    return {
      kind: 'value',
      expectedType: 'boolean',
      message: 'Drop a boolean condition here',
    }
  }

  if (target.kind === 'expression-operand') {
    const parent = findBlock(target.parentBlockId)
    if (parent?.kind !== 'expression') {
      return { kind: 'unavailable', message: 'Expression slot is unavailable' }
    }
    const operandType = getExpressionOperandType(parent.data.operator)
    return {
      kind: 'value',
      expectedType: operandType,
      message: `Drop a ${operandType} value here`,
    }
  }

  if (target.kind === 'for-init') {
    const parent = findBlock(target.parentBlockId)
    if (parent?.kind !== 'for') {
      return { kind: 'unavailable', message: 'For init slot is unavailable' }
    }
    return {
      kind: 'specific',
      allowedKinds: ['variable'],
      expectedType: 'number',
      message: 'Drop a number Variable for loop init',
    }
  }

  if (target.kind === 'for-condition' || target.kind === 'while-condition') {
    const parent = findBlock(target.parentBlockId)
    if (target.kind === 'for-condition' && parent?.kind !== 'for') {
      return { kind: 'unavailable', message: 'For condition slot is unavailable' }
    }
    if (target.kind === 'while-condition' && parent?.kind !== 'while') {
      return { kind: 'unavailable', message: 'While condition slot is unavailable' }
    }
    return {
      kind: 'value',
      expectedType: 'boolean',
      message: 'Drop a boolean condition here',
    }
  }

  if (target.kind === 'for-increment') {
    const parent = findBlock(target.parentBlockId)
    if (parent?.kind !== 'for') {
      return { kind: 'unavailable', message: 'For increment slot is unavailable' }
    }
    return {
      kind: 'specific',
      allowedKinds: ['expression'],
      expectedType: 'number',
      message: 'Drop a number Expression for loop increment',
    }
  }

  return { kind: 'unavailable', message: 'Invalid drop target' }
}

function canMeetSpecificRequirement(
  requirement: Extract<SlotRequirement, { kind: 'specific' }>,
  block: BlockNode,
): boolean {
  if (!requirement.allowedKinds.includes(block.kind)) return false
  if (!requirement.expectedType) return true
  if (block.kind === 'primitive') return requirement.expectedType !== 'void'
  return getBlockValueType(block) === requirement.expectedType
}

export function canAttachBlockToSlot(
  target: SlotTarget,
  block: BlockNode,
  findBlock: FindBlock,
  _options: AttachOptions = {},
  getBlocks: GetBlocks = () => [],
): boolean {
  const requirement = getSlotRequirement(target, findBlock, getBlocks)

  if (requirement.kind === 'unavailable') return false
  if (requirement.kind === 'statement') {
    if (!canUseAsStatement(block)) return false
    if (block.kind === 'return') {
      return isStatementBodyInsideFunction(getBlocks(), target as Extract<SlotTarget, { kind: 'statement-body' }>)
    }
    return true
  }
  if (requirement.kind === 'specific') {
    return canMeetSpecificRequirement(requirement, block)
  }

  if (requirement.expectedType === null) return isValueReturningBlock(block)

  if (block.kind === 'primitive' && requirement.expectedType !== 'void') {
    return true
  }

  return getBlockValueType(block) === requirement.expectedType
}

export function canAttachPaletteKindToSlot(
  target: SlotTarget,
  kind: BlockKind,
  findBlock: FindBlock,
  getBlocks: GetBlocks = () => [],
): boolean {
  const requirement = getSlotRequirement(target, findBlock, getBlocks)

  if (requirement.kind === 'unavailable') return false
  if (requirement.kind === 'statement') {
    if (!STATEMENT_PALETTE_KINDS.has(kind)) return false
    if (kind === 'return') {
      return isStatementBodyInsideFunction(getBlocks(), target as Extract<SlotTarget, { kind: 'statement-body' }>)
    }
    return true
  }
  if (requirement.kind === 'specific') {
    if (!requirement.allowedKinds.includes(kind)) return false
    if (!requirement.expectedType) return true
    if (kind === 'primitive') return requirement.expectedType !== 'void'
    return defaultValueTypeForKind(kind) === requirement.expectedType
  }

  if (requirement.expectedType === null) return paletteKindReturnsValue(kind)
  if (kind === 'primitive' && requirement.expectedType !== 'void') return true
  return defaultValueTypeForKind(kind) === requirement.expectedType
}

export function normalizeBlockForSlot(
  target: SlotTarget,
  block: BlockNode,
  findBlock: FindBlock,
  _options: AttachOptions = {},
  getBlocks: GetBlocks = () => [],
): BlockNode {
  const requirement = getSlotRequirement(target, findBlock, getBlocks)
  if (
    requirement.kind === 'value' &&
    requirement.expectedType &&
    block.kind === 'primitive'
  ) {
    return {
      ...block,
      data: {
        valueType: requirement.expectedType,
        value: defaultValueForType(requirement.expectedType),
      },
    }
  }
  if (
    requirement.kind === 'specific' &&
    requirement.expectedType &&
    block.kind === 'primitive'
  ) {
    return {
      ...block,
      data: {
        valueType: requirement.expectedType,
        value: defaultValueForType(requirement.expectedType),
      },
    }
  }
  return block
}

export function slotRejectMessage(
  target: SlotTarget,
  kind: BlockKind | null,
  block: BlockNode | null,
  expectedType: ValueType | undefined,
  findBlock: FindBlock,
  getBlocks: GetBlocks = () => [],
): string {
  const requirement = getSlotRequirement(target, findBlock, getBlocks)
  if (block && requirement.kind === 'value' && requirement.expectedType) {
    const got = getBlockValueType(block)
    if (got === null) return `This slot needs a ${requirement.expectedType} value`
    return `Needs a ${requirement.expectedType}, not a ${got}`
  }
  if (block && requirement.kind === 'specific' && requirement.expectedType) {
    const got = getBlockValueType(block)
    if (got && got !== requirement.expectedType) {
      return `Needs a ${requirement.expectedType}, not a ${got}`
    }
  }
  if (requirement.kind !== 'unavailable') return requirement.message
  if (expectedType) return `Drop a ${expectedType} value here`
  if (kind) return 'This block cannot go here'
  return requirement.message
}
