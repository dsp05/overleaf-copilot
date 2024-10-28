import { onFindSimilar, onToolbarAction } from "./sidePanel";
import { Options } from "../types";
import {
  ALargeSmall, BookCheck, Bookmark, BookmarkCheck, BookOpenCheck,
  BookPlus, Brush, createElement, Eye, IconNode, NotebookPen, NotebookText, Pen,
  Pencil, PencilLine, PencilOff, PencilRuler, PenLine, PenOff, Ruler, Save, Search,
  SquarePen, SearchCheck, Send, CircleX, SpellCheck, SpellCheck2, UserRoundCheck, Languages,
  Globe, BookType, MessageCircleMore, ChevronsUp, MessageSquareQuote, MessageCirclePlus, Sigma,
  X, Infinity, Expand, Shrink, CaseSensitive
} from 'lucide';

export function showToolbar(data: {
  selection: string;
  from: number;
  to: number;
  head: number;
}, options: Options) {
  document.getElementById('copilot-toolbar')?.remove();

  const scroller = document.querySelector('div.cm-scroller');
  if (scroller == null) return;

  const cursor = document.querySelector('.cm-cursor-primary') as HTMLElement;
  if (cursor == null) return;

  const toolbar = document.createElement('div');
  toolbar.setAttribute('id', 'copilot-toolbar');

  if (
    data.to - data.head <
    data.head - data.from
  ) {
    toolbar.style.left = `${parseInt(cursor.style.left) - 25}px`;
    toolbar.style.top = `${parseInt(cursor.style.top) + 25}px`;
  } else {
    toolbar.style.left = `${parseInt(cursor.style.left) - 35}px`;
    toolbar.style.top = `${parseInt(cursor.style.top) - 30}px`;
  }

  for (const action of options.toolbarActions ?? []) {
    const botton = document.createElement('div');
    botton.title = action.name ?? "Rewrite";
    const icon = createElement(iconsMap[action.icon] ?? Pen);
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    botton.appendChild(icon);
    botton.onclick = async () => {
      await onToolbarAction(data.selection, data.from, data.to, action.prompt);
    };
    toolbar.appendChild(botton);
  }

  if (!options.toolbarSearchDisabled) {
    const button = document.createElement('div');
    button.className = 'search';
    button.title = 'Search';
    const icon = createElement(Search);
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    button.appendChild(icon);
    button.onclick = async () => {
      await onFindSimilar(data.selection);
    };
    toolbar.appendChild(button);
  }

  scroller.appendChild(toolbar);
}

const iconsMap: { [key: string]: IconNode } = {
  'pen': Pen,
  'pen-off': PenOff,
  'pen-line': PenLine,
  'square-pen': SquarePen,
  'pencil': Pencil,
  'pencil-off': PencilOff,
  'pencil-line': PencilLine,
  'pencil-ruler': PencilRuler,
  'notebook-pen': NotebookPen,
  'notebook-text': NotebookText,
  'book-plus': BookPlus,
  'book-check': BookCheck,
  'book-open-check': BookOpenCheck,
  'ruler': Ruler,
  'bookmark': Bookmark,
  'bookmark-check': BookmarkCheck,
  'eye': Eye,
  'search': Search,
  'a-large-small': ALargeSmall,
  'brush': Brush,
  'save': Save,
  'search-check': SearchCheck,
  'send': Send,
  'circle-x': CircleX,
  'spell-check': SpellCheck,
  'spell-check-2': SpellCheck2,
  'user-round-check': UserRoundCheck,
  'languages': Languages,
  'globe': Globe,
  'book-type': BookType,
  'message-circle-more': MessageCircleMore,
  'chevrons-up': ChevronsUp,
  'message-square-quote': MessageSquareQuote,
  'message-circle-plus': MessageCirclePlus,
  'sigma': Sigma,
  'x': X,
  'infinity': Infinity,
  'expand': Expand,
  'shrink': Shrink,
  'case-sensitive': CaseSensitive,
}