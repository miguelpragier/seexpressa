import { StateEffect, StateField } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { defaultHighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'

export interface EditorHighlight {
  line: number
  kind: 'active' | 'error'
}

const setHighlight = StateEffect.define<EditorHighlight | null>()

const activeMark = Decoration.line({ class: 'cm-highlight-line' })
const errorMark = Decoration.line({ class: 'cm-error-line' })

const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    for (const effect of tr.effects) {
      if (effect.is(setHighlight)) {
        const value = effect.value
        if (value === null) {
          decorations = Decoration.none
        } else {
          const lineNumber = Math.min(Math.max(value.line, 1), tr.state.doc.lines)
          const line = tr.state.doc.line(lineNumber)
          const mark = value.kind === 'error' ? errorMark : activeMark
          decorations = Decoration.set([mark.range(line.from)])
        }
      }
    }
    return decorations
  },
  provide: (field) => EditorView.decorations.from(field),
})

const expressaLanguage = StreamLanguage.define({
  name: 'expressa',
  token(stream) {
    if (stream.eatSpace()) return null
    if (stream.match('//')) {
      stream.skipToEnd()
      return 'comment'
    }
    if (stream.match(/[0-9]+/)) return 'number'
    if (stream.match(/[\p{L}_][\p{L}\p{N}_]*/u)) return 'keyword'
    stream.next()
    return null
  },
})

export const editorExtensions: Extension[] = [
  lineNumbers(),
  highlightActiveLine(),
  highlightSpecialChars(),
  drawSelection(),
  dropCursor(),
  EditorView.lineWrapping,
  history(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  syntaxHighlighting(defaultHighlightStyle),
  expressaLanguage,
  highlightField,
]

export function applyHighlight(view: EditorView, highlight: EditorHighlight | null): void {
  view.dispatch({ effects: setHighlight.of(highlight) })
  if (highlight !== null) {
    const lineNumber = Math.min(Math.max(highlight.line, 1), view.state.doc.lines)
    const line = view.state.doc.line(lineNumber)
    view.dispatch({ effects: EditorView.scrollIntoView(line.from, { y: 'center' }) })
  }
}
