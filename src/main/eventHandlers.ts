import * as Diff from 'diff';
import { getCmView } from './helpers';
import { Suggestion } from '../common/suggestion';

export function onAcceptSuggestion() {
  const suggestion = Suggestion.getCurrent();
  if (suggestion?.status !== 'completed') {
    suggestion?.remove();
    return;
  }

  const view = getCmView();
  const changes = {
    from: suggestion.pos,
    to: view.state.selection.main.head,
    insert: suggestion.text
  };
  view.dispatch({ changes });
  suggestion.remove();
}

export function onAcceptPartialSuggestion() {
  const suggestion = Suggestion.getCurrent();
  if (suggestion?.status !== 'completed') return;

  const pos = suggestion.pos;
  const text = suggestion.text;

  let acceptedLength = text.length;
  let hasContent = false;

  const isSpace = (c: string) => c == ' ' || c == '\n';

  for (let i = 0; i < text.length; i++) {
    const b = isSpace(text[i]);
    hasContent ||= !b;
    if (hasContent && b) { acceptedLength = i; break; }
  }
  const accepted = text.substring(0, acceptedLength);
  const changes = { from: pos, to: pos, insert: accepted };
  const view = getCmView();
  suggestion.toPartialAccepted(acceptedLength);
  view.dispatch({ changes: changes, selection: { anchor: pos + acceptedLength } });
}

export function onReplaceContent(
  e: CustomEvent<{ content: string; from: number; to: number }>
) {
  var view = getCmView();
  const state = view.state;
  if (
    state.selection.main.from == e.detail.from &&
    state.selection.main.to == e.detail.to
  ) {
    const originalContent = state.sliceDoc(
      state.selection.main.from,
      state.selection.main.to
    )
    let changes = [];
    let diffs = Diff.diffChars(originalContent, e.detail.content);

    if (diffs.length >= 500) {
      diffs = Diff.diffWordsWithSpace(originalContent, e.detail.content);
    }

    if (diffs.length >= 500) {
      changes.push({
        from: e.detail.from,
        to: e.detail.to,
        insert: e.detail.content,
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

    const selection = { anchor: e.detail.from + e.detail.content.length };
    view.dispatch({ changes, selection });
  }
}
