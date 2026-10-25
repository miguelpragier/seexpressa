export interface SourceLocation {
  line: number
  column: number
}

export class LanguageError extends Error {
  readonly line: number
  readonly column: number

  constructor(line: number, column: number, message: string) {
    super(message)
    this.name = 'LanguageError'
    this.line = line
    this.column = column
  }
}

/** Formats an error for display, e.g. `Linha 4: esperava "vezes" depois do número.` */
export function formatError(error: LanguageError): string {
  return `Linha ${error.line}: ${error.message}`
}
