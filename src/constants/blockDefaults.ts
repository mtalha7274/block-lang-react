import type { BlockKind, BlockNode } from '../types'

let blockCounter = 0

function nextId(prefix: string): string {
  blockCounter += 1
  return `${prefix}-${blockCounter}-${Date.now()}`
}

export function createBlockFromKind(kind: BlockKind): BlockNode {
  switch (kind) {
    case 'main':
      return {
        id: nextId('main'),
        kind: 'main',
        data: { body: [] },
      }
    case 'primitive':
      return {
        id: nextId('prim'),
        kind: 'primitive',
        data: { valueType: 'number', value: 0 },
      }
    case 'variable':
      return {
        id: nextId('var'),
        kind: 'variable',
        data: {
          valueType: 'number',
          name: 'x',
        },
      }
    case 'type':
      return {
        id: nextId('type'),
        kind: 'type',
        data: {
          rows: [{ id: nextId('row'), name: 'a', type: 'number' }],
          variables: [],
        },
      }
    case 'expression':
      return {
        id: nextId('expr'),
        kind: 'expression',
        data: {
          resultName: 'result',
          resultType: 'number',
          operator: '+',
        },
      }
    case 'if':
      return {
        id: nextId('if'),
        kind: 'if',
        data: { trueBranch: [], falseBranch: [] },
      }
    case 'for':
      return {
        id: nextId('for'),
        kind: 'for',
        data: { body: [] },
      }
    case 'while':
      return {
        id: nextId('while'),
        kind: 'while',
        data: { body: [] },
      }
    case 'function':
      return {
        id: nextId('func'),
        kind: 'function',
        data: {
          name: 'myFunc',
          returnType: 'number',
          body: [],
        },
      }
    case 'functionCall':
      return {
        id: nextId('call'),
        kind: 'functionCall',
        data: {
          functionName: 'myFunc',
          returnType: 'number',
          arguments: [],
        },
      }
    case 'print':
      return {
        id: nextId('print'),
        kind: 'print',
        data: {},
      }
    case 'return':
      return {
        id: nextId('return'),
        kind: 'return',
        data: {},
      }
    case 'valueRef':
      throw new Error('valueRef blocks are created via in-scope references only')
  }
}
