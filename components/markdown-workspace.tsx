import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import styles from "./markdown-workspace.module.css";

type View = "write" | "split" | "preview";
type Format = "heading" | "bold" | "list" | "link" | "code";

const views: Array<{ id: View; label: string }> = [
  { id: "write", label: "撰写" },
  { id: "split", label: "分栏" },
  { id: "preview", label: "预览" },
];

const formats: Array<{ id: Format; label: string; symbol: string; shortcut?: string }> = [
  { id: "heading", label: "标题", symbol: "#" },
  { id: "bold", label: "粗体", symbol: "B", shortcut: "Control+B Meta+B" },
  { id: "list", label: "列表", symbol: "•" },
  { id: "link", label: "链接", symbol: "[]", shortcut: "Control+K Meta+K" },
  { id: "code", label: "代码", symbol: "</>" },
];

type Replacement = {
  start: number;
  end: number;
  text: string;
  selectionStart: number;
  selectionEnd: number;
};

function lineFormat(format: "heading" | "list", value: string, start: number, end: number): Replacement {
  const firstLine = value.slice(0, start).lastIndexOf("\n") + 1;
  const lastBreak = value.indexOf("\n", Math.max(start, end - 1));
  const lastLine = lastBreak < 0 ? value.length : lastBreak;
  const prefix = format === "heading" ? "## " : "- ";
  const existing = format === "heading" ? /^#{1,6}[ \t]+/ : /^[-+*][ \t]+/;
  const original = value.slice(firstLine, lastLine);
  const lines = original.split("\n");
  const text = lines
    .map(line => line === "" && lines.length > 1 ? "" : prefix + line.replace(existing, ""))
    .join("\n");
  const offset = prefix.length + Math.max(0, start - firstLine - (original.match(existing)?.[0].length ?? 0));
  return {
    start: firstLine,
    end: lastLine,
    text,
    selectionStart: start === end ? offset : 0,
    selectionEnd: start === end ? offset : text.length,
  };
}

function replacementFor(format: Format, value: string, start: number, end: number): Replacement {
  if (format === "heading" || format === "list") return lineFormat(format, value, start, end);

  let selected = value.slice(start, end);
  if (format === "link") {
    const url = "https://";
    const label = "[" + (selected || "链接文字") + "](";
    return { start, end, text: label + url + ")", selectionStart: label.length, selectionEnd: label.length + url.length };
  }

  const backtick = "`";
  let before = "**";
  let after = "**";
  if (format === "bold" && selected.trim()) {
    before = (selected.match(/^\s*/)?.[0] ?? "") + before;
    after += selected.match(/\s*$/)?.[0] ?? "";
    selected = selected.trim();
  }
  if (format === "code") {
    const ticks = (selected.match(/`+/g) ?? []).reduce((max, run) => Math.max(max, run.length), 0);
    if (selected.includes("\n")) {
      const fence = backtick.repeat(Math.max(3, ticks + 1));
      before = (start && value[start - 1] !== "\n" ? "\n" : "") + fence + "\n";
      after = (selected.endsWith("\n") ? "" : "\n") + fence + (value[end] === "\n" ? "" : "\n");
    } else {
      const marker = backtick.repeat(ticks + 1);
      before = marker + (selected.startsWith(backtick) ? " " : "");
      after = (selected.endsWith(backtick) ? " " : "") + marker;
    }
  }
  return {
    start,
    end,
    text: before + selected + after,
    selectionStart: before.length,
    selectionEnd: before.length + selected.length,
  };
}

type Props = { value: string; previewMarkdown: string; onChange: (value: string) => void };

export default function MarkdownWorkspace({ value, previewMarkdown, onChange }: Props) {
  const [view, setView] = useState<View>("write");
  const [roomForSplit, setRoomForSplit] = useState(false);
  const workspace = useRef<HTMLElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const activeView = view === "split" && !roomForSplit ? "write" : view;
  const showEditor = activeView !== "preview";
  const showPreview = activeView !== "write";
  const deferredMarkdown = useDeferredValue(previewMarkdown);
  const previewHtml = useMemo(() => (
    showPreview ? DOMPurify.sanitize(marked.parse(deferredMarkdown, { gfm: true, async: false })) : ""
  ), [deferredMarkdown, showPreview]);

  useEffect(() => {
    const element = workspace.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setRoomForSplit(entry.contentRect.width >= 640));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function applyFormat(format: Format) {
    const textarea = editor.current;
    if (!textarea || textarea.matches(":disabled")) return;
    const direction = textarea.selectionDirection;
    const edit = replacementFor(format, textarea.value, textarea.selectionStart, textarea.selectionEnd);
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(edit.start, edit.end);
    // Native insertion keeps the browser's undo history. The range fallback also works
    // where the legacy insertText command has been disabled.
    if (!document.execCommand?.("insertText", false, edit.text)) {
      textarea.setRangeText(edit.text, edit.start, edit.end);
      onChange(textarea.value);
    }
    textarea.setSelectionRange(edit.start + edit.selectionStart, edit.start + edit.selectionEnd, direction);
  }

  function handleShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.nativeEvent.isComposing) return;
    const key = event.key.toLowerCase();
    if (key !== "b" && key !== "k") return;
    event.preventDefault();
    applyFormat(key === "b" ? "bold" : "link");
  }

  function jumpToEnd() {
    const textarea = editor.current;
    if (!textarea || textarea.matches(":disabled")) return;
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    const bottom = textarea.getBoundingClientRect().bottom;
    if (bottom > window.innerHeight - 48) {
      window.scrollBy({ top: bottom - window.innerHeight + 48, behavior: "instant" });
    }
  }

  return <section ref={workspace} className={styles.workspace} aria-label="Markdown 编辑器">
    <div className={styles.toolbar}>
      <div className={`editor-tabs ${styles.modes}`} role="group" aria-label="编辑器视图">
        {views.filter(item => roomForSplit || item.id !== "split").map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={activeView === id} onClick={() => setView(id)}>{label}</button>
        ))}
      </div>
      {showEditor && <div className={styles.formatting} role="group" aria-label="Markdown 编辑工具">
        {formats.map(({ id, label, symbol, shortcut }) => (
          <button key={id} type="button" aria-keyshortcuts={shortcut} onMouseDown={event => event.preventDefault()} onClick={() => applyFormat(id)}>
            <span aria-hidden="true">{symbol}</span>{label}
          </button>
        ))}
      </div>}
      <div className={styles.metrics}>
        <span className={styles.count}>{value.length.toLocaleString("zh-CN")} 字符</span>
        {showEditor && <button type="button" className={styles.jump} onClick={jumpToEnd}>跳到文末</button>}
      </div>
    </div>
    <div className={styles.documents} data-view={activeView}>
      <div className={styles.editorPane} hidden={!showEditor} data-text={value}>
        <textarea
          ref={editor}
          rows={1}
          className={styles.editor}
          aria-label="笔记正文"
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={handleShortcut}
          spellCheck={false}
          placeholder="用 Markdown 写下你的问题、方法和证据。"
        />
      </div>
      {showPreview && <div className={`${styles.preview} editor-preview markdown-body`} aria-label="Markdown 预览" role="region">
        {previewHtml
          ? <div dangerouslySetInnerHTML={{ __html: previewHtml }}/>
          : <p className={styles.empty}>正文的排版效果会显示在这里。</p>}
      </div>}
    </div>
  </section>;
}
