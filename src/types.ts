'use strict';

export interface EditorContent {
  cmView: {
    view: EditorContentView;
  }
}

export interface EditorContentView {
  state: EditorContentState,
  dispatch: (changes: any) => void;
};

export interface EditorContentState {
  doc: {
    lineAt: (pos: number) => {
      number: number;
      from: number;
      text: string;
    };
    length: number;
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

export interface ToolbarAction {
  name: string,
  prompt: string,
  icon: string,
  onClick: "replace" | "show_editor",
}

export interface Options {
  apiKey?: string;
  apiBaseUrl?: string;
  model?: string;

  suggestionMaxOutputToken?: number;
  suggestionPrompt?: string;
  suggestionDisabled?: boolean;

  toolbarActions?: ToolbarAction[];
  toolbarSearchDisabled?: boolean;
  toolbarDisabled?: boolean;
}
export interface StreamChunk {
  kind: "token" | "error",
  content: string
}

export interface EditorSelectionData {
  content: TextContent;
  from: number;
  to: number;
  head: number;
}

export interface TextContent {
  before: string,
  after: string,
  selection: string,
}