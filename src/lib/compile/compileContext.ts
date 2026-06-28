import type { BlockNode, ProgramDocument, ValueType } from '../../types'

export class CompileContext {
  readonly functions: Map<string, BlockNode>
  readonly doc: ProgramDocument
  inFunctionBody = false
  currentFunctionReturnType: ValueType = 'void'
  readonly declaredNames = new Set<string>()

  constructor(doc: ProgramDocument) {
    this.doc = doc
    this.functions = new Map()
    for (const block of doc.blocks) {
      if (block.kind === 'function') {
        this.functions.set(block.data.name, block)
        this.functions.set(block.id, block)
      }
    }
  }

  indent(level: number): string {
    return '  '.repeat(level)
  }

  sanitizeIdentifier(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9_$]/g, '')
    if (!cleaned || /^[0-9]/.test(cleaned)) return '_'
    return cleaned
  }

  findFunction(nameOrId: string): Extract<BlockNode, { kind: 'function' }> | undefined {
    const block = this.functions.get(nameOrId)
    return block?.kind === 'function' ? block : undefined
  }
}
