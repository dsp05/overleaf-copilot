'use strict';

import './contentScript.css';

import { GetOrLoadSuggestion } from '../utils/suggestion';
import { showToolbar } from './toolbar';
import { GetOptions } from '../utils/helper';
import { Options } from '../types';
import { createNewSuggestion } from './helpers';
import { getCurrentSuggestion } from '../common/helpers';

let options: Options | undefined = undefined;

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
    if (options == undefined || options.suggestionDisabled) return;

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
  if (options == undefined || options.suggestionDisabled) return;

  const existing = getCurrentSuggestion();
  if (!!existing) return;

  const suggestion = createNewSuggestion('...', pos);
  if (!suggestion) return;

  let completion = '';

  try {
    completion = await GetOrLoadSuggestion(content, signal);
  } catch (error) {
    if (!options.apiKey) {
      completion = 'Server is at capacity. Please try again later or use your own OpenAI API key.';
    } else {
      completion = 'An error occurred while generating the content. ' + error;
    }

    suggestion.toError(completion);
    return;
  }

  suggestion.toCompleted(completion);
}

async function onOptionsUpdate() {
  options = await GetOptions();
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

window.addEventListener('copilot:editor:update', debounce(onEditorUpdate));
window.addEventListener('copilot:editor:select', onEditorSelect as any as EventListener);

chrome.storage.onChanged.addListener(onOptionsUpdate);
onOptionsUpdate();
