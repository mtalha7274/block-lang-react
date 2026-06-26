import type { BlockNode } from '../../types'

function collectNodeIds(node: BlockNode): string[] {
  const ids: string[] = [node.id]

  switch (node.kind) {
    case 'main':
      node.data.body.forEach((s) => ids.push(...collectNodeIds(s)))
      break
    case 'function':
      if (node.data.signature) ids.push(...collectNodeIds(node.data.signature))
      node.data.body.forEach((s) => ids.push(...collectNodeIds(s)))
      break
    case 'variable':
      if (node.data.value) ids.push(...collectNodeIds(node.data.value))
      break
    case 'print':
      if (node.data.value) ids.push(...collectNodeIds(node.data.value))
      break
    case 'return':
      if (node.data.value) ids.push(...collectNodeIds(node.data.value))
      break
    case 'if':
      if (node.data.condition) ids.push(...collectNodeIds(node.data.condition))
      node.data.trueBranch.forEach((s) => ids.push(...collectNodeIds(s)))
      node.data.falseBranch?.forEach((s) => ids.push(...collectNodeIds(s)))
      break
    case 'for':
      if (node.data.init) ids.push(...collectNodeIds(node.data.init))
      if (node.data.condition) ids.push(...collectNodeIds(node.data.condition))
      if (node.data.increment) ids.push(...collectNodeIds(node.data.increment))
      node.data.body.forEach((s) => ids.push(...collectNodeIds(s)))
      break
    case 'while':
      if (node.data.condition) ids.push(...collectNodeIds(node.data.condition))
      node.data.body.forEach((s) => ids.push(...collectNodeIds(s)))
      break
    case 'functionCall':
      node.data.arguments.forEach((arg) => {
        if (arg.value) ids.push(...collectNodeIds(arg.value))
      })
      break
    case 'expression':
      if (node.data.left) ids.push(...collectNodeIds(node.data.left))
      if (node.data.right) ids.push(...collectNodeIds(node.data.right))
      break
    case 'type':
      node.data.variables.forEach((v) => ids.push(...collectNodeIds(v)))
      break
    default:
      break
  }

  return ids
}

/** All block ids nested inside `root`, excluding `root` itself. */
export function collectSubtreeBlockIds(root: BlockNode): string[] {
  return collectNodeIds(root).filter((id) => id !== root.id)
}

export function collectDescendantBlockIds(container: BlockNode): string[] {
  switch (container.kind) {
    case 'main':
      return container.data.body.flatMap((s) => collectNodeIds(s))
    case 'function':
      return [
        ...(container.data.signature
          ? collectNodeIds(container.data.signature)
          : []),
        ...container.data.body.flatMap((s) => collectNodeIds(s)),
      ]
    default:
      return []
  }
}
