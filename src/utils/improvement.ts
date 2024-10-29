'use strict';

import OpenAI from 'openai';
import {
  DEFAULT_MODEL,
} from '../constants';
import { GetOptions, postProcessResponse } from './helper';

const HOSTED_IMPROVE_URL = 'https://embedding.azurewebsites.net/improve';

export async function* getImprovement(selection: string, prompt: string) {
  const options = await GetOptions();

  if (!options.apiKey) {
    const response = await fetch(HOSTED_IMPROVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: selection }),
    });

    if (!response.ok) {
      yield "Server is at capacity. Please select fewer words, try again later or use your own OpenAI API key.";
    }

    yield postProcessResponse((await response.json())["content"]);
  } else {
    const openai = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.apiBaseUrl,
      dangerouslyAllowBrowser: true,
    });

    try {
      const stream = await openai.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: buildImprovePrompt(selection, prompt),
          },
        ],
        model: options.model || DEFAULT_MODEL,
        stream: true,
      });

      for await (const chunk of stream) {
        yield chunk.choices[0]?.delta?.content || ''
      }

    } catch (error) {
      yield "An error occurred while generating the content.\n" + error;
    }
  }
}

function buildImprovePrompt(selection: string, template: string) {
  if (!!template && template.indexOf('<input>') >= 0) {
    return template.replace('<input>', selection);
  }

  return `Rewrite and improve the following content:\n` + `${selection}`;
}
