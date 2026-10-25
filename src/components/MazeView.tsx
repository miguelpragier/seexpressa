import { WALL } from '../maze/types'
import type { Direction, Maze, PlayerState } from '../maze/types'
import type { Status } from '../execution/reducer'

const CELL = 32

const DIRECTION_ANGLE: Record<Direction, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
}

interface WallLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function MazeView({ maze, player, status }: { maze: Maze; player: PlayerState; status: Status }) {
  const width = maze.cols * CELL
  const height = maze.rows * CELL

  const wallLines: WallLine[] = []
  for (let row = 0; row < maze.rows; row++) {
    for (let col = 0; col < maze.cols; col++) {
      const walls = maze.walls[row][col]
      const x = col * CELL
      const y = row * CELL
      if (walls & WALL.NORTH) wallLines.push({ x1: x, y1: y, x2: x + CELL, y2: y })
      if (walls & WALL.WEST) wallLines.push({ x1: x, y1: y, x2: x, y2: y + CELL })
      if (row === maze.rows - 1 && walls & WALL.SOUTH) {
        wallLines.push({ x1: x, y1: y + CELL, x2: x + CELL, y2: y + CELL })
      }
      if (col === maze.cols - 1 && walls & WALL.EAST) {
        wallLines.push({ x1: x + CELL, y1: y, x2: x + CELL, y2: y + CELL })
      }
    }
  }

  const entranceX = maze.entrance.col * CELL
  const entranceY = maze.entrance.row * CELL
  const exitX = maze.exit.col * CELL
  const exitY = maze.exit.row * CELL

  const cx = player.col * CELL + CELL / 2
  const cy = player.row * CELL + CELL / 2
  const arrowRadius = CELL * 0.32
  const arrowPoints = `0,${-arrowRadius} ${arrowRadius * 0.85},${arrowRadius * 0.7} ${-arrowRadius * 0.85},${arrowRadius * 0.7}`

  return (
    <figure class="maze-figure">
      <svg
        class="maze-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Labirinto com a entrada à esquerda e a saída à direita"
      >
        <rect class="maze-bg" x="0" y="0" width={width} height={height} />

        <rect class="cell-entrance" x={entranceX} y={entranceY} width={CELL} height={CELL} />
        <rect class="cell-exit" x={exitX} y={exitY} width={CELL} height={CELL} />

        <g class="maze-walls">
          {wallLines.map((line, i) => (
            <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          ))}
        </g>

        <g class="maze-markers">
          <polygon
            class="marker-entrance"
            points={`${entranceX + CELL * 0.55},${entranceY + CELL * 0.3} ${entranceX + CELL * 0.55},${entranceY + CELL * 0.7} ${entranceX + CELL * 0.75},${entranceY + CELL * 0.5}`}
          />
          <polygon
            class="marker-exit"
            points={`${exitX + CELL * 0.35},${exitY + CELL * 0.3} ${exitX + CELL * 0.35},${exitY + CELL * 0.7} ${exitX + CELL * 0.55},${exitY + CELL * 0.5}`}
          />
        </g>

        <g class="character" transform={`translate(${cx}, ${cy})`}>
          <g transform={`rotate(${DIRECTION_ANGLE[player.direction]})`}>
            <polygon class={status === 'success' ? 'character-arrow is-success' : 'character-arrow'} points={arrowPoints} />
          </g>
        </g>
      </svg>
      <figcaption class="maze-legend">
        <span class="legend-item">
          <span class="legend-swatch legend-swatch-entrance" aria-hidden="true" />
          Entrada
        </span>
        <span class="legend-item">
          <span class="legend-swatch legend-swatch-exit" aria-hidden="true" />
          Saída
        </span>
      </figcaption>
    </figure>
  )
}
