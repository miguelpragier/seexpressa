import { useCallback, useEffect, useReducer, useRef, useState } from 'preact/hooks'
import { createInitialState, reducer } from '../execution/reducer'
import { Runner } from '../execution/controller'
import { loadState, saveCode, saveDifficulty, saveSeed } from './storage'
import type { StoredState } from './storage'
import type { EditorHighlight } from './editor'
import { CodeEditor } from '../components/CodeEditor'
import { CommandReference } from '../components/CommandReference'
import { ExecutionControls } from '../components/ExecutionControls'
import { MazeView } from '../components/MazeView'
import { StatusPanel } from '../components/StatusPanel'

export function App() {
  const [stored] = useState<StoredState>(() => loadState())
  const [state, dispatch] = useReducer(
    reducer,
    stored,
    (initial) => createInitialState(initial.difficulty, initial.seed),
  )

  const codeRef = useRef(stored.code)
  const speedRef = useRef(state.speed)
  speedRef.current = state.speed

  const runnerRef = useRef<Runner | null>(null)
  if (runnerRef.current === null) {
    runnerRef.current = new Runner(() => dispatch({ type: 'TICK' }), () => speedRef.current)
  }

  useEffect(() => {
    if (state.status === 'running') runnerRef.current!.start()
    else runnerRef.current!.stop()
    return () => runnerRef.current!.stop()
  }, [state.status])

  useEffect(() => {
    saveDifficulty(state.difficulty)
    saveSeed(state.maze.seed)
  }, [state.difficulty, state.maze.seed])

  const handleCodeChange = useCallback((code: string) => {
    codeRef.current = code
    saveCode(code)
    dispatch({ type: 'CANCEL' })
  }, [])

  const handleRun = useCallback(() => dispatch({ type: 'RUN', code: codeRef.current }), [])
  const handlePause = useCallback(() => dispatch({ type: 'PAUSE' }), [])
  const handleResume = useCallback(() => dispatch({ type: 'RESUME' }), [])
  const handleReset = useCallback(() => dispatch({ type: 'RESET' }), [])
  const handleNewMaze = useCallback(
    () => dispatch({ type: 'NEW_MAZE', difficulty: state.difficulty }),
    [state.difficulty],
  )
  const handleDifficultyChange = useCallback(
    (difficulty: Parameters<typeof createInitialState>[0]) =>
      dispatch({ type: 'NEW_MAZE', difficulty }),
    [],
  )
  const handleSpeedChange = useCallback((speed: number) => dispatch({ type: 'SET_SPEED', speed }), [])

  const highlight: EditorHighlight | null =
    state.highlightLine === null
      ? null
      : { line: state.highlightLine, kind: state.status === 'syntaxError' ? 'error' : 'active' }

  return (
    <div class="app">
      <header class="app-header">
        <h1 class="app-title">Labirinto Expressa</h1>
        <p class="app-tagline">
          Resolva o labirinto escrevendo comandos baseados na sintaxe da Expressa.
        </p>
      </header>

      <main class="app-main">
        <section class="maze-section" aria-label="Labirinto">
          <MazeView maze={state.maze} player={state.player} status={state.status} />
        </section>

        <section class="workspace">
          <ExecutionControls
            status={state.status}
            difficulty={state.difficulty}
            speed={state.speed}
            onRun={handleRun}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
            onNewMaze={handleNewMaze}
            onDifficultyChange={handleDifficultyChange}
            onSpeedChange={handleSpeedChange}
          />

          <CodeEditor
            initialCode={stored.code}
            onCodeChange={handleCodeChange}
            highlight={highlight}
          />

          <StatusPanel
            status={state.status}
            error={state.error}
            message={state.message}
            executed={state.executed}
          />

          <CommandReference />
        </section>
      </main>
    </div>
  )
}
