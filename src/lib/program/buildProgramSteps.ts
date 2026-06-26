import type { BlockNode, ProgramDocument } from '../../types'
import { main, program } from '../../testUtils/programBuilder'
import { resolveCallTarget } from './callWire'

function visitBlocks(nodes: BlockNode[], visit: (block: BlockNode) => void): void {
  for (const node of nodes) {
    visit(node)
    switch (node.kind) {
      case 'main':
        visitBlocks(node.data.body, visit)
        break
      case 'function':
        node.data.body.forEach((child) => visitBlocks([child], visit))
        break
      case 'variable':
        if (node.data.value) visitBlocks([node.data.value], visit)
        break
      case 'print':
        if (node.data.value) visitBlocks([node.data.value], visit)
        break
      case 'return':
        if (node.data.value) visitBlocks([node.data.value], visit)
        break
      case 'if':
        if (node.data.condition) visitBlocks([node.data.condition], visit)
        visitBlocks(node.data.trueBranch, visit)
        if (node.data.falseBranch) visitBlocks(node.data.falseBranch, visit)
        break
      case 'for':
        if (node.data.init) visitBlocks([node.data.init], visit)
        if (node.data.condition) visitBlocks([node.data.condition], visit)
        if (node.data.increment) visitBlocks([node.data.increment], visit)
        visitBlocks(node.data.body, visit)
        break
      case 'while':
        if (node.data.condition) visitBlocks([node.data.condition], visit)
        visitBlocks(node.data.body, visit)
        break
      case 'functionCall':
        node.data.arguments.forEach((arg) => {
          if (arg.value) visitBlocks([arg.value], visit)
        })
        break
      case 'expression':
        if (node.data.left) visitBlocks([node.data.left], visit)
        if (node.data.right) visitBlocks([node.data.right], visit)
        break
      default:
        break
    }
  }
}

function referencedFunctionIds(
  statements: BlockNode[],
  allBlocks: BlockNode[],
): string[] {
  const ids = new Set<string>()
  visitBlocks(statements, (block) => {
    if (block.kind !== 'functionCall') return
    const fn = resolveCallTarget(block, allBlocks)
    if (fn) ids.add(fn.id)
  })
  return [...ids]
}

/** Progressive program states: one main-body statement added per step. */
export function buildIncrementalProgramSteps(finalDoc: ProgramDocument): ProgramDocument[] {
  const mainBlock = finalDoc.blocks.find((b) => b.kind === 'main')
  if (!mainBlock || mainBlock.kind !== 'main') {
    return [structuredClone(finalDoc)]
  }

  const allFunctions = finalDoc.blocks.filter((b) => b.kind === 'function')
  const steps: ProgramDocument[] = []

  for (let i = 0; i <= mainBlock.data.body.length; i += 1) {
    const body = mainBlock.data.body.slice(0, i)
    const fnIds = referencedFunctionIds(body, finalDoc.blocks)
    const fns = allFunctions.filter((fn) => fnIds.includes(fn.id))
    steps.push(
      program(main(body, mainBlock.id), fns),
    )
  }

  return steps
}
