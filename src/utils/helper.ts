import { LOCAL_STORAGE_KEY_API_KEY, LOCAL_STORAGE_KEY_BASE_URL, LOCAL_STORAGE_KEY_MODEL, LOCAL_STORAGE_KEY_OPTIONS } from "../constants";
import { Options } from "../types";

const Prefixes = ["```latex\n", "```latex", "```"];
const Suffixes = ["\n```", "```"];

export function PostProcessResponse(response: string | null) {
    if (!response) return '';

    let result = response.trim();

    for (const prefix of Prefixes) {
        if (result.startsWith(prefix)) {
            result = result.substring(prefix.length);
        }
    }

    for (const suffix of Suffixes) {
        if (result.endsWith(suffix)) {
            result = result.substring(0, result.length - suffix.length);
        }
    }

    return result;
}

export async function GetOptions() {
    const data = await chrome.storage.local.get([LOCAL_STORAGE_KEY_OPTIONS, LOCAL_STORAGE_KEY_API_KEY, LOCAL_STORAGE_KEY_BASE_URL, LOCAL_STORAGE_KEY_MODEL]);
    const options = (data[LOCAL_STORAGE_KEY_OPTIONS] ?? {}) as Options;
    const toolbarActions = options.toolbarActions ?? [];

    // This is for backward compatibility. If the options are not found in the new format, try to get them from the old format.
    // It will be removed in the future.
    if (!options.apiKey && !!data[LOCAL_STORAGE_KEY_API_KEY]) options.apiKey = data[LOCAL_STORAGE_KEY_API_KEY];
    if (!options.apiBaseUrl && !!data[LOCAL_STORAGE_KEY_BASE_URL]) options.apiBaseUrl = data[LOCAL_STORAGE_KEY_BASE_URL];
    if (!options.model && !!data[LOCAL_STORAGE_KEY_MODEL]) options.model = data[LOCAL_STORAGE_KEY_MODEL];

    // By default, always add a rewrite action in the toolbar.
    if (toolbarActions.length === 0) toolbarActions.push({ name: '', prompt: '', icon: '' });
    options.toolbarActions = toolbarActions;

    return options;
}
