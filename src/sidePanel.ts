"use strict";

import { GetImprovement } from "./utils/improvement";
import { fetchMetadata, search } from "./utils/search";

export async function LoadSidePanel(selection: string, from: number, to: number) {
  const rightContainer = document.querySelector(".ui-layout-east") as HTMLElement;
  if (!rightContainer) return;

  const sidePanel = document.createElement("div");
  const sidePanelUrl = chrome.runtime.getURL("sidePanel.html");
  sidePanel.innerHTML = await (await fetch(sidePanelUrl)).text();
  (sidePanel.querySelector("#copilot-original-content") as HTMLElement).textContent = selection;

  const improveBtn = sidePanel.querySelector("#btn-copilot-improve") as HTMLButtonElement;
  improveBtn.onclick = async () => {
    improveBtn.disabled = true;
    await generate(selection, sidePanel);
    improveBtn.disabled = false;
  };

  const regenerateBtn = sidePanel.querySelector("#btn-copilot-regenerate") as HTMLButtonElement;
  regenerateBtn.onclick = async () => {
    regenerateBtn.disabled = true;
    await generate(selection, sidePanel);
    regenerateBtn.disabled = false;
  };

  const replaceBtn = sidePanel.querySelector("#btn-copilot-replace") as HTMLButtonElement;
  replaceBtn.onclick = () => {
    window.dispatchEvent(new CustomEvent("copilot:editor:replace", {
      detail: {
        improvement: (sidePanel.querySelector("#copilot-gpt-response") as HTMLInputElement).value,
        from: from,
        to: to
      }
    }))
    document.getElementById("copilot-side-panel")?.remove();
  };

  const closeBtn = sidePanel.querySelector("#btn-copilot-close") as HTMLButtonElement;
  closeBtn.onclick = () => document.getElementById("copilot-side-panel")?.remove();
  const loadMoreBtn = sidePanel.querySelector("#btn-copilot-load-more") as HTMLButtonElement;
  loadMoreBtn.onclick = () => chrome.runtime.sendMessage({ type: "load-more", payload: { selection } });
  rightContainer.appendChild(sidePanel);

  await findSimilar(selection, sidePanel);
  return;
}

async function generate(selection: string, sidePanel: HTMLElement) {
  const textarea = sidePanel.querySelector("#copilot-gpt-response") as HTMLInputElement;
  textarea.disabled = true;
  const improvement = await GetImprovement(selection);
  textarea.value = improvement;
  textarea.parentElement!.parentElement!.style.display = "block";
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min((textarea.scrollHeight + 2), 200)}px`;
  textarea.disabled = false;
}

async function findSimilar(selection: string, sidePanel: HTMLElement) {

  const data = await search(selection, 0);
  const ids = data.map(d => d.id);
  const metadata = await fetchMetadata(ids);

  const similarContent = sidePanel.querySelector("#copilot-similar-content") as HTMLElement;
  if (!!similarContent && ids.length == metadata.length) {
    const template = document.getElementById("copilot-similar-content-template") as HTMLTemplateElement;

    for (let i = 0; i < ids.length; i++) {
      const clone = document.importNode(template.content, true);
      const m = metadata[i];

      const link = clone.querySelector("a")!;
      link.href = m.link;
      link.textContent = m.title;

      const divs = clone.querySelectorAll("div div");
      const published = divs[0];
      published.textContent = m.authors.length == 1 ? m.authors[0] : m.authors[0] + " et al. " + m.published;

      const text = divs[1];
      for (const d of data[i].data) {
        const node = document.createElement("p");
        node.textContent = d.text;
        node.title = `Similarity ${(d.score * 100).toFixed(1)} %`;
        text.appendChild(node);
      }
      similarContent.appendChild(clone);
    }
    document.getElementById("copilot-similar-content-loading-spinner")?.remove();
    document.getElementById("copilot-similar-content-container")!.style.display = "block";
  }
}