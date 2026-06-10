import type { OperatorSymbol, ValueType } from '../types'

export interface OperatorEntry {
  symbol: OperatorSymbol
  label: string
  resultType: ValueType
}

export const operators: OperatorEntry[] = [
  { symbol: '+', label: 'Add', resultType: 'number' },
  { symbol: '-', label: 'Subtract', resultType: 'number' },
  { symbol: '*', label: 'Multiply', resultType: 'number' },
  { symbol: '/', label: 'Divide', resultType: 'number' },
  { symbol: '%', label: 'Modulo', resultType: 'number' },
  { symbol: '==', label: 'Equals', resultType: 'boolean' },
  { symbol: '!=', label: 'Not equals', resultType: 'boolean' },
  { symbol: '>', label: 'Greater than', resultType: 'boolean' },
  { symbol: '<', label: 'Less than', resultType: 'boolean' },
  { symbol: '>=', label: 'Greater or equal', resultType: 'boolean' },
  { symbol: '<=', label: 'Less or equal', resultType: 'boolean' },
]
