import type {
  BlockId,
  ProgramDocument,
  StackFrame,
  VariableSnapshot,
} from '../types'

export const sampleTypeScript = `let x: number = 5;
let y: number = 10;
let z: number = add(x, y);

function add(a: number, b: number): number {
  return a + b;
}`

export const sampleVariables: VariableSnapshot[] = [
  { name: 'x', type: 'number', value: '5' },
  { name: 'y', type: 'number', value: '10' },
  { name: 'z', type: 'number', value: '15', active: true },
]

export const sampleCallStack: StackFrame[] = [
  { id: 'frame-main', label: 'main()', active: false },
  { id: 'frame-add', label: 'add(a=5, b=10)', active: true },
]

export const sampleEmulationHighlight: BlockId = 'call-add'
export const sampleErrorBlock: BlockId = 'var-bad'

export const sampleProgram: ProgramDocument = {
  blocks: [
    {
      id: 'main',
      kind: 'main',
      data: {
        body: [
          {
            id: 'var-x',
            kind: 'variable',
            data: {
              valueType: 'number',
              name: 'x',
              value: {
                id: 'prim-x',
                kind: 'primitive',
                data: { valueType: 'number', value: 5 },
              },
            },
          },
          {
            id: 'var-y',
            kind: 'variable',
            data: {
              valueType: 'number',
              name: 'y',
              value: {
                id: 'prim-y',
                kind: 'primitive',
                data: { valueType: 'number', value: 10 },
              },
            },
          },
          {
            id: 'var-bad',
            kind: 'variable',
            visual: {
              state: 'error',
              errorMessage: 'Type mismatch: expected number, got string',
            },
            data: {
              valueType: 'number',
              name: 'bad',
              value: {
                id: 'prim-bad',
                kind: 'primitive',
                data: { valueType: 'string', value: '"oops"' },
              },
            },
          },
          {
            id: 'call-add',
            kind: 'functionCall',
            data: {
              functionName: 'add',
              returnType: 'number',
              targetFunctionId: 'func-add',
              arguments: [
                {
                  portId: 'arg-a',
                  name: 'a',
                  type: 'number',
                  value: {
                    id: 'ref-x',
                    kind: 'variable',
                    data: { valueType: 'number', name: 'x' },
                  },
                },
                {
                  portId: 'arg-b',
                  name: 'b',
                  type: 'number',
                  value: {
                    id: 'ref-y',
                    kind: 'variable',
                    data: { valueType: 'number', name: 'y' },
                  },
                },
              ],
            },
          },
          {
            id: 'var-z',
            kind: 'variable',
            data: {
              valueType: 'number',
              name: 'z',
              value: {
                id: 'ref-call',
                kind: 'functionCall',
                data: {
                  functionName: 'add',
                  returnType: 'number',
                  arguments: [],
                },
              },
            },
          },
        ],
      },
    },
    {
      id: 'func-add',
      kind: 'function',
      data: {
        name: 'add',
        returnType: 'number',
        signature: {
          id: 'type-add-sig',
          kind: 'type',
          data: {
            rows: [
              { id: 'param-a', name: 'a', type: 'number' },
              { id: 'param-b', name: 'b', type: 'number' },
            ],
            variables: [],
          },
        },
        body: [
          {
            id: 'expr-return',
            kind: 'expression',
            data: {
              resultName: 'result',
              resultType: 'number',
              operator: '+',
              left: {
                id: 'ref-param-a',
                kind: 'variable',
                data: { valueType: 'number', name: 'a' },
              },
              right: {
                id: 'ref-param-b',
                kind: 'variable',
                data: { valueType: 'number', name: 'b' },
              },
            },
          },
        ],
      },
    },
    {
      id: 'demo-if',
      kind: 'if',
      data: {
        condition: {
          id: 'cond-bool',
          kind: 'primitive',
          data: { valueType: 'boolean', value: true },
        },
        trueBranch: [
          {
            id: 'if-true-var',
            kind: 'variable',
            data: {
              valueType: 'string',
              name: 'msg',
              value: {
                id: 'if-true-val',
                kind: 'primitive',
                data: { valueType: 'string', value: '"yes"' },
              },
            },
          },
        ],
        falseBranch: [
          {
            id: 'if-false-var',
            kind: 'variable',
            data: {
              valueType: 'string',
              name: 'msg',
              value: {
                id: 'if-false-val',
                kind: 'primitive',
                data: { valueType: 'string', value: '"no"' },
              },
            },
          },
        ],
      },
    },
    {
      id: 'demo-for',
      kind: 'for',
      data: {
        init: {
          id: 'for-init',
          kind: 'variable',
          data: {
            valueType: 'number',
            name: 'i',
            value: {
              id: 'for-init-val',
              kind: 'primitive',
              data: { valueType: 'number', value: 0 },
            },
          },
        },
        condition: {
          id: 'for-cond',
          kind: 'expression',
          data: {
            resultName: '',
            resultType: 'boolean',
            operator: '<',
            left: {
              id: 'for-cond-i',
              kind: 'variable',
              data: { valueType: 'number', name: 'i' },
            },
            right: {
              id: 'for-cond-10',
              kind: 'primitive',
              data: { valueType: 'number', value: 10 },
            },
          },
        },
        increment: {
          id: 'for-inc',
          kind: 'expression',
          data: {
            resultName: 'i',
            resultType: 'number',
            operator: '+',
            left: {
              id: 'for-inc-i',
              kind: 'variable',
              data: { valueType: 'number', name: 'i' },
            },
            right: {
              id: 'for-inc-1',
              kind: 'primitive',
              data: { valueType: 'number', value: 1 },
            },
          },
        },
        body: [],
      },
    },
    {
      id: 'demo-while',
      kind: 'while',
      data: {
        condition: {
          id: 'while-cond',
          kind: 'primitive',
          data: { valueType: 'boolean', value: true },
        },
        body: [],
      },
    },
  ],
  placements: [
    { blockId: 'main', x: 40, y: 40 },
    { blockId: 'func-add', x: 520, y: 80 },
    { blockId: 'demo-if', x: 40, y: 480 },
    { blockId: 'demo-for', x: 340, y: 480 },
    { blockId: 'demo-while', x: 680, y: 480 },
  ],
  connections: [],
}
