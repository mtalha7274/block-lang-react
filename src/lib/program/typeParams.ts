import type { BlockNode, FunctionParameter } from '../../types'

export function deriveTypeParams(typeBlock: BlockNode): FunctionParameter[] {
  if (typeBlock.kind !== 'type') return []

  const fromRows = typeBlock.data.rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
  }))

  const fromVariables = typeBlock.data.variables.map((v) => {
    if (v.kind !== 'variable') {
      return { id: v.id, name: 'param', type: 'number' as const }
    }
    return {
      id: v.id,
      name: v.data.name,
      type: v.data.valueType,
    }
  })

  return [...fromRows, ...fromVariables]
}

export function formatTypeSummary(typeBlock: BlockNode): string {
  const params = deriveTypeParams(typeBlock)
  if (params.length === 0) return '(no params)'
  return params.map((p) => `${p.type} ${p.name}`).join(', ')
}
