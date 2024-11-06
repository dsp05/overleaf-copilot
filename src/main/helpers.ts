import { EditorContent, EditorContentState } from "../types";
import { Suggestion } from "../common/suggestion";

export function getCmView() {
  const editor = document.querySelector('.cm-content') as any as EditorContent;
  return editor.cmView.view;
}

export function updateSuggestionOnCursorUpdate() {
  const suggestion = Suggestion.getCurrent();
  if (!suggestion) return;

  const view = getCmView()
  const currentPos = view.state.selection.main.head;

  if (currentPos === suggestion.pos && suggestion.status === 'partial-accepted'
    && suggestion.toCompletedFromPartialAccepted())
    return;

  suggestion.remove();
}

export function getContentBeforeCursor(state: EditorContentState, pos: number, length: number) {
  const start = Math.max(0, pos - length);
  return state.sliceDoc(start, pos);
}

export function getContentAfterCursor(state: EditorContentState, pos: number, length: number) {
  const end = Math.min(state.doc.length, pos + length);
  return state.sliceDoc(pos, end);
}