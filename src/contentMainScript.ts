'use strict';

import { CONFIG_MAX_PROMPT_WORDS } from './constants';
import { EditorContent } from './types';
import { SuggestionManager } from './manager/SuggestionManager';
import { onAcceptImprovement } from './utils/actions';

let maxPromptWords = 500;
const suggestionManager = new SuggestionManager();

function debounce<T extends () => void>(func: T): () => void {
  let timeout: NodeJS.Timeout | null;

  return function () {
    document.getElementById('copilot-sidebar-button')?.remove();
    document.getElementById('copilot-side-panel')?.remove();
    suggestionManager.onCursorUpdate();

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func();
      timeout = null;
    }, 500);
  };
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key == 'Tab') {
    suggestionManager.onAcceptSuggestion();
  } else if ((event.metaKey || event.ctrlKey) && event.key == 'ArrowRight') {
    suggestionManager.onAcceptPartialSuggestion();
  }
}

function onCursorUpdate() {
  var editor = document.querySelector('.cm-content');
  if (!editor) return;
  const state = (editor as any as EditorContent).cmView.view.state;

  if (state.selection.main.from != state.selection.main.to) {
    // Selection is not empty.
    if (state.selection.main.to - state.selection.main.from >= 2000) return;
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
    // Selection is empty.
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

function onConfigUpdate(e: CustomEvent<{ [CONFIG_MAX_PROMPT_WORDS]: number }>) {
  maxPromptWords = e.detail[CONFIG_MAX_PROMPT_WORDS] || maxPromptWords;
}

window.addEventListener(
  'copilot:editor:replace',
  onAcceptImprovement as EventListener
);
window.addEventListener('cursor:editor:update', debounce(onCursorUpdate));
window.addEventListener(
  'copilot:config:update',
  onConfigUpdate as EventListener
);

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