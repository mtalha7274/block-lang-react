import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import {
  findEnclosingFunction,
  isInsideFunctionBody,
  isStatementBodyInsideFunction,
} from './enclosingFunction'

function functionWithNestedVariable(): BlockNode[] {
  const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
  const ifBlock = createBlockFromKind('if') as Extract<BlockNode, { kind: 'if' }>
  const variable = createBlockFromKind('variable')
  ifBlock.data.trueBranch = [variable]
  fn.data.body = [ifBlock]
  return [fn]
}

describe('enclosingFunction', () => {
  it('finds enclosing function for statement in function body', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const variable = createBlockFromKind('variable')
    fn.data.body = [variable]
    const blocks = [fn]

    expect(findEnclosingFunction(blocks, variable.id)?.id).toBe(fn.id)
    expect(isInsideFunctionBody(blocks, variable.id)).toBe(true)
  })

  it('finds enclosing function for statement nested in if branch', () => {
    const blocks = functionWithNestedVariable()
    const fn = blocks[0]
    const variable = (fn as Extract<BlockNode, { kind: 'function' }>).data.body[0]
      .kind === 'if'
      ? ((fn as Extract<BlockNode, { kind: 'function' }>).data.body[0] as Extract<
          BlockNode,
          { kind: 'if' }
        >).data.trueBranch[0]
      : null

    expect(variable?.kind).toBe('variable')
    if (variable) {
      expect(findEnclosingFunction(blocks, variable.id)?.id).toBe(fn.id)
    }
  })

  it('returns null for statement in main body', () => {
    const main = createBlockFromKind('main') as Extract<BlockNode, { kind: 'main' }>
    const variable = createBlockFromKind('variable')
    main.data.body = [variable]
    const blocks = [main]

    expect(findEnclosingFunction(blocks, variable.id)).toBeNull()
    expect(isInsideFunctionBody(blocks, variable.id)).toBe(false)
  })

  it('detects function statement-body targets', () => {
    const fn = createBlockFromKind('function')
    const blocks = [fn]
    expect(
      isStatementBodyInsideFunction(blocks, {
        kind: 'statement-body',
        parentBlockId: fn.id,
        region: 'function',
      }),
    ).toBe(true)
  })

  it('rejects return in main body', () => {
    const main = createBlockFromKind('main')
    const blocks = [main]
    expect(
      isStatementBodyInsideFunction(blocks, {
        kind: 'statement-body',
        parentBlockId: main.id,
        region: 'main',
      }),
    ).toBe(false)
  })
})
