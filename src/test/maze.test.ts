import { describe, expect, it } from 'vitest'
import { generateMaze } from '../maze/generator'
import { validateMaze } from '../maze/validation'
import { solve } from '../maze/solver'
import { DIFFICULTY_CONFIG } from '../maze/types'
import type { Difficulty } from '../maze/types'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

describe('generateMaze', () => {
  it('toda semente testada produz entrada e saída conectadas', () => {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 1; seed <= 20; seed++) {
        const maze = generateMaze(difficulty, seed)
        const path = solve(maze.walls, maze.entrance, maze.exit)
        expect(path, `dificuldade ${difficulty} semente ${seed}`).not.toBeNull()
        expect(path![0]).toEqual(maze.entrance)
        expect(path![path!.length - 1]).toEqual(maze.exit)
      }
    }
  })

  it('paredes são simétricas entre células vizinhas', () => {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 1; seed <= 20; seed++) {
        const maze = generateMaze(difficulty, seed)
        expect(validateMaze(maze), `dificuldade ${difficulty} semente ${seed}`).toEqual([])
      }
    }
  })

  it('o mesmo par dificuldade/semente reproduz o mesmo labirinto', () => {
    expect(generateMaze('hard', 12345)).toEqual(generateMaze('hard', 12345))
  })

  it('dimensões correspondem à dificuldade', () => {
    for (const difficulty of DIFFICULTIES) {
      const maze = generateMaze(difficulty, 7)
      expect(maze.rows).toBe(DIFFICULTY_CONFIG[difficulty].rows)
      expect(maze.cols).toBe(DIFFICULTY_CONFIG[difficulty].cols)
    }
  })

  it('a solução atende aos limites de comprimento definidos', () => {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 1; seed <= 20; seed++) {
        const maze = generateMaze(difficulty, seed)
        expect(maze.solutionLength).toBeGreaterThanOrEqual(DIFFICULTY_CONFIG[difficulty].minSolution)
      }
    }
  })
})
