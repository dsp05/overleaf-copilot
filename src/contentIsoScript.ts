'use strict';

import './contentIsoScript.css';

import { GetOrLoadCompletion } from './utils/completion';
import { LoadSidePanel } from './sidePanel';
import {
  CONFIG_DISABLE_COMPLETION,
  CONFIG_DISABLE_IMPROVEMENT,
  CONFIG_MAX_PROMPT_WORDS,
} from './constants';
import { SuggestionManager } from './manager/SuggestionManager';

let cursorPos: { row: number; column: number } | null = null;
const suggestionManager = new SuggestionManager();

function debounce<
  T extends (
    content: string,
    pos: number,
    row: number,
    col: number,
    signal: AbortSignal
  ) => Promise<void>
>(func: T): EventListener {
  let controller: AbortController | null = null;

  return async function (event: Event) {
    if (controller) controller.abort();

    controller = new AbortController();
    const detail = (
      event as CustomEvent<{
        prefix: string;
        pos: number;
        row: number;
        col: number;
      }>
    ).detail;
    await func(
      detail.prefix,
      detail.pos,
      detail.row,
      detail.col,
      controller.signal
    );
  };
}

async function onEditorUpdate(
  content: string,
  pos: number,
  row: number,
  col: number,
  signal: AbortSignal
) {
  const config = await chrome.storage.local.get([CONFIG_DISABLE_COMPLETION]);
  if (!!config[CONFIG_DISABLE_COMPLETION]) return;

  if (!!suggestionManager.currentSuggestion) return;

  const suggestion = suggestionManager.createNewSuggestion('Generating...', pos);
  if (!suggestion) return;

  const completion = await GetOrLoadCompletion(content, signal);

  suggestion.toCompleted(completion);
}

async function onConfigUpdate() {
  const config = await chrome.storage.local.get([CONFIG_MAX_PROMPT_WORDS]);
  window.dispatchEvent(
    new CustomEvent('copilot:config:update', { detail: config })
  );
}

async function onEditorSelect(
  event: CustomEvent<{
    selection: string;
    from: number;
    to: number;
    head: number;
  }>
) {
  const config = await chrome.storage.local.get([CONFIG_DISABLE_IMPROVEMENT]);

  if (!!config[CONFIG_DISABLE_IMPROVEMENT]) return;

  const scroller = document.querySelector('div.cm-scroller');
  if (scroller == null) return;

  const cursor = document.querySelector('.cm-cursor-primary') as HTMLElement;
  if (cursor == null) return;
  const button = document.createElement('div');
  button.setAttribute('id', 'copilot-sidebar-button');

  if (
    event.detail.to - event.detail.head <
    event.detail.head - event.detail.from
  ) {
    button.style.left = `${parseInt(cursor.style.left) - 25}px`;
    button.style.top = `${parseInt(cursor.style.top) + 25}px`;
  } else {
    button.style.left = `${parseInt(cursor.style.left) - 35}px`;
    button.style.top = `${parseInt(cursor.style.top) - 30}px`;
  }
  button.style.backgroundImage = `url("${chrome.runtime.getURL(
    'icons/icon_128.png'
  )}")`;
  button.onclick = async () => {
    document.getElementById('copilot-sidebar-button')?.remove();
    document.getElementById('copilot-side-panel')?.remove();
    await LoadSidePanel(
      event.detail.selection,
      event.detail.from,
      event.detail.to
    );
  };
  scroller.appendChild(button);
}

function onCursorUpdate(event: CustomEvent<{ row: number; column: number }>) {
  cursorPos = event.detail;
}

window.addEventListener('copilot:editor:update', debounce(onEditorUpdate));
window.addEventListener(
  'copilot:editor:select',
  onEditorSelect as any as EventListener
);

window.addEventListener(
  'cursor:editor:update',
  onCursorUpdate as EventListener
);
window.addEventListener('load', onConfigUpdate);

chrome.runtime.onMessage.addListener(async function (request) {
  if (request.type === 'config:update') await onConfigUpdate();
});
