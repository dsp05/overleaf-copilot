"use strict";

import {
  CONFIG_API_KEY, CONFIG_BASE_URL, CONFIG_COMPLETION_CUSTOM_PROMPT, CONFIG_DISABLE_COMPLETION,
  CONFIG_DISABLE_IMPROVEMENT, CONFIG_IMPROVEMENT_CUSTOM_PROMPT,
  CONFIG_MAX_PROMPT_WORDS, CONFIG_MAX_TOKEN, CONFIG_MODEL
} from "./constants";
import "./popup.css";

(function () {
  function restoreConfig() {
    chrome.storage.local.get([
      CONFIG_API_KEY, CONFIG_BASE_URL, CONFIG_MODEL, CONFIG_MAX_TOKEN,
      CONFIG_MAX_PROMPT_WORDS, CONFIG_COMPLETION_CUSTOM_PROMPT, CONFIG_IMPROVEMENT_CUSTOM_PROMPT,
      CONFIG_DISABLE_COMPLETION, CONFIG_DISABLE_IMPROVEMENT],
      (result) => {
        const apiKey = result[CONFIG_API_KEY] as string;
        if (!!apiKey) {
          const maskedApiKey = apiKey.length <= 3 ? "***" : apiKey.substring(0, 3) + "*".repeat(apiKey.length - 3);
          document.getElementById(CONFIG_API_KEY)!.setAttribute("placeholder", maskedApiKey);
        }

        const baseURL = result[CONFIG_BASE_URL] as string;
        if (!!baseURL) {
          document.getElementById(CONFIG_BASE_URL)!.setAttribute("placeholder", baseURL);
        }

        const selected = result[CONFIG_MODEL];
        if (!!selected) {
          const modelSelect = document.getElementById(CONFIG_MODEL)! as HTMLSelectElement;
          for (var i = 0; i < modelSelect.options.length; i++) {
            if (modelSelect.options[i].value == selected) {
              modelSelect.selectedIndex = i;
              break;
            }
          }
        }
        const disableCompletion = !!result[CONFIG_DISABLE_COMPLETION];
        (document.getElementById(CONFIG_DISABLE_COMPLETION)! as HTMLInputElement).checked = disableCompletion;

        const maxTokenInput = document.getElementById(CONFIG_MAX_TOKEN) as HTMLInputElement;
        maxTokenInput.value = result[CONFIG_MAX_TOKEN] ?? "";
        maxTokenInput.disabled = disableCompletion;

        const maxPromptWordsInput = document.getElementById(CONFIG_MAX_PROMPT_WORDS) as HTMLInputElement
        maxPromptWordsInput.value = result[CONFIG_MAX_PROMPT_WORDS] ?? "";
        maxPromptWordsInput.disabled = disableCompletion;

        const completionCustomPromptInput = document.getElementById(CONFIG_COMPLETION_CUSTOM_PROMPT)! as HTMLInputElement;
        completionCustomPromptInput.value = result[CONFIG_COMPLETION_CUSTOM_PROMPT] ?? "";
        completionCustomPromptInput.disabled = disableCompletion;

        const disableImprovement = !!result[CONFIG_DISABLE_IMPROVEMENT];
        (document.getElementById(CONFIG_DISABLE_IMPROVEMENT)! as HTMLInputElement).checked = disableImprovement;

        const improvementCustomPromptInput = document.getElementById(CONFIG_IMPROVEMENT_CUSTOM_PROMPT) as HTMLInputElement;
        improvementCustomPromptInput.value = result[CONFIG_IMPROVEMENT_CUSTOM_PROMPT] ?? "";
        improvementCustomPromptInput.disabled = disableImprovement;
      });
  }

  document.getElementById("btn-save")!.addEventListener("click", async () => {
    const model = (document.getElementById(CONFIG_MODEL)! as HTMLSelectElement).value;
    const apiKey = (document.getElementById(CONFIG_API_KEY)! as HTMLInputElement).value;
    const baseURL = (document.getElementById(CONFIG_BASE_URL)! as HTMLInputElement).value;
    const maxToken = (document.getElementById(CONFIG_MAX_TOKEN)! as HTMLInputElement).value;
    const maxPromptWords = (document.getElementById(CONFIG_MAX_PROMPT_WORDS)! as HTMLInputElement).value;
    const completionCustomPrompt = (document.getElementById(CONFIG_COMPLETION_CUSTOM_PROMPT)! as HTMLInputElement).value;
    const improvementCustomPrompt = (document.getElementById(CONFIG_IMPROVEMENT_CUSTOM_PROMPT)! as HTMLInputElement).value;
    const disableCompletion = (document.getElementById(CONFIG_DISABLE_COMPLETION)! as HTMLInputElement).checked;
    const disableImprovement = (document.getElementById(CONFIG_DISABLE_IMPROVEMENT)! as HTMLInputElement).checked;

    let config: any = {
      [CONFIG_MODEL]: model,
      [CONFIG_COMPLETION_CUSTOM_PROMPT]: completionCustomPrompt,
      [CONFIG_IMPROVEMENT_CUSTOM_PROMPT]: improvementCustomPrompt,
      [CONFIG_MAX_TOKEN]: maxToken,
      [CONFIG_MAX_PROMPT_WORDS]: maxPromptWords,
      [CONFIG_DISABLE_COMPLETION]: disableCompletion,
      [CONFIG_DISABLE_IMPROVEMENT]: disableImprovement,
    };

    if (!!apiKey) config[CONFIG_API_KEY] = apiKey;
    if (!!baseURL) config[CONFIG_BASE_URL] = baseURL;
    await chrome.storage.local.set(config);
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tabs?.length > 0 && tabs[0].id) {
      try {
        chrome.tabs.sendMessage(tabs[0].id, { type: "config:update" });
      } catch (err) {
        console.error(err);
      }
    }

    window.close();
  });

  document.getElementById("btn-cancel")!.addEventListener("click", () => {
    window.close();
  });

  document.getElementById(CONFIG_DISABLE_COMPLETION)?.addEventListener("change", (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    (document.getElementById(CONFIG_MAX_TOKEN) as HTMLInputElement).disabled = checked;
    (document.getElementById(CONFIG_COMPLETION_CUSTOM_PROMPT) as HTMLInputElement).disabled = checked;
    (document.getElementById(CONFIG_MAX_PROMPT_WORDS) as HTMLInputElement).disabled = checked;
  });

  document.getElementById(CONFIG_DISABLE_IMPROVEMENT)?.addEventListener("change", (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    (document.getElementById(CONFIG_IMPROVEMENT_CUSTOM_PROMPT) as HTMLInputElement).disabled = checked;
  });

  document.addEventListener("DOMContentLoaded", restoreConfig);
})();
