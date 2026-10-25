import { useEffect, useRef } from 'preact/hooks'
import { EditorView } from '@codemirror/view'
import { applyHighlight, editorExtensions } from '../app/editor'
import type { EditorHighlight } from '../app/editor'

interface CodeEditorProps {
  initialCode: string
  onCodeChange: (code: string) => void
  highlight: EditorHighlight | null
}

export function CodeEditor({ initialCode, onCodeChange, highlight }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onCodeChange)
  onChangeRef.current = onCodeChange

  useEffect(() => {
    const view = new EditorView({
      doc: initialCode,
      extensions: [
        ...editorExtensions,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString())
        }),
      ],
      parent: containerRef.current!,
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Mounted exactly once; the document is owned by CodeMirror after creation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (viewRef.current) applyHighlight(viewRef.current, highlight)
  }, [highlight])

  return <div class="editor-host" ref={containerRef} />
}
