import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { updateNestedVariableValue } from './blockTree'

describe('updateNestedVariableValue', () => {
  it('updates variable values nested inside function bodies', () => {
    const fn = createBlockFromKind('function') as Extract<BlockNode, { kind: 'function' }>
    const variable = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    variable.data.name = 'total'
    fn.data.body = [variable]

    const expression = createBlockFromKind('expression')
    const blocks = updateNestedVariableValue([fn], variable.id, expression)

    const updatedFn = blocks[0]
    expect(updatedFn?.kind).toBe('function')
    if (updatedFn?.kind === 'function') {
      const updatedVar = updatedFn.data.body[0]
      expect(updatedVar?.kind).toBe('variable')
      if (updatedVar?.kind === 'variable') {
        expect(updatedVar.data.value?.kind).toBe('expression')
      }
    }
  })

  it('updates variable values in main body', () => {
    const main = createBlockFromKind('main')
    const variable = createBlockFromKind('variable') as Extract<BlockNode, { kind: 'variable' }>
    if (main.kind === 'main') {
      main.data.body = [variable]
    }

    const primitive = createBlockFromKind('primitive')
    const blocks = updateNestedVariableValue([main], variable.id, primitive)

    const updatedMain = blocks[0]
    expect(updatedMain?.kind).toBe('main')
    if (updatedMain?.kind === 'main') {
      expect(updatedMain.data.body[0]?.kind).toBe('variable')
      if (updatedMain.data.body[0]?.kind === 'variable') {
        expect(updatedMain.data.body[0].data.value?.kind).toBe('primitive')
      }
    }
  })
})
