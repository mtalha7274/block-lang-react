import type { ValueType, OutputLine, BlockId } from '../../types'

export type RuntimeValue = number | string | boolean

export interface RuntimeEntry {
  value: RuntimeValue
  type: ValueType
}

export interface StackFrameInternal {
  id: string
  label: string
  locals: Map<string, RuntimeEntry>
}

export class Runtime {
  readonly globals = new Map<string, RuntimeEntry>()
  readonly frames: StackFrameInternal[] = []
  lastBlockId?: string
  lastWrittenVar?: string
  readonly outputLines: OutputLine[] = []

  appendOutput(blockId: BlockId, line: string): void {
    this.outputLines.push({ blockId, line })
  }

  pushFrame(id: string, label: string, locals: Record<string, RuntimeEntry>): void {
    this.frames.push({
      id,
      label,
      locals: new Map(Object.entries(locals)),
    })
  }

  popFrame(): void {
    this.frames.pop()
  }

  private lookup(name: string): RuntimeEntry | undefined {
    for (let i = this.frames.length - 1; i >= 0; i--) {
      const entry = this.frames[i].locals.get(name)
      if (entry) return entry
    }
    return this.globals.get(name)
  }

  get(name: string): RuntimeEntry {
    const entry = this.lookup(name)
    if (!entry) {
      throw new Error(`Variable "${name}" is not defined`)
    }
    return entry
  }

  set(name: string, value: RuntimeValue, type: ValueType, local = false): void {
    const entry: RuntimeEntry = { value, type }
    if (local && this.frames.length > 0) {
      this.frames[this.frames.length - 1].locals.set(name, entry)
    } else {
      this.globals.set(name, entry)
    }
    this.lastWrittenVar = name
  }

  formatValue(value: RuntimeValue): string {
    if (typeof value === 'string') return `"${value}"`
    return String(value)
  }
}

export function runtimeValueToString(value: RuntimeValue, type: ValueType): string {
  if (type === 'string') return `"${value}"`
  return String(value)
}
