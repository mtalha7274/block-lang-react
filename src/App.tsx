import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  AppShell,
  Toolbar,
  BlockPalette,
  WorkspaceCanvas,
  CanvasBlocksLayer,
  canvasBlockStackId,
  RightPanel,
  OutputPanel,
} from './components/layout'
import { FloatingPanel } from './components/ui'
import { BlockEditorPanel } from './components/panels'
import { useEditorState, useBlockDrag, useEmulator, useStackZOrder, useAlgorithmPlayback } from './hooks'
import { DragContext, type DragContextValue } from './components/canvas/DragContext'
import { blockRegistry } from './constants'
import { compileProgram } from './lib/compile'
import { validateProgram } from './lib/validation/validateProgram'
import { runProgram } from './lib/emulate'
import { ReferenceDragGhost } from './components/blocks/ReferenceDragGhost'
import { resolveBlockEditorTargetId } from './lib/program/callWire'
import { findBlockInTree, getStatementLineNumber } from './lib/program/blockTree'
import { collectDescendantBlockIds } from './lib/program/collectDescendantBlockIds'
import { computeEditorPanelPosition } from './lib/workspace/editorPanelPlacement'
import {
  getInspectorDefaultX,
  getPaletteDefaultPosition,
  INSPECTOR_PANEL_WIDTH,
  PALETTE_PANEL_WIDTH,
} from './lib/workspace/panelDefaults'
import { createTestApi } from './testApi'
import { algorithmCatalog, defaultAlgorithmId } from './constants/algorithmCatalog'
import { getSiblingEditorIdsToClose } from './lib/program/editorStackRules'
import { PlaybackGhost } from './components/playback/PlaybackGhost'
import type { BlockKind, PanelTab, SlotTarget } from './types'
import './App.css'

function App() {
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>('typescript')
  const [editorStack, setEditorStack] = useState<string[]>([])
  const [centerMainTrigger, setCenterMainTrigger] = useState(1)
  const [scrollOffset, setScrollOffset] = useState({ left: 0, top: 0 })
  const surfaceRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const workspaceContainerRef = useRef<HTMLDivElement>(null)

  const panelZ = useStackZOrder(20)

  const {
    program,
    panelPositions,
    moveBlock,
    movePanel,
    resetProgram,
    loadProgram,
    updateBlockType,
    updateBlockValue,
    updateVariableName,
    updateFunctionReturnType,
    updateFunctionName,
    addTypeParamRow,
    removeTypeParamRow,
    updateTypeParamRow,
    updateFunctionCallName,
    updateExpressionOperator,
    updateExpressionResultName,
    updateBlockLayout,
    attachBlockIdToSlot,
    attachNewBlockToSlot,
    attachTemplateBlockToSlot,
    ensureTopLevelFunction,
    assignInScopeReference,
    getInScopeValues,
    detachNestedBlock,
    removeTopLevelBlock,
  } = useEditorState()

  const emulator = useEmulator()

  const e2eEnabled =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('e2e')

  const centerMain = useCallback(() => {
    setCenterMainTrigger((n) => n + 1)
  }, [])

  const compileResult = useMemo(() => compileProgram(program), [program])
  const validationErrors = useMemo(() => validateProgram(program), [program])
  const canEmulate =
    validationErrors.length === 0 && compileResult.errors.length === 0

  const findBlock = useCallback(
    (id: string) => findBlockInTree(program.blocks, id),
    [program.blocks],
  )

  useEffect(() => {
    setEditorStack((prev) =>
      prev.filter((id) => findBlockInTree(program.blocks, id) !== undefined),
    )
  }, [program])

  const raiseCanvasBlock = useCallback(
    (blockId: string) => {
      panelZ.raise(canvasBlockStackId(blockId))
    },
    [panelZ],
  )

  const getCanvasBlockZ = useCallback(
    (blockId: string) => panelZ.getZ(canvasBlockStackId(blockId), 2),
    [panelZ],
  )

  const raisePanel = useCallback(
    (panelId: string) => {
      panelZ.raise(panelId)
    },
    [panelZ],
  )

  const getEditorTargetBlockId = useCallback(
    (blockId: string) => {
      const block = findBlock(blockId)
      if (!block) return blockId
      return resolveBlockEditorTargetId(block, program.blocks)
    },
    [findBlock, program.blocks],
  )

  const openBlockEditor = useCallback(
    (blockId: string, anchorEl?: HTMLElement | null) => {
      const editorBlockId = getEditorTargetBlockId(blockId)
      const panelId = `blockEditor-${editorBlockId}`
      const siblingEditorsToClose = getSiblingEditorIdsToClose(program.blocks, blockId)

      setEditorStack((prev) => {
        const withoutSiblings = prev.filter((id) => !siblingEditorsToClose.has(id))
        const withoutSelf = withoutSiblings.filter((id) => id !== editorBlockId)

        if (
          anchorEl &&
          workspaceContainerRef.current &&
          !panelPositions[panelId]
        ) {
          const pos = computeEditorPanelPosition(
            anchorEl,
            workspaceContainerRef.current,
            280,
          )
          movePanel(panelId, pos.x, pos.y)
        }

        return [...withoutSelf, editorBlockId]
      })

      raisePanel(panelId)
    },
    [getEditorTargetBlockId, movePanel, panelPositions, program.blocks, raisePanel],
  )

  const attachNewBlockFromPalette = useCallback(
    (kind: BlockKind, target: SlotTarget) => {
      const result = attachNewBlockToSlot(kind, target)
      if (result.createdFunctionId) {
        openBlockEditor(result.createdFunctionId)
      }
      return result
    },
    [attachNewBlockToSlot, openBlockEditor],
  )

  const algorithmPlayback = useAlgorithmPlayback({
    resetProgram: () => {
      emulator.reset()
      setEditorStack([])
      resetProgram()
      centerMain()
    },
    attachTemplateBlockToSlot,
    ensureTopLevelFunction,
    openBlockEditor: (blockId) => openBlockEditor(blockId),
    centerMain,
    defaultAlgorithmId,
    onComplete: () => {
      if (e2eEnabled) {
        document.body.dataset.demoComplete = 'true'
      }
    },
  })

  useEffect(() => {
    if (!e2eEnabled) {
      delete window.__BLOCKLANG_TEST__
      return
    }

    window.__BLOCKLANG_TEST__ = createTestApi({
      loadProgram,
      getProgram: () => program,
      runEmulate: () => {
        emulator.run(program)
        setActivePanelTab('variables')
      },
      getEmulationState: () => {
        const result = runProgram(program)
        return {
          status: result.status,
          variables: result.variables.map((v) => ({
            name: v.name,
            value: v.value,
          })),
          errorMessage: result.errorMessage,
        }
      },
      selectAlgorithm: algorithmPlayback.setSelectedAlgorithmId,
      playAlgorithm: algorithmPlayback.play,
      getPlaybackState: () => ({
        isPlaying: algorithmPlayback.isPlaying,
        selectedAlgorithmId: algorithmPlayback.selectedAlgorithmId,
        stepIndex: algorithmPlayback.stepIndex,
        totalSteps: algorithmPlayback.totalSteps,
        demoComplete: document.body.dataset.demoComplete === 'true',
      }),
    })
    document.body.dataset.testid = 'app-ready'

    return () => {
      delete window.__BLOCKLANG_TEST__
      delete document.body.dataset.testid
    }
  }, [e2eEnabled, loadProgram, program, emulator, algorithmPlayback])

  const drag = useBlockDrag({
    onMoveBlock: moveBlock,
    onAttachBlockId: attachBlockIdToSlot,
    onAttachNewBlock: attachNewBlockFromPalette,
    onAssignReference: assignInScopeReference,
    onRaiseCanvasBlock: raiseCanvasBlock,
    surfaceRef,
    scrollRef,
    findBlock,
    getBlocks: () => program.blocks,
  })

  const closeBlockEditor = useCallback((blockId: string) => {
    setEditorStack((prev) => prev.filter((id) => id !== blockId))
  }, [])

  const closeNestedEditors = useCallback(
    (containerBlockId: string) => {
      const container = findBlockInTree(program.blocks, containerBlockId)
      if (!container) return
      const descendantIds = new Set(collectDescendantBlockIds(container))
      setEditorStack((prev) => prev.filter((id) => !descendantIds.has(id)))
    },
    [program.blocks],
  )

  const handleDetachNestedBlock = useCallback(
    (blockId: string) => {
      detachNestedBlock(blockId)
      setEditorStack((prev) => prev.filter((id) => id !== blockId))
    },
    [detachNestedBlock],
  )

  const handleRemoveTopLevelBlock = useCallback(
    (blockId: string) => {
      removeTopLevelBlock(blockId)
      setEditorStack((prev) => prev.filter((id) => id !== blockId))
    },
    [removeTopLevelBlock],
  )

  const dragContext = useMemo<DragContextValue>(
    () => ({
      draggingBlockId: drag.draggingBlockId,
      draggingPaletteKind: drag.draggingPaletteKind,
      draggingReferenceSourceId: drag.draggingReferenceSourceId,
      hoverSlot: drag.hoverSlot,
      slotValidity: drag.slotValidity,
      rejectBlockId: drag.rejectBlockId,
      rejectMessage: drag.rejectMessage,
      rejectSlotTarget: drag.rejectSlotTarget,
      editorStack,
      hoverPreviewSize: drag.hoverPreviewSize,
      referenceDragPosition: drag.referenceDragPosition,
      updateBlockType,
      updateBlockValue,
      updateVariableName,
      updateFunctionReturnType,
      updateFunctionName,
      addTypeParamRow,
      removeTypeParamRow,
      updateTypeParamRow,
      updateFunctionCallName,
      updateExpressionOperator,
      updateExpressionResultName,
      updateBlockLayout,
      onSlotPointerEnter: drag.onSlotPointerEnter,
      onSlotPointerLeave: drag.onSlotPointerLeave,
      onSlotPointerUp: drag.onSlotPointerUp,
      onBlockDragStart: () => {},
      onBlockDragEnd: () => {},
      onReferenceDragStart: drag.onReferenceDragStart,
      onReferenceDragEnd: drag.onReferenceDragEnd,
      onNestedChipPointerDown: drag.handleNestedChipPointerDown,
      handleSlotDragOver: drag.handleSlotDragOver,
      handleSlotDrop: drag.handleSlotDrop,
      openBlockEditor,
      getEditorTargetBlockId,
      closeBlockEditor,
      closeNestedEditors,
      detachNestedBlock: handleDetachNestedBlock,
      removeTopLevelBlock: handleRemoveTopLevelBlock,
      assignInScopeReference,
      getInScopeValues,
      getBlocks: () => program.blocks,
      isNested: false,
    }),
    [
      drag,
      editorStack,
      updateBlockType,
      updateBlockValue,
      updateVariableName,
      updateFunctionReturnType,
      updateFunctionName,
      addTypeParamRow,
      removeTypeParamRow,
      updateTypeParamRow,
      updateFunctionCallName,
      updateExpressionOperator,
      updateExpressionResultName,
      updateBlockLayout,
      openBlockEditor,
      getEditorTargetBlockId,
      closeBlockEditor,
      closeNestedEditors,
      handleDetachNestedBlock,
      handleRemoveTopLevelBlock,
      assignInScopeReference,
      getInScopeValues,
      program.blocks,
    ],
  )

  const handleReset = () => {
    algorithmPlayback.stop()
    emulator.reset()
    setActivePanelTab('typescript')
    setEditorStack([])
    resetProgram()
    setCenterMainTrigger((n) => n + 1)
    delete document.body.dataset.demoComplete
  }

  const handleCenterMain = useCallback(
    (x: number, y: number) => {
      moveBlock('main', x, y)
    },
    [moveBlock],
  )

  const isEmulating = emulator.isActive
  const activeHighlightBlockId =
    algorithmPlayback.highlightBlockId ?? emulator.highlight?.activeBlockId

  const handleEmulateToggle = () => {
    if (emulator.isActive) {
      emulator.stop()
    } else {
      emulator.run(program)
      setActivePanelTab('variables')
    }
  }

  const inspectorX = panelPositions.inspector?.x ?? getInspectorDefaultX()

  const referenceDragBlock =
    drag.draggingReferenceSourceId && drag.referenceDragPosition
      ? findBlock(drag.draggingReferenceSourceId)
      : null

  return (
    <AppShell
      toolbar={
        <Toolbar
          isEmulating={isEmulating}
          emulateStatus={emulator.status}
          emulateError={emulator.status === 'error'}
          emulateDisabled={!canEmulate}
          onEmulateToggle={handleEmulateToggle}
          onReset={handleReset}
          algorithms={algorithmCatalog}
          selectedAlgorithmId={algorithmPlayback.selectedAlgorithmId}
          isAlgorithmPlaying={algorithmPlayback.isPlaying}
          algorithmStatusMessage={algorithmPlayback.statusMessage}
          onSelectAlgorithm={algorithmPlayback.setSelectedAlgorithmId}
          onAlgorithmPlay={() => {
            delete document.body.dataset.demoComplete
            void algorithmPlayback.play()
          }}
          onAlgorithmStop={algorithmPlayback.stop}
        />
      }
      outputPanel={
        <OutputPanel
          lines={emulator.isActive ? emulator.outputLines : []}
          visible
        />
      }
      workspace={
        <div ref={workspaceContainerRef} className="app-workspace-root">
          <DragContext.Provider value={dragContext}>
            {referenceDragBlock && drag.referenceDragPosition && (
              <ReferenceDragGhost
                block={referenceDragBlock}
                x={drag.referenceDragPosition.x}
                y={drag.referenceDragPosition.y}
              />
            )}
            {algorithmPlayback.ghost && (
              <PlaybackGhost
                label={algorithmPlayback.ghost.label}
                kind={algorithmPlayback.ghost.kind}
                x={algorithmPlayback.ghost.x}
                y={algorithmPlayback.ghost.y}
                visible={algorithmPlayback.isPlaying}
              />
            )}
            <WorkspaceCanvas
              surfaceRef={surfaceRef}
              scrollRef={scrollRef}
              onScrollOffsetChange={setScrollOffset}
            />

            <CanvasBlocksLayer
              program={program}
              activeBlockId={activeHighlightBlockId}
              scrollOffset={scrollOffset}
              scrollRef={scrollRef}
              centerMainTrigger={centerMainTrigger}
              getBlockZ={getCanvasBlockZ}
              onBlockPointerDown={drag.handleBlockPointerDown}
              onRaiseBlock={raiseCanvasBlock}
              onCenterMain={handleCenterMain}
            />

            <FloatingPanel
              id="palette"
              title="Blocks"
              dock="top-left"
              position={panelPositions.palette ?? getPaletteDefaultPosition()}
              onMove={movePanel}
              minWidth={PALETTE_PANEL_WIDTH}
              zIndex={panelZ.getZ('palette', 20)}
              workspaceContainerRef={workspaceContainerRef}
              onFocus={() => raisePanel('palette')}
            >
              <BlockPalette
                onDragStart={drag.handlePaletteDragStart}
                onDragEnd={drag.handlePaletteDragEnd}
              />
            </FloatingPanel>

            {editorStack.map((blockId, stackIndex) => {
              const block = findBlock(blockId)
              if (!block) return null
              const panelId = `blockEditor-${blockId}`
              const saved = panelPositions[panelId]
              const title =
                block.kind === 'function'
                  ? block.data.name
                  : (blockRegistry[block.kind]?.label ?? 'Block Editor')
              const lineNumber = getStatementLineNumber(program.blocks, blockId)
              const stackZ = 30 + stackIndex * 10
              return (
                <FloatingPanel
                  key={blockId}
                  id={panelId}
                  title={title}
                  subtitle={lineNumber ? `Line ${lineNumber}` : undefined}
                  position={{
                    x: saved?.x ?? 80,
                    y: saved?.y ?? 80,
                  }}
                  onMove={movePanel}
                  minWidth={280}
                  zIndex={panelZ.getZ(panelId, stackZ)}
                  workspaceContainerRef={workspaceContainerRef}
                  onFocus={() => raisePanel(panelId)}
                  onHeaderClose={() => closeBlockEditor(blockId)}
                >
                  <BlockEditorPanel
                    block={block}
                    activeBlockId={activeHighlightBlockId}
                  />
                </FloatingPanel>
              )
            })}

            <FloatingPanel
              id="inspector"
              title="Inspector"
              dock="top-right"
              position={{
                x: inspectorX,
                y: panelPositions.inspector?.y ?? 0,
              }}
              onMove={movePanel}
              minWidth={INSPECTOR_PANEL_WIDTH}
              zIndex={panelZ.getZ('inspector', 20)}
              workspaceContainerRef={workspaceContainerRef}
              onFocus={() => raisePanel('inspector')}
            >
              <RightPanel
                activeTab={activePanelTab}
                onTabChange={setActivePanelTab}
                typeScriptCode={compileResult.code}
                compileErrors={compileResult.errors}
                variables={emulator.isActive ? emulator.variables : []}
                callStack={emulator.isActive ? emulator.callStack : []}
                isEmulating={isEmulating}
                errorMessage={emulator.errorMessage}
              />
            </FloatingPanel>
          </DragContext.Provider>
        </div>
      }
    />
  )
}

export default App
