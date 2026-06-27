import type { EmulationStatus } from '../../types'
import type { AlgorithmDefinition } from '../../constants/algorithmCatalog'
import { AlgorithmPlayButton } from './AlgorithmPlayButton'
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
  onSelectAlgorithm,
  onAlgorithmPlay,
  onAlgorithmStop,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar__brand">
        <img className="toolbar__logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={24} height={24} />
        <h1 className="toolbar__title">BlockLang</h1>
      </div>

      <div className="toolbar__controls">
        <AlgorithmPlayButton
          algorithms={algorithms}
          selectedId={selectedAlgorithmId}
          isPlaying={isAlgorithmPlaying}
          statusMessage={algorithmStatusMessage}
          onSelect={onSelectAlgorithm}
          onPlay={onAlgorithmPlay}
          onStop={onAlgorithmStop}
        />

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
    </div>
  )
}
