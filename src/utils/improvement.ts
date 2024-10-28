'use strict';

import OpenAI from 'openai';
import {
  DEFAULT_MODEL,
} from '../constants';
import { GetOptions, PostProcessResponse } from './helper';

const HOSTED_IMPROVE_URL = 'https://embedding.azurewebsites.net/improve';

export async function getImprovement(selection: string, prompt: string) {
  const options = await GetOptions();

  if (!options.apiKey) {
    const response = await fetch(HOSTED_IMPROVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: selection }),
    });

    if (!response.ok) {
      return "Server is at capacity. Please select fewer words, try again later or use your own OpenAI API key.";
    }

    return PostProcessResponse((await response.json())["content"]);
  };

  const openai = new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.apiBaseUrl,
    dangerouslyAllowBrowser: true,
  });

  try {
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
  } catch (error) {
    return "An error occurred while generating the content.\n" + error;
  }
}

function buildImprovePrompt(selection: string, template: string) {
  if (!!template && template.indexOf('<input>') >= 0) {
    return template.replace('<input>', selection);
  }

  return `Rewrite and improve the following content:\n` + `${selection}`;
}
