import {
  DIRECTION_INFO,
  hasWall,
  isAtCell,
  opposite,
  turnLeft,
  turnRight,
} from '../maze/types'
import type { Difficulty, Maze, PlayerState } from '../maze/types'
import { generateMaze } from '../maze/generator'
import { randomSeed } from '../maze/rng'
import { LanguageError } from '../language/errors'
import { tokenize } from '../language/lexer'
import { parse } from '../language/parser'
import { expand } from '../language/interpreter'
import type { Action } from '../language/interpreter'

export type Status = 'idle' | 'running' | 'paused' | 'collision' | 'success' | 'syntaxError'

export interface AppState {
  status: Status
  difficulty: Difficulty
  speed: number
  maze: Maze
  player: PlayerState
  actions: Action[]
  index: number
  executed: number
  error: LanguageError | null
  message: string | null
  highlightLine: number | null
  runId: number
}

export type ReducerAction =
  | { type: 'RUN'; code: string }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'CANCEL' }
  | { type: 'NEW_MAZE'; difficulty: Difficulty; seed?: number }
  | { type: 'SET_SPEED'; speed: number }

export const DEFAULT_SPEED = 450

export const SPEED_PRESETS: ReadonlyArray<{ label: string; value: number }> = [
  { label: 'Lenta', value: 850 },
  { label: 'Média', value: 450 },
  { label: 'Rápida', value: 140 },
]

const START_DIRECTION = 'east' as const

export function startPlayer(maze: Maze): PlayerState {
  return { row: maze.entrance.row, col: maze.entrance.col, direction: START_DIRECTION }
}

export function createInitialState(difficulty: Difficulty, seed: number): AppState {
  const maze = generateMaze(difficulty, seed)
  return {
    status: 'idle',
    difficulty,
    speed: DEFAULT_SPEED,
    maze,
    player: startPlayer(maze),
    actions: [],
    index: 0,
    executed: 0,
    error: null,
    message: null,
    highlightLine: null,
    runId: 0,
  }
}

export function reducer(state: AppState, action: ReducerAction): AppState {
  switch (action.type) {
    case 'RUN': {
      try {
        const parsed = parse(tokenize(action.code))
        if (!parsed.ok) {
          return {
            ...state,
            status: 'syntaxError',
            error: parsed.error,
            message: null,
            highlightLine: parsed.error.line,
            runId: state.runId + 1,
          }
        }
        const expanded = expand(parsed.statements)
        if (!expanded.ok) {
          return {
            ...state,
            status: 'syntaxError',
            error: expanded.error,
            message: null,
            highlightLine: expanded.error.line,
            runId: state.runId + 1,
          }
        }
        return {
          ...state,
          status: 'running',
          player: startPlayer(state.maze),
          actions: expanded.actions,
          index: 0,
          executed: 0,
          error: null,
          message: null,
          highlightLine: expanded.actions.length > 0 ? expanded.actions[0].location.line : null,
          runId: state.runId + 1,
        }
      } catch (error) {
        if (error instanceof LanguageError) {
          return {
            ...state,
            status: 'syntaxError',
            error,
            message: null,
            highlightLine: error.line,
            runId: state.runId + 1,
          }
        }
        throw error
      }
    }

    case 'TICK': {
      if (state.status !== 'running') return state
      if (state.index >= state.actions.length) {
        return {
          ...state,
          status: 'idle',
          message: 'Programa concluído sem alcançar a saída.',
          highlightLine: null,
          runId: state.runId + 1,
        }
      }
      const action = state.actions[state.index]
      const result = step(state.player, state.maze, action.command)
      if (result.collision) {
        return {
          ...state,
          status: 'collision',
          message: 'Bateu na parede! O personagem permaneceu no lugar.',
          highlightLine: action.location.line,
          runId: state.runId + 1,
        }
      }
      const executed = state.executed + 1
      const player = result.player
      if (isAtCell(player, state.maze.exit)) {
        return {
          ...state,
          player,
          index: state.index + 1,
          executed,
          status: 'success',
          message: `Chegou à saída em ${executed} ${executed === 1 ? 'ação' : 'ações'}!`,
          highlightLine: action.location.line,
          runId: state.runId + 1,
        }
      }
      return { ...state, player, index: state.index + 1, executed, highlightLine: action.location.line }
    }

    case 'PAUSE':
      return state.status === 'running' ? { ...state, status: 'paused' } : state

    case 'RESUME':
      return state.status === 'paused' ? { ...state, status: 'running' } : state

    case 'RESET':
      return {
        ...state,
        status: 'idle',
        player: startPlayer(state.maze),
        index: 0,
        executed: 0,
        error: null,
        message: null,
        highlightLine: null,
        runId: state.runId + 1,
      }

    case 'CANCEL':
      if (state.status !== 'running' && state.status !== 'paused') return state
      return {
        ...state,
        status: 'idle',
        message: null,
        highlightLine: null,
        runId: state.runId + 1,
      }

    case 'NEW_MAZE': {
      const seed = action.seed ?? randomSeed()
      const maze = generateMaze(action.difficulty, seed)
      return {
        ...state,
        status: 'idle',
        difficulty: action.difficulty,
        maze,
        player: startPlayer(maze),
        actions: [],
        index: 0,
        executed: 0,
        error: null,
        message: null,
        highlightLine: null,
        runId: state.runId + 1,
      }
    }

    case 'SET_SPEED':
      return { ...state, speed: action.speed }
  }
}

interface StepResult {
  player: PlayerState
  collision: boolean
}

export function step(player: PlayerState, maze: Maze, command: Action['command']): StepResult {
  switch (command) {
    case 'turnLeft':
      return { player: { ...player, direction: turnLeft(player.direction) }, collision: false }
    case 'turnRight':
      return { player: { ...player, direction: turnRight(player.direction) }, collision: false }
    case 'forward':
      return move(player, maze, player.direction)
    case 'backward':
      return move(player, maze, opposite(player.direction))
  }
}

function move(player: PlayerState, maze: Maze, direction: PlayerState['direction']): StepResult {
  const info = DIRECTION_INFO[direction]
  const nextRow = player.row + info.row
  const nextCol = player.col + info.col
  if (nextRow < 0 || nextRow >= maze.rows || nextCol < 0 || nextCol >= maze.cols) {
    return { player, collision: true }
  }
  if (hasWall(maze, player.row, player.col, direction)) {
    return { player, collision: true }
  }
  return { player: { row: nextRow, col: nextCol, direction: player.direction }, collision: false }
}
