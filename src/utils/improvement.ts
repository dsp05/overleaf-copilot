'use strict';

import OpenAI from 'openai';
import {
  DEFAULT_MODEL,
} from '../constants';
import { GetOptions, PostProcessResponse } from './helper';

const HOSTED_IMPROVE_URL = 'https://embedding.azurewebsites.net/improve';

export async function GetImprovement(selection: string, prompt: string) {
  const options = await GetOptions();

  if (!options.apiKey) {
    const response = await fetch(HOSTED_IMPROVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: selection }),
    });

    return PostProcessResponse((await response.json())["content"]);
  };

  const openai = new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.apiBaseUrl,
    dangerouslyAllowBrowser: true,
  });

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: buildImprovePrompt(selection, prompt),
      },
    ],
    model: options.model || DEFAULT_MODEL,
  });

  return PostProcessResponse(completion.choices[0].message.content);
}

function buildImprovePrompt(selection: string, template: string) {
  if (!!template && template.indexOf('<input>') >= 0) {
    return template.replace('<input>', selection);
  }

  return `Rewrite and improve the following content:\n` + `${selection}`;
}
