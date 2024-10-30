'use strict';

import './contentScript.css';

import { showToolbar } from './toolbar';
import { Options } from '../types';
import { Suggestion } from '../common/suggestion';
import { getOptions } from '../utils/helper';

let options: Options | undefined = undefined;
let suggestionAbortController: AbortController | null = null;
let toolbarActionAbortController: AbortController | null = null;

async function onEditorUpdate(
  event: CustomEvent<{
    prefix: string,
    pos: number,
    row: number,
    col: number
  }>
) {
  suggestionAbortController?.abort();

  if (options == undefined || options.suggestionDisabled) return;
  suggestionAbortController = new AbortController();

  const existing = Suggestion.getCurrent();
  if (!!existing) return;

  await Suggestion.create(event.detail.pos)?.generate(event.detail.prefix, suggestionAbortController.signal, options);
}

async function onOptionsUpdate() {
  options = await getOptions();
  window.dispatchEvent(
    new CustomEvent('copilot:options:update', { detail: { options } })
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
  toolbarActionAbortController?.abort();

  if (options == undefined || options.toolbarDisabled) return;
  toolbarActionAbortController = new AbortController();
  showToolbar(event.detail, options, toolbarActionAbortController.signal);
}

function onCursorUpdate(_: Event) {
  suggestionAbortController?.abort();
  toolbarActionAbortController?.abort();
}

window.addEventListener('copilot:editor:update', onEditorUpdate as any as EventListener);
window.addEventListener('copilot:editor:select', onEditorSelect as any as EventListener);
window.addEventListener('copilot:cursor:update', onCursorUpdate);
chrome.storage.onChanged.addListener(onOptionsUpdate);
onOptionsUpdate();
