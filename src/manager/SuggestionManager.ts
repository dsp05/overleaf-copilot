import { GetCurrentEditorContent } from "../utils/dom";

export class SuggestionManager {

    public get currentSuggestion() {
        const dom = document.getElementById('copilot-suggestion');
        if (!dom) return null;

        return new Suggestion(dom);
    }

    public createNewSuggestion(text: string, pos: number) {
        this.currentSuggestion?.remove();

        const scroller = document.querySelector('div.cm-scroller') as HTMLElement;
        const editor = scroller?.querySelector('div.cm-content') as HTMLElement;
        const cursor = document.querySelector('.cm-cursor-primary') as HTMLElement;
        if (scroller == null || editor == null || cursor == null) return null;

        const textNode = document.createTextNode(text);
        const contentDom = document.createElement('div');
        contentDom.setAttribute('id', 'copilot-suggestion-content');
        contentDom.appendChild(textNode);

        const editorRect = editor.getBoundingClientRect();
        contentDom.style.width = `${editorRect.width}px`;
        contentDom.style.top = cursor.style.top;
        contentDom.style.textIndent = `${parseInt(cursor.style.left) - 60}px`;

        const suggestionBackground = document.createElement('div');
        suggestionBackground.setAttribute('id', 'copilot-suggestion-background');
        contentDom.appendChild(suggestionBackground);
        contentDom.onclick = () =>
            document.getElementById('copilot-suggestion')?.remove();

        const dom = document.createElement('div');
        dom.setAttribute('class', 'cm-layer');
        dom.setAttribute('id', 'copilot-suggestion');
        dom.appendChild(contentDom);
        scroller.appendChild(dom);

        const suggestion = new Suggestion(dom);
        suggestion.pos = pos;
        suggestion.status = 'generating';

        return suggestion;
    }

    public onCursorUpdate() {
        const suggestion = this.currentSuggestion;
        if (!suggestion) return;

        const content = GetCurrentEditorContent();
        const currentPos = content.cmView.view.state.selection.main.head;

        if (currentPos === suggestion.pos && suggestion.status === 'partial-accepted' && suggestion.toCompletedFromPartialAccepted())
            return;

        suggestion.remove();
    }

    public onAcceptSuggestion() {
        const suggestion = this.currentSuggestion;
        if (suggestion?.status !== 'completed') {
            suggestion?.remove();
            return;
        }

        const content = GetCurrentEditorContent();
        const currentPos = content.cmView.view.state.selection.main.head;
        const changes = { from: suggestion.pos, to: currentPos, insert: suggestion.text };
        content.cmView.view.dispatch({ changes });

        suggestion.remove();
    }

    public onAcceptPartialSuggestion() {
        const suggestion = this.currentSuggestion;
        if (suggestion?.status !== 'completed') return;

        const pos = suggestion.pos;
        const text = suggestion.text;

        let acceptedLength = text.length;
        let hasContent = false;

        const isSpace = (c: string) => c == ' ' || c == '\n';

        for (let i = 0; i < text.length; i++) {
            const b = isSpace(text[i]);
            hasContent ||= !b;
            if (hasContent && b) { acceptedLength = i; break; }
        }
        const accepted = text.substring(0, acceptedLength);
        const changes = { from: pos, to: pos, insert: accepted };
        const content = GetCurrentEditorContent();
        suggestion.toPartialAccepted(acceptedLength);
        content.cmView.view.dispatch({ changes: changes, selection: { anchor: pos + acceptedLength } });
    }
}

// A class to represent a suggestion in the editor
class Suggestion {
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
