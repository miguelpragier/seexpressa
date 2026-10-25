import type { Cell } from './types'
import { WALL } from './types'

/**
 * Breadth-first search from start to goal through open (non-walled) cells.
 * Returns the list of cells on the shortest path (start to goal), or null if
 * no path exists.
 */
export function solve(walls: number[][], start: Cell, goal: Cell): Cell[] | null {
  const rows = walls.length
  const cols = walls[0].length
  const key = (r: number, c: number) => `${r}:${c}`

  const previous = new Map<string, Cell>()
  const seen = new Set<string>([key(start.row, start.col)])
  const queue: Cell[] = [start]

  const deltas = [
    { dr: -1, dc: 0, bit: WALL.NORTH },
    { dr: 0, dc: 1, bit: WALL.EAST },
    { dr: 1, dc: 0, bit: WALL.SOUTH },
    { dr: 0, dc: -1, bit: WALL.WEST },
  ]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.row === goal.row && current.col === goal.col) {
      const path: Cell[] = []
      let cursor: Cell | undefined = current
      while (cursor) {
        path.unshift(cursor)
        cursor = previous.get(key(cursor.row, cursor.col))
      }
      return path
    }

    for (const { dr, dc, bit } of deltas) {
      const nr = current.row + dr
      const nc = current.col + dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if ((walls[current.row][current.col] & bit) !== 0) continue
      const neighborKey = key(nr, nc)
      if (seen.has(neighborKey)) continue
      seen.add(neighborKey)
      previous.set(neighborKey, current)
      queue.push({ row: nr, col: nc })
    }
  }

  return null
}
