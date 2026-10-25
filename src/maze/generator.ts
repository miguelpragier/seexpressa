import { ALL_WALLS, DIFFICULTY_CONFIG, WALL } from './types'
import type { Cell, Difficulty, Maze } from './types'
import { mulberry32 } from './rng'
import { solve } from './solver'

const MAX_GENERATION_ATTEMPTS = 200

/**
 * Generates a perfect maze (exactly one path between any two cells) using
 * randomized depth-first search with backtracking. Entrance is placed on the
 * left column and exit on the right column, opening the outer wall at both.
 *
 * Trivial mazes (solution shorter than the difficulty's minimum) are rejected
 * and regenerated. The entire sequence is driven by a single PRNG seeded with
 * `seed`, so the same (difficulty, seed) pair always reproduces the same maze.
 */
export function generateMaze(difficulty: Difficulty, seed: number): Maze {
  const { rows, cols, minSolution } = DIFFICULTY_CONFIG[difficulty]
  const rng = mulberry32(seed)

  let walls: number[][] = []
  let entrance: Cell = { row: 0, col: 0 }
  let exit: Cell = { row: 0, col: cols - 1 }
  let solutionLength = 0

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    walls = generateWalls(rows, cols, rng)
    entrance = { row: Math.floor(rng() * rows), col: 0 }
    exit = { row: Math.floor(rng() * rows), col: cols - 1 }

    // Open the outer wall at the entrance and exit for a clear visual gap.
    walls[entrance.row][entrance.col] &= ~WALL.WEST
    walls[exit.row][exit.col] &= ~WALL.EAST

    const solution = solve(walls, entrance, exit)
    if (solution && solution.length >= minSolution) {
      solutionLength = solution.length
      break
    }
  }

  if (solutionLength === 0) {
    // Fallback: keep the last generated maze (still always solvable).
    const solution = solve(walls, entrance, exit)
    solutionLength = solution ? solution.length : 0
  }

  return { difficulty, seed, rows, cols, walls, entrance, exit, solutionLength }
}

function generateWalls(rows: number, cols: number, rng: () => number): number[][] {
  const walls: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ALL_WALLS),
  )
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false),
  )

  const deltas = [
    { dr: -1, dc: 0, bit: WALL.NORTH, opposite: WALL.SOUTH },
    { dr: 0, dc: 1, bit: WALL.EAST, opposite: WALL.WEST },
    { dr: 1, dc: 0, bit: WALL.SOUTH, opposite: WALL.NORTH },
    { dr: 0, dc: -1, bit: WALL.WEST, opposite: WALL.EAST },
  ]

  const stack: Cell[] = [{ row: 0, col: 0 }]
  visited[0][0] = true

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const neighbors = deltas
      .map((d) => ({ ...d, nr: current.row + d.dr, nc: current.col + d.dc }))
      .filter((n) => n.nr >= 0 && n.nr < rows && n.nc >= 0 && n.nc < cols && !visited[n.nr][n.nc])

    if (neighbors.length === 0) {
      stack.pop()
      continue
    }

    const next = neighbors[Math.floor(rng() * neighbors.length)]
    visited[next.nr][next.nc] = true
    walls[current.row][current.col] &= ~next.bit
    walls[next.nr][next.nc] &= ~next.opposite
    stack.push({ row: next.nr, col: next.nc })
  }

  return walls
}
