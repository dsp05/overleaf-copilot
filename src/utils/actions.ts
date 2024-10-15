import { EditorContent } from "../types";
import { GetSuggestion } from "./dom";

export function onAcceptSuggestion(content: EditorContent) {
  const suggestion = GetSuggestion();
  if (suggestion?.getAttribute('data-status') !== 'completed') return;

  const currentPos = content.cmView.view.state.selection.main.head;
  const posAttr = suggestion.getAttribute('data-pos');
  const pos = posAttr ? parseInt(posAttr) : currentPos;
  const changes = { from: pos, to: currentPos, insert: suggestion.innerText };
  content.cmView.view.dispatch({ changes });
}

export function onAcceptPartialSuggestion(content: EditorContent) {
  const suggestion = GetSuggestion();
  if (suggestion?.getAttribute('data-status') !== 'completed') return;

  let currentPos = content.cmView.view.state.selection.main.head;
  const posAttr = suggestion.getAttribute('data-pos');
  const pos = posAttr ? parseInt(posAttr) : currentPos;
  const text = suggestion.innerText;

  let acceptedLength = text.length;
  let hasContent = false;
  for (let i = 0; i < text.length; i++) {
    hasContent ||= (text[i] != ' ');
    if (hasContent && text[i] == ' ') { acceptedLength = i; break; }
  }
  const accepted = text.substring(0, acceptedLength);
  const changes = { from: pos, to: pos, insert: accepted };

  suggestion.setAttribute('data-status', 'partial-accepted');
  suggestion.setAttribute('data-partial-accepted-length', `${acceptedLength}`);
  suggestion.setAttribute('data-pos', `${pos + acceptedLength}`);
  content.cmView.view.dispatch({ changes: changes, selection: { anchor: pos + acceptedLength } });
}

export function onAcceptImprovement(
  e: CustomEvent<{ improvement: string; from: number; to: number }>
) {
  var editor = document.querySelector('.cm-content');
  if (!editor) return;
  const content = editor as any as EditorContent;
  const state = content.cmView.view.state;
  if (
    state.selection.main.from == e.detail.from &&
    state.selection.main.to == e.detail.to
  ) {
    const changes = {
      from: e.detail.from,
      to: e.detail.to,
      insert: e.detail.improvement,
    };
    const selection = { anchor: e.detail.from + e.detail.improvement.length };
    content.cmView.view.dispatch({ changes, selection });
  }
}