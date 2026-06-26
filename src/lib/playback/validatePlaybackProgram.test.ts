import { describe, expect, it } from 'vitest'
import { validatePlaybackProgram } from './validatePlaybackProgram'
import { emptyProgram } from '../../constants/emptyProgram'
import { buildSumToN } from '../algorithms/builders'

describe('validatePlaybackProgram', () => {
  it('reports valid for an empty main-only program', () => {
    const result = validatePlaybackProgram(emptyProgram)
    expect(result.valid).toBe(true)
    expect(result.errorCount).toBe(0)
  })

  it('reports valid for a complete algorithm program', () => {
    const result = validatePlaybackProgram(buildSumToN(3))
    expect(result.valid).toBe(true)
  })
})
