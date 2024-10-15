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

export function updateSuggestionOnCursorUpdate() {
    const suggestion = GetSuggestion();
    var editor = document.querySelector('.cm-content');
    let shouldGenerateSuggestion = true;

    if (!!suggestion && !!editor) {
        const content = editor as any as EditorContent;
        const currentPos = content.cmView.view.state.selection.main.head;
        const posAttr = suggestion.getAttribute('data-pos');

        if (!posAttr || parseInt(posAttr) != currentPos) {
            suggestion.remove();
        } else if (suggestion.getAttribute('data-status') == 'partial-accepted') {
            const cursor = document.querySelector('.cm-cursor-primary') as HTMLElement;
            if (!!cursor) {
                updatePartialAcceptedSuggestion(suggestion, cursor);
                shouldGenerateSuggestion = false;
            } else {
                suggestion.remove();
            }
        }
    }

    return shouldGenerateSuggestion;
}

// REVIEW dsp05: Create a wrapper class for the suggestion element.
export function GetSuggestion() {
    return document.getElementById('copilot-suggestion');
}

function updatePartialAcceptedSuggestion(suggestion: HTMLElement, cursor: HTMLElement) {
    const suggestionContent = suggestion.firstChild as HTMLElement;
    const partialAcceptedLength = parseInt(suggestion.getAttribute('data-partial-accepted-length')!);

    suggestionContent.style.top = cursor.style.top;
    suggestionContent.style.textIndent = `${parseInt(cursor.style.left) - 50}px`;

    suggestion.firstChild!.textContent = suggestion.firstChild!.textContent!.substring(partialAcceptedLength);
    suggestion.setAttribute('data-status', 'completed');
    suggestion.removeAttribute('data-partial-accepted-length');
}