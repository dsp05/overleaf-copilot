'use strict';

import { getContentBeforeCursor, getCmView, updateSuggestionOnCursorUpdate, getContentAfterCursor } from './helpers';
import { onAcceptPartialSuggestion, onAcceptSuggestion, onReplaceContent } from './eventHandlers';
import { MAX_LENGTH_AFTER_CURSOR, MAX_LENGTH_BEFORE_CURSOR, MAX_LENGTH_SELECTION } from '../constants';

function debounce<T extends () => void>(func: T): () => void {
  let timeout: NodeJS.Timeout | null;

  return function () {
    window.dispatchEvent(new CustomEvent('copilot:cursor:update'));
    document.getElementById('copilot-toolbar')?.remove();
    document.getElementById('copilot-toolbar-editor')?.remove();
    updateSuggestionOnCursorUpdate();

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func();
      timeout = null;
    }, 500);
  };
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key == 'Tab') {
    onAcceptSuggestion();
  } else if ((event.metaKey || event.ctrlKey) && event.key == 'ArrowRight') {
    onAcceptPartialSuggestion();
  }
}

function onCursorUpdate() {
  var view = getCmView();
  const state = view.state;
  const from = state.selection.main.from;
  const to = state.selection.main.to;
  const head = state.selection.main.head;

  if (from != to) {
    // Selection is not empty. Show the toolbar;
    if (to - from >= MAX_LENGTH_SELECTION) return;
    window.dispatchEvent(
      new CustomEvent('copilot:editor:select', {
        detail: {
          content: {
            selection: state.sliceDoc(from, to),
            before: getContentBeforeCursor(state, from, MAX_LENGTH_BEFORE_CURSOR),
            after: getContentAfterCursor(state, to, MAX_LENGTH_AFTER_CURSOR),
          },
          from,
          to,
          head,
        },
      })
    );
  } else {
    // Selection is empty. Show the suggestion.
    const line = state.doc.lineAt(head);
    const col = head - line.from;
    const newLine = line.text.length == 0;
    if (newLine || (col == line.text.length && line.text[col - 1] == ' ')) {
      window.dispatchEvent(
        new CustomEvent('copilot:editor:update', {
          detail: {
            content: {
              selction: '',
              before: getContentBeforeCursor(state, head, MAX_LENGTH_BEFORE_CURSOR),
              after: getContentAfterCursor(state, head, MAX_LENGTH_AFTER_CURSOR),
            },
            head,
          },
        })
      );
    }
  }
}


window.addEventListener('copilot:editor:replace', onReplaceContent as EventListener);
window.addEventListener('cursor:editor:update', debounce(onCursorUpdate));

// REVIEW dsp05: This isn't very ideal, need to investigate what was changed.
const setupKeydownListener = (n: number) => {
  if (n <= 0) return true;
  const editor = document.querySelector('.cm-content');
  if (!editor) {
    setTimeout(() => setupKeydownListener(n - 1), 500);
    return false;
  }
  editor.addEventListener('keydown', onKeyDown as EventListener);
  return true;
};

setupKeydownListener(10);
