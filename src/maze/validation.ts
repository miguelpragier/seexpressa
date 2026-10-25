import { DIFFICULTY_CONFIG, WALL } from './types'
import type { Maze } from './types'
import { solve } from './solver'

/**
 * Validates the invariants of a generated maze and returns a list of
 * human-readable violations (empty when the maze is valid). Used primarily by
 * tests to pin down the generator's guarantees.
 */
export function validateMaze(maze: Maze): string[] {
  const errors: string[] = []
  const config = DIFFICULTY_CONFIG[maze.difficulty]

  if (maze.rows !== config.rows || maze.cols !== config.cols) {
    errors.push(
      `dimensões ${maze.rows}x${maze.cols} não correspondem à dificuldade ${maze.difficulty} (${config.rows}x${config.cols})`,
    )
  }

  if (maze.walls.length !== maze.rows) {
    errors.push('número de linhas de paredes não corresponde às dimensões')
  } else if (maze.walls.some((row) => row.length !== maze.cols)) {
    errors.push('alguma linha de paredes tem largura incorreta')
  }

  // Wall symmetry between neighboring cells.
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const cell = maze.walls[r][c]
      if (c + 1 < maze.cols) {
        const east = (cell & WALL.EAST) !== 0
        const neighborWest = (maze.walls[r][c + 1] & WALL.WEST) !== 0
        if (east !== neighborWest) errors.push(`paredes assimétricas entre (${r},${c}) e (${r},${c + 1})`)
      }
      if (r + 1 < maze.rows) {
        const south = (cell & WALL.SOUTH) !== 0
        const neighborNorth = (maze.walls[r + 1][c] & WALL.NORTH) !== 0
        if (south !== neighborNorth) errors.push(`paredes assimétricas entre (${r},${c}) e (${r + 1},${c})`)
      }
    }
  }

  const inBounds = (row: number, col: number) =>
    row >= 0 && row < maze.rows && col >= 0 && col < maze.cols

  if (!inBounds(maze.entrance.row, maze.entrance.col)) errors.push('entrada fora dos limites')
  if (!inBounds(maze.exit.row, maze.exit.col)) errors.push('saída fora dos limites')
  if (maze.entrance.col !== 0) errors.push('entrada não está na coluna esquerda')
  if (maze.exit.col !== maze.cols - 1) errors.push('saída não está na coluna direita')
  if (maze.entrance.row === maze.exit.row && maze.entrance.col === maze.exit.col) {
    errors.push('entrada e saída coincidem')
  }

  const solution = solve(maze.walls, maze.entrance, maze.exit)
  if (!solution) {
    errors.push('entrada e saída não estão conectadas')
  } else {
    if (solution.length !== maze.solutionLength) {
      errors.push(`comprimento da solução incorreto (${maze.solutionLength} vs ${solution.length})`)
    }
    if (solution.length < config.minSolution) {
      errors.push(`solução muito curta (${solution.length} < ${config.minSolution})`)
    }
  }

  return errors
}
