import type { EmulationStatus } from '../../types'
import { Button } from '../ui'
import './Toolbar.css'

interface ToolbarProps {
  isEmulating: boolean
  emulateStatus?: EmulationStatus
  emulateError?: boolean
  emulateDisabled?: boolean
  onEmulateToggle: () => void
  onReset?: () => void
}

export function Toolbar({
  isEmulating,
  emulateStatus = 'idle',
  emulateError = false,
  emulateDisabled = false,
  onEmulateToggle,
  onReset,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__logo">⬡</span>
        <h1 className="toolbar__title">BlockLang</h1>
      </div>

      <div className="toolbar__controls">
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
          disabled={!isEmulating && emulateDisabled}
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
