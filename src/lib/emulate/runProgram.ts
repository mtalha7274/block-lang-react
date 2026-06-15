import type { ProgramDocument } from '../../types'
import { executeStatement } from './evaluateBlock'
import { Runtime } from './runtime'
import {
  buildCallStackFrames,
  buildVariableSnapshots,
  EmulationError,
  type EmulationResult,
} from './types'

export function runProgram(doc: ProgramDocument): EmulationResult {
  const runtime = new Runtime()
  runtime.pushFrame('main', 'main()', {})

  try {
    const main = doc.blocks.find((b) => b.kind === 'main')
    if (!main || main.kind !== 'main') {
      throw new EmulationError('Program has no main function')
    }

    for (const stmt of main.data.body) {
      executeStatement(stmt, runtime, doc, false)
    }

    runtime.popFrame()

    return {
      status: 'success',
      variables: buildVariableSnapshots(runtime.globals, runtime.lastWrittenVar),
      callStack: [{ id: 'frame-main', label: 'main()', active: true }],
      outputLines: runtime.outputLines,
      highlight: runtime.lastBlockId
        ? { activeBlockId: runtime.lastBlockId }
        : undefined,
    }
  } catch (err) {
    const message =
      err instanceof EmulationError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Unknown emulation error'

    return {
      status: 'error',
      variables: buildVariableSnapshots(runtime.globals, runtime.lastWrittenVar),
      callStack: buildCallStackFrames(runtime.frames),
      outputLines: runtime.outputLines,
      highlight:
        err instanceof EmulationError && err.blockId
          ? { activeBlockId: err.blockId }
          : runtime.lastBlockId
            ? { activeBlockId: runtime.lastBlockId }
            : undefined,
      errorMessage: message,
    }
  }
}

export type { EmulationResult } from './types'
