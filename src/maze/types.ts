export type Difficulty = 'easy' | 'medium' | 'hard'

export type Direction = 'north' | 'east' | 'south' | 'west'

export interface Cell {
  row: number
  col: number
}

export interface PlayerState {
  row: number
  col: number
  direction: Direction
}

/**
 * Wall bitmask per cell. A set bit means the wall is present on that side.
 * Bits: north=1, east=2, south=4, west=8.
 */
export const WALL = {
  NORTH: 1,
  EAST: 2,
  SOUTH: 4,
  WEST: 8,
} as const

export const ALL_WALLS = WALL.NORTH | WALL.EAST | WALL.SOUTH | WALL.WEST

export interface Maze {
  difficulty: Difficulty
  seed: number
  rows: number
  cols: number
  /** walls[row][col] is a bitmask of the walls present around that cell. */
  walls: number[][]
  entrance: Cell
  exit: Cell
  /** Number of steps in the shortest path from entrance to exit. */
  solutionLength: number
}

export interface DifficultyConfig {
  rows: number
  cols: number
  /** Minimum accepted solution length; shorter mazes are regenerated. */
  minSolution: number
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 7, cols: 7, minSolution: 14 },
  medium: { rows: 11, cols: 11, minSolution: 26 },
  hard: { rows: 15, cols: 15, minSolution: 44 },
}

/** Logical cap on the number of primitive actions a program may execute. */
export const MAX_PRIMITIVE_ACTIONS = 500

export const DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west']

export interface DirectionDelta {
  row: number
  col: number
  bit: number
  opposite: number
}

export const DIRECTION_INFO: Record<Direction, DirectionDelta> = {
  north: { row: -1, col: 0, bit: WALL.NORTH, opposite: WALL.SOUTH },
  east: { row: 0, col: 1, bit: WALL.EAST, opposite: WALL.WEST },
  south: { row: 1, col: 0, bit: WALL.SOUTH, opposite: WALL.NORTH },
  west: { row: 0, col: -1, bit: WALL.WEST, opposite: WALL.EAST },
}

export function hasWall(maze: Maze, row: number, col: number, dir: Direction): boolean {
  return (maze.walls[row][col] & DIRECTION_INFO[dir].bit) !== 0
}

export function turnLeft(dir: Direction): Direction {
  const idx = DIRECTIONS.indexOf(dir)
  return DIRECTIONS[(idx + 3) % 4]
}

export function turnRight(dir: Direction): Direction {
  const idx = DIRECTIONS.indexOf(dir)
  return DIRECTIONS[(idx + 1) % 4]
}

export function opposite(dir: Direction): Direction {
  const idx = DIRECTIONS.indexOf(dir)
  return DIRECTIONS[(idx + 2) % 4]
}

export function isAtCell(player: PlayerState, cell: Cell): boolean {
  return player.row === cell.row && player.col === cell.col
}
