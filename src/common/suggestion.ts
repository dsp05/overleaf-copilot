// A class to represent a suggestion in the editor
export class Suggestion {
  public constructor(private dom: HTMLElement) { }

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

  public toCompleted(text: string) {
    this.status = 'completed';
    this.text = text;
  }

  public toError(text: string) {
    this.status = 'error';
    this.text = text;
    document.getElementById('copilot-suggestion-content')!.style.color = 'red';
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

  private set text(text: string) {
    this.dom.firstChild!.firstChild!.textContent = text;
  }
}

export type SuggestonStatus = 'generating' | 'completed' | 'partial-accepted' | 'error';
