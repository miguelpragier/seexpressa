# seexpressa

Labirinto Expressa — resolva um labirinto escrevendo comandos baseados na sintaxe da linguagem Expressa.

Aplicação web estática, sem backend, executada inteiramente no navegador. Publicável no GitHub Pages.

## Stack

- Vite + TypeScript
- Preact
- CodeMirror 6
- Vitest

## Comandos locais

```bash
npm install        # instala dependências
npm run dev        # servidor de desenvolvimento
npm test           # roda os testes unitários (Vitest)
npm run build      # typecheck + build de produção em dist/
npm run preview    # serve o build de produção localmente
```

## Como funciona

O usuário escreve um programa com um subconjunto didático da Expressa
(`frente()`, `tras()`/`trás()`, `esquerda()`, `direita()`, `repita N vezes { ... }`)
para guiar um personagem da entrada até a saída de um labirinto gerado
aleatoriamente (mas determinístico por semente).

- `frente()` avança uma casa; `tras()`/`trás()` recua uma casa.
- `esquerda()` e `direita()` giram 90 graus (não deslocam lateralmente).
- `repita N vezes { ... }` repete um bloco; blocos podem ser aninhados.
- Comentários de uma linha (`//`) são aceitos; ponto e vírgula é opcional.
- O total de ações primitivas é limitado a 500; erros são exibidos em português
  apontando a linha relevante.

## Publicação

O repositório publica `dist/` no GitHub Pages automaticamente via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) a cada push na
branch `main`. O `base` do Vite está configurado como relativo (`./`), então a
aplicação funciona em qualquer subdiretório sem depender de fallback de SPA.
