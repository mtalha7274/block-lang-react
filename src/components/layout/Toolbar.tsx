import type { EmulationStatus } from '../../types'
import type { AlgorithmDefinition } from '../../constants/algorithmCatalog'
import { AlgorithmPlayButton } from './AlgorithmPlayButton'
import { AlgorithmSelectButton } from './AlgorithmSelectButton'
import { Button } from '../ui'
import './Toolbar.css'

interface ToolbarProps {
  isEmulating: boolean
  emulateStatus?: EmulationStatus
  emulateError?: boolean
  emulateDisabled?: boolean
  onEmulateToggle: () => void
  onReset?: () => void
  algorithms: AlgorithmDefinition[]
  selectedAlgorithmId: string
  isAlgorithmPlaying: boolean
  algorithmStatusMessage?: string | null
  algorithmValidationError?: boolean
  onSelectAlgorithm: (id: string) => void
  onAlgorithmPlay: () => void
  onAlgorithmStop: () => void
}

export function Toolbar({
  isEmulating,
  emulateStatus = 'idle',
  emulateError = false,
  emulateDisabled = false,
  onEmulateToggle,
  onReset,
  algorithms,
  selectedAlgorithmId,
  isAlgorithmPlaying,
  algorithmStatusMessage,
  algorithmValidationError = false,
  onSelectAlgorithm,
  onAlgorithmPlay,
  onAlgorithmStop,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__logo" aria-hidden="true">⬡</span>
        <h1 className="toolbar__title">BlockLang</h1>
      </div>

      <div className="toolbar__center">
        {isEmulating && (
          <span className="toolbar__running">
            <span
              className={`toolbar__running-dot${emulateError ? ' toolbar__running-dot--error' : emulateStatus === 'finished' ? ' toolbar__running-dot--done' : ''}`}
            />
            {emulateError ? 'Error' : emulateStatus === 'finished' ? 'Done' : 'Running…'}
          </span>
        )}
        <Button
          variant="primary"
          size="md"
          active={isEmulating}
          disabled={(!isEmulating && emulateDisabled) || isAlgorithmPlaying}
          onClick={onEmulateToggle}
          className="toolbar__emulate"
          data-testid="toolbar-emulate"
          title={
            !isEmulating && emulateDisabled
              ? 'Fix validation errors before emulating'
              : undefined
          }
        >
          ▶ {isEmulating ? 'Stop' : 'Emulate'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} title="Reset workspace">
          Reset
        </Button>
      </div>

      <div className="toolbar__playback" data-testid="algorithm-playback-controls">
        <AlgorithmPlayButton
          isPlaying={isAlgorithmPlaying}
          onPlay={onAlgorithmPlay}
          onStop={onAlgorithmStop}
        />
        <AlgorithmSelectButton
          algorithms={algorithms}
          selectedId={selectedAlgorithmId}
          disabled={isAlgorithmPlaying}
          onSelect={onSelectAlgorithm}
        />
        {(isAlgorithmPlaying || algorithmStatusMessage) && (
          <span
            className={`toolbar__playback-status${algorithmValidationError ? ' toolbar__playback-status--error' : ''}`}
            data-testid="algorithm-play-status"
          >
            {algorithmStatusMessage ?? (isAlgorithmPlaying ? 'Building…' : '')}
          </span>
        )}
      </div>
    </div>
  )
}
