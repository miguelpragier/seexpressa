import { LanguageError } from './errors'
import type { Token } from './tokens'
import type { MoveCommand, Statement } from './ast'

/** Maximum nesting depth for `repita` blocks. */
export const MAX_BLOCK_DEPTH = 50
/** Maximum allowed repetition count. */
export const MAX_REPEAT_COUNT = 1_000

export type ParseResult =
  | { ok: true; statements: Statement[] }
  | { ok: false; error: LanguageError }

const COMMANDS: Record<string, MoveCommand> = {
  frente: 'forward',
  tras: 'backward',
  'trás': 'backward',
  esquerda: 'turnLeft',
  direita: 'turnRight',
}

export function parse(tokens: Token[]): ParseResult {
  const parser = new Parser(tokens)
  try {
    const statements = parser.parseProgram()
    return { ok: true, statements }
  } catch (error) {
    if (error instanceof LanguageError) {
      return { ok: false, error }
    }
    throw error
  }
}

class Parser {
  private position = 0

  constructor(private tokens: Token[]) {}

  private current(): Token {
    return this.tokens[this.position]
  }

  private advance(): Token {
    const token = this.current()
    if (token.type !== 'eof') this.position++
    return token
  }

  private expect(type: Token['type'], message: string): Token {
    const token = this.current()
    if (token.type !== type) {
      throw new LanguageError(token.location.line, token.location.column, message)
    }
    return this.advance()
  }

  parseProgram(): Statement[] {
    const statements: Statement[] = []
    while (this.current().type !== 'eof') {
      statements.push(this.parseStatement(0))
    }
    return statements
  }

  private parseStatement(depth: number): Statement {
    const token = this.current()
    if (token.type === 'word') {
      if (token.text === 'repita') {
        return this.parseRepeat(token, depth)
      }
      if (token.text in COMMANDS) {
        return this.parseMove(token)
      }
      throw new LanguageError(token.location.line, token.location.column, `comando "${token.text}" não reconhecido.`)
    }
    throw new LanguageError(token.location.line, token.location.column, `esperava um comando, encontrou "${describe(token)}".`)
  }

  private parseMove(word: Token): Statement {
    this.advance() // command word
    this.expect('lparen', `esperava "(" depois do comando "${word.text}".`)
    this.expect('rparen', `esperava ")" depois do comando "${word.text}".`)
    return {
      kind: 'move',
      command: COMMANDS[word.text],
      location: word.location,
    }
  }

  private parseRepeat(word: Token, depth: number): Statement {
    if (depth >= MAX_BLOCK_DEPTH) {
      throw new LanguageError(word.location.line, word.location.column, 'blocos aninhados demais.')
    }
    this.advance() // "repita"

    const number = this.current()
    if (number.type !== 'number') {
      throw new LanguageError(number.location.line, number.location.column, 'esperava um número depois de "repita".')
    }
    this.advance()

    const count = Number(number.text)
    if (!Number.isSafeInteger(count)) {
      throw new LanguageError(number.location.line, number.location.column, 'o número de repetições é grande demais.')
    }
    if (count > MAX_REPEAT_COUNT) {
      throw new LanguageError(number.location.line, number.location.column, `o número de repetições não pode passar de ${MAX_REPEAT_COUNT}.`)
    }

    const vezes = this.current()
    if (vezes.type !== 'word' || vezes.text !== 'vezes') {
      throw new LanguageError(vezes.location.line, vezes.location.column, 'esperava "vezes" depois do número.')
    }
    this.advance()

    this.expect('lbrace', 'esperava "{" depois de "vezes".')

    const body: Statement[] = []
    while (this.current().type !== 'rbrace' && this.current().type !== 'eof') {
      body.push(this.parseStatement(depth + 1))
    }

    if (this.current().type === 'eof') {
      throw new LanguageError(
        this.current().location.line,
        this.current().location.column,
        `falta fechar o bloco iniciado na linha ${word.location.line}.`,
      )
    }
    this.advance() // "}"

    return { kind: 'repeat', count, body, location: word.location }
  }
}

function describe(token: Token): string {
  if (token.type === 'eof') return 'fim do programa'
  return `"${token.text}"`
}
