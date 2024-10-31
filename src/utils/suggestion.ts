'use strict';

import OpenAI, { APIUserAbortError } from 'openai';
import {
  DEFAULT_SUGGESTION_MAX_OUTPUT_TOKEN,
  DEFAULT_MODEL,
} from '../constants';
import { postProcessToken } from './helper';
import { Options, StreamChunk } from '../types';

const HOSTED_COMPLETE_URL = 'https://embedding.azurewebsites.net/complete';

export async function* getSuggestion(input: string, signal: AbortSignal, options: Options):
  AsyncGenerator<StreamChunk, void, unknown> {

  if (!options.apiKey) {
    try {
      const response = await fetch(HOSTED_COMPLETE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input, stream: true }),
        signal: signal,
      });

      if (!response.ok || response.body === null) {
        yield {
          kind: "error",
          content: "Server is at capacity. Please try again later or use your own OpenAI API key."
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
      const stream = await openai.chat.completions.create(
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
          stream: true,
        },
        { signal: signal }
      );

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