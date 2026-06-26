import { describe, expect, it } from 'vitest'
import { buildSumToN } from '../algorithms/builders'
import { compilePlaybackScript } from './compilePlaybackScript'

describe('compilePlaybackScript', () => {
  it('generates drag-drop and open-editor actions for sum to n', () => {
    const actions = compilePlaybackScript(buildSumToN(5))
    expect(actions.some((a) => a.type === 'center-main')).toBe(true)
    expect(actions.filter((a) => a.type === 'drag-drop').length).toBeGreaterThanOrEqual(2)
    expect(actions.some((a) => a.type === 'open-editor')).toBe(true)
  })
})
