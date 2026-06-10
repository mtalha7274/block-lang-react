import type { ProgramDocument } from '../../types'
import { CompileContext } from './compileContext'
import { emitStatement, emitFunction } from './emitStatement'
import type { CompileResult } from './types'

export function compileProgram(doc: ProgramDocument): CompileResult {
  const ctx = new CompileContext(doc)
  const errors: CompileResult['errors'] = []
  const lines: string[] = []

  const main = doc.blocks.find((b) => b.kind === 'main')
  if (main && main.kind === 'main') {
    for (const stmt of main.data.body) {
      lines.push(...emitStatement(stmt, ctx, errors, 0))
    }
  }

  const functions = doc.blocks.filter((b) => b.kind === 'function')
  if (functions.length > 0) {
    if (lines.length > 0) lines.push('')
    for (let i = 0; i < functions.length; i++) {
      if (i > 0) lines.push('')
      const fn = functions[i]
      if (fn.kind === 'function') {
        lines.push(...emitFunction(fn, ctx, errors))
      }
    }
  }

  return {
    code: lines.join('\n'),
    errors,
  }
}

export type { CompileResult, CompileError } from './types'
