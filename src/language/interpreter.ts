import { LanguageError } from './errors'
import type { MoveCommand, Statement } from './ast'
import type { SourceLocation } from './errors'
import { MAX_PRIMITIVE_ACTIONS } from '../maze/types'

export interface Action {
  command: MoveCommand
  location: SourceLocation
}

export type ExpandResult =
  | { ok: true; actions: Action[] }
  | { ok: false; error: LanguageError }

/**
 * Expands the AST into a flat, ordered list of primitive actions, each tagged
 * with the source location of the instruction that produced it. Enforces the
 * total primitive-action limit before any animation starts.
 */
export function expand(statements: Statement[]): ExpandResult {
  const actions: Action[] = []
  const error = walk(statements, actions)
  if (error) return { ok: false, error }
  return { ok: true, actions }
}

function walk(statements: Statement[], into: Action[]): LanguageError | null {
  for (const statement of statements) {
    if (into.length > MAX_PRIMITIVE_ACTIONS) {
      return new LanguageError(
        statement.location.line,
        statement.location.column,
        `o programa excede o limite de ${MAX_PRIMITIVE_ACTIONS} ações.`,
      )
    }

    if (statement.kind === 'move') {
      into.push({ command: statement.command, location: statement.location })
      continue
    }

    // Expand the body once, then repeat it `count` times.
    const bodyActions: Action[] = []
    const bodyError = walk(statement.body, bodyActions)
    if (bodyError) return bodyError

    const total = into.length + bodyActions.length * statement.count
    if (total > MAX_PRIMITIVE_ACTIONS) {
      return new LanguageError(
        statement.location.line,
        statement.location.column,
        `o programa excede o limite de ${MAX_PRIMITIVE_ACTIONS} ações.`,
      )
    }

    for (let i = 0; i < statement.count; i++) {
      for (const action of bodyActions) into.push(action)
    }
  }
  return null
}
