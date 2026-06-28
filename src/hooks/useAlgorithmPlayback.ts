import { useCallback, useRef, useState } from 'react'
import type { BlockNode, ProgramDocument, SlotTarget } from '../types'
import { getAlgorithmById } from '../constants/algorithmCatalog'
import { compilePlaybackScript } from '../lib/playback/compilePlaybackScript'
import {
  animateDragBetweenElements,
  pulseSlotHover,
} from '../lib/playback/animateDrag'
import {
  PLAYBACK_DRAG_MS,
  type PlaybackAction,
} from '../lib/playback/playbackTypes'
import {
  paletteKindSelector,
  slotTargetToSelector,
} from '../lib/playback/slotSelectors'
import { pickTopmostElement } from '../lib/drag/slotTargetFromElement'
import { validatePlaybackProgram } from '../lib/playback/validatePlaybackProgram'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForSlotElement(selector: string, timeoutMs = 4000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const tick = () => {
      const matches = Array.from(document.querySelectorAll(selector))
      const el = pickTopmostElement(matches)
      if (el) {
        resolve(el)
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Element not found: ${selector}`))
        return
      }
      window.setTimeout(tick, 16)
    }
    tick()
  })
}

export interface AlgorithmPlaybackState {
  isPlaying: boolean
  selectedAlgorithmId: string
  stepIndex: number
  totalSteps: number
  highlightBlockId: string | null
  statusMessage: string | null
  validationError: boolean
  ghost: { x: number; y: number; label: string; kind: BlockNode['kind'] } | null
}

export function useAlgorithmPlayback(options: {
  resetProgram: () => void
  getProgram: () => ProgramDocument
  loadProgram: (doc: ProgramDocument) => void
  attachTemplateBlockToSlot: (
    template: BlockNode,
    target: SlotTarget,
  ) => { accepted: boolean; program?: ProgramDocument }
  ensureTopLevelFunction: (fn: Extract<BlockNode, { kind: 'function' }>) => ProgramDocument | undefined
  openBlockEditor: (blockId: string) => void
  centerMain: () => void
  onComplete?: () => void
  defaultAlgorithmId: string
  fastPlayback?: boolean
}) {
  const {
    resetProgram,
    getProgram,
    loadProgram,
    attachTemplateBlockToSlot,
    ensureTopLevelFunction,
    openBlockEditor,
    centerMain,
    onComplete,
    defaultAlgorithmId,
    fastPlayback = false,
  } = options

  const pause = (ms: number) => delay(fastPlayback ? Math.min(ms, 30) : ms)

  const cancelRef = useRef(false)
  const programSnapshotRef = useRef<ProgramDocument | null>(null)
  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState(defaultAlgorithmId)
  const [isPlaying, setIsPlaying] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [highlightBlockId, setHighlightBlockId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [validationError, setValidationError] = useState(false)
  const [ghost, setGhost] = useState<AlgorithmPlaybackState['ghost']>(null)

  const checkBuild = useCallback((programOverride?: ProgramDocument) => {
    const doc = programOverride ?? programSnapshotRef.current ?? getProgram()
    programSnapshotRef.current = doc
    const result = validatePlaybackProgram(doc)
    if (!result.valid) {
      setValidationError(true)
      setStatusMessage(result.summary)
    } else {
      setValidationError(false)
    }
    return result
  }, [getProgram])

  const stop = useCallback(() => {
    cancelRef.current = true
    setIsPlaying(false)
    setHighlightBlockId(null)
    setStatusMessage(null)
    setValidationError(false)
    setGhost(null)
    document.querySelectorAll('.slot--playback-hover').forEach((el) => {
      el.classList.remove('slot--playback-hover')
    })
  }, [])

  const runAction = useCallback(
    async (action: PlaybackAction, index: number) => {
      if (cancelRef.current) return

      setStepIndex(index)

      switch (action.type) {
        case 'center-main':
          setStatusMessage('Centering workspace…')
          centerMain()
          await pause(400)
          if (!fastPlayback) centerMain()
          return

        case 'pause':
          await pause(action.ms)
          return

        case 'ensure-function': {
          const nextProgram = ensureTopLevelFunction(action.functionBlock)
          if (nextProgram) checkBuild(nextProgram)
          await pause(120)
          return
        }

        case 'open-editor':
          setStatusMessage('Opening block editor…')
          setHighlightBlockId(action.blockId)
          openBlockEditor(action.blockId)
          await pause(300)
          return

        case 'drag-drop': {
          const paletteSel = paletteKindSelector(action.paletteKind)
          const slotSel = slotTargetToSelector(action.target)
          setStatusMessage(`Dragging ${action.label}…`)

          if (fastPlayback) {
            setGhost({
              x: 0,
              y: 0,
              label: action.label,
              kind: action.paletteKind,
            })
            await pause(150)
            const result = attachTemplateBlockToSlot(action.template, action.target)
            if (result.accepted) {
              setHighlightBlockId(action.template.id)
              const validation = checkBuild(result.program)
              setStatusMessage(
                validation.valid
                  ? `Dropped ${action.label}`
                  : validation.summary,
              )
              centerMain()
            }
            setGhost(null)
            return
          }

          let paletteEl: Element
          let slotEl: Element
          try {
            paletteEl = await waitForSlotElement(paletteSel)
            slotEl = await waitForSlotElement(slotSel)
          } catch {
            const result = attachTemplateBlockToSlot(action.template, action.target)
            if (result.accepted) {
              setHighlightBlockId(action.template.id)
              const validation = checkBuild(result.program)
              setStatusMessage(
                validation.valid
                  ? `Dropped ${action.label}`
                  : validation.summary,
              )
            }
            return
          }

          slotEl.scrollIntoView({ block: 'nearest', inline: 'nearest' })
          await pause(200)

          setGhost({
            x: 0,
            y: 0,
            label: action.label,
            kind: action.paletteKind,
          })

          pulseSlotHover(slotEl, true)
          await animateDragBetweenElements(
            paletteEl,
            slotEl,
            PLAYBACK_DRAG_MS,
            (point) => setGhost({ ...point, label: action.label, kind: action.paletteKind }),
            () => cancelRef.current,
          )

          pulseSlotHover(slotEl, false)
          setGhost(null)

          const result = attachTemplateBlockToSlot(action.template, action.target)
          if (result.accepted) {
            setHighlightBlockId(action.template.id)
            const validation = checkBuild(result.program)
            setStatusMessage(
              validation.valid ? `Dropped ${action.label}` : validation.summary,
            )
            centerMain()
          }
          await pause(250)
          return
        }

        default:
          return
      }
    },
    [
      attachTemplateBlockToSlot,
      centerMain,
      checkBuild,
      ensureTopLevelFunction,
      fastPlayback,
      openBlockEditor,
    ],
  )

  const play = useCallback(async () => {
    const algorithm = getAlgorithmById(selectedAlgorithmId)
    if (!algorithm) return

    cancelRef.current = false
    setIsPlaying(true)
    setValidationError(false)
    programSnapshotRef.current = getProgram()
    setStatusMessage(`Building: ${algorithm.name}`)
    resetProgram()
    await pause(300)

    const finalDoc = algorithm.build()
    const actions = compilePlaybackScript(finalDoc)
    setTotalSteps(actions.length)

    if (fastPlayback) {
      for (let i = 0; i < actions.length; i += 1) {
        if (cancelRef.current) return
        const action = actions[i]
        if (action.type === 'ensure-function') {
          ensureTopLevelFunction(action.functionBlock)
        }
      }
      loadProgram(finalDoc)
      setStepIndex(actions.length)
      setHighlightBlockId(null)
      setGhost(null)
      setStatusMessage(`Done: ${algorithm.name}`)
      setIsPlaying(false)
      onComplete?.()
      return
    }

    for (let i = 0; i < actions.length; i += 1) {
      if (cancelRef.current) return
      await runAction(actions[i], i)
    }

    if (cancelRef.current) return

    const finalValidation = checkBuild(programSnapshotRef.current ?? getProgram())
    setHighlightBlockId(null)
    setGhost(null)
    setStatusMessage(
      finalValidation.valid
        ? `Done: ${algorithm.name}`
        : `Done with issues: ${finalValidation.summary}`,
    )
    setValidationError(!finalValidation.valid)
    setIsPlaying(false)
    onComplete?.()
  }, [
    selectedAlgorithmId,
    resetProgram,
    loadProgram,
    runAction,
    onComplete,
    checkBuild,
    fastPlayback,
    ensureTopLevelFunction,
    getProgram,
  ])

  return {
    selectedAlgorithmId,
    setSelectedAlgorithmId,
    isPlaying,
    stepIndex,
    totalSteps,
    highlightBlockId,
    statusMessage,
    validationError,
    ghost,
    play,
    stop,
  }
}
