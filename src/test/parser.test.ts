import { describe, expect, it } from 'vitest'
import { tokenize } from '../language/lexer'
import { parse } from '../language/parser'
import { LanguageError } from '../language/errors'
import type { Statement } from '../language/ast'

function parseSource(source: string): Statement[] {
  const result = parse(tokenize(source))
  if (!result.ok) throw result.error
  return result.statements
}

function parseError(source: string): LanguageError {
  try {
    const result = parse(tokenize(source))
    if (!result.ok) return result.error
  } catch (error) {
    if (error instanceof LanguageError) return error
    throw error
  }
  throw new Error(`esperava um erro ao analisar: ${source}`)
}

describe('parser', () => {
  it('reconhece todos os comandos', () => {
    const statements = parseSource('frente()\ntras()\ntrás()\nesquerda()\ndireita()')
    const commands = statements.map((s) => (s.kind === 'move' ? s.command : null))
    expect(commands).toEqual(['forward', 'backward', 'backward', 'turnLeft', 'turnRight'])
  })

  it('aceita blocos aninhados', () => {
    const statements = parseSource('repita 2 vezes { repita 3 vezes { frente() } }')
    expect(statements).toHaveLength(1)
    const outer = statements[0]
    expect(outer.kind).toBe('repeat')
    if (outer.kind !== 'repeat') return
    expect(outer.count).toBe(2)
    expect(outer.body).toHaveLength(1)
    expect(outer.body[0].kind).toBe('repeat')
    if (outer.body[0].kind !== 'repeat') return
    expect(outer.body[0].count).toBe(3)
  })

  it('rejeita comando desconhecido', () => {
    const error = parseError('avance()')
    expect(error.message).toContain('avance')
    expect(error.line).toBe(1)
  })

  it('rejeita parênteses ausentes', () => {
    expect(parseError('frente').message).toContain('esperava "("')
    expect(parseError('frente(').message).toContain('esperava ")"')
  })

  it('rejeita chaves ausentes', () => {
    expect(parseError('repita 2 vezes frente()').message).toContain('esperava "{"')
    expect(parseError('repita 2 vezes { frente()').message).toContain('falta fechar o bloco')
  })

  it('aponta a linha do erro', () => {
    const error = parseError('frente()\nfrente()\nfoo()')
    expect(error.line).toBe(3)
  })

  it('espera a palavra "vezes"', () => {
    expect(parseError('repita 3 { frente() }').message).toContain('vezes')
  })

  it('rejeita contagem negativa, não inteira ou excessiva', () => {
    expect(parseError('repita -3 vezes { frente() }')).toBeInstanceOf(LanguageError)
    expect(parseError('repita 1.5 vezes { frente() }')).toBeInstanceOf(LanguageError)
    expect(parseError('repita 1001 vezes { frente() }').message).toContain('repetições')
  })
})
