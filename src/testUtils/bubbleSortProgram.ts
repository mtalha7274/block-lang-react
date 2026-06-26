import type { BlockId, BlockNode, ProgramDocument, ValueType } from '../types'
import {
  call,
  expr,
  func,
  ifBlock,
  main,
  num,
  program,
  reassign,
  ret,
  varRef,
  variable,
} from './programBuilder'

/** Call a two-argument number/boolean helper with variable operands. */
function callPair(
  functionName: string,
  targetFunctionId: BlockId,
  leftName: string,
  rightName: string,
  returnType: ValueType,
): BlockNode {
  return call(functionName, targetFunctionId, [
    { name: 'a', type: 'number', value: varRef(leftName) },
    { name: 'b', type: 'number', value: varRef(rightName) },
  ], returnType)
}

function swapIfGreater(left: string, right: string): BlockNode {
  return ifBlock(
    callPair('isGreater', 'func-isGreater', left, right, 'boolean'),
    [
      variable('temp', callPair('maxOf', 'func-maxOf', left, right, 'number')),
      reassign(left, callPair('minOf', 'func-minOf', left, right, 'number')),
      reassign(right, varRef('temp')),
    ],
  )
}

function bubbleSortPass(count: number): BlockNode[] {
  const steps: BlockNode[] = []
  for (let i = 0; i < count - 1; i += 1) {
    steps.push(swapIfGreater(`n${i}`, `n${i + 1}`))
  }
  return steps
}

/**
 * Bubble sort using three helper functions:
 * - isGreater(a, b): boolean
 * - maxOf(a, b): number
 * - minOf(a, b): number
 *
 * Swap logic stays in main because function parameters are pass-by-value.
 */
export function buildBubbleSortWithThreeFunctions(values: number[]): ProgramDocument {
  const isGreaterFn = func(
    'isGreater',
    [
      { id: 'p-a', name: 'a', type: 'number' },
      { id: 'p-b', name: 'b', type: 'number' },
    ],
    'boolean',
    [ret(expr('>', varRef('a'), varRef('b'), '', 'boolean'))],
    'func-isGreater',
  )

  const maxOfFn = func(
    'maxOf',
    [
      { id: 'p-a', name: 'a', type: 'number' },
      { id: 'p-b', name: 'b', type: 'number' },
    ],
    'number',
    [
      ifBlock(
        expr('>', varRef('a'), varRef('b'), '', 'boolean'),
        [ret(varRef('a'))],
        [ret(varRef('b'))],
      ),
    ],
    'func-maxOf',
  )

  const minOfFn = func(
    'minOf',
    [
      { id: 'p-a', name: 'a', type: 'number' },
      { id: 'p-b', name: 'b', type: 'number' },
    ],
    'number',
    [
      ifBlock(
        expr('<', varRef('a'), varRef('b'), '', 'boolean'),
        [ret(varRef('a'))],
        [ret(varRef('b'))],
      ),
    ],
    'func-minOf',
  )

  const init = values.map((v, i) => variable(`n${i}`, num(v)))
  const passes: BlockNode[] = []
  for (let p = 0; p < values.length - 1; p += 1) {
    passes.push(...bubbleSortPass(values.length - p))
  }

  return program(main([...init, ...passes]), [isGreaterFn, maxOfFn, minOfFn])
}

/** Expected sorted variable values after emulation. */
export function expectedSortedValues(values: number[]): number[] {
  return [...values].sort((a, b) => a - b)
}
