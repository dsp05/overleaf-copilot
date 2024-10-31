'use strict';

import OpenAI, { APIUserAbortError } from 'openai';
import {
  DEFAULT_MODEL,
} from '../constants';
import { postProcessToken } from './helper';
import { Options, StreamChunk } from '../types';

const HOSTED_IMPROVE_URL = 'https://embedding.azurewebsites.net/improve';

export async function getImprovement(selection: string, prompt: string, options: Options, signal: AbortSignal) {
  if (!options.apiKey) {
    try {
      const response = await fetch(HOSTED_IMPROVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: selection }),
        signal: signal,
      });
      if (!response.ok) {
        return "Server is at capacity. Please select fewer words, try again later or use your own OpenAI API key."
      }
      return postProcessToken((await response.json())["content"])
    } catch (AbortError) {
      return "The request was aborted.";
    }
  } else {
    const openai = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.apiBaseUrl,
      dangerouslyAllowBrowser: true,
    });

    try {
      const response = await openai.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: buildImprovePrompt(selection, prompt),
          },
        ],
        model: options.model || DEFAULT_MODEL,
      }, { signal: signal });
      return response.choices[0].message.content ?? '';
    } catch (error) {
      if (error instanceof APIUserAbortError) {
        return "The request was aborted.";
      }
      return "An error occurred while generating the content.\n" + error;
    }
  }
}

export async function* getImprovementStream(selection: string, prompt: string, options: Options, signal: AbortSignal):
  AsyncGenerator<StreamChunk, void, unknown> {

  if (!options.apiKey) {
    try {
      const response = await fetch(HOSTED_IMPROVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: selection, stream: true }),
        signal: signal,
      });

      if (!response.ok || response.body === null) {
        yield {
          kind: "error",
          content: "Server is at capacity. Please select fewer words, try again later or use your own OpenAI API key."
        };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const token = postProcessToken(decoder.decode(value, { stream: true }));
        if (!!token) {
          yield {
            kind: "token",
            content: token,
          };
        }
      }
    } catch (AbortError) {
    }
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
      }, { signal: signal });

      for await (const chunk of stream) {
        yield { kind: "token", content: chunk.choices[0]?.delta?.content || '' };
      }

    } catch (error) {
      if (error instanceof APIUserAbortError) {
        return;
      }
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
