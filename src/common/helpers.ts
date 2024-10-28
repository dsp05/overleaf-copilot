import { Suggestion } from "./suggestion";

export function getCurrentSuggestion() {
    const dom = document.getElementById('copilot-suggestion');
    if (!dom) return null;

    return new Suggestion(dom);
}
