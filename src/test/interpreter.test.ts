import { describe, expect, it } from 'vitest'
import { tokenize } from '../language/lexer'
import { parse } from '../language/parser'
import { expand } from '../language/interpreter'

function expandSource(source: string) {
  const parsed = parse(tokenize(source))
  if (!parsed.ok) throw parsed.error
  return expand(parsed.statements)
}

describe('expand', () => {
  it('expande blocos repetidos', () => {
    const result = expandSource('repita 3 vezes { frente() }')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.actions).toHaveLength(3)
    expect(result.actions.every((a) => a.command === 'forward')).toBe(true)
  })

  it('expande blocos aninhados', () => {
    const result = expandSource('repita 2 vezes { repita 3 vezes { direita() } }')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.actions).toHaveLength(6)
    expect(result.actions.every((a) => a.command === 'turnRight')).toBe(true)
  })

  it('respeita o limite de 500 ações primitivas', () => {
    const result = expandSource('repita 600 vezes { frente() }')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.message).toContain('500')
  })

  it('mantém a localização de origem de cada ação', () => {
    const result = expandSource('frente()\ndireita()')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.actions[0].location.line).toBe(1)
    expect(result.actions[1].location.line).toBe(2)
  })

  it('repita 0 vezes produz zero ações', () => {
    const result = expandSource('repita 0 vezes { frente() }')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.actions).toHaveLength(0)
  })
})
