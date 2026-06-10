import type { BlockCategory, BlockKind, ValueType } from '../types'

export interface BlockRegistryEntry {
  kind: BlockKind
  label: string
  category: BlockCategory
  stage: string
  stripeColor: string
  description: string
}

export const blockRegistry: Record<BlockKind, BlockRegistryEntry> = {
  main: {
    kind: 'main',
    label: 'Main Function',
    category: 'function',
    stage: 'basics',
    stripeColor: 'var(--type-void)',
    description: 'Program entry point',
  },
  primitive: {
    kind: 'primitive',
    label: 'Constant',
    category: 'primitive',
    stage: 'basics',
    stripeColor: 'var(--type-number)',
    description: 'A typed constant value (number, string, or boolean)',
  },
  variable: {
    kind: 'variable',
    label: 'Variable',
    category: 'variable',
    stage: 'basics',
    stripeColor: 'var(--type-string)',
    description: 'Typed variable assignment',
  },
  type: {
    kind: 'type',
    label: 'Type',
    category: 'variable',
    stage: 'basics',
    stripeColor: 'var(--type-boolean)',
    description: 'Function parameter signature',
  },
  expression: {
    kind: 'expression',
    label: 'Expression',
    category: 'variable',
    stage: 'expressions',
    stripeColor: 'var(--type-number)',
    description: 'Arithmetic or comparison',
  },
  if: {
    kind: 'if',
    label: 'If / Else',
    category: 'control',
    stage: 'control',
    stripeColor: 'var(--type-boolean)',
    description: 'Conditional branch',
  },
  for: {
    kind: 'for',
    label: 'For Loop',
    category: 'control',
    stage: 'control',
    stripeColor: 'var(--type-boolean)',
    description: 'Counted loop',
  },
  while: {
    kind: 'while',
    label: 'While Loop',
    category: 'control',
    stage: 'control',
    stripeColor: 'var(--type-boolean)',
    description: 'Condition loop',
  },
  function: {
    kind: 'function',
    label: 'Function',
    category: 'function',
    stage: 'functions',
    stripeColor: 'var(--type-void)',
    description: 'Reusable function block',
  },
  functionCall: {
    kind: 'functionCall',
    label: 'Function Call',
    category: 'function',
    stage: 'functions',
    stripeColor: 'var(--type-void)',
    description: 'Call a function by name',
  },
  print: {
    kind: 'print',
    label: 'Print',
    category: 'variable',
    stage: 'basics',
    stripeColor: 'var(--type-string)',
    description: 'Print a value to the output panel',
  },
  valueRef: {
    kind: 'valueRef',
    label: 'Reference',
    category: 'variable',
    stage: 'basics',
    stripeColor: 'var(--type-string)',
    description: 'In-scope value reference',
  },
}

export const typeColorMap: Record<ValueType, string> = {
  number: 'var(--type-number)',
  string: 'var(--type-string)',
  boolean: 'var(--type-boolean)',
  void: 'var(--type-void)',
}

export const categoryStripeMap: Record<BlockCategory, string> = {
  primitive: 'var(--stripe-primitive)',
  variable: 'var(--stripe-variable)',
  control: 'var(--stripe-control)',
  function: 'var(--stripe-function)',
}
