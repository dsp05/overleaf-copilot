"use strict";

import OpenAI, { APIUserAbortError } from "openai";
import crypto from "crypto-js";
import { ChatCompletion } from "openai/resources/chat";
import {
  CONFIG_API_KEY, CONFIG_BASE_URL, CONFIG_COMPLETION_CUSTOM_PROMPT,
  CONFIG_MAX_TOKEN, CONFIG_MODEL, DEFAULT_MAX_TOKEN, DEFAULT_MODEL
} from "../constants";

const completionCache = new Map<string, string>();
const cacheSize = 100;

export async function GetOrLoadCompletion(input: string, signal: AbortSignal) {
  const key = `completion-${computeMD5Hash(input)}`;
  if (completionCache.has(key)) {
    return completionCache.get(key) ?? "";
  }

  const completion = await getCompletion(input, signal);

  if (completionCache.size >= cacheSize) completionCache.clear();
  completionCache.set(key, completion);
  return completion;
}

async function getCompletion(input: string, signal: AbortSignal) {
  const config = await chrome.storage.local.get([
    CONFIG_API_KEY,
    CONFIG_BASE_URL,
    CONFIG_MODEL,
    CONFIG_MAX_TOKEN,
    CONFIG_COMPLETION_CUSTOM_PROMPT]);

  if (!config[CONFIG_API_KEY]) return "";

  console.log("config", config)

  const openai = new OpenAI({
    apiKey: config[CONFIG_API_KEY],
    baseURL: !!config[CONFIG_BASE_URL]? config[CONFIG_BASE_URL] : undefined,
    dangerouslyAllowBrowser: true,
  });

  let completion: ChatCompletion | null = null;
  try {
    completion = await openai.chat.completions.create({
      messages: [{
        role: "user",
        content: buildCompletionPrompt(input, config[CONFIG_COMPLETION_CUSTOM_PROMPT])
      }],
      model: config[CONFIG_MODEL] || DEFAULT_MODEL,
      max_tokens: parseInt(config[CONFIG_MAX_TOKEN]) || DEFAULT_MAX_TOKEN,
    }, { signal: signal });
  } catch (err) {
    if (err instanceof APIUserAbortError) {
      return "";
    }
    throw err;
  }
  return completion.choices[0].message.content?.trim() ?? "";
}

function buildCompletionPrompt(input: string, template: string) {
  if (!!template) {
    if (template.indexOf("<input>") >= 0)
      return template.replace("<input>", input);
    else
      return template + input;
  }

  return `Continue ${input.endsWith("\n") ? "" : "the last paragraph of "}the academic paper in LaTeX below, ` +
    `making sure to maintain semantic continuity.\n\n` +
    `### Beginning of the paper ###\n` +
    `${input}\n` +
    `### End of the paper ###`;
}

function computeMD5Hash(input: string) {
  return crypto.MD5(input).toString();
}
