import { useEffect, useState } from "preact/hooks";
import { Icon } from "./Icon";
import "./styles/ToolbarEditor.css";
import 'purecss/build/pure-min.css';
import { getImprovement } from "../utils/improvement";

interface ToolbarEditorProps {
  data: { selection: string, from: number, to: number }
  action: { name: string, prompt: string, icon: string },
}


export const ToolbarEditor = ({ data, action }: ToolbarEditorProps) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");

  useEffect(() => {
    getImprovement(data.selection, action.prompt)
      .then((improvement) => {
        setContent(improvement);
        setLoading(false);
      });
  }, []);

  const onRegenerate = () => {
    if (loading) return;
    setContent("");
    setLoading(true);
    getImprovement(data.selection, action.prompt)
      .then((improvement) => {
        setContent(improvement);
        setLoading(false);
      });
  }

  const onReplace = () => {
    if (loading) return;
    window.dispatchEvent(
      new CustomEvent('copilot:editor:replace', {
        detail: {
          content: content,
          from: data.from,
          to: data.to,
        },
      })
    );
  }

  return <div class="toolbar-editor-container">
    <div class="pure-g toolbar-editor-header">
      <span class="pure-u-1-4">Action: {action.name ?? "Rewrite"}</span>
      <span class="pure-u-3-4 toolbar-editor-header-actions">
        <a href="#" className={loading ? "disabled" : ""} onClick={onRegenerate}>
          <span><Icon name="rotate-ccw" size={18} /></span>
          <span>Regenerate</span>
        </a>
        <a href="#" className={loading ? "disabled" : ""} onClick={onReplace}>
          <span><Icon name="replace" size={18} /></span>
          <span>Replace</span>
        </a>
      </span>
    </div >
    <textarea disabled={loading} placeholder={"Generating..."} onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}>{content}</textarea>
  </div >
}

export type ToolbarPosition = "up" | "down";