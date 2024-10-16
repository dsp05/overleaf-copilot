
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