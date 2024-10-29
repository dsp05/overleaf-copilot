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
}, options: Options) {
  document.getElementById('copilot-toolbar')?.remove();
  document.getElementById('copilot-toolbar-editor')?.remove();

  const scroller = document.querySelector('div.cm-scroller');
  if (scroller == null) return;
  const cursor = document.querySelector('.cm-cursor-primary') as HTMLElement;
  if (cursor == null) return;

  const toolbar = document.createElement('div');
  toolbar.setAttribute('id', 'copilot-toolbar');
  const position: ToolbarPosition = data.to - data.head < data.head - data.from ? "down" : "up";
  if (position == "down") {
    toolbar.style.left = `${parseInt(cursor.style.left) - 25}px`;
    toolbar.style.top = `${parseInt(cursor.style.top) + 25}px`;
  } else {
    toolbar.style.left = `${parseInt(cursor.style.left) - 35}px`;
    toolbar.style.top = `${parseInt(cursor.style.top) - 30}px`;
  }

  scroller.appendChild(toolbar);
  render(h(Toolbar, {
    actions: options.toolbarActions ?? [],
    searchDisabled: !!options.toolbarSearchDisabled,
    onClickAction: (action) => {
      const toolbar = document.getElementById('copilot-toolbar');
      if (toolbar == null)
        return;

      const scroller = document.querySelector('div.cm-scroller');
      if (scroller == null) return;

      document.getElementById('copilot-toolbar-editor')?.remove();

      const toolbarEditor = document.createElement('div');
      toolbarEditor.setAttribute('id', 'copilot-toolbar-editor');

      if (position == "down")
        toolbarEditor.style.top = `${parseInt(toolbar.style.top) + 35}px`;
      else
        toolbarEditor.style.top = `${parseInt(toolbar.style.top) - 205}px`;

      scroller.appendChild(toolbarEditor);
      render(h(ToolbarEditor, { action, data }), toolbarEditor);
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
