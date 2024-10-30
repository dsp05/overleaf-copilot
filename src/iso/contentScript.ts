'use strict';

import './contentScript.css';

import { showToolbar } from './toolbar';
import { Options } from '../types';
import { Suggestion } from '../common/suggestion';
import { getOptions } from '../utils/helper';

let options: Options | undefined = undefined;
let suggestionAbortController: AbortController | null = null;

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

  try {
    await Suggestion.create(event.detail.pos)?.generate(event.detail.prefix, suggestionAbortController.signal, options);
  } catch (AbortError) {
  }
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
  if (options == undefined || options.toolbarDisabled) return;
  showToolbar(event.detail, options);
}

function onCursorUpdate(_: Event) {
  suggestionAbortController?.abort();
}

window.addEventListener('copilot:editor:update', onEditorUpdate as any as EventListener);
window.addEventListener('copilot:editor:select', onEditorSelect as any as EventListener);
window.addEventListener('copilot:cursor:update', onCursorUpdate);
chrome.storage.onChanged.addListener(onOptionsUpdate);
onOptionsUpdate();
