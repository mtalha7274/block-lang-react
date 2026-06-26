import { useCallback, useRef, useState } from 'react'
import type { ProgramDocument } from '../types'
import { getAlgorithmById } from '../constants/algorithmCatalog'
import { emptyProgram } from '../constants/emptyProgram'
import { findBlockInTree } from '../lib/program/blockTree'

const STEP_DELAY_MS = 550

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function findNewMainBodyBlockId(
  previous: ProgramDocument,
  next: ProgramDocument,
): string | null {
  const prevMain = previous.blocks.find((b) => b.kind === 'main')
  const nextMain = next.blocks.find((b) => b.kind === 'main')
  if (!prevMain || prevMain.kind !== 'main' || !nextMain || nextMain.kind !== 'main') {
    return null
  }
  if (nextMain.data.body.length <= prevMain.data.body.length) return null
  return nextMain.data.body[nextMain.data.body.length - 1]?.id ?? null
}

export interface AlgorithmPlaybackState {
  isPlaying: boolean
  selectedAlgorithmId: string
  stepIndex: number
  totalSteps: number
  highlightBlockId: string | null
  statusMessage: string | null
}

export function useAlgorithmPlayback(options: {
  loadProgram: (doc: ProgramDocument) => void
  resetProgram: () => void
  onComplete?: (doc: ProgramDocument) => void
  defaultAlgorithmId: string
}) {
  const { loadProgram, resetProgram, onComplete, defaultAlgorithmId } = options
  const cancelRef = useRef(false)

  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState(defaultAlgorithmId)
  const [isPlaying, setIsPlaying] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [highlightBlockId, setHighlightBlockId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const stop = useCallback(() => {
    cancelRef.current = true
    setIsPlaying(false)
    setHighlightBlockId(null)
    setStatusMessage(null)
  }, [])

  const play = useCallback(async () => {
    const algorithm = getAlgorithmById(selectedAlgorithmId)
    if (!algorithm) return

    cancelRef.current = false
    setIsPlaying(true)
    setStatusMessage(`Building: ${algorithm.name}`)
    resetProgram()
    loadProgram(emptyProgram)

    const steps = algorithm.getSteps()
    setTotalSteps(steps.length)
    setStepIndex(0)

    let previous = emptyProgram
    for (let i = 0; i < steps.length; i += 1) {
      if (cancelRef.current) return

      const step = steps[i]
      const newBlockId = findNewMainBodyBlockId(previous, step)
      loadProgram(step)
      setStepIndex(i)

      if (newBlockId) {
        setHighlightBlockId(newBlockId)
        const block = findBlockInTree(step.blocks, newBlockId)
        setStatusMessage(
          block
            ? `Adding ${block.kind} block…`
            : `Step ${i + 1} of ${steps.length}`,
        )
      } else {
        setHighlightBlockId(null)
        setStatusMessage(i === 0 ? 'Starting…' : `Step ${i + 1} of ${steps.length}`)
      }

      previous = step
      await delay(STEP_DELAY_MS)
    }

    if (cancelRef.current) return

    const finalDoc = steps[steps.length - 1] ?? algorithm.build()
    setHighlightBlockId(null)
    setStatusMessage(`Done: ${algorithm.name}`)
    setIsPlaying(false)
    onComplete?.(finalDoc)
  }, [selectedAlgorithmId, loadProgram, resetProgram, onComplete])

  return {
    selectedAlgorithmId,
    setSelectedAlgorithmId,
    isPlaying,
    stepIndex,
    totalSteps,
    highlightBlockId,
    statusMessage,
    play,
    stop,
  }
}
