import { describe, expect, it } from 'vitest'
import { buildSumToN } from '../algorithms/builders'
import { buildIncrementalProgramSteps } from './buildProgramSteps'

describe('buildIncrementalProgramSteps', () => {
  it('adds one main-body statement per step', () => {
    const finalDoc = buildSumToN(5)
    const steps = buildIncrementalProgramSteps(finalDoc)
    const finalMain = finalDoc.blocks.find((b) => b.kind === 'main')
    expect(finalMain?.kind).toBe('main')

    expect(steps.length).toBe((finalMain?.data.body.length ?? 0) + 1)
    expect(steps[0].blocks.find((b) => b.kind === 'main')?.data.body).toEqual([])

    const lastMain = steps[steps.length - 1].blocks.find((b) => b.kind === 'main')
    expect(lastMain?.kind).toBe('main')
    expect(lastMain?.data.body.length).toBe(finalMain?.data.body.length)
  })
})
