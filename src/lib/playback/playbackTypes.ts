import type { BlockKind, BlockNode, SlotTarget } from '../../types'

export type PlaybackAction =
  | { type: 'center-main' }
  | { type: 'pause'; ms: number }
  | {
      type: 'drag-drop'
      paletteKind: BlockKind
      label: string
      target: SlotTarget
      template: BlockNode
    }
  | { type: 'open-editor'; blockId: string }
  | { type: 'ensure-function'; functionBlock: Extract<BlockNode, { kind: 'function' }> }

export const PLAYBACK_DRAG_MS = 900
export const PLAYBACK_PAUSE_AFTER_DROP_MS = 1100
export const PLAYBACK_PAUSE_AFTER_OPEN_MS = 850
export const PLAYBACK_INITIAL_PAUSE_MS = 1200
