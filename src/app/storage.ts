import type { Difficulty } from '../maze/types'
import { DIFFICULTY_CONFIG } from '../maze/types'
import { randomSeed } from '../maze/rng'
import { DEFAULT_SPEED } from '../execution/reducer'

const KEYS = {
  code: 'seexpressa.code',
  difficulty: 'seexpressa.difficulty',
  seed: 'seexpressa.seed',
} as const

export const DEFAULT_CODE = `// Gire e avance pelo labirinto
frente()
direita()

repita 2 vezes {
    frente()
}
`

export interface StoredState {
  code: string
  difficulty: Difficulty
  seed: number
}

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && value in DIFFICULTY_CONFIG
}

/** Reads persisted state, falling back to defaults when data is missing/invalid. */
export function loadState(): StoredState {
  let code = DEFAULT_CODE
  let difficulty: Difficulty = 'medium'
  let seed = randomSeed()

  try {
    const storedCode = localStorage.getItem(KEYS.code)
    if (typeof storedCode === 'string') code = storedCode

    const storedDifficulty = localStorage.getItem(KEYS.difficulty)
    if (storedDifficulty !== null && isDifficulty(storedDifficulty)) difficulty = storedDifficulty

    const storedSeed = localStorage.getItem(KEYS.seed)
    if (storedSeed !== null) {
      const parsed = Number(storedSeed)
      if (Number.isFinite(parsed)) seed = parsed
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — use defaults.
  }

  return { code, difficulty, seed }
}

export function saveCode(code: string): void {
  try {
    localStorage.setItem(KEYS.code, code)
  } catch {
    // ignore persistence failures
  }
}

export function saveDifficulty(difficulty: Difficulty): void {
  try {
    localStorage.setItem(KEYS.difficulty, difficulty)
  } catch {
    // ignore persistence failures
  }
}

export function saveSeed(seed: number): void {
  try {
    localStorage.setItem(KEYS.seed, String(seed))
  } catch {
    // ignore persistence failures
  }
}

export { DEFAULT_SPEED }
