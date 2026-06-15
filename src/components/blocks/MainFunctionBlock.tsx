import type { BlockNode, RenderChildOptions, ConnectionEdge } from '../../types'
import { PuzzleStrip } from './PuzzleStrip'
import { StatementBody } from './StatementBody'

interface MainFunctionBlockProps {
  block: Extract<BlockNode, { kind: 'main' }>
  renderChild: (node: BlockNode, opts?: RenderChildOptions) => React.ReactNode
  activeBlockId?: string
  connections?: ConnectionEdge[]
}

export function MainFunctionBlock({
  block,
  renderChild,
  activeBlockId,
  connections = [],
}: MainFunctionBlockProps) {
  const isActive = activeBlockId === block.id

  return (
    <PuzzleStrip
      blockId={block.id}
      layoutOverride={block.visual?.layout}
      typeColor="var(--accent)"
      isMain
      state={isActive ? 'active' : 'default'}
    >
      <StatementBody
        statements={block.data.body}
        region="main"
        parentBlockId={block.id}
        containerBlock={block}
        renderChild={renderChild}
        activeBlockId={activeBlockId}
        connections={connections}
      />
    </PuzzleStrip>
  )
}
