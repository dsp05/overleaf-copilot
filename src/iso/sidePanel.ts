import { fetchMetadata, search } from "../utils/search";

export async function onFindSimilar(selection: string) {
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
