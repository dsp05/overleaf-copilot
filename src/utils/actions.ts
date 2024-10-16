import { EditorContent } from "../types";

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