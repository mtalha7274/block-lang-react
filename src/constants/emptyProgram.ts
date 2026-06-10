import type { ProgramDocument } from '../types'

export const emptyProgram: ProgramDocument = {
  blocks: [
    {
      id: 'main',
      kind: 'main',
      data: { body: [] },
    },
  ],
  placements: [{ blockId: 'main', x: 120, y: 80 }],
  connections: [],
}

export const emptyTypeScript = ''

export const emptyVariables: import('../types').VariableSnapshot[] = []

export const emptyCallStack: import('../types').StackFrame[] = []
