import { EditorContent } from "../types";
import * as Diff from 'diff';

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
    const originalContent = state.sliceDoc(
      state.selection.main.from,
      state.selection.main.to
    )
    let changes = [];
    let diffs = Diff.diffChars(originalContent, e.detail.improvement);

    if (diffs.length >= 500) {
      diffs = Diff.diffWordsWithSpace(originalContent, e.detail.improvement);
    }

    if (diffs.length >= 500) {
      changes.push({
        from: e.detail.from,
        to: e.detail.to,
        insert: e.detail.improvement,
      });
    } else {
      let index = 0;
      for (const diff of diffs) {
        if (diff.added) {
          changes.push({
            from: e.detail.from + index,
            to: e.detail.from + index,
            insert: diff.value,
          });
        } else if (diff.removed) {
          changes.push({
            from: e.detail.from + index,
            to: e.detail.from + index + diff.value.length,
          });
          index += diff.value.length;
        } else {
          index += diff.value.length;
        }
      }
    }

    const selection = { anchor: e.detail.from + e.detail.improvement.length };
    content.cmView.view.dispatch({ changes, selection });
  }
}
