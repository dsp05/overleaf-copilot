'use strict';

import OpenAI from 'openai';
import {
  CONFIG_API_KEY,
  CONFIG_BASE_URL,
  CONFIG_IMPROVEMENT_CUSTOM_PROMPT,
  CONFIG_MODEL,
  DEFAULT_MODEL,
} from '../constants';
import { PostProcessResponse } from './helper';

const HOSTED_IMPROVE_URL = 'https://embedding.azurewebsites.net/improve';

export async function GetImprovement(selection: string) {
  const config = await chrome.storage.local.get([
    CONFIG_API_KEY,
    CONFIG_BASE_URL,
    CONFIG_MODEL,
    CONFIG_IMPROVEMENT_CUSTOM_PROMPT,
  ]);

  if (!config[CONFIG_API_KEY]) {
    const response = await fetch(HOSTED_IMPROVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: selection }),
    });

    return PostProcessResponse((await response.json())["content"]);
  };

  const openai = new OpenAI({
    apiKey: config[CONFIG_API_KEY],
    baseURL: config[CONFIG_BASE_URL] || undefined,
    dangerouslyAllowBrowser: true,
  });

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: buildImprovePrompt(
          selection,
          config[CONFIG_IMPROVEMENT_CUSTOM_PROMPT]
        ),
      },
    ],
    model: config[CONFIG_MODEL] || DEFAULT_MODEL,
  });

  return PostProcessResponse(completion.choices[0].message.content);
}

function buildImprovePrompt(selection: string, template: string) {
  if (!!template) {
    if (template.indexOf('<input>') >= 0)
      return template.replace('<input>', selection);
    else return template + selection;
  }

  return `Rewrite and improve the following content:\n` + `${selection}`;
}
