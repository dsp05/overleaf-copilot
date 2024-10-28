import { Suggestion } from "../common/suggestion";

export function createNewSuggestion(text: string, pos: number) {
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