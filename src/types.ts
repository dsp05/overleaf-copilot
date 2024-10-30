'use strict';

export interface EditorContent {
  cmView: {
    view: {
      state: {
        doc: {
          lineAt: (pos: number) => {
            number: number;
            from: number;
            text: string;
          };
        };
        selection: {
          main: {
            from: number;
            to: number;
            head: number;
          };
        };
        sliceDoc: (from: number, to: number) => string;
      };
      dispatch: (changes: any) => void;
    };
  };
}

export interface Options {
  apiKey?: string;
  apiBaseUrl?: string;
  model?: string;

  suggestionPromptMaxWords?: number;
  suggestionMaxOutputToken?: number;
  suggestionPrompt?: string;
  suggestionDisabled?: boolean;

  toolbarActions?: { name: string, prompt: string, icon: string }[];
  toolbarSearchDisabled?: boolean;
  toolbarDisabled?: boolean;
}
export interface StreamChunk {
  kind: "token" | "error",
  content: string
}