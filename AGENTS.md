# AGENTS.md

Guia para agentes que trabalham no repositório `seexpressa`.

## O que é

Aplicação web estática ("Labirinto Expressa") onde o usuário resolve um labirinto
escrevendo um subconjunto didático da linguagem Expressa. Roda 100% no navegador
(sem backend) e publica no GitHub Pages. A especificação completa está em
[`V1.md`](V1.md) (em português).

## Comandos

```bash
npm install        # instala dependências (usa package-lock.json)
npm run dev        # servidor de desenvolvimento (Vite)
npm test           # testes unitários (Vitest, modo run)
npm run test:watch # testes em modo watch
npm run build      # tsc --noEmit && vite build  → dist/
npm run preview    # serve dist/ localmente
```

- Gerenciador de pacotes: **npm** (não yarn/pnpm).
- Typecheck: `npx tsc --noEmit` (o build já roda isso).
- Não há lint configurado.

## Stack e decisões

- Vite + TypeScript (strict) + Preact 10 + CodeMirror 6 + Vitest.
- JSX automático com `jsxImportSource: "preact"` (não importar `h` manualmente).
- `vite.config.ts` usa `base: './'` (relativo) para funcionar em qualquer
  subdiretório do GitHub Pages, sem fallback de SPA.
- CodeMirror é montado a partir de pacotes individuais
  (`@codemirror/{state,view,language,commands}`), **não** do meta-pacote
  `codemirror`. Não usar `basicSetup`; o setup mínimo está em
  `src/app/editor.ts`.

## Estrutura

```
src/
  app/          App.tsx, storage.ts (localStorage), editor.ts (CodeMirror)
  maze/         types.ts, rng.ts, generator.ts, solver.ts, validation.ts
  language/     tokens.ts, lexer.ts, parser.ts, ast.ts, interpreter.ts, errors.ts
  execution/    reducer.ts (máquina de estados), controller.ts (Runner)
  components/   MazeView, CodeEditor, ExecutionControls, CommandReference, StatusPanel
  styles/       style.css
  test/         lexer, parser, interpreter, maze, execution (Vitest)
```

## Arquitetura e fluxo de dados

O texto do editor flui por uma cadeia de transformações **puras e desacopladas
do DOM**:

1. **Lexer** (`language/lexer.ts`): `tokenize(source)` → tokens com linha/coluna.
2. **Parser** (`language/parser.ts`): `parse(tokens)` → AST (`Statement[]`).
3. **Interpreter** (`language/interpreter.ts`): `expand(ast)` → lista plana de
   `Action[]` (comando + localização de origem), validando o limite de 500 ações.
4. **Reducer** (`execution/reducer.ts`): máquina de estados; `TICK` executa uma
   ação por vez via `step()`.
5. **Runner** (`execution/controller.ts`): agenda os ticks com `setTimeout`,
   cancelável por contador de geração.

O estado do app vive em um único `useReducer` (`AppState` em `reducer.ts`) e não
na árvore de componentes. Status: `idle | running | paused | collision | success
| syntaxError`.

## Convenções e gotchas

- **Paredes são bitmask** por célula (`WALL.NORTH/EAST/SOUTH/WEST` em
  `maze/types.ts`), não objetos. Use `hasWall()`, `turnLeft()`, `turnRight()`,
  `opposite()` em vez de manipular bits diretamente.
- **Determinismo**: `generateMaze(difficulty, seed)` é reproduzível (mulberry32).
  A entrada fica na coluna esquerda, a saída na direita, com a parede externa
  "quebrada" visualmente. Míseros labirintos são regenerados até `minSolution`.
- **`repita` e `vezes` não são tipos de token**: o lexer só produz `word`,
  `number`, parênteses/chaves e `eof`; o parser casa comandos e palavras-chave
  pelo texto do token `word`. Não adicionar novos `TokenType` para keywords.
- **Erros de linguagem** são `LanguageError` (linha/coluna 1-based) formatados
  com `formatError()` → `Linha N: mensagem`. O lexer lança; o parser retorna
  `ParseResult` (`ok: true/false`), nunca lança.
- **Nunca usar `eval`/`Function`**: o código do usuário só passa por lexer/parser
  próprios.
- **Execução cancelável**: mudar o código dispara `CANCEL` (para o runner).
  Reiniciar/novo labirinto/colisão/vitória incrementam `runId` e param o Runner.
  Não criar `setTimeout` independentes fora do `Runner`.
- **Persistência** (`app/storage.ts`): chaves `seexpressa.code`,
  `seexpressa.difficulty`, `seexpressa.seed`; leitura tolerante a dados
  ausentes/inválidos (não lançar).
- **CodeMirror é dono do documento**: o componente monta o `EditorView` uma única
  vez; o código atual fica em `codeRef` no `App.tsx` (lido no `RUN`), não no
  estado do reducer.
- **Acessibilidade**: labirinto em SVG com `role="img"`; status em região
  `aria-live="polite"` (não anunciar cada tick); respeitar `prefers-reduced-motion`
  nas animações.

## Testes

- Vitest, arquivos em `src/test/`. Cobrem lexer, parser, interpreter, gerador de
  labirinto e a máquina de estados/`step`.
- Testes de labirinto usam sementes fixas e `validateMaze()` (que checa simetria
  de paredes, conectividade e comprimento mínimo).
- Testes de execução constroem labirintos pequenos à mão (`makeMaze`) para
  controlar paredes e posição de saída.
