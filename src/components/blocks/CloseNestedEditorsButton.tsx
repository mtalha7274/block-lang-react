import { useMemo } from 'react'
import { useDragContext } from '../canvas/DragContext'
import { collectDescendantBlockIds } from '../../lib/program/collectDescendantBlockIds'
import type { BlockNode } from '../../types'
import './CloseNestedEditorsButton.css'

function CloseEditorsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M2 3.5h10M2 7h7M2 10.5h4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M10.5 6v4.5H6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

interface CloseNestedEditorsButtonProps {
  containerBlock: Extract<BlockNode, { kind: 'main' | 'function' }>
}

export function CloseNestedEditorsButton({
  containerBlock,
}: CloseNestedEditorsButtonProps) {
  const ctx = useDragContext()

  const descendantIds = useMemo(
    () => new Set(collectDescendantBlockIds(containerBlock)),
    [containerBlock],
  )

  const openCount = ctx.editorStack.filter((id) => descendantIds.has(id)).length
  if (openCount === 0) return null

  return (
    <button
      type="button"
      className="close-nested-editors-btn"
      onClick={() => ctx.closeNestedEditors(containerBlock.id)}
    >
      <CloseEditorsIcon />
      <span>
        Close {openCount} editor{openCount === 1 ? '' : 's'}
      </span>
    </button>
  )
}
