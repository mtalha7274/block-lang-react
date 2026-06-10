import type { BlockNode } from '../../types'
import { BlockRenderer } from '../canvas/BlockRenderer'
import './BlockEditorPanel.css'

interface BlockEditorPanelProps {
  block: BlockNode
  activeBlockId?: string
}

export function BlockEditorPanel({ block, activeBlockId }: BlockEditorPanelProps) {
  return (
    <div className="block-editor-panel">
      <BlockRenderer block={block} activeBlockId={activeBlockId} inEditorPanel />
    </div>
  )
}
