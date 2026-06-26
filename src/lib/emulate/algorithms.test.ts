import { describe, expect, it, beforeEach } from 'vitest'
import { compileProgram } from '../compile/compileProgram'
import { runProgram } from './runProgram'
import { validateProgram } from '../validation/validateProgram'
import {
  bool,
  call,
  expr,
  forLoop,
  func,
  getVarNumber,
  ifBlock,
  main,
  num,
  print,
  program,
  reassign,
  resetProgramBuilderIds,
  ret,
  str,
  varRef,
  variable,
  whileLoop,
} from '../../testUtils/programBuilder'
import { buildBubbleSortWithThreeFunctions } from '../../testUtils/bubbleSortProgram'

function swapIfGreater(a: string, b: string) {
  return ifBlock(expr('>', varRef(a), varRef(b), '', 'boolean'), [
    variable('temp', varRef(a)),
    reassign(a, varRef(b)),
    reassign(b, varRef('temp')),
  ])
}

function bubbleSortPass(count: number) {
  const steps: ReturnType<typeof swapIfGreater>[] = []
  for (let i = 0; i < count - 1; i++) {
    steps.push(swapIfGreater(`n${i}`, `n${i + 1}`))
  }
  return steps
}

function buildSumToN(n: number) {
  const sumLoop = forLoop(
    variable('i', num(1)),
    expr('<=', varRef('i'), num(n), '', 'boolean'),
    expr('+', varRef('i'), num(1), 'i'),
    [
      reassign('sum', expr('+', varRef('sum'), varRef('i'))),
    ],
  )
  return program(
    main([
      variable('sum', num(0)),
      sumLoop,
    ]),
  )
}

function buildFactorial(n: number) {
  return program(
    main([
      variable('n', num(n)),
      variable('fact', num(1)),
      forLoop(
        variable('i', num(1)),
        expr('<=', varRef('i'), varRef('n'), '', 'boolean'),
        expr('+', varRef('i'), num(1), 'i'),
        [reassign('fact', expr('*', varRef('fact'), varRef('i')))],
      ),
    ]),
  )
}

function buildFibonacci(target: number) {
  return program(
    main([
      variable('a', num(0)),
      variable('b', num(1)),
      variable('i', num(0)),
      forLoop(
        undefined,
        expr('<', varRef('i'), num(target), '', 'boolean'),
        expr('+', varRef('i'), num(1), 'i'),
        [
          variable('next', expr('+', varRef('a'), varRef('b'))),
          reassign('a', varRef('b')),
          reassign('b', varRef('next')),
        ],
      ),
    ]),
  )
}

function buildGcd(a: number, b: number) {
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

function buildBubbleSort(values: number[]) {
  const init = values.map((v, i) => variable(`n${i}`, num(v)))
  const passes: ReturnType<typeof swapIfGreater>[] = []
  for (let p = 0; p < values.length - 1; p++) {
    passes.push(...bubbleSortPass(values.length - p))
  }
  return program(main([...init, ...passes]))
}

function buildIsPrime(n: number) {
  return program(
    main([
      variable('n', num(n)),
      variable('isPrime', bool(true), 'boolean'),
      variable('i', num(2)),
      forLoop(
        undefined,
        expr('<=', expr('*', varRef('i'), varRef('i'), '', 'number'), varRef('n'), '', 'boolean'),
        expr('+', varRef('i'), num(1), 'i'),
        [
          ifBlock(expr('==', expr('%', varRef('n'), varRef('i'), '', 'number'), num(0), '', 'boolean'), [
            reassign('isPrime', bool(false), 'boolean'),
          ]),
        ],
      ),
    ]),
  )
}

function buildMax(a: number, b: number) {
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

function buildAddFunction() {
  const addFn = func(
    'add',
    [
      { id: 'p-a', name: 'a', type: 'number' },
      { id: 'p-b', name: 'b', type: 'number' },
    ],
    'number',
    [
      ret(expr('+', varRef('a'), varRef('b'))),
    ],
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

function buildExpressionDoesNotReturn() {
  const badFn = func(
    'badAdd',
    [
      { id: 'p-a', name: 'a', type: 'number' },
      { id: 'p-b', name: 'b', type: 'number' },
    ],
    'number',
    [
      expr('+', varRef('a'), varRef('b'), 'result'),
    ],
    'func-bad',
  )
  return program(
    main([
      variable('result', call('badAdd', 'func-bad', [
        { name: 'a', type: 'number', value: num(5) },
        { name: 'b', type: 'number', value: num(10) },
      ])),
    ]),
    [badFn],
  )
}

function buildLinearSearch() {
  // Fixed-size search: values n0..n3, search for target in main
  const values = [4, 7, 2, 9]
  const target = 7
  return program(
    main([
      ...values.map((v, i) => variable(`n${i}`, num(v))),
      variable('target', num(target)),
      variable('found', num(-1)),
      variable('i', num(0)),
      forLoop(
        undefined,
        expr('<', varRef('i'), num(values.length), '', 'boolean'),
        expr('+', varRef('i'), num(1), 'i'),
        [
          ifBlock(
            expr('==', varRef('n0'), varRef('target'), '', 'boolean'),
            [reassign('found', num(0))],
          ),
          ifBlock(
            expr('==', varRef('n1'), varRef('target'), '', 'boolean'),
            [reassign('found', num(1))],
          ),
          ifBlock(
            expr('==', varRef('n2'), varRef('target'), '', 'boolean'),
            [reassign('found', num(2))],
          ),
          ifBlock(
            expr('==', varRef('n3'), varRef('target'), '', 'boolean'),
            [reassign('found', num(3))],
          ),
        ],
      ),
    ]),
  )
}

describe('algorithm programs', () => {
  beforeEach(() => {
    resetProgramBuilderIds()
  })

  it('sums integers 1 through n', () => {
    const doc = buildSumToN(10)
    expect(validateProgram(doc)).toEqual([])
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(getVarNumber(result, 'sum')).toBe(55)
  })

  it('computes factorial iteratively', () => {
    const doc = buildFactorial(5)
    expect(validateProgram(doc)).toEqual([])
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(getVarNumber(result, 'fact')).toBe(120)
  })

  it('computes fibonacci iteratively', () => {
    const doc = buildFibonacci(9)
    expect(validateProgram(doc)).toEqual([])
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(getVarNumber(result, 'b')).toBe(55)
  })

  it('computes greatest common divisor (Euclidean)', () => {
    const doc = buildGcd(48, 18)
    expect(validateProgram(doc)).toEqual([])
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(getVarNumber(result, 'a')).toBe(6)
  })

  it('bubble-sorts four fixed variables', () => {
    const doc = buildBubbleSort([5, 1, 4, 2])
    expect(validateProgram(doc)).toEqual([])
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(getVarNumber(result, 'n0')).toBe(1)
    expect(getVarNumber(result, 'n1')).toBe(2)
    expect(getVarNumber(result, 'n2')).toBe(4)
    expect(getVarNumber(result, 'n3')).toBe(5)
  })

  it('bubble-sorts using three helper functions', () => {
    const doc = buildBubbleSortWithThreeFunctions([5, 1, 4, 2])
    expect(validateProgram(doc)).toEqual([])
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(getVarNumber(result, 'n0')).toBe(1)
    expect(getVarNumber(result, 'n1')).toBe(2)
    expect(getVarNumber(result, 'n2')).toBe(4)
    expect(getVarNumber(result, 'n3')).toBe(5)
  })

  it('detects prime numbers', () => {
    const primeDoc = buildIsPrime(17)
    const compositeDoc = buildIsPrime(15)
    expect(runProgram(primeDoc).variables.find((v) => v.name === 'isPrime')?.value).toBe('true')
    expect(runProgram(compositeDoc).variables.find((v) => v.name === 'isPrime')?.value).toBe('false')
  })

  it('finds maximum of two numbers with if/else', () => {
    const doc = buildMax(3, 7)
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(getVarNumber(result, 'max')).toBe(7)
  })

  it('performs linear search on fixed slots', () => {
    const doc = buildLinearSearch()
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(getVarNumber(result, 'found')).toBe(1)
  })

  it('compiles algorithms to valid TypeScript structure', () => {
    const doc = buildSumToN(5)
    const compiled = compileProgram(doc)
    expect(compiled.errors).toEqual([])
    expect(compiled.code).toContain('for (')
    expect(compiled.code).toContain('let sum: number')
  })
})

describe('BLOCK_RULES compliance via emulation', () => {
  beforeEach(() => {
    resetProgramBuilderIds()
  })

  it('functions return values via Return blocks, not expressions alone', () => {
    const good = runProgram(buildAddFunction())
    expect(good.status).toBe('success')
    expect(getVarNumber(good, 'z')).toBe(15)

    const bad = runProgram(buildExpressionDoesNotReturn())
    expect(bad.status).toBe('success')
    // Expression assigns to `result` locally but does not return — implicit default 0
    expect(getVarNumber(bad, 'result')).toBe(0)
  })

  it('void functions use bare return without value slot', () => {
    const logFn = func(
      'logMsg',
      [],
      'void',
      [print(str('hello'))],
      'func-log',
    )
    const doc = program(
      main([call('logMsg', 'func-log', [], 'void')]),
      [logFn],
    )
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(result.outputLines.map((o) => o.line)).toEqual(['"hello"'])
  })

  it('non-void functions without return use implicit defaults', () => {
    const emptyFn = func('empty', [], 'number', [], 'func-empty')
    const doc = program(
      main([
        variable('v', call('empty', 'func-empty', [])),
      ]),
      [emptyFn],
    )
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(getVarNumber(result, 'v')).toBe(0)
  })

  it('first return reached wins during execution', () => {
    const earlyFn = func(
      'pick',
      [{ id: 'p-n', name: 'n', type: 'number' }],
      'number',
      [
        ifBlock(expr('>', varRef('n'), num(0), '', 'boolean'), [ret(num(1))]),
        ret(num(99)),
      ],
      'func-pick',
    )
    const doc = program(
      main([
        variable('a', call('pick', 'func-pick', [{ name: 'n', type: 'number', value: num(5) }])),
        variable('b', call('pick', 'func-pick', [{ name: 'n', type: 'number', value: num(-1) }])),
      ]),
      [earlyFn],
    )
    const result = runProgram(doc)
    expect(getVarNumber(result, 'a')).toBe(1)
    expect(getVarNumber(result, 'b')).toBe(99)
  })
})
