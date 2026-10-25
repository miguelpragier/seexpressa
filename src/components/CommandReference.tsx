const COMMANDS: ReadonlyArray<{ syntax: string; description: string }> = [
  { syntax: 'frente()', description: 'avança uma casa' },
  { syntax: 'tras()', description: 'recua uma casa' },
  { syntax: 'esquerda()', description: 'gira para a esquerda' },
  { syntax: 'direita()', description: 'gira para a direita' },
  { syntax: 'repita N vezes { ... }', description: 'repete um grupo de comandos' },
]

export function CommandReference() {
  return (
    <section class="command-reference" aria-label="Referência de comandos">
      <h2 class="command-reference-title">Comandos</h2>
      <ul class="command-list">
        {COMMANDS.map((command) => (
          <li key={command.syntax} class="command-item">
            <code class="command-syntax">{command.syntax}</code>
            <span class="command-description">{command.description}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
