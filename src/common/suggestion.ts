import { Options } from "../types";
import { getSuggestion } from "../utils/suggestion";

// A class to represent a suggestion in the editor
export class Suggestion {
  private constructor(private dom: HTMLElement) { }

  public static getCurrent() {
    const dom = document.getElementById('copilot-suggestion');
    if (!dom) return null;
    return new Suggestion(dom);
  }

  public static create(pos: number) {
    const scroller = document.querySelector('div.cm-scroller') as HTMLElement;
    const editor = scroller?.querySelector('div.cm-content') as HTMLElement;
    const cursor = document.querySelector('.cm-cursor-primary') as HTMLElement;
    if (scroller == null || editor == null || cursor == null) return null;

    const textNode = document.createTextNode("...");
    const content = document.createElement('div');
    content.setAttribute('id', 'copilot-suggestion-content');
    content.appendChild(textNode);

    const editorRect = editor.getBoundingClientRect();
    content.style.width = `${editorRect.width}px`;
    content.style.top = cursor.style.top;
    content.style.textIndent = `${parseInt(cursor.style.left) - 60}px`;

    const bg = document.createElement('div');
    bg.setAttribute('id', 'copilot-suggestion-background');
    content.appendChild(bg);
    content.onclick = () =>
      document.getElementById('copilot-suggestion')?.remove();

    const dom = document.createElement('div');
    dom.setAttribute('class', 'cm-layer');
    dom.setAttribute('id', 'copilot-suggestion');
    dom.appendChild(content);
    scroller.appendChild(dom);

    const suggestion = new Suggestion(dom);
    suggestion.pos = pos;
    suggestion.status = 'generating';

    return suggestion;
  }

  public get pos() {
    return parseInt(this.dom.getAttribute('data-pos')!);
  }

  public set pos(pos: number) {
    this.dom.setAttribute('data-pos', `${pos}`);
  }

  public get status() {
    return this.dom.getAttribute('data-status') as SuggestonStatus;
  }

  public set status(status: SuggestonStatus) {
    this.dom.setAttribute('data-status', status);
  }

  public get text() {
    return this.dom.firstChild!.firstChild!.textContent!;
  }

  private set text(text: string) {
    this.dom.firstChild!.firstChild!.textContent = text;
  }

  private set textColor(color: string) {
    (this.dom.firstChild! as HTMLDivElement).style.color = color
  }

  public async generate(content: string, signal: AbortSignal, options: Options) {
    let hasError = false;
    let firstToken = true;
    for await (const chunk of getSuggestion(content, signal, options)) {
      if (chunk.kind === "token") {
        if (firstToken) {
          this.text = chunk.content;
          firstToken = false;
        }
        else this.text = this.text + chunk.content;
      } else {
        this.status = 'error';
        this.text = this.text + chunk.content;
        hasError = true;
        this.textColor = 'red';
        break;
      }
    }

    if (!hasError) {
      this.status = 'completed';
      this.textColor = '#666';
    }
  }

  public toPartialAccepted(length: number) {
    this.status = 'partial-accepted';
    this.dom.setAttribute('data-partial-accepted-length', `${length}`);
    this.pos += length;
  }

  public toCompletedFromPartialAccepted() {
    if (this.status !== 'partial-accepted') {
      return false;
    }

    const cursor = document.querySelector('.cm-cursor-primary') as HTMLElement;
    if (!cursor) {
      return false;
    };

    const length = parseInt(this.dom.getAttribute('data-partial-accepted-length')!);
    const suggestionContent = this.dom.firstChild as HTMLElement;
    suggestionContent.style.top = cursor.style.top;
    suggestionContent.style.textIndent = `${parseInt(cursor.style.left) - 60}px`;

    this.dom.removeAttribute('data-partial-accepted-length');
    this.text = this.text.substring(length);
    this.status = 'completed';

    return true;
  }

  public remove() {
    this.dom.remove();
  }
}

export type SuggestonStatus = 'generating' | 'completed' | 'partial-accepted' | 'error';
