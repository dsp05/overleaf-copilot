import { Options } from "../types";
import { h, render } from "preact";
import { ToolbarEditor, ToolbarPosition } from "../components/ToolbarEditor";
import { Toolbar } from "../components/Toolbar";
import { FindSimilar } from "../components/FindSimilar";

export function showToolbar(data: {
  selection: string;
  from: number;
  to: number;
  head: number;
}, options: Options, signal: AbortSignal) {
  document.getElementById('copilot-toolbar')?.remove();
  document.getElementById('copilot-toolbar-editor')?.remove();

  const cursor = document.querySelector('.cm-cursor-primary') as HTMLElement;
  if (cursor == null) return;
  const rect = cursor.getBoundingClientRect();

  const toolbar = document.createElement('div');
  toolbar.setAttribute('id', 'copilot-toolbar');

  let position: ToolbarPosition;
  if (rect.top <= 250) position = "down";
  else if (rect.bottom >= window.innerHeight - 250) position = "up";
  else position = data.to - data.head < data.head - data.from ? "down" : "up";

  let left = Math.max(0, rect.left - 35);
  toolbar.style.left = `${left}px`;

  if (position == "down") {
    toolbar.style.top = `${rect.top + 25}px`;
  } else {
    toolbar.style.top = `${rect.top - 35}px`;
  }

  document.body.appendChild(toolbar);

  render(h(Toolbar, {
    actions: options.toolbarActions ?? [],
    searchDisabled: !!options.toolbarSearchDisabled,
    onClickAction: (action) => {
      const toolbar = document.getElementById('copilot-toolbar');
      if (toolbar == null)
        return;
      document.getElementById('copilot-toolbar-editor')?.remove();

      const toolbarEditor = document.createElement('div');
      toolbarEditor.setAttribute('id', 'copilot-toolbar-editor');

      if (position == "down")
        toolbarEditor.style.top = `${parseInt(toolbar.style.top) + 35}px`;
      else
        toolbarEditor.style.top = `${parseInt(toolbar.style.top) - 205}px`;

      const scroller = document.querySelector('div.cm-scroller');
      let width = scroller?.getBoundingClientRect().width ?? 400;
      width = Math.min(Math.max(width, 400), 800);
      toolbarEditor.style.width = `${width}px`;

      const rect = toolbar.getBoundingClientRect();
      let left = Math.max(parseInt(toolbar.style.left) - (width - rect.width) / 2, 0);
      toolbarEditor.style.left = `${left}px`;

      document.body.appendChild(toolbarEditor);
      render(h(ToolbarEditor, { action, data, options, signal }), toolbarEditor);
    },
    onClickSearch: async () => {
      await onFindSimilar(data.selection);
    }
  }), toolbar);
}

async function onFindSimilar(selection: string) {
  const rightContainer = document.querySelector('.ide-react-panel[data-panel-id="panel-pdf"]');
  if (!rightContainer) return;

  document.getElementById('copilot-side-panel')?.remove();
  const sidePanel = document.createElement('div');
  sidePanel.setAttribute('id', 'copilot-side-panel');
  rightContainer.appendChild(sidePanel);

  render(h(FindSimilar, {
    selection,
    onClose: () => document.getElementById('copilot-side-panel')?.remove(),
    onLoadMore: () => chrome.runtime.sendMessage({ type: 'load-more', payload: { selection } })
  }), sidePanel);
}
