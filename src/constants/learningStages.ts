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
    blockKinds: ['primitive', 'variable', 'type', 'print'],
  },
  {
    id: 'expressions',
    label: 'Expressions',
    blockKinds: ['expression'],
  },
  {
    id: 'control',
    label: 'Control Flow',
    blockKinds: ['if', 'for', 'while'],
  },
  {
    id: 'functions',
    label: 'Functions',
    blockKinds: ['functionCall', 'return'],
  },
]
