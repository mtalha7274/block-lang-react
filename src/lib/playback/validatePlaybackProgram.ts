import type { ProgramDocument } from '../../types'
import { compileProgram } from '../compile'
import { validateProgram } from '../validation/validateProgram'

export interface PlaybackValidationResult {
  valid: boolean
  summary: string
  errorCount: number
}

export function validatePlaybackProgram(
  program: ProgramDocument,
): PlaybackValidationResult {
  const validationErrors = validateProgram(program)
  const compileErrors = compileProgram(program).errors
  const errorCount = validationErrors.length + compileErrors.length

  if (errorCount === 0) {
    return { valid: true, summary: 'Code checks out', errorCount: 0 }
  }

  const first =
    validationErrors[0]?.message ??
    compileErrors[0]?.message ??
    'Validation failed'

  return {
    valid: false,
    summary: `${errorCount} issue${errorCount > 1 ? 's' : ''}: ${first}`,
    errorCount,
  }
}
