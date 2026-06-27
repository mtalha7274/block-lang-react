import type { ProgramDocument } from '../../types'
import { buildBubbleSortWithThreeFunctions } from '../../testUtils/bubbleSortProgram'
import {
  bool,
  call,
  expr,
  func,
  ifBlock,
  main,
  num,
  print,
  program,
  reassign,
  ret,
  varRef,
  variable,
  whileLoop,
} from '../../testUtils/programBuilder'

function swapIfGreater(a: string, b: string) {
  return ifBlock(expr('>', varRef(a), varRef(b), '', 'boolean'), [
    variable('temp', varRef(a)),
    reassign(a, varRef(b)),
    reassign(b, varRef('temp')),
  ])
}

function bubbleSortPass(count: number) {
  const steps = []
  for (let i = 0; i < count - 1; i += 1) {
    steps.push(swapIfGreater(`n${i}`, `n${i + 1}`))
  }
  return steps
}

export function buildSumToN(n: number): ProgramDocument {
  return program(
    main([
      variable('sum', num(0)),
      variable('i', num(1)),
      whileLoop(expr('<=', varRef('i'), num(n), '', 'boolean'), [
        reassign('sum', expr('+', varRef('sum'), varRef('i'))),
        reassign('i', expr('+', varRef('i'), num(1), 'i')),
      ]),
    ]),
  )
}

export function buildFactorial(n: number): ProgramDocument {
  return program(
    main([
      variable('n', num(n)),
      variable('fact', num(1)),
      variable('i', num(1)),
      whileLoop(expr('<=', varRef('i'), varRef('n'), '', 'boolean'), [
        reassign('fact', expr('*', varRef('fact'), varRef('i'))),
        reassign('i', expr('+', varRef('i'), num(1), 'i')),
      ]),
    ]),
  )
}

export function buildFibonacci(target: number): ProgramDocument {
  return program(
    main([
      variable('a', num(0)),
      variable('b', num(1)),
      variable('i', num(0)),
      whileLoop(expr('<', varRef('i'), num(target), '', 'boolean'), [
        variable('next', expr('+', varRef('a'), varRef('b'))),
        reassign('a', varRef('b')),
        reassign('b', varRef('next')),
        reassign('i', expr('+', varRef('i'), num(1), 'i')),
      ]),
    ]),
  )
}

export function buildGcd(a: number, b: number): ProgramDocument {
  return program(
    main([
      variable('a', num(a)),
      variable('b', num(b)),
      whileLoop(expr('>', varRef('b'), num(0), '', 'boolean'), [
        variable('temp', varRef('b')),
        reassign('b', expr('%', varRef('a'), varRef('b'), '', 'number')),
        reassign('a', varRef('temp')),
      ]),
    ]),
  )
}

export function buildBubbleSort(values: number[]): ProgramDocument {
  const init = values.map((v, i) => variable(`n${i}`, num(v)))
  const passes = []
  for (let p = 0; p < values.length - 1; p += 1) {
    passes.push(...bubbleSortPass(values.length - p))
  }
  return program(main([...init, ...passes]))
}

export function buildIsPrime(n: number): ProgramDocument {
  return program(
    main([
      variable('n', num(n)),
      variable('isPrime', bool(true), 'boolean'),
      variable('i', num(2)),
      whileLoop(
        expr('<=', expr('*', varRef('i'), varRef('i'), '', 'number'), varRef('n'), '', 'boolean'),
        [
          ifBlock(expr('==', expr('%', varRef('n'), varRef('i'), '', 'number'), num(0), '', 'boolean'), [
            reassign('isPrime', bool(false), 'boolean'),
          ]),
          reassign('i', expr('+', varRef('i'), num(1), 'i')),
        ],
      ),
    ]),
  )
}

export function buildMax(a: number, b: number): ProgramDocument {
  return program(
    main([
      variable('a', num(a)),
      variable('b', num(b)),
      variable('max', num(0)),
      ifBlock(
        expr('>', varRef('a'), varRef('b'), '', 'boolean'),
        [reassign('max', varRef('a'))],
        [reassign('max', varRef('b'))],
      ),
    ]),
  )
}

export function buildLinearSearch(): ProgramDocument {
  const values = [4, 7, 2, 9]
  return program(
    main([
      ...values.map((v, i) => variable(`n${i}`, num(v))),
      variable('target', num(7)),
      variable('found', num(-1)),
      variable('i', num(0)),
      whileLoop(expr('<', varRef('i'), num(values.length), '', 'boolean'), [
        ifBlock(expr('==', varRef('n0'), varRef('target'), '', 'boolean'), [reassign('found', num(0))]),
        ifBlock(expr('==', varRef('n1'), varRef('target'), '', 'boolean'), [reassign('found', num(1))]),
        ifBlock(expr('==', varRef('n2'), varRef('target'), '', 'boolean'), [reassign('found', num(2))]),
        ifBlock(expr('==', varRef('n3'), varRef('target'), '', 'boolean'), [reassign('found', num(3))]),
        reassign('i', expr('+', varRef('i'), num(1), 'i')),
      ]),
    ]),
  )
}

export function buildAddFunction(): ProgramDocument {
  const addFn = func(
    'add',
    [
      { id: 'p-a', name: 'a', type: 'number' },
      { id: 'p-b', name: 'b', type: 'number' },
    ],
    'number',
    [ret(expr('+', varRef('a'), varRef('b')))],
    'func-add',
  )
  return program(
    main([
      variable('x', num(5)),
      variable('y', num(10)),
      variable('z', call('add', 'func-add', [
        { name: 'a', type: 'number', value: varRef('x') },
        { name: 'b', type: 'number', value: varRef('y') },
      ])),
    ]),
    [addFn],
  )
}

export function buildPower(base: number, exp: number): ProgramDocument {
  return program(
    main([
      variable('base', num(base)),
      variable('exp', num(exp)),
      variable('result', num(1)),
      variable('i', num(0)),
      whileLoop(expr('<', varRef('i'), varRef('exp'), '', 'boolean'), [
        reassign('result', expr('*', varRef('result'), varRef('base'))),
        reassign('i', expr('+', varRef('i'), num(1), 'i')),
      ]),
    ]),
  )
}

export function buildAbsoluteValue(n: number): ProgramDocument {
  return program(
    main([
      variable('n', num(n)),
      variable('abs', num(0)),
      ifBlock(
        expr('<', varRef('n'), num(0), '', 'boolean'),
        [reassign('abs', expr('-', num(0), varRef('n'), '', 'number'))],
        [reassign('abs', varRef('n'))],
      ),
    ]),
  )
}

export function buildCountdown(from: number): ProgramDocument {
  return program(
    main([
      variable('i', num(from)),
      whileLoop(expr('>=', varRef('i'), num(1), '', 'boolean'), [
        print(varRef('i')),
        reassign('i', expr('-', varRef('i'), num(1), 'i')),
      ]),
    ]),
  )
}

export function buildAverageTwo(a: number, b: number): ProgramDocument {
  return program(
    main([
      variable('a', num(a)),
      variable('b', num(b)),
      variable('avg', expr('/', expr('+', varRef('a'), varRef('b')), num(2))),
    ]),
  )
}

export function buildEvenOdd(n: number): ProgramDocument {
  return program(
    main([
      variable('n', num(n)),
      variable('isEven', bool(false), 'boolean'),
      ifBlock(
        expr('==', expr('%', varRef('n'), num(2), '', 'number'), num(0), '', 'boolean'),
        [reassign('isEven', bool(true), 'boolean')],
      ),
    ]),
  )
}

export function buildMinTwo(a: number, b: number): ProgramDocument {
  return program(
    main([
      variable('a', num(a)),
      variable('b', num(b)),
      variable('min', num(0)),
      ifBlock(
        expr('<', varRef('a'), varRef('b'), '', 'boolean'),
        [reassign('min', varRef('a'))],
        [reassign('min', varRef('b'))],
      ),
    ]),
  )
}

export { buildBubbleSortWithThreeFunctions }
