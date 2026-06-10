import type { StackFrame } from '../../types'
import './CallStackPanel.css'
import './panel-empty.css'

interface CallStackPanelProps {
  frames: StackFrame[]
  isEmulating?: boolean
  hasRun?: boolean
}

export function CallStackPanel({
  frames,
  isEmulating = false,
  hasRun = false,
}: CallStackPanelProps) {
  if (frames.length === 0) {
    return (
      <div className="panel-empty">
        <span className="panel-empty__icon">↳</span>
        <p className="panel-empty__text">
          {hasRun ? 'Execution finished' : 'Run Emulate to see the call stack'}
        </p>
      </div>
    )
  }

  return (
    <ol className="callstack">
      {frames.map((frame, index) => (
        <li
          key={frame.id}
          className={[
            'callstack__frame',
            isEmulating && frame.active ? 'callstack__frame--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="callstack__index">{index + 1}</span>
          <code className="callstack__label">{frame.label}</code>
        </li>
      ))}
    </ol>
  )
}
