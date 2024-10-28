'use strict';

import OpenAI, { APIUserAbortError } from 'openai';
import crypto from 'crypto-js';
import { ChatCompletion } from 'openai/resources/chat';
import {
  DEFAULT_SUGGESTION_MAX_OUTPUT_TOKEN,
  DEFAULT_MODEL,
} from '../constants';
import { GetOptions, PostProcessResponse } from './helper';

const completionCache = new Map<string, string>();
const cacheSize = 100;
const HOSTED_COMPLETE_URL = 'https://embedding.azurewebsites.net/complete';

export async function GetOrLoadSuggestion(input: string, signal: AbortSignal) {
  const key = `completion-${computeMD5Hash(input)}`;
  if (completionCache.has(key)) {
    return completionCache.get(key) ?? '';
  }

  const completion = await getSuggestion(input, signal);

  if (completionCache.size >= cacheSize) completionCache.clear();
  completionCache.set(key, completion);
  return completion;
}

async function getSuggestion(input: string, signal: AbortSignal) {
  const options = await GetOptions();

  if (!options.apiKey) {
    const response = await fetch(HOSTED_COMPLETE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input }),
    });

    return PostProcessResponse((await response.json())["content"]);
  };

  const openai = new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.apiBaseUrl,
    dangerouslyAllowBrowser: true,
  });

  let completion: ChatCompletion | null = null;
  try {
    completion = await openai.chat.completions.create(
      {
        messages: [
          {
            role: 'user',
            content: buildSuggestionPrompt(
              input,
              options.suggestionPrompt,
            ),
          },
        ],
        model: options.model ?? DEFAULT_MODEL,
        max_tokens: options.suggestionMaxOutputToken ?? DEFAULT_SUGGESTION_MAX_OUTPUT_TOKEN,
      },
      { signal: signal }
    );
  } catch (err) {
    if (err instanceof APIUserAbortError) {
      return '';
    }
    throw err;
  }
  return PostProcessResponse(completion.choices[0].message.content);
}

function buildSuggestionPrompt(input: string, template: string | undefined) {
  if (!!template) {
    if (template.indexOf('<input>') >= 0)
      return template.replace('<input>', input);
    else return template + input;
  }

  return (
    `Continue ${input.endsWith('\n') ? '' : 'the last paragraph of '
    }the academic paper in LaTeX below, ` +
    `making sure to maintain semantic continuity.\n\n` +
    `### Beginning of the paper ###\n` +
    `${input}\n` +
    `### End of the paper ###`
  );
}

function computeMD5Hash(input: string) {
  return crypto.MD5(input).toString();
}
