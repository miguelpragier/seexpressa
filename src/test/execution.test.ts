import { describe, expect, it } from 'vitest'
import { createInitialState, reducer, startPlayer, step } from '../execution/reducer'
import type { AppState } from '../execution/reducer'
import { WALL } from '../maze/types'
import type { Cell, Maze, PlayerState } from '../maze/types'

function makeMaze(rows: number, cols: number, walls?: number[][], entrance?: Cell, exit?: Cell): Maze {
  return {
    difficulty: 'easy',
    seed: 1,
    rows,
    cols,
    walls: walls ?? Array.from({ length: rows }, () => Array(cols).fill(0)),
    entrance: entrance ?? { row: 0, col: 0 },
    exit: exit ?? { row: 0, col: cols - 1 },
    solutionLength: 1,
  }
}

function makeState(maze: Maze, overrides: Partial<AppState> = {}): AppState {
  return {
    status: 'idle',
    difficulty: 'easy',
    speed: 450,
    maze,
    player: startPlayer(maze),
    actions: [],
    index: 0,
    executed: 0,
    error: null,
    message: null,
    highlightLine: null,
    runId: 0,
    ...overrides,
  }
}

describe('step', () => {
  it('giros alteram apenas a orientação', () => {
    const maze = makeMaze(3, 3)
    const player: PlayerState = { row: 1, col: 1, direction: 'north' }
    expect(step(player, maze, 'turnLeft').player).toEqual({ row: 1, col: 1, direction: 'west' })
    expect(step(player, maze, 'turnRight').player).toEqual({ row: 1, col: 1, direction: 'east' })
    expect(step(player, maze, 'turnLeft').collision).toBe(false)
  })

  it('frente obedece à orientação', () => {
    const maze = makeMaze(3, 3)
    const player: PlayerState = { row: 1, col: 1, direction: 'east' }
    expect(step(player, maze, 'forward').player).toEqual({ row: 1, col: 2, direction: 'east' })
  })

  it('tras recua sem mudar a orientação', () => {
    const maze = makeMaze(3, 3)
    const player: PlayerState = { row: 1, col: 1, direction: 'east' }
    expect(step(player, maze, 'backward').player).toEqual({ row: 1, col: 0, direction: 'east' })
  })

  it('colisão não altera a posição', () => {
    const maze = makeMaze(3, 3)
    maze.walls[1][1] = WALL.EAST
    const player: PlayerState = { row: 1, col: 1, direction: 'east' }
    const result = step(player, maze, 'forward')
    expect(result.collision).toBe(true)
    expect(result.player).toEqual(player)
  })

  it('sair da grade é colisão', () => {
    const maze = makeMaze(3, 3)
    const player: PlayerState = { row: 0, col: 0, direction: 'north' }
    const result = step(player, maze, 'forward')
    expect(result.collision).toBe(true)
    expect(result.player).toEqual(player)
  })
})

describe('reducer', () => {
  it('RUN reinicia o jogador na entrada e inicia a execução', () => {
    const maze = makeMaze(1, 3, [[0, 0, 0]], { row: 0, col: 0 }, { row: 0, col: 2 })
    const next = reducer(makeState(maze), { type: 'RUN', code: 'frente()' })
    expect(next.status).toBe('running')
    expect(next.player).toEqual(startPlayer(maze))
    expect(next.actions).toHaveLength(1)
    expect(next.index).toBe(0)
  })

  it('alcançar a saída encerra a fila restante', () => {
    const maze = makeMaze(1, 3, [[0, 0, 0]], { row: 0, col: 0 }, { row: 0, col: 2 })
    let state = reducer(makeState(maze), { type: 'RUN', code: 'frente() frente() frente()' })
    state = reducer(state, { type: 'TICK' })
    expect(state.player.col).toBe(1)
    state = reducer(state, { type: 'TICK' })
    expect(state.status).toBe('success')
    expect(state.player.col).toBe(2)
    expect(state.index).toBe(2)
    const after = reducer(state, { type: 'TICK' })
    expect(after.player.col).toBe(2)
    expect(after.status).toBe('success')
  })

  it('colisão interrompe a execução e mantém o personagem', () => {
    const maze = makeMaze(1, 3, [[0, 0, 0]], { row: 0, col: 0 }, { row: 0, col: 2 })
    maze.walls[0][1] = WALL.EAST
    let state = reducer(makeState(maze), { type: 'RUN', code: 'frente() frente()' })
    state = reducer(state, { type: 'TICK' })
    state = reducer(state, { type: 'TICK' })
    expect(state.status).toBe('collision')
    expect(state.player.col).toBe(1)
  })

  it('reiniciar restaura posição e orientação', () => {
    const maze = makeMaze(2, 2)
    const state = makeState(maze, { player: { row: 1, col: 1, direction: 'west' }, status: 'running' })
    const next = reducer(state, { type: 'RESET' })
    expect(next.player).toEqual(startPlayer(maze))
    expect(next.status).toBe('idle')
  })

  it('CANCEL impede que ticks posteriores modifiquem o estado', () => {
    const maze = makeMaze(1, 3, [[0, 0, 0]], { row: 0, col: 0 }, { row: 0, col: 2 })
    let state = reducer(makeState(maze), { type: 'RUN', code: 'frente() frente()' })
    state = reducer(state, { type: 'TICK' })
    state = reducer(state, { type: 'CANCEL' })
    expect(state.status).toBe('idle')
    const frozen = state.player
    expect(reducer(state, { type: 'TICK' }).player).toEqual(frozen)
  })

  it('pausa e retomada preservam a próxima ação', () => {
    const maze = makeMaze(1, 3, [[0, 0, 0]], { row: 0, col: 0 }, { row: 0, col: 2 })
    let state = reducer(makeState(maze), { type: 'RUN', code: 'frente() direita()' })
    state = reducer(state, { type: 'TICK' })
    expect(state.index).toBe(1)
    const paused = reducer(state, { type: 'PAUSE' })
    expect(paused.status).toBe('paused')
    expect(paused.index).toBe(1)
    const resumed = reducer(paused, { type: 'RESUME' })
    expect(resumed.status).toBe('running')
    expect(resumed.index).toBe(1)
  })

  it('código inválido produz status de erro com a linha relevante', () => {
    const maze = makeMaze(1, 3)
    const next = reducer(makeState(maze), { type: 'RUN', code: 'frente()\nfoo()' })
    expect(next.status).toBe('syntaxError')
    expect(next.highlightLine).toBe(2)
  })

  it('cria estado inicial na entrada e com dificuldade padrão', () => {
    const state = createInitialState('medium', 42)
    expect(state.difficulty).toBe('medium')
    expect(state.player).toEqual(startPlayer(state.maze))
    expect(state.status).toBe('idle')
  })
})
