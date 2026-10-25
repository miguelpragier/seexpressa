import { SPEED_PRESETS } from '../execution/reducer'
import type { Status } from '../execution/reducer'
import type { Difficulty } from '../maze/types'

const DIFFICULTIES: ReadonlyArray<{ value: Difficulty; label: string }> = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Intermediário' },
  { value: 'hard', label: 'Difícil' },
]

interface ExecutionControlsProps {
  status: Status
  difficulty: Difficulty
  speed: number
  onRun: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onNewMaze: () => void
  onDifficultyChange: (difficulty: Difficulty) => void
  onSpeedChange: (speed: number) => void
}

export function ExecutionControls({
  status,
  difficulty,
  speed,
  onRun,
  onPause,
  onResume,
  onReset,
  onNewMaze,
  onDifficultyChange,
  onSpeedChange,
}: ExecutionControlsProps) {
  const isRunning = status === 'running'
  const isPaused = status === 'paused'

  return (
    <div class="controls">
      <div class="controls-buttons">
        <button type="button" class="btn btn-primary" onClick={onRun} disabled={isRunning}>
          Executar
        </button>
        {isPaused ? (
          <button type="button" class="btn" onClick={onResume}>
            Continuar
          </button>
        ) : (
          <button type="button" class="btn" onClick={onPause} disabled={!isRunning}>
            Pausar
          </button>
        )}
        <button type="button" class="btn" onClick={onReset}>
          Reiniciar
        </button>
        <button type="button" class="btn" onClick={onNewMaze}>
          Novo labirinto
        </button>
      </div>

      <div class="controls-settings">
        <fieldset class="fieldset">
          <legend class="legend">Dificuldade</legend>
          <div class="segmented">
            {DIFFICULTIES.map((option) => (
              <label key={option.value} class="segmented-option">
                <input
                  type="radio"
                  name="difficulty"
                  value={option.value}
                  checked={difficulty === option.value}
                  onChange={() => onDifficultyChange(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="legend">Velocidade</legend>
          <div class="segmented">
            {SPEED_PRESETS.map((option) => (
              <label key={option.value} class="segmented-option">
                <input
                  type="radio"
                  name="speed"
                  value={String(option.value)}
                  checked={speed === option.value}
                  onChange={() => onSpeedChange(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  )
}
