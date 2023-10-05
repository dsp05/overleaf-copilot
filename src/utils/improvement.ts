"use strict";

import OpenAI from "openai";
import {
  CONFIG_API_KEY, CONFIG_IMPROVEMENT_CUSTOM_PROMPT,
  CONFIG_MODEL, DEFAULT_MODEL
} from "../constants";

export async function GetImprovement(selection: string) {
  const config = await chrome.storage.local.get([
    CONFIG_API_KEY, CONFIG_MODEL, CONFIG_IMPROVEMENT_CUSTOM_PROMPT]);

  if (!config[CONFIG_API_KEY]) return "";

  const openai = new OpenAI({
    apiKey: config[CONFIG_API_KEY],
    dangerouslyAllowBrowser: true,
  });

  const completion = await openai.chat.completions.create({
    messages: [{
      role: "user",
      content: buildImprovePrompt(selection, config[CONFIG_IMPROVEMENT_CUSTOM_PROMPT])
    }],
    model: config[CONFIG_MODEL] || DEFAULT_MODEL
  });

  return completion.choices[0].message.content?.trim() ?? "";
}

function buildImprovePrompt(selection: string, template: string) {
  if (!!template) {
    if (template.indexOf("<input>") >= 0)
      return template.replace("<input>", selection);
    else
      return template + selection;
  }

  return `Rewrite and improve the following content:\n` +
    `${selection}`;
}
