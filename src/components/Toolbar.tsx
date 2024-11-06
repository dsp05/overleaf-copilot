import { Fragment } from "preact/jsx-runtime";
import { Icon } from "./Icon";
import { EditorSelectionData, Options, ToolbarAction } from "../types";
import { getImprovement } from "../utils/improvement";
import { useState } from "preact/hooks";
import "./styles/Toolbar.css";

export interface ToolbarProps {
  data: EditorSelectionData;
  actions: ToolbarAction[];
  searchDisabled: boolean;
  onShowEditor: (action: { name: string, prompt: string, icon: string }) => void;
  onClickSearch: () => void;
  signal: AbortSignal;
  options: Options;
}

export const Toolbar = ({ data, actions, searchDisabled, onShowEditor, onClickSearch, signal, options }: ToolbarProps) => {
  const [loading, setLoading] = useState(false);

  const onClick = async (action: ToolbarAction) => {
    if (loading) return;

    if (action.onClick === "replace") {
      setLoading(true);
      const content = await getImprovement(data.content, action.prompt, options, signal);
      setLoading(false);

      if (signal.aborted) return;
      window.dispatchEvent(
        new CustomEvent('copilot:editor:replace', {
          detail: {
            content: content,
            from: data.from,
            to: data.to,
          },
        })
      );
      setLoading(false);
    } else {
      onShowEditor(action);
    }
  }

  return <Fragment>
    {actions.map(action => {
      return <div className={`copilot-toolbar-button ${loading ? "disabled" : ""}`} title={action.name ?? "Rewrite"} onClick={() => onClick(action)}>
        <Icon name={action.icon} size={16} />
      </div>
    })}
    {!searchDisabled && <div className="copilot-toolbar-button copilot-toolbar-search" title="Search" onClick={onClickSearch}>
      <Icon name="search" size={16} />
    </div>}
  </Fragment>
}