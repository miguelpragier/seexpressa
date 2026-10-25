import { formatError } from '../language/errors'
import type { LanguageError } from '../language/errors'
import type { Status } from '../execution/reducer'

interface StatusPanelProps {
  status: Status
  error: LanguageError | null
  message: string | null
  executed: number
}

function liveText(status: Status, error: LanguageError | null, message: string | null): string {
  if (status === 'syntaxError' && error) return formatError(error)
  if (message) return message
  switch (status) {
    case 'running':
      return 'Executando…'
    case 'paused':
      return 'Pausado.'
    case 'success':
      return 'Parabéns!'
    case 'collision':
      return 'Colisão.'
    default:
      return 'Pronto para executar.'
  }
}

export function StatusPanel({ status, error, message, executed }: StatusPanelProps) {
  return (
    <section class="status-panel" aria-label="Status">
      <p class="status-message" role="status" aria-live="polite" aria-atomic="true">
        {liveText(status, error, message)}
      </p>
      <p class="status-count">Ações executadas: {executed}</p>
    </section>
  )
}
