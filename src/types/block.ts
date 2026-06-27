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
  | 'return'
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
  params: TypeParamRow[]
  /** @deprecated Legacy programs may still attach a Type block here. */
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

export interface ReturnBlockData {
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

export interface BaseBlockNode<TKind extends BlockKind, TData> {
  id: BlockId
  kind: TKind
  data: TData
  visual?: BlockVisualFlags
}

export type MainBlockNode = BaseBlockNode<'main', MainFunctionBlockData>
export type PrimitiveBlockNode = BaseBlockNode<'primitive', PrimitiveBlockData>
export type VariableBlockNode = BaseBlockNode<'variable', VariableBlockData>
export type TypeBlockNode = BaseBlockNode<'type', TypeBlockData>
export type ExpressionBlockNode = BaseBlockNode<'expression', ExpressionBlockData>
export type IfBlockNode = BaseBlockNode<'if', IfBlockData>
export type ForLoopBlockNode = BaseBlockNode<'for', ForLoopBlockData>
export type WhileLoopBlockNode = BaseBlockNode<'while', WhileLoopBlockData>
export type FunctionBlockNode = BaseBlockNode<'function', FunctionBlockData>
export type FunctionCallBlockNode = BaseBlockNode<'functionCall', FunctionCallBlockData>
export type PrintBlockNode = BaseBlockNode<'print', PrintBlockData>
export type ReturnBlockNode = BaseBlockNode<'return', ReturnBlockData>
export type ValueRefBlockNode = BaseBlockNode<'valueRef', ValueRefBlockData>

export type BlockNode =
  | MainBlockNode
  | PrimitiveBlockNode
  | VariableBlockNode
  | TypeBlockNode
  | ExpressionBlockNode
  | IfBlockNode
  | ForLoopBlockNode
  | WhileLoopBlockNode
  | FunctionBlockNode
  | FunctionCallBlockNode
  | PrintBlockNode
  | ReturnBlockNode
  | ValueRefBlockNode

export type BlockData = Pick<BlockNode, 'kind' | 'data'>
