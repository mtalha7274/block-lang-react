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

  it('does not close the function editor being opened from a linked call', () => {
    const main = createBlockFromKind('main')
    const fn = createBlockFromKind('function')
    const call = createBlockFromKind('functionCall')
    const otherCall = createBlockFromKind('functionCall')
    if (
      main.kind !== 'main' ||
      fn.kind !== 'function' ||
      call.kind !== 'functionCall' ||
      otherCall.kind !== 'functionCall'
    ) {
      throw new Error('unexpected block kind')
    }

    fn.data.name = 'helper'
    call.data.functionName = 'helper'
    call.data.targetFunctionId = fn.id
    otherCall.data.functionName = 'helper'
    otherCall.data.targetFunctionId = fn.id

    let blocks: BlockNode[] = [main, fn]
    blocks = appendToStatementBody(blocks, main.id, 'main', call)
    blocks = appendToStatementBody(blocks, main.id, 'main', otherCall)

    const toClose = getSiblingEditorIdsToClose(blocks, call.id)
    expect(toClose.has(fn.id)).toBe(false)
  })
})
