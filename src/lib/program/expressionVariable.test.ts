import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import {
  defaultOperatorForValueType,
  inferExpressionResultType,
  normalizeExpressionForSlot,
} from './expressionVariable'

describe('expressionVariable', () => {
  it('coerces expression operator for boolean if-condition slots', () => {
    const ifBlock = createBlockFromKind('if')
    const expression = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    const target = {
      kind: 'if-condition' as const,
      parentBlockId: ifBlock.id,
    }

    const normalized = normalizeExpressionForSlot(expression, target, 'boolean', () => [ifBlock])
    expect(normalized.data.operator).toBe('==')
    expect(normalized.data.resultType).toBe('boolean')
    expect(normalized.data.resultName).toBe('cond')
  })

  it('infers boolean type from comparison operators', () => {
    expect(inferExpressionResultType('==')).toBe('boolean')
    expect(inferExpressionResultType('+')).toBe('number')
  })

  it('preserves existing expression resultName when attaching to another value slot', () => {
    const variable = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    const expression = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    expression.data.resultName = 'total'
    const target = {
      kind: 'variable-value' as const,
      parentBlockId: variable.id,
    }

    const normalized = normalizeExpressionForSlot(expression, target, 'number', () => [variable])
    expect(normalized.data.resultName).toBe('total')
    expect(normalized.data.operator).toBe('+')
  })

  it('picks default operators for value types', () => {
    expect(defaultOperatorForValueType('boolean')).toBe('==')
    expect(defaultOperatorForValueType('number')).toBe('+')
  })
})
