import type { BlockKind, BlockNode, ValueType } from '../../types'
import { typeColorMap } from '../../constants'

export interface MiniBlockView {
  label: string
  color: string
  valueType: ValueType | null
}

export interface BlockContract<TKind extends BlockKind = BlockKind> {
  kind: TKind
  getValueType: (block: Extract<BlockNode, { kind: TKind }>) => ValueType | null
  canUseAsStatement: (block: Extract<BlockNode, { kind: TKind }>) => boolean
  canCreateValueReference: (block: Extract<BlockNode, { kind: TKind }>) => boolean
  getMiniBlockView: (block: Extract<BlockNode, { kind: TKind }>) => MiniBlockView
}

function formatPrimitiveValue(value: string | number | boolean, type: ValueType): string {
  if (type === 'string') return `"${value}"`
  if (type === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function voidColor(): string {
  return typeColorMap.void
}

function primitiveContract(): BlockContract<'primitive'> {
  return {
    kind: 'primitive',
    getValueType: (block) => block.data.valueType,
    canUseAsStatement: () => false,
    canCreateValueReference: () => false,
    getMiniBlockView: (block) => ({
      label: formatPrimitiveValue(block.data.value, block.data.valueType),
      color: typeColorMap[block.data.valueType],
      valueType: block.data.valueType,
    }),
  }
}

function variableContract(): BlockContract<'variable'> {
  return {
    kind: 'variable',
    getValueType: (block) => block.data.valueType,
    canUseAsStatement: () => true,
    canCreateValueReference: () => true,
    getMiniBlockView: (block) => {
      const { name, value, valueType } = block.data
      let label = name
      if (value?.kind === 'primitive') {
        label = `${name} = ${formatPrimitiveValue(value.data.value, value.data.valueType)}`
      } else if (value?.kind === 'valueRef') {
        label = `${name} = ${value.data.label}`
      } else if (value) {
        label = `${name} = ...`
      }
      return { label, color: typeColorMap[valueType], valueType }
    },
  }
}

function expressionContract(): BlockContract<'expression'> {
  return {
    kind: 'expression',
    getValueType: (block) => block.data.resultType,
    canUseAsStatement: () => true,
    canCreateValueReference: () => true,
    getMiniBlockView: (block) => ({
      label: `${block.data.resultName || 'result'} = ...`,
      color: typeColorMap[block.data.resultType],
      valueType: block.data.resultType,
    }),
  }
}

function functionCallContract(): BlockContract<'functionCall'> {
  return {
    kind: 'functionCall',
    getValueType: (block) =>
      block.data.returnType === 'void' ? null : block.data.returnType,
    canUseAsStatement: () => true,
    canCreateValueReference: (block) => block.data.returnType !== 'void',
    getMiniBlockView: (block) => ({
      label: `${block.data.functionName}(...)`,
      color: block.data.returnType === 'void'
        ? voidColor()
        : typeColorMap[block.data.returnType],
      valueType: block.data.returnType === 'void' ? null : block.data.returnType,
    }),
  }
}

function valueRefContract(): BlockContract<'valueRef'> {
  return {
    kind: 'valueRef',
    getValueType: (block) => block.data.valueType === 'void' ? null : block.data.valueType,
    canUseAsStatement: () => false,
    canCreateValueReference: () => false,
    getMiniBlockView: (block) => ({
      label: block.data.label,
      color: typeColorMap[block.data.valueType],
      valueType: block.data.valueType,
    }),
  }
}

function nonValueContract<TKind extends BlockKind>(
  kind: TKind,
  label: (block: Extract<BlockNode, { kind: TKind }>) => string,
  color: string,
  statement: boolean,
): BlockContract<TKind> {
  return {
    kind,
    getValueType: () => null,
    canUseAsStatement: () => statement,
    canCreateValueReference: () => false,
    getMiniBlockView: (block) => ({
      label: label(block),
      color,
      valueType: null,
    }),
  }
}

function ifContract(): BlockContract<'if'> {
  return {
    kind: 'if',
    getValueType: () => null,
    canUseAsStatement: () => true,
    canCreateValueReference: () => false,
    getMiniBlockView: (block) => {
      if (block.data.condition?.kind === 'valueRef') {
        return {
          label: `If ${block.data.condition.data.label}`,
          color: typeColorMap.boolean,
          valueType: null,
        }
      }
      return {
        label: 'If / Else',
        color: typeColorMap.boolean,
        valueType: null,
      }
    },
  }
}

function returnContract(): BlockContract<'return'> {
  return {
    kind: 'return',
    getValueType: () => null,
    canUseAsStatement: () => true,
    canCreateValueReference: () => false,
    getMiniBlockView: (block) => {
      if (block.data.value?.kind === 'valueRef') {
        return {
          label: block.data.value.data.label,
          color: typeColorMap[block.data.value.data.valueType],
          valueType: null,
        }
      }
      if (block.data.value) {
        return {
          label: '…',
          color: voidColor(),
          valueType: null,
        }
      }
      return {
        label: '…',
        color: voidColor(),
        valueType: null,
      }
    },
  }
}

export const blockContracts = {
  main: nonValueContract('main', () => 'Main Function', voidColor(), false),
  primitive: primitiveContract(),
  variable: variableContract(),
  type: nonValueContract('type', () => 'Type', typeColorMap.boolean, false),
  expression: expressionContract(),
  if: ifContract(),
  for: nonValueContract('for', () => 'For', typeColorMap.boolean, true),
  while: nonValueContract('while', () => 'While', typeColorMap.boolean, true),
  function: nonValueContract('function', (block) => block.data.name, voidColor(), false),
  functionCall: functionCallContract(),
  print: nonValueContract('print', (block) => {
    if (block.data.value?.kind === 'valueRef') return `PRINT ${block.data.value.data.label}`
    return block.data.value ? 'PRINT ...' : 'PRINT'
  }, typeColorMap.string, true),
  return: returnContract(),
  valueRef: valueRefContract(),
} satisfies { [K in BlockKind]: BlockContract<K> }

function contractFor(block: BlockNode): BlockContract {
  return blockContracts[block.kind] as BlockContract
}

export function getBlockValueType(block: BlockNode): ValueType | null {
  return contractFor(block).getValueType(block as never)
}

export function isValueReturningBlock(block: BlockNode): boolean {
  return getBlockValueType(block) !== null
}

export function canUseAsStatement(block: BlockNode): boolean {
  return contractFor(block).canUseAsStatement(block as never)
}

export function canCreateValueReference(block: BlockNode): boolean {
  return contractFor(block).canCreateValueReference(block as never)
}

export function getMiniBlockView(block: BlockNode): MiniBlockView {
  return contractFor(block).getMiniBlockView(block as never)
}

export function getValueLabel(block: BlockNode): string | null {
  if (!canCreateValueReference(block)) return null
  return getMiniBlockView(block).label
}
