import type { BlockId, BlockNode, ProgramDocument } from '../../types'
import {
  canExpressionOperandAcceptBlock,
  getBlockValueType,
} from './typeChecker'
import { findEnclosingFunction } from '../program/enclosingFunction'

export interface ProgramValidationError {
  blockId: BlockId
  message: string
}

function visitBlock(block: BlockNode, visit: (block: BlockNode) => void): void {
  visit(block)

  switch (block.kind) {
    case 'main':
      block.data.body.forEach((child) => visitBlock(child, visit))
      break
    case 'variable':
      if (block.data.value) visitBlock(block.data.value, visit)
      break
    case 'print':
      if (block.data.value) visitBlock(block.data.value, visit)
      break
    case 'return':
      if (block.data.value) visitBlock(block.data.value, visit)
      break
    case 'functionCall':
      block.data.arguments.forEach((arg) => {
        if (arg.value) visitBlock(arg.value, visit)
      })
      break
    case 'type':
      block.data.variables.forEach((v) => visitBlock(v, visit))
      break
    case 'expression':
      if (block.data.left) visitBlock(block.data.left, visit)
      if (block.data.right) visitBlock(block.data.right, visit)
      break
    case 'if':
      if (block.data.condition) visitBlock(block.data.condition, visit)
      block.data.trueBranch.forEach((child) => visitBlock(child, visit))
      block.data.falseBranch?.forEach((child) => visitBlock(child, visit))
      break
    case 'for':
      if (block.data.init) visitBlock(block.data.init, visit)
      if (block.data.condition) visitBlock(block.data.condition, visit)
      if (block.data.increment) visitBlock(block.data.increment, visit)
      block.data.body.forEach((child) => visitBlock(child, visit))
      break
    case 'while':
      if (block.data.condition) visitBlock(block.data.condition, visit)
      block.data.body.forEach((child) => visitBlock(child, visit))
      break
    case 'function':
      if (block.data.signature) visitBlock(block.data.signature, visit)
      block.data.body.forEach((child) => visitBlock(child, visit))
      break
    default:
      break
  }
}

function validateBlock(
  block: BlockNode,
  errors: ProgramValidationError[],
  blocks: BlockNode[],
): void {
  if (block.visual?.state === 'error') {
    errors.push({
      blockId: block.id,
      message: block.visual.errorMessage ?? 'Block has an error',
    })
  }

  if (block.kind === 'expression') {
    const { left, right } = block.data
    if (left && !canExpressionOperandAcceptBlock(block, left)) {
      errors.push({
        blockId: block.id,
        message: 'Left operand type does not match operator',
      })
    }
    if (right && !canExpressionOperandAcceptBlock(block, right)) {
      errors.push({
        blockId: block.id,
        message: 'Right operand type does not match operator',
      })
    }
    if ((left || right) && (!left || !right)) {
      errors.push({
        blockId: block.id,
        message: 'Expression is incomplete',
      })
    }
  }

  if (block.kind === 'if' && block.data.condition) {
    const conditionType = getBlockValueType(block.data.condition)
    if (conditionType !== 'boolean') {
      errors.push({
        blockId: block.id,
        message: 'Condition must evaluate to a boolean',
      })
    }
  }

  if (block.kind === 'for' && block.data.condition) {
    const conditionType = getBlockValueType(block.data.condition)
    if (conditionType !== 'boolean') {
      errors.push({
        blockId: block.id,
        message: 'Condition must evaluate to a boolean',
      })
    }
  }

  if (block.kind === 'while' && block.data.condition) {
    const conditionType = getBlockValueType(block.data.condition)
    if (conditionType !== 'boolean') {
      errors.push({
        blockId: block.id,
        message: 'Condition must evaluate to a boolean',
      })
    }
  }

  if (block.kind === 'return') {
    const fn = findEnclosingFunction(blocks, block.id)
    if (!fn) {
      errors.push({
        blockId: block.id,
        message: 'Return must be inside a function',
      })
      return
    }
    if (fn.data.returnType === 'void' && block.data.value) {
      errors.push({
        blockId: block.id,
        message: 'Void functions cannot return a value',
      })
      return
    }
    if (block.data.value && fn.data.returnType !== 'void') {
      const valueType = getBlockValueType(block.data.value)
      if (valueType !== fn.data.returnType) {
        errors.push({
          blockId: block.id,
          message: `Return value must be ${fn.data.returnType}, not ${valueType ?? 'unknown'}`,
        })
      }
    }
  }
}

export function validateProgram(doc: ProgramDocument): ProgramValidationError[] {
  const errors: ProgramValidationError[] = []
  doc.blocks.forEach((block) => {
    visitBlock(block, (b) => validateBlock(b, errors, doc.blocks))
  })
  return errors
}
