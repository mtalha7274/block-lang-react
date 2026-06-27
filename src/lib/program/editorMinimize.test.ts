import { describe, expect, it } from 'vitest'
import { createBlockFromKind } from '../../constants/blockDefaults'
import { collectSubtreeBlockIds } from './collectDescendantBlockIds'

describe('editor minimize cascade', () => {
  it('collects nested block ids under a parent for stack closure', () => {
    const ifBlock = createBlockFromKind('if')
    const variable = createBlockFromKind('variable')
    if (ifBlock.kind !== 'if' || variable.kind !== 'variable') {
      throw new Error('expected if and variable blocks')
    }
    ifBlock.data.trueBranch = [variable]

    const nestedExpr = createBlockFromKind('expression')
    if (nestedExpr.kind !== 'expression') throw new Error('expected expression')
    variable.data.value = nestedExpr

    const subtree = collectSubtreeBlockIds(ifBlock)
    expect(subtree).toContain(variable.id)
    expect(subtree).toContain(nestedExpr.id)
    expect(subtree).not.toContain(ifBlock.id)
  })
})
