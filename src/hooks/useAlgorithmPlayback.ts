import { useCallback, useRef, useState } from 'react'
import type { BlockNode, SlotTarget } from '../types'
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForElement(selector: string, timeoutMs = 4000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const tick = () => {
      const el = document.querySelector(selector)
      if (el) {
        resolve(el)
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Element not found: ${selector}`))
        return
      }
      requestAnimationFrame(tick)
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
  ghost: { x: number; y: number; label: string; kind: BlockNode['kind'] } | null
}

export function useAlgorithmPlayback(options: {
  resetProgram: () => void
  attachTemplateBlockToSlot: (
    template: BlockNode,
    target: SlotTarget,
  ) => { accepted: boolean }
  ensureTopLevelFunction: (fn: Extract<BlockNode, { kind: 'function' }>) => void
  openBlockEditor: (blockId: string) => void
  centerMain: () => void
  onComplete?: () => void
  defaultAlgorithmId: string
}) {
  const {
    resetProgram,
    attachTemplateBlockToSlot,
    ensureTopLevelFunction,
    openBlockEditor,
    centerMain,
    onComplete,
    defaultAlgorithmId,
  } = options

  const cancelRef = useRef(false)
  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState(defaultAlgorithmId)
  const [isPlaying, setIsPlaying] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [highlightBlockId, setHighlightBlockId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [ghost, setGhost] = useState<AlgorithmPlaybackState['ghost']>(null)

  const stop = useCallback(() => {
    cancelRef.current = true
    setIsPlaying(false)
    setHighlightBlockId(null)
    setStatusMessage(null)
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
          await delay(400)
          centerMain()
          return

        case 'pause':
          await delay(action.ms)
          return

        case 'ensure-function':
          ensureTopLevelFunction(action.functionBlock)
          await delay(120)
          return

        case 'open-editor':
          setStatusMessage('Opening block editor…')
          setHighlightBlockId(action.blockId)
          openBlockEditor(action.blockId)
          await delay(300)
          return

        case 'drag-drop': {
          const paletteSel = paletteKindSelector(action.paletteKind)
          const slotSel = slotTargetToSelector(action.target)
          setStatusMessage(`Dragging ${action.label}…`)

          let paletteEl: Element
          let slotEl: Element
          try {
            paletteEl = await waitForElement(paletteSel)
            slotEl = await waitForElement(slotSel)
          } catch {
            attachTemplateBlockToSlot(action.template, action.target)
            setHighlightBlockId(action.template.id)
            return
          }

          slotEl.scrollIntoView({ block: 'nearest', inline: 'nearest' })
          await delay(200)

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
            setStatusMessage(`Dropped ${action.label}`)
            centerMain()
          }
          await delay(250)
          return
        }

        default:
          return
      }
    },
    [
      attachTemplateBlockToSlot,
      centerMain,
      ensureTopLevelFunction,
      openBlockEditor,
    ],
  )

  const play = useCallback(async () => {
    const algorithm = getAlgorithmById(selectedAlgorithmId)
    if (!algorithm) return

    cancelRef.current = false
    setIsPlaying(true)
    setStatusMessage(`Building: ${algorithm.name}`)
    resetProgram()
    await delay(300)

    const finalDoc = algorithm.build()
    const actions = compilePlaybackScript(finalDoc)
    setTotalSteps(actions.length)

    for (let i = 0; i < actions.length; i += 1) {
      if (cancelRef.current) return
      await runAction(actions[i], i)
    }

    if (cancelRef.current) return

    setHighlightBlockId(null)
    setGhost(null)
    setStatusMessage(`Done: ${algorithm.name}`)
    setIsPlaying(false)
    onComplete?.()
  }, [selectedAlgorithmId, resetProgram, runAction, onComplete])

  return {
    selectedAlgorithmId,
    setSelectedAlgorithmId,
    isPlaying,
    stepIndex,
    totalSteps,
    highlightBlockId,
    statusMessage,
    ghost,
    play,
    stop,
  }
}
