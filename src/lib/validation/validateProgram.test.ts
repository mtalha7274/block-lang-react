import { describe, expect, it } from 'vitest'
import { sampleProgram } from '../../mocks/sampleProgram'
import { runProgram } from '../emulate/runProgram'
import { compileProgram } from '../compile/compileProgram'
import {
  call,
  expr,
  func,
  getVarNumber,
  main,
  num,
  program,
  ret,
  varRef,
  variable,
} from '../../testUtils/programBuilder'
import { validateProgram } from './validateProgram'

function buildSampleAddProgram() {
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
      variable(
        'z',
        call('add', 'func-add', [
          { name: 'a', type: 'number', value: varRef('x') },
          { name: 'b', type: 'number', value: varRef('y') },
        ]),
      ),
    ]),
    [addFn],
  )
}

describe('validateProgram', () => {
  it('accepts a correct add program using Return blocks', () => {
    const doc = buildSampleAddProgram()
    expect(validateProgram(doc)).toEqual([])
    const result = runProgram(doc)
    expect(result.status).toBe('success')
    expect(getVarNumber(result, 'z')).toBe(15)
  })

  it('reports intentional demo errors in the sample program', () => {
    const errors = validateProgram(sampleProgram)
    expect(errors).toEqual([
      expect.objectContaining({
        blockId: 'var-bad',
        message: 'Type mismatch: expected number, got string',
      }),
    ])
  })

  it('rejects comparison expressions with number resultType', () => {
    const doc = program(
      main([
        expr('>', num(1), num(2), '', 'number'),
      ]),
    )
    const errors = validateProgram(doc)
    expect(errors).toEqual([
      expect.objectContaining({
        message: 'Expression result type must be boolean for operator >',
      }),
    ])
  })

  it('rejects return outside function', () => {
    const doc = program(main([ret(num(1))]))
    expect(validateProgram(doc)).toEqual([
      expect.objectContaining({ message: 'Return must be inside a function' }),
    ])
  })

  it('compiles add program with explicit return', () => {
    const compiled = compileProgram(buildSampleAddProgram())
    expect(compiled.errors).toEqual([])
    expect(compiled.code).toContain('return a + b')
  })

  it('rejects void function return with value', () => {
    const voidFn = func('noop', [], 'void', [ret(num(1))], 'func-noop')
    const doc = program(main([]), [voidFn])
    expect(validateProgram(doc)).toEqual([
      expect.objectContaining({ message: 'Void functions cannot return a value' }),
    ])
  })
})
