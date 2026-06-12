import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { getInScopeValuesForConsumer } from './scope'

describe('scope', () => {
  it('exposes earlier function body value sources to return block consumer', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const variable = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    variable.data.name = 'count'
    const ret = createBlockFromKind('return')
    fn.data.body = [variable, ret]
    const blocks = [fn]

    const inScope = getInScopeValuesForConsumer(blocks, ret.id)
    expect(inScope.some((v) => v.blockId === variable.id && v.label === 'count')).toBe(true)
  })
})
