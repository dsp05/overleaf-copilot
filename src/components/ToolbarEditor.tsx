import { useEffect, useState } from "preact/hooks";
import { Icon } from "./Icon";
import "./styles/ToolbarEditor.css";
import 'purecss/build/pure-min.css';
import { getImprovement } from "../utils/improvement";
import * as Diff from 'diff';

interface ToolbarEditorProps {
  data: { selection: string, from: number, to: number }
  action: { name: string, prompt: string, icon: string },
}


export const ToolbarEditor = ({ data, action }: ToolbarEditorProps) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [diffs, setDiffs] = useState<Diff.Change[]>([]);

  useEffect(() => {
    const run = async () => {
      onRegenerate();
    }
    run();
  }, []);

  const onRegenerate = async () => {
    if (loading) return;
    setShowDiff(false);
    setContent("");
    setLoading(true);
    const stream = getImprovement(data.selection, action.prompt);
    for await (const token of stream) {
      setContent((prev) => prev + token);
    }
    setLoading(false);
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

  const onToggleDiff = () => {
    if (!showDiff) {
      const charDiff = Diff.diffChars(data.selection, content);
      if (charDiff.length <= 100) {
        setDiffs(charDiff);
      } else {
        const wordDiffs = Diff.diffWordsWithSpace(data.selection, content);
        setDiffs(wordDiffs);
      }
    }
    setShowDiff(!showDiff)
  }

  return <div class="toolbar-editor-container">
    <div class="pure-g toolbar-editor-header">
      <span class="pure-u-1-4">Action: {action.name ?? "Rewrite"}</span>
      <span class="pure-u-3-4 toolbar-editor-header-actions">
        <a href="#" className={loading ? "disabled toolbar-editor-action" : "toolbar-editor-action"} onClick={onToggleDiff}>
          <span><Icon name={showDiff ? "circle-check" : "circle"} size={18} /></span>
          <span>Show diff</span>
        </a>
        <a href="#" className={loading ? "disabled toolbar-editor-action" : "toolbar-editor-action"} onClick={onRegenerate}>
          <span><Icon name="rotate-ccw" size={18} /></span>
          <span>Regenerate</span>
        </a>
        <a href="#" className={loading ? "disabled toolbar-editor-action" : "toolbar-editor-action"} onClick={onReplace}>
          <span><Icon name="replace" size={18} /></span>
          <span>Replace</span>
        </a>
      </span>
    </div >
    {showDiff ?
      <div className="toolbar-editor-diff-view">
        {diffs.map(d => {
          if (d.added) {
            return <span className="toolbar-editor-diff-added">{d.value}</span>
          } else if (d.removed) {
            return <s className="toolbar-editor-diff-removed">{d.value}</s>
          } else {
            return <span>{d.value}</span>
          }
        })}
      </div> :
      <textarea disabled={loading} placeholder={"Generating..."} onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}>{content}</textarea>}
  </div >
}

export type ToolbarPosition = "up" | "down";