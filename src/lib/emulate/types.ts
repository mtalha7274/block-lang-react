import type {
  BlockId,
  EmulationHighlight,
  OutputLine,
  StackFrame,
  VariableSnapshot,
} from '../../types'

export interface EmulationResult {
  status: 'success' | 'error'
  variables: VariableSnapshot[]
  callStack: StackFrame[]
  outputLines: OutputLine[]
  highlight?: EmulationHighlight
  errorMessage?: string
}

export class EmulationError extends Error {
  blockId?: BlockId

  constructor(message: string, blockId?: BlockId) {
    super(message)
    this.name = 'EmulationError'
    this.blockId = blockId
  }
}

export function buildVariableSnapshots(
  globals: Map<string, import('./runtime').RuntimeEntry>,
  lastWrittenVar?: string,
): VariableSnapshot[] {
  return [...globals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, entry]) => ({
      name,
      type: entry.type,
      value:
        entry.type === 'string'
          ? `"${entry.value}"`
          : String(entry.value),
      active: name === lastWrittenVar,
    }))
}

export function buildCallStackFrames(
  frames: import('./runtime').StackFrameInternal[],
): StackFrame[] {
  if (frames.length === 0) {
    return [{ id: 'frame-main', label: 'main()', active: true }]
  }
  return frames.map((f, i) => ({
    id: f.id,
    label: f.label,
    active: i === frames.length - 1,
  }))
}
