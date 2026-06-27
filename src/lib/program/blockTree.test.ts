import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { findBlockInTree, updateBlockInTree, updateNestedVariableValue } from './blockTree'

describe('findBlockInTree', () => {
  it('finds primitives nested in expression operands', () => {
    const main = createBlockFromKind('main')
    const expression = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    const left = createBlockFromKind('primitive')
    const right = createBlockFromKind('primitive')
    expression.data.left = left
    expression.data.right = right
    if (main.kind === 'main') {
      main.data.body = [expression]
    }

    expect(findBlockInTree([main], left.id)?.kind).toBe('primitive')
    expect(findBlockInTree([main], right.id)?.kind).toBe('primitive')
    expect(findBlockInTree([main], expression.id)?.kind).toBe('expression')
  })

  it('finds blocks nested in for-loop slots', () => {
    const main = createBlockFromKind('main')
    const forBlock = createBlockFromKind('for') as Extract<BlockNode, { kind: 'for' }>
    const init = createBlockFromKind('variable')
    const condition = createBlockFromKind('expression')
    forBlock.data.init = init
    forBlock.data.condition = condition
    if (main.kind === 'main') {
      main.data.body = [forBlock]
    }

    expect(findBlockInTree([main], init.id)?.kind).toBe('variable')
    expect(findBlockInTree([main], condition.id)?.kind).toBe('expression')
  })

  it('updates primitive values nested in expression operands', () => {
    const main = createBlockFromKind('main')
    const expression = createBlockFromKind('expression') as Extract<BlockNode, { kind: 'expression' }>
    const left = createBlockFromKind('primitive') as Extract<BlockNode, { kind: 'primitive' }>
    expression.data.left = left
    if (main.kind === 'main') {
      main.data.body = [expression]
    }

    const blocks = updateBlockInTree([main], left.id, (block) => {
      if (block.kind !== 'primitive') return block
      return { ...block, data: { ...block.data, value: 42 } }
    })

    const updated = findBlockInTree(blocks, left.id)
    expect(updated?.kind).toBe('primitive')
    if (updated?.kind === 'primitive') {
      expect(updated.data.value).toBe(42)
    }
  })
})

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
