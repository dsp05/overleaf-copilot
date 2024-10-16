import { EditorContent } from "../types";

export function createSuggestion(scroller: HTMLElement, editor: HTMLElement, cursor: HTMLElement,
    text: string, pos: number, status: 'completed' | 'generating') {

    const initText = document.createTextNode(text);
    const suggestionContent = document.createElement('div');
    suggestionContent.setAttribute('id', 'copilot-suggestion-content');
    suggestionContent.appendChild(initText);

    const editorRect = editor.getBoundingClientRect();
    suggestionContent.style.width = `${editorRect.width}px`;
    suggestionContent.style.top = cursor.style.top;
    suggestionContent.style.textIndent = `${parseInt(cursor.style.left) - 50}px`;

    const suggestionBackground = document.createElement('div');
    suggestionBackground.setAttribute('id', 'copilot-suggestion-background');
    suggestionContent.appendChild(suggestionBackground);
    suggestionContent.onclick = () =>
        document.getElementById('copilot-suggestion')?.remove();

    const suggestion = document.createElement('div');
    suggestion.setAttribute('class', 'cm-layer');
    suggestion.setAttribute('id', 'copilot-suggestion');
    suggestion.setAttribute('data-pos', `${pos}`);
    suggestion.setAttribute('data-status', status);
    suggestion.appendChild(suggestionContent);

    return { suggestionContent, suggestion };
}

export function GetCurrentEditorContent() {
    return document.querySelector('.cm-content') as any as EditorContent;
}