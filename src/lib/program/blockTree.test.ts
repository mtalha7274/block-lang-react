import { describe, expect, it } from 'vitest'
import { updateNestedVariableValue } from './blockTree'
import type { BlockNode } from '../../types'

describe('updateNestedVariableValue', () => {
  const constant = (id: string, value: number): BlockNode => ({
    id,
    kind: 'primitive',
    data: { valueType: 'number', value },
  })

  it('updates a variable nested inside an if true branch', () => {
    const blocks: BlockNode[] = [
      {
        id: 'main',
        kind: 'main',
        data: {
          body: [
            {
              id: 'demo-if',
              kind: 'if',
              data: {
                condition: constant('cond', 1),
                trueBranch: [
                  {
                    id: 'if-var',
                    kind: 'variable',
                    data: { valueType: 'number', name: 'x' },
                  },
                ],
              },
            },
          ],
        },
      },
    ]

    const next = updateNestedVariableValue(blocks, 'if-var', constant('val', 42))
    const ifBlock = next[0]
    expect(ifBlock.kind).toBe('main')
    if (ifBlock.kind !== 'main') return

    const branchVar = ifBlock.data.body[0]
    expect(branchVar.kind).toBe('if')
    if (branchVar.kind !== 'if') return

    const variable = branchVar.data.trueBranch[0]
    expect(variable.kind).toBe('variable')
    if (variable.kind !== 'variable') return

    expect(variable.data.value?.kind).toBe('primitive')
    if (variable.data.value?.kind === 'primitive') {
      expect(variable.data.value.data.value).toBe(42)
    }
  })
})
