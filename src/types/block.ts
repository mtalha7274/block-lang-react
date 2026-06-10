export type BlockId = string

export type ValueType = 'number' | 'string' | 'boolean' | 'void'

export type BlockKind =
  | 'main'
  | 'primitive'
  | 'variable'
  | 'type'
  | 'expression'
  | 'if'
  | 'for'
  | 'while'
  | 'function'
  | 'functionCall'
  | 'print'
  | 'valueRef'

export type BlockCategory = 'primitive' | 'variable' | 'control' | 'function'

export type BlockVisualState = 'default' | 'active' | 'error' | 'disabled'

export type OperatorSymbol =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '=='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='

export interface BlockLayoutOverride {
  width?: number
  height?: number
}

export interface RenderChildOptions {
  compact?: boolean
  inStatementBody?: boolean
  slotFit?: boolean
  nestedView?: boolean
  statementIndex?: number
  scopeConsumerId?: string
}

export interface BlockVisualFlags {
  state?: BlockVisualState
  errorMessage?: string
  layout?: BlockLayoutOverride
}

export interface PrimitiveBlockData {
  valueType: ValueType
  value: string | number | boolean
}

export interface VariableBlockData {
  valueType: ValueType
  name: string
  value?: BlockNode
}

export interface TypeParamRow {
  id: string
  name: string
  type: ValueType
}

export interface TypeBlockData {
  rows: TypeParamRow[]
  variables: BlockNode[]
}

export interface ExpressionBlockData {
  resultName: string
  resultType: ValueType
  operator: OperatorSymbol
  left?: BlockNode
  right?: BlockNode
}

export interface IfBlockData {
  condition?: BlockNode
  trueBranch: BlockNode[]
  falseBranch?: BlockNode[]
}

export interface ForLoopBlockData {
  init?: BlockNode
  condition?: BlockNode
  increment?: BlockNode
  body: BlockNode[]
}

export interface WhileLoopBlockData {
  condition?: BlockNode
  body: BlockNode[]
}

export interface FunctionParameter {
  id: string
  name: string
  type: ValueType
}

export interface FunctionBlockData {
  name: string
  returnType: ValueType
  signature?: BlockNode
  body: BlockNode[]
}

export interface FunctionCallArgument {
  portId: string
  name: string
  type: ValueType
  value?: BlockNode
}

export interface FunctionCallBlockData {
  functionName: string
  returnType: ValueType
  targetFunctionId?: BlockId
  arguments: FunctionCallArgument[]
}

export interface PrintBlockData {
  value?: BlockNode
}

export interface ValueRefBlockData {
  sourceBlockId: BlockId
  label: string
  valueType: ValueType
}

export interface MainFunctionBlockData {
  body: BlockNode[]
}

export type BlockData =
  | { kind: 'main'; data: MainFunctionBlockData }
  | { kind: 'primitive'; data: PrimitiveBlockData }
  | { kind: 'variable'; data: VariableBlockData }
  | { kind: 'type'; data: TypeBlockData }
  | { kind: 'expression'; data: ExpressionBlockData }
  | { kind: 'if'; data: IfBlockData }
  | { kind: 'for'; data: ForLoopBlockData }
  | { kind: 'while'; data: WhileLoopBlockData }
  | { kind: 'function'; data: FunctionBlockData }
  | { kind: 'functionCall'; data: FunctionCallBlockData }
  | { kind: 'print'; data: PrintBlockData }
  | { kind: 'valueRef'; data: ValueRefBlockData }

export type BlockNode = BlockData & {
  id: BlockId
  visual?: BlockVisualFlags
}
