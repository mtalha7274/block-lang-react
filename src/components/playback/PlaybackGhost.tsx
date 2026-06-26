import { blockRegistry } from '../../constants/blockRegistry'
import type { BlockKind } from '../../types'
import './PlaybackGhost.css'

interface PlaybackGhostProps {
  label: string
  kind: BlockKind
  x: number
  y: number
  visible: boolean
}

export function PlaybackGhost({ label, kind, x, y, visible }: PlaybackGhostProps) {
  if (!visible) return null
  const stripe = blockRegistry[kind]?.stripeColor ?? 'var(--accent)'

  return (
    <div
      className="playback-ghost"
      style={{
        left: x,
        top: y,
        '--ghost-color': stripe,
      } as React.CSSProperties}
      data-testid="playback-ghost"
      aria-hidden
    >
      <span className="playback-ghost__dot" />
      <span className="playback-ghost__label">{label}</span>
    </div>
  )
}
