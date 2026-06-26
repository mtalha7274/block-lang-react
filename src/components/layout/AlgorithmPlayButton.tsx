import { Button } from '../ui'
import './AlgorithmPlayButton.css'

interface AlgorithmPlayButtonProps {
  isPlaying: boolean
  disabled?: boolean
  onPlay: () => void
  onStop: () => void
}

export function AlgorithmPlayButton({
  isPlaying,
  disabled = false,
  onPlay,
  onStop,
}: AlgorithmPlayButtonProps) {
  return (
    <Button
      variant="primary"
      size="md"
      className="algo-play__btn"
      data-testid="toolbar-algorithm-play"
      disabled={disabled}
      onClick={() => {
        if (isPlaying) onStop()
        else onPlay()
      }}
      title={isPlaying ? 'Stop building algorithm' : 'Play selected algorithm'}
    >
      {isPlaying ? '■ Stop' : '▶ Play'}
    </Button>
  )
}
