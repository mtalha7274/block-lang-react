import { describe, expect, it } from 'vitest'
import { createBlockFromKind } from '../../constants/blockDefaults'
import {
  defaultOperatorForValueType,
  inferExpressionResultType,
  normalizeExpressionForSlot,
} from './expressionVariable'

describe('expressionVariable', () => {
  it('infers boolean type from comparison operators', () => {
    expect(inferExpressionResultType('==')).toBe('boolean')
    expect(inferExpressionResultType('>')).toBe('boolean')
  })

  it('infers number type from arithmetic operators', () => {
    expect(inferExpressionResultType('+')).toBe('number')
    expect(inferExpressionResultType('%')).toBe('number')
  })

  it('normalizes expression for boolean if-condition slots', () => {
    const ifBlock = createBlockFromKind('if')
    const expression = createBlockFromKind('expression')
    if (expression.kind !== 'expression') throw new Error('expected expression')

    const normalized = normalizeExpressionForSlot(
      expression,
      { kind: 'if-condition', parentBlockId: ifBlock.id },
      'boolean',
      () => [ifBlock],
    )

    expect(normalized.data.operator).toBe('==')
    expect(normalized.data.resultType).toBe('boolean')
    expect(normalized.data.resultName).toBe('cond')
  })

  it('picks default boolean operator for boolean slots', () => {
    expect(defaultOperatorForValueType('boolean')).toBe('==')
  })
})
