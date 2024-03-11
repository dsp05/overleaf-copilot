'use strict';

import OpenAI from 'openai';
import {
  CONFIG_API_KEY,
  CONFIG_BASE_URL,
  CONFIG_IMPROVEMENT_CUSTOM_PROMPT,
  CONFIG_MODEL,
  DEFAULT_MODEL,
} from '../constants';

export async function AskQuestion(question: string, selection?: string) {
  const config = await chrome.storage.local.get([
    CONFIG_API_KEY,
    CONFIG_BASE_URL,
    CONFIG_MODEL,
    CONFIG_IMPROVEMENT_CUSTOM_PROMPT,
  ]);

  if (!config[CONFIG_API_KEY]) return '';

  const openai = new OpenAI({
    apiKey: config[CONFIG_API_KEY],
    baseURL: config[CONFIG_BASE_URL] || undefined,
    dangerouslyAllowBrowser: true,
  });

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: buildAskPrompt(
          question,
          selection
        ),
      },
    ],
    model: config[CONFIG_MODEL] || DEFAULT_MODEL,
  });

  return completion.choices[0].message.content?.trim() ?? '';
}

function buildAskPrompt(question: string, selection?: string) {
  if (selection) {
    return (
      `Rewrite and improve the following content:\n` + `${selection}\n\n` + 
      `Making sure to maintain semantic continuity, the content should adhere to the following question:\n` +
      `${question}`
    );
  } else {
    return (
      `Continue the academic paper in LaTeX below by providing a solution to the following question.\n` +
      `Only provide the output that has to be written to answer the question:\n\n` +
      `${question}`
    );
  }
}
