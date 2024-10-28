import { EditorContent } from "../types";
import { getCurrentSuggestion } from "../common/helpers";

export function getCurrentEditorContent() {
  return document.querySelector('.cm-content') as any as EditorContent;
}

export function updateSuggestionOnCursorUpdate() {
  const suggestion = getCurrentSuggestion();
  if (!suggestion) return;

  const content = getCurrentEditorContent();
  const currentPos = content.cmView.view.state.selection.main.head;

  if (currentPos === suggestion.pos && suggestion.status === 'partial-accepted'
    && suggestion.toCompletedFromPartialAccepted())
    return;

  suggestion.remove();
}
