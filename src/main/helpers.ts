import { EditorContent } from "../types";
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
