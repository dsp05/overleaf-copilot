import { CONFIG_API_KEY } from "../constants";
import { GetImprovement } from "../utils/improvement";
import { fetchMetadata, search } from "../utils/search";

export class SidePanelManager {

  public async onImprove(selection: string, from: number, to: number) {
    const rightContainer = getRightContainer();
    if (!rightContainer) return;
    const sidePanel = await prepareSidePanel('sidePanelImprove.html');

    sidePanel.querySelector('#copilot-original-content')!.textContent = selection;
    const regenerateBtn = sidePanel.querySelector(
      '#btn-copilot-regenerate'
    ) as HTMLButtonElement;
    regenerateBtn.onclick = async () => {
      await generate(selection, sidePanel);
    };

    const replaceBtn = sidePanel.querySelector(
      '#btn-copilot-replace'
    ) as HTMLButtonElement;
    replaceBtn.onclick = () => {
      window.dispatchEvent(
        new CustomEvent('copilot:editor:replace', {
          detail: {
            improvement: (
              sidePanel.querySelector('#copilot-gpt-response') as HTMLInputElement
            ).value,
            from: from,
            to: to,
          },
        })
      );
      document.getElementById('copilot-side-panel')?.remove();
    };

    rightContainer.appendChild(sidePanel);

    await generate(selection, sidePanel);
  }

  public async onFindSimilar(selection: string) {
    const rightContainer = getRightContainer();
    if (!rightContainer) return;
    const sidePanel = await prepareSidePanel('sidePanelFindSimilar.html');

    const loadMoreBtn = sidePanel.querySelector(
      '#btn-copilot-load-more'
    ) as HTMLButtonElement;
    loadMoreBtn.onclick = () =>
      chrome.runtime.sendMessage({ type: 'load-more', payload: { selection } });

    rightContainer.appendChild(sidePanel);

    await findSimilar(selection, sidePanel);
  }
}

function removeCurrentSidePanel() {
  document.getElementById('copilot-side-panel')?.remove();
}

async function prepareSidePanel(url: string) {
  removeCurrentSidePanel();

  const sidePanel = document.createElement('div');
  const sidePanelUrl = chrome.runtime.getURL(url);
  sidePanel.innerHTML = await (await fetch(sidePanelUrl)).text();

  const closeBtn = sidePanel.querySelector(
    '#btn-copilot-close'
  ) as HTMLButtonElement;
  closeBtn.onclick = () =>
    document.getElementById('copilot-side-panel')?.remove();

  return sidePanel;
}

function getRightContainer() {
  return document.querySelector(
    '.ide-react-panel[data-panel-id="panel-pdf"]'
  );
}

async function generate(selection: string, sidePanel: HTMLElement) {
  const textarea = sidePanel.querySelector(
    '#copilot-gpt-response'
  ) as HTMLInputElement;
  const parent = textarea.parentElement!.parentElement!;
  const spinner = document.getElementById('copilot-improve-loading-spinner')!
  parent.style.display = 'none';
  spinner.style.display = 'block';

  let improvement = ''
  try {
    improvement = await GetImprovement(selection);
  } catch (error) {
    const config = await chrome.storage.local.get([CONFIG_API_KEY]);
    if (!config[CONFIG_API_KEY]) {
      improvement = 'Server is at capacity. Please try again later or use your own OpenAI API key.';
    } else {
      improvement = 'An error occurred while generating the content. Please try again later.\nError: ' + error;
    }
  }

  textarea.value = improvement;
  textarea.style.height = `${document.getElementById('copilot-original-content')!.clientHeight}px`;
  parent.style.display = 'block';
  spinner.style.display = 'none';
}

async function findSimilar(selection: string, sidePanel: HTMLElement) {
  const data = await search(selection, 0);
  const ids = data.map((d) => d.id);
  const metadata = await fetchMetadata(ids);

  const similarContent = sidePanel.querySelector(
    '#copilot-similar-content'
  ) as HTMLElement;
  if (!!similarContent && ids.length == metadata.length) {
    const template = document.getElementById(
      'copilot-similar-content-template'
    ) as HTMLTemplateElement;

    for (let i = 0; i < ids.length; i++) {
      const clone = document.importNode(template.content, true);
      const m = metadata[i];

      const link = clone.querySelector('a')!;
      link.href = m.link;
      link.textContent = m.title;

      const divs = clone.querySelectorAll('div div');
      const published = divs[0];
      published.textContent =
        m.authors.length == 1
          ? m.authors[0]
          : m.authors[0] + ' et al. ' + m.published;

      const text = divs[1];
      for (const d of data[i].data) {
        const node = document.createElement('p');
        node.textContent = d.text;
        node.title = `Similarity ${(d.score * 100).toFixed(1)} %`;
        text.appendChild(node);
      }
      similarContent.appendChild(clone);
    }
    document
      .getElementById('copilot-similar-content-loading-spinner')
      ?.remove();
    document.getElementById(
      'copilot-similar-content-container'
    )!.style.display = 'block';
  }
}
