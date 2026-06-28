import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { functionParamSourceId } from './functionParams'
import {
  getAssignableInScopeValues,
  resolveAssignableBinding,
  resolveScopeConsumerForStatementBody,
} from './scope'

describe('scope reassignment helpers', () => {
  it('resolves statement-body scope consumer from the last statement in a branch', () => {
    const main = createBlockFromKind('main') as Extract<BlockNode, { kind: 'main' }>
    const countVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    countVar.data.name = 'count'
    const ifBlock = createBlockFromKind('if')
    const branchExpr = createBlockFromKind('expression')
    if (ifBlock.kind === 'if') {
      ifBlock.data.trueBranch = [countVar, branchExpr]
    }
    main.data.body = [ifBlock]
    const blocks = [main]

    expect(
      resolveScopeConsumerForStatementBody(blocks, {
        kind: 'statement-body',
        parentBlockId: ifBlock.id,
        region: 'if-true',
      }),
    ).toBe(branchExpr.id)
  })

  it('lists only assignable variables and params', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const paramRow = { id: 'param-a', name: 'amount', type: 'number' as const }
    fn.data.params = [paramRow]
    const countVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    countVar.data.name = 'count'
    const expr = createBlockFromKind('expression')
    fn.data.body = [countVar, expr]
    const blocks = [fn]

    const assignable = getAssignableInScopeValues(blocks, expr.id)
    expect(assignable.some((v) => v.blockId === countVar.id)).toBe(true)
    expect(
      assignable.some((v) => v.blockId === functionParamSourceId(fn.id, paramRow.id)),
    ).toBe(true)
    expect(assignable.every((v) => v.kind === 'variable' || v.kind === 'functionParam')).toBe(
      true,
    )
  })

  it('resolves assignable bindings from variables and params', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const paramRow = { id: 'param-a', name: 'amount', type: 'number' as const }
    fn.data.params = [paramRow]
    const countVar = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    countVar.data.name = 'count'
    fn.data.body = [countVar]
    const blocks = [fn]

    expect(resolveAssignableBinding(blocks, countVar.id)).toEqual({
      name: 'count',
      valueType: 'number',
    })
    expect(
      resolveAssignableBinding(blocks, functionParamSourceId(fn.id, paramRow.id)),
    ).toEqual({
      name: 'amount',
      valueType: 'number',
    })
  })
})
