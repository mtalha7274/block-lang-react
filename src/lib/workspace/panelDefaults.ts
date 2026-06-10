import type { PanelPosition } from '../../hooks/useEditorState'

export const PALETTE_PANEL_WIDTH = 240
export const INSPECTOR_PANEL_WIDTH = 280

export function createDefaultPanelPositions(): Record<string, PanelPosition> {
  const viewportWidth =
    typeof window !== 'undefined' ? window.innerWidth : 1280

  return {
    palette: { x: 0, y: 0 },
    inspector: {
      x: Math.max(0, viewportWidth - INSPECTOR_PANEL_WIDTH),
      y: 0,
    },
    blockEditor: {
      x: Math.max(0, viewportWidth - INSPECTOR_PANEL_WIDTH - PALETTE_PANEL_WIDTH),
      y: 0,
    },
  }
}

export function getInspectorDefaultX(viewportWidth = window.innerWidth): number {
  return Math.max(0, viewportWidth - INSPECTOR_PANEL_WIDTH)
}

export function getPaletteDefaultPosition(): PanelPosition {
  return { x: 0, y: 0 }
}
