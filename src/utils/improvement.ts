'use strict';

import OpenAI from 'openai';
import {
  DEFAULT_MODEL,
} from '../constants';
import { getOptions, postProcessResponse } from './helper';
import { StreamChunk } from '../types';

const HOSTED_IMPROVE_URL = 'https://embedding.azurewebsites.net/improve';

export async function* getImprovement(selection: string, prompt: string):
  AsyncGenerator<StreamChunk, void, unknown> {
  const options = await getOptions();

  if (!options.apiKey) {
    const response = await fetch(HOSTED_IMPROVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: selection }),
    });

    if (!response.ok) {
      yield {
        kind: "error",
        content: "Server is at capacity. Please select fewer words, try again later or use your own OpenAI API key."
      };
      return;
    }

    yield {
      kind: "token",
      content: postProcessResponse((await response.json())["content"])
    };
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
        yield { kind: "token", content: chunk.choices[0]?.delta?.content || '' };
      }

    } catch (error) {
      yield { kind: "error", content: "An error occurred while generating the content.\n" + error };
    }
  }
}

function buildImprovePrompt(selection: string, template: string) {
  if (!!template && template.indexOf('<input>') >= 0) {
    return template.replace('<input>', selection);
  }

  return `Rewrite and improve the following content:\n` + `${selection}`;
}
