import type { VariableSnapshot } from '../../types'
import { TypeBadge } from '../ui'
import './VariableStatePanel.css'
import './panel-empty.css'

interface VariableStatePanelProps {
  variables: VariableSnapshot[]
  isEmulating?: boolean
}

export function VariableStatePanel({
  variables,
  isEmulating = false,
}: VariableStatePanelProps) {
  if (variables.length === 0) {
    return (
      <div className="panel-empty">
        <span className="panel-empty__icon">x</span>
        <p className="panel-empty__text">No variables yet</p>
      </div>
    )
  }

  return (
    <div className="var-panel" data-testid="variables-panel">
      <table className="var-panel__table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((v) => (
            <tr
              key={v.name}
              data-testid={`var-row-${v.name}`}
              className={
                isEmulating && v.active ? 'var-panel__row--active' : undefined
              }
            >
              <td className="var-panel__name">{v.name}</td>
              <td>
                <TypeBadge type={v.type} />
              </td>
              <td className="var-panel__value" data-testid={`var-value-${v.name}`}>
                {v.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
