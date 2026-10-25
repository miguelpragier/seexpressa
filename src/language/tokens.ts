import type { SourceLocation } from './errors'

export type TokenType = 'word' | 'number' | 'lparen' | 'rparen' | 'lbrace' | 'rbrace' | 'eof'

export interface Token {
  type: TokenType
  text: string
  location: SourceLocation
}
