import type { ValueType, PortDirection } from '../../types'
import './NodePort.css'

interface NodePortProps {
  portId: string
  type: ValueType
  direction: PortDirection
  connected?: boolean
  invalid?: boolean
  label?: string
}

export function NodePort({
  portId,
  type,
  direction,
  connected = false,
  invalid = false,
  label,
}: NodePortProps) {
  const classes = [
    'port',
    `port--${direction}`,
    `port--${type}`,
    connected ? 'port--connected' : '',
    invalid ? 'port--invalid' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="port-wrap">
      {direction === 'in' && label && (
        <span className="port-wrap__label">{label}</span>
      )}
      <div
        className={classes}
        data-port-id={portId}
        data-port-type={type}
        data-port-direction={direction}
        title={label ?? `${direction} ${type}`}
      />
      {direction === 'out' && label && (
        <span className="port-wrap__label">{label}</span>
      )}
    </div>
  )
}
