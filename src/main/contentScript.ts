'use strict';

import { Options } from '../types';
import { DEFAULT_SUGGESTION_MAX_WORDS } from '../constants';
import { getCmView, updateSuggestionOnCursorUpdate } from './helpers';
import { onAcceptPartialSuggestion, onAcceptSuggestion, onReplaceContent } from './eventHandlers';

let options: Options | undefined = undefined;

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
  if (options == undefined) return;

  const maxPromptWords = options.suggestionPromptMaxWords || DEFAULT_SUGGESTION_MAX_WORDS;;

  var view = getCmView();
  const state = view.state;

  if (state.selection.main.from != state.selection.main.to) {
    // Selection is not empty. Show the toolbar;
    if (state.selection.main.to - state.selection.main.from >= 5000) return;
    window.dispatchEvent(
      new CustomEvent('copilot:editor:select', {
        detail: {
          selection: state.sliceDoc(
            state.selection.main.from,
            state.selection.main.to
          ),
          from: state.selection.main.from,
          to: state.selection.main.to,
          head: state.selection.main.head,
        },
      })
    );
  } else {
    // Selection is empty. Show the suggestion.
    const pos = state.selection.main.head;
    const line = state.doc.lineAt(pos);
    const col = pos - line.from;
    const newLine = line.text.length == 0;
    if (newLine || (col == line.text.length && line.text[col - 1] == ' ')) {
      let prefix = line.text.trim().split(' ');
      let from = line.from;
      while (prefix.length < maxPromptWords && from > 0) {
        const prevLine = state.doc.lineAt(from - 1);
        from = prevLine.from - 1;
        const content = prevLine.text.trim().split(' ');
        if (content.length == 0) continue;
        prefix = content.concat(['\n']).concat(prefix);
      }

      if (prefix.length > maxPromptWords) {
        prefix = prefix.slice(-maxPromptWords);
      }

      if (newLine) {
        prefix.push('\n');
      }

      window.dispatchEvent(
        new CustomEvent('copilot:editor:update', {
          detail: {
            prefix: prefix.join(' '),
            pos,
            newLine,
            col,
            row: line.number - 1,
          },
        })
      );
    }
  }
}

function onOptionsUpdate(e: CustomEvent<{ options: Options }>) {
  options = e.detail.options;
}

window.addEventListener('copilot:editor:replace', onReplaceContent as EventListener);
window.addEventListener('cursor:editor:update', debounce(onCursorUpdate));
window.addEventListener('copilot:options:update', onOptionsUpdate as EventListener);

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
