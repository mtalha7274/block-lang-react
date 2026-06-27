import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { functionParamSourceId } from './functionParams'
import { getInScopeValuesForConsumer } from './scope'

describe('scope nested in control flow', () => {
  it('exposes function params inside an if branch', () => {
    const main = createBlockFromKind('main') as Extract<BlockNode, { kind: 'main' }>
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const paramRow = { id: 'param-a', name: 'amount', type: 'number' as const }
    fn.data.params = [paramRow]
    const ifBlock = createBlockFromKind('if')
    const branchExpr = createBlockFromKind('expression')
    if (ifBlock.kind === 'if') ifBlock.data.trueBranch = [branchExpr]
    fn.data.body = [ifBlock]
    const blocks = [main, fn]

    const inScope = getInScopeValuesForConsumer(blocks, branchExpr.id)
    expect(
      inScope.some((v) => v.blockId === functionParamSourceId(fn.id, paramRow.id)),
    ).toBe(true)
  })

  it('exposes earlier function body variables inside a while body', () => {
    const main = createBlockFromKind('main') as Extract<BlockNode, { kind: 'main' }>
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const countVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    countVar.data.name = 'count'
    const whileBlock = createBlockFromKind('while')
    const bodyExpr = createBlockFromKind('expression')
    if (whileBlock.kind === 'while') whileBlock.data.body = [bodyExpr]
    fn.data.body = [countVar, whileBlock]
    const blocks = [main, fn]

    const inScope = getInScopeValuesForConsumer(blocks, bodyExpr.id)
    expect(inScope.some((v) => v.blockId === countVar.id && v.label === 'count')).toBe(true)
  })

  it('exposes function params to while condition slots', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const paramRow = { id: 'param-a', name: 'flag', type: 'boolean' as const }
    fn.data.params = [paramRow]
    const whileBlock = createBlockFromKind('while')
    fn.data.body = [whileBlock]
    const blocks = [fn]

    const inScope = getInScopeValuesForConsumer(blocks, whileBlock.id)
    expect(
      inScope.some((v) => v.blockId === functionParamSourceId(fn.id, paramRow.id)),
    ).toBe(true)
  })

  it('exposes function body variables declared after an if to the if branch', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const ifBlock = createBlockFromKind('if')
    const branchExpr = createBlockFromKind('expression')
    const totalVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    totalVar.data.name = 'total'
    if (ifBlock.kind === 'if') ifBlock.data.trueBranch = [branchExpr]
    fn.data.body = [ifBlock, totalVar]
    const blocks = [fn]

    const inScope = getInScopeValuesForConsumer(blocks, branchExpr.id)
    expect(inScope.some((v) => v.blockId === totalVar.id && v.label === 'total')).toBe(true)
  })

  it('exposes function params inside a while loop body', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const paramRow = { id: 'param-c', name: 'count', type: 'number' as const }
    fn.data.params = [paramRow]
    const whileBlock = createBlockFromKind('while')
    const bodyExpr = createBlockFromKind('expression')
    if (whileBlock.kind === 'while') whileBlock.data.body = [bodyExpr]
    fn.data.body = [whileBlock]
    const blocks = [fn]

    const inScope = getInScopeValuesForConsumer(blocks, bodyExpr.id)
    expect(
      inScope.some((v) => v.blockId === functionParamSourceId(fn.id, paramRow.id)),
    ).toBe(true)
  })
})
