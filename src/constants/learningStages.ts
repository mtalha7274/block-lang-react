import type { BlockKind } from '../types'

export interface LearningStage {
  id: string
  label: string
  blockKinds: BlockKind[]
}

export const learningStages: LearningStage[] = [
  {
    id: 'basics',
    label: 'Basics',
    blockKinds: ['primitive', 'variable', 'print'],
  },
  {
    id: 'expressions',
    label: 'Expressions',
    blockKinds: ['expression'],
  },
  {
    id: 'control',
    label: 'Control Flow',
    blockKinds: ['if', 'while'],
  },
  {
    id: 'functions',
    label: 'Functions',
    blockKinds: ['functionCall', 'return'],
  },
]
