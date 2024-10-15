'use strict';

import { EditorContent } from "./types";
import { AskQuestion } from "./utils/chat";

export async function LoadChatPanel(
  selection?: string,
  from?: number,
  to?: number
) {
  const rightContainer = document.querySelector(
    '.ide-react-panel[data-panel-id="panel-pdf"]'
  ) as HTMLElement;
  if (!rightContainer) return;

  const sidePanel = document.createElement('div');
  const sidePanelUrl = chrome.runtime.getURL('chatPanel.html');
  sidePanel.innerHTML = await (await fetch(sidePanelUrl)).text();

  const questionTxt = sidePanel.querySelector(
    '#copilot-gpt-question'
  ) as HTMLInputElement;

  const askBtn = sidePanel.querySelector(
    '#btn-copilot-ask'
  ) as HTMLButtonElement;
  askBtn.onclick = async () => {
    askBtn.disabled = true;
    await generate(questionTxt.value, selection, sidePanel);
    askBtn.disabled = false;
  };

  const regenerateBtn = sidePanel.querySelector(
    '#btn-copilot-regenerate'
  ) as HTMLButtonElement;
  regenerateBtn.onclick = async () => {
    regenerateBtn.disabled = true;
    await generate(questionTxt.value, selection, sidePanel);
    regenerateBtn.disabled = false;
  };

  const replaceBtn = sidePanel.querySelector(
    '#btn-copilot-replace'
  ) as HTMLButtonElement;
  if (!selection) {
    // Replace is "insert"
    replaceBtn.textContent = 'Insert';
  }
  
  replaceBtn.onclick = () => {
    const responseTxt = (
      sidePanel.querySelector('#copilot-gpt-response') as HTMLInputElement
    ).value;

    if (selection) {
      window.dispatchEvent(
        new CustomEvent('copilot:editor:replace', {
          detail: {
            improvement: responseTxt,
            from: from,
            to: to,
          },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('copilot:editor:append', {
          detail: {
            content: responseTxt,
          },
        })
      );
    }
    document.getElementById('copilot-side-panel')?.remove();
  };

  const closeBtn = sidePanel.querySelector(
    '#btn-copilot-close'
  ) as HTMLButtonElement;
  closeBtn.onclick = () =>
    document.getElementById('copilot-side-panel')?.remove();
  rightContainer.appendChild(sidePanel);
  
  // Focus on the question input
  questionTxt.focus();

  return;
}

async function generate(question: string, selection: string | undefined, sidePanel: HTMLElement) {
  const textarea = sidePanel.querySelector(
    '#copilot-gpt-response'
  ) as HTMLInputElement;
  textarea.disabled = true;
  const improvement = await AskQuestion(question, selection);
  textarea.value = improvement;
  textarea.parentElement!.parentElement!.style.display = 'block';
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight + 2, 200)}px`;
  textarea.disabled = false;
}
