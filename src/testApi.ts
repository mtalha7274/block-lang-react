import type { ProgramDocument } from './types'
import { validateProgram } from './lib/validation/validateProgram'
import { compileProgram } from './lib/compile'
import { runProgram } from './lib/emulate'

export interface BlockLangTestApi {
  loadProgram: (doc: ProgramDocument) => void
  getProgram: () => ProgramDocument
  getValidationErrors: () => ReturnType<typeof validateProgram>
  getCompileErrors: () => string[]
  runEmulate: () => {
    status: string
    variables: Record<string, string>
    errorMessage?: string
  }
  isReady: () => boolean
}

declare global {
  interface Window {
    __BLOCKLANG_TEST__?: BlockLangTestApi
  }
}

export function createTestApi(handlers: {
  loadProgram: (doc: ProgramDocument) => void
  getProgram: () => ProgramDocument
  runEmulate: () => void
  getEmulationState: () => {
    status: string
    variables: { name: string; value: string }[]
    errorMessage?: string
  }
}): BlockLangTestApi {
  return {
    loadProgram: handlers.loadProgram,
    getProgram: handlers.getProgram,
    getValidationErrors: () => validateProgram(handlers.getProgram()),
    getCompileErrors: () =>
      compileProgram(handlers.getProgram()).errors.map((e) => e.message),
    runEmulate: () => {
      handlers.runEmulate()
      const state = handlers.getEmulationState()
      const variables: Record<string, string> = {}
      for (const v of state.variables) {
        variables[v.name] = v.value
      }
      return {
        status: state.status,
        variables,
        errorMessage: state.errorMessage,
      }
    },
    isReady: () => true,
  }
}

export function runProgramDirect(doc: ProgramDocument) {
  return runProgram(doc)
}
