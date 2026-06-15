import type { PanelPosition } from '../../hooks/useEditorState'

const PANEL_GAP = 8

export function computeEditorPanelPosition(
  anchorEl: HTMLElement,
  workspaceEl: HTMLElement,
  panelWidth = 280,
): PanelPosition {
  const anchor = anchorEl.getBoundingClientRect()
  const workspace = workspaceEl.getBoundingClientRect()

  let x = anchor.left - workspace.left
  let y = anchor.bottom - workspace.top + PANEL_GAP

  const maxX = Math.max(0, workspace.width - panelWidth - PANEL_GAP)
  const maxY = Math.max(0, workspace.height - 120)

  x = Math.max(PANEL_GAP, Math.min(x, maxX))
  y = Math.max(PANEL_GAP, Math.min(y, maxY))

  return { x, y }
}
