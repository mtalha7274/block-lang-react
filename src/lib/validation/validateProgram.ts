import type { BlockId, BlockNode, ProgramDocument } from '../../types'
import { canExpressionOperandAcceptBlock } from './typeChecker'

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
    case 'while':
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

function validateBlock(block: BlockNode, errors: ProgramValidationError[]): void {
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
}

export function validateProgram(doc: ProgramDocument): ProgramValidationError[] {
  const errors: ProgramValidationError[] = []
  doc.blocks.forEach((block) => {
    visitBlock(block, (b) => validateBlock(b, errors))
  })
  return errors
}
