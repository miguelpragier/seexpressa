import { describe, expect, it } from 'vitest'
import { tokenize } from '../language/lexer'

describe('tokenize', () => {
  it('reconhece todos os comandos', () => {
    const tokens = tokenize('frente() tras() esquerda() direita()')
    const words = tokens.filter((t) => t.type === 'word').map((t) => t.text)
    expect(words).toEqual(['frente', 'tras', 'esquerda', 'direita'])
  })

  it('aceita trás() como comando', () => {
    const tokens = tokenize('trás()')
    expect(tokens.some((t) => t.type === 'word' && t.text === 'trás')).toBe(true)
  })

  it('ignora comentários e espaços', () => {
    const tokens = tokenize('// comentário\nfrente()\n  // outro\n')
    const words = tokens.filter((t) => t.type === 'word').map((t) => t.text)
    expect(words).toEqual(['frente'])
  })

  it('aceita ponto e vírgula como separador opcional', () => {
    const tokens = tokenize('frente(); direita();')
    const words = tokens.filter((t) => t.type === 'word').map((t) => t.text)
    expect(words).toEqual(['frente', 'direita'])
  })

  it('produz linha e coluna úteis', () => {
    const tokens = tokenize('frente()\n  direita()')
    const direita = tokens.find((t) => t.text === 'direita')!
    expect(direita.location).toEqual({ line: 2, column: 3 })
  })

  it('rejeita caractere inesperado', () => {
    expect(() => tokenize('frente() @')).toThrow(/inesperado/)
  })
})
