import type { SourceLocation } from './errors'

export type MoveCommand = 'forward' | 'backward' | 'turnLeft' | 'turnRight'

export type Statement =
  | { kind: 'move'; command: MoveCommand; location: SourceLocation }
  | { kind: 'repeat'; count: number; body: Statement[]; location: SourceLocation }
