import { describe, expect, it } from 'vitest'
import type { BlockNode } from '../../types'
import { createBlockFromKind } from '../../constants/blockDefaults'
import {
  getSiblingEditorIdsToClose,
  getSiblingStatementBlockIds,
} from './editorStackRules'
import { appendToStatementBody } from './blockTree'

describe('editorStackRules', () => {
  it('returns sibling statement ids at the same body level', () => {
    const main = createBlockFromKind('main')
    const variable = createBlockFromKind('variable')
    const print = createBlockFromKind('print')
    if (main.kind !== 'main' || variable.kind !== 'variable' || print.kind !== 'print') {
      throw new Error('unexpected block kind')
    }

    let blocks: BlockNode[] = [main]
    blocks = appendToStatementBody(blocks, main.id, 'main', variable)
    blocks = appendToStatementBody(blocks, main.id, 'main', print)

    expect(getSiblingStatementBlockIds(blocks, variable.id)).toEqual([print.id])
    expect(getSiblingStatementBlockIds(blocks, print.id)).toEqual([variable.id])
  })

  it('closes sibling editors and their nested descendants', () => {
    const main = createBlockFromKind('main')
    const variable = createBlockFromKind('variable')
    const primitive = createBlockFromKind('primitive')
    const print = createBlockFromKind('print')
    if (
      main.kind !== 'main' ||
      variable.kind !== 'variable' ||
      primitive.kind !== 'primitive' ||
      print.kind !== 'print'
    ) {
      throw new Error('unexpected block kind')
    }

    variable.data.value = primitive

    let blocks: BlockNode[] = [main]
    blocks = appendToStatementBody(blocks, main.id, 'main', variable)
    blocks = appendToStatementBody(blocks, main.id, 'main', print)

    const toClose = getSiblingEditorIdsToClose(blocks, print.id)
    expect(toClose.has(variable.id)).toBe(true)
    expect(toClose.has(primitive.id)).toBe(true)
    expect(toClose.has(print.id)).toBe(false)
  })
})
