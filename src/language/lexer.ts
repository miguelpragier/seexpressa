import { LanguageError } from './errors'
import type { Token } from './tokens'

/** Hard cap on tokens to avoid pathological input. */
export const MAX_TOKENS = 10_000

const IDENTIFIER_START = /[\p{L}_]/u
const IDENTIFIER_CONTINUE = /[\p{L}\p{N}_]/u
const DIGIT = /[0-9]/

/**
 * Converts source text into a token stream. Comments (`//`) and blank
 * whitespace are ignored; semicolons are accepted as optional separators and
 * skipped. Throws a `LanguageError` (with line/column) on any unexpected
 * character.
 */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let index = 0
  let line = 1
  let column = 1

  const advance = (): string => {
    const ch = source[index]
    index++
    if (ch === '\n') {
      line++
      column = 1
    } else {
      column++
    }
    return ch
  }

  const peek = (): string => source[index]

  while (index < source.length) {
    const ch = peek()

    if (ch === '\n') {
      advance()
      continue
    }
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      advance()
      continue
    }
    if (ch === ';') {
      advance()
      continue
    }
    if (ch === '/' && source[index + 1] === '/') {
      advance()
      advance()
      while (index < source.length && peek() !== '\n') advance()
      continue
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen', text: '(', location: { line, column } })
      advance()
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', text: ')', location: { line, column } })
      advance()
      continue
    }
    if (ch === '{') {
      tokens.push({ type: 'lbrace', text: '{', location: { line, column } })
      advance()
      continue
    }
    if (ch === '}') {
      tokens.push({ type: 'rbrace', text: '}', location: { line, column } })
      advance()
      continue
    }
    if (DIGIT.test(ch)) {
      const start = { line, column }
      let text = ''
      while (index < source.length && DIGIT.test(peek())) {
        text += advance()
      }
      tokens.push({ type: 'number', text, location: start })
      continue
    }
    if (IDENTIFIER_START.test(ch)) {
      const start = { line, column }
      let text = ''
      while (index < source.length && IDENTIFIER_CONTINUE.test(peek())) {
        text += advance()
      }
      tokens.push({ type: 'word', text, location: start })
      continue
    }

    throw new LanguageError(line, column, `caractere "${ch}" inesperado.`)
  }

  tokens.push({ type: 'eof', text: '', location: { line, column } })
  if (tokens.length > MAX_TOKENS) {
    throw new LanguageError(line, column, 'o programa tem instruções demais.')
  }
  return tokens
}
