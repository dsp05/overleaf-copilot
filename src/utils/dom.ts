import { SidePanelManager } from "../manager/SidePanelManager";
import { EditorContent } from "../types";

export function ShowSidePanelToggleButton(data: {
  selection: string;
  from: number;
  to: number;
  head: number;
}) {
  const sidePanelManager = new SidePanelManager();

  document.getElementById('copilot-sidebar-button')?.remove();

  const scroller = document.querySelector('div.cm-scroller');
  if (scroller == null) return;

  const cursor = document.querySelector('.cm-cursor-primary') as HTMLElement;
  if (cursor == null) return;

  const button = document.createElement('div');
  button.setAttribute('id', 'copilot-sidebar-button');

  if (
    data.to - data.head <
    data.head - data.from
  ) {
    button.style.left = `${parseInt(cursor.style.left) - 25}px`;
    button.style.top = `${parseInt(cursor.style.top) + 25}px`;
  } else {
    button.style.left = `${parseInt(cursor.style.left) - 35}px`;
    button.style.top = `${parseInt(cursor.style.top) - 30}px`;
  }

  const improveButton = document.createElement('div');
  improveButton.style.backgroundImage = `url("${chrome.runtime.getURL(
    'icons/icon_128.png'
  )}")`;
  improveButton.style.backgroundSize = 'cover';
  improveButton.onclick = async () => {
    await sidePanelManager.onImprove(data.selection, data.from, data.to);
  };
  button.appendChild(improveButton);

  const searchButton = document.createElement('div');
  searchButton.style.backgroundImage = `url("${chrome.runtime.getURL(
    'icons/icon_search_128.png'
  )}")`;
  searchButton.style.backgroundSize = 'cover';
  searchButton.onclick = async () => {
    await sidePanelManager.onFindSimilar(data.selection);
  };
  button.appendChild(searchButton);

  scroller.appendChild(button);
}

export function GetCurrentEditorContent() {
  return document.querySelector('.cm-content') as any as EditorContent;
}