import { describe, expect, it } from 'vitest'
import { findBlockInTree, updateNestedVariableValue } from './blockTree'
import type { BlockNode } from '../../types'

describe('blockTree nested slots', () => {
  const constant = (id: string, value: number): BlockNode => ({
    id,
    kind: 'primitive',
    data: { valueType: 'number', value },
  })

  const forWithInitVar = (): BlockNode[] => [
    {
      id: 'main',
      kind: 'main',
      data: {
        body: [
          {
            id: 'loop',
            kind: 'for',
            data: {
              init: {
                id: 'init-var',
                kind: 'variable',
                data: { valueType: 'number', name: 'i' },
              },
              condition: constant('cond', 1),
              increment: undefined,
              body: [],
            },
          },
        ],
      },
    },
  ]

  it('finds variables nested in for init slots', () => {
    const blocks = forWithInitVar()
    expect(findBlockInTree(blocks, 'init-var')?.kind).toBe('variable')
  })

  it('updates a variable nested inside a for init slot', () => {
    const next = updateNestedVariableValue(forWithInitVar(), 'init-var', constant('val', 0))
    const forBlock = next[0]
    expect(forBlock.kind).toBe('main')
    if (forBlock.kind !== 'main') return

    const loop = forBlock.data.body[0]
    expect(loop.kind).toBe('for')
    if (loop.kind !== 'for') return

    expect(loop.data.init?.kind).toBe('variable')
    if (loop.data.init?.kind === 'variable') {
      expect(loop.data.init.data.value?.kind).toBe('primitive')
    }
  })
})
