"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import type { Id } from "../../../convex/_generated/dataModel";

interface UploadModalProps {
  projectId: Id<"projects">;
  onClose: () => void;
}

type UploadTab = "file" | "component";

interface QueuedFile {
  file: File;
  name: string;
  status: "pending" | "uploading" | "done" | "error";
}

export default function UploadModal({
  projectId,
  onClose,
}: UploadModalProps) {
  const [tab, setTab] = useState<UploadTab>("file");
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [componentCode, setComponentCode] = useState(STARTER_CODE);
  const [savingComponent, setSavingComponent] = useState(false);

  const componentName = useMemo(
    () => extractComponentName(componentCode),
    [componentCode],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const items: QueuedFile[] = Array.from(files).map((f) => ({
      file: f,
      name: f.name,
      status: "pending" as const,
    }));
    setQueue((prev) => [...prev, ...items]);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  async function uploadAll() {
    if (queue.length === 0) return;
    setUploading(true);

    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status !== "pending") continue;

      setQueue((prev) =>
        prev.map((q, j) =>
          j === i ? { ...q, status: "uploading" } : q,
        ),
      );

      const formData = new FormData();
      formData.append("file", queue[i].file);
      formData.append("projectId", projectId as string);

      try {
        await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });
        setQueue((prev) =>
          prev.map((q, j) =>
            j === i ? { ...q, status: "done" } : q,
          ),
        );
      } catch {
        setQueue((prev) =>
          prev.map((q, j) =>
            j === i ? { ...q, status: "error" } : q,
          ),
        );
      }
    }

    setUploading(false);
  }

  async function handleSaveComponent() {
    if (!componentCode.trim()) return;
    setSavingComponent(true);

    const blob = new Blob([componentCode], {
      type: "text/plain",
    });
    const file = new File([blob], `${componentName}.tsx`, {
      type: "text/plain",
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId as string);

    try {
      await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      onClose();
    } catch (err) {
      console.error("Component save failed:", err);
    } finally {
      setSavingComponent(false);
    }
  }

  const pendingCount = queue.filter(
    (q) => q.status === "pending",
  ).length;
  const doneCount = queue.filter(
    (q) => q.status === "done",
  ).length;
  const allDone =
    queue.length > 0 && doneCount === queue.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border flex flex-col"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Upload Media
            </h2>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "var(--muted)" }}
            >
              Add files or write a React component
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center
              text-sm hover:bg-(--surface-hover) transition-colors"
            style={{ color: "var(--muted)" }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {(
            [
              { id: "file", label: "Upload Files", icon: "↑" },
              {
                id: "component",
                label: "Write Component",
                icon: "⚛",
              },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
              style={{
                color:
                  tab === t.id
                    ? "var(--brand-teal)"
                    : "var(--muted)",
                borderBottom:
                  tab === t.id
                    ? "2px solid var(--brand-teal)"
                    : "2px solid transparent",
              }}
            >
              <span className="text-sm">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "file" ? (
            <FileUploadTab
              dragOver={dragOver}
              queue={queue}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClickBrowse={() => fileInputRef.current?.click()}
              onRemove={(i) =>
                setQueue((prev) =>
                  prev.filter((_, j) => j !== i),
                )
              }
            />
          ) : (
            <ComponentWriteTab
              code={componentCode}
              detectedName={componentName}
              onCodeChange={setComponentCode}
            />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3 border-t shrink-0"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="text-[11px]" style={{ color: "var(--muted)" }}>
            {tab === "file" && queue.length > 0
              ? allDone
                ? `${doneCount} file${doneCount > 1 ? "s" : ""} uploaded`
                : `${pendingCount} pending · ${doneCount} done`
              : ""}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-(--surface-hover)"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              {allDone ? "Done" : "Cancel"}
            </button>
            {tab === "file" ? (
              <button
                onClick={allDone ? onClose : uploadAll}
                disabled={
                  uploading || queue.length === 0 || allDone
                }
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white
                  disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: "var(--brand-teal)" }}
              >
                {uploading
                  ? "Uploading..."
                  : allDone
                    ? "All Done"
                    : `Upload${pendingCount > 1 ? ` (${pendingCount})` : ""}`}
              </button>
            ) : (
              <button
                onClick={handleSaveComponent}
                disabled={
                  savingComponent || !componentCode.trim()
                }
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white
                  disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: "var(--brand-teal)" }}
              >
                {savingComponent
                  ? "Saving..."
                  : "Save Component"}
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.tsx,.jsx,.ts,.js"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/* ---------- File upload tab ---------- */

function FileUploadTab({
  dragOver,
  queue,
  onDragOver,
  onDragLeave,
  onDrop,
  onClickBrowse,
  onRemove,
}: {
  dragOver: boolean;
  queue: QueuedFile[];
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClickBrowse: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClickBrowse}
        className="rounded-xl border-2 border-dashed cursor-pointer transition-all
          flex flex-col items-center justify-center py-10 gap-3"
        style={{
          borderColor: dragOver
            ? "var(--brand-teal)"
            : "var(--border)",
          background: dragOver
            ? "rgba(62,208,195,0.06)"
            : "var(--background)",
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-transform"
          style={{
            background: "rgba(62,208,195,0.1)",
            color: "var(--brand-teal)",
            transform: dragOver ? "scale(1.1)" : "scale(1)",
          }}
        >
          ↑
        </div>
        <div className="text-center">
          <p
            className="text-xs font-medium"
            style={{ color: "var(--foreground)" }}
          >
            {dragOver
              ? "Drop files here"
              : "Drag & drop files here"}
          </p>
          <p
            className="text-[11px] mt-1"
            style={{ color: "var(--muted)" }}
          >
            or{" "}
            <span
              style={{ color: "var(--brand-teal)" }}
              className="underline"
            >
              browse
            </span>{" "}
            to choose files
          </p>
        </div>
        <div
          className="flex flex-wrap items-center justify-center gap-1.5 mt-1"
        >
          {["Images", "Video", "Audio", ".tsx", ".jsx"].map(
            (label) => (
              <span
                key={label}
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: "var(--surface)",
                  color: "var(--muted)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {label}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Queued files list */}
      {queue.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h4
            className="text-[11px] font-medium"
            style={{ color: "var(--muted)" }}
          >
            Files ({queue.length})
          </h4>
          {queue.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <FileIcon name={item.name} />
              <span
                className="text-xs truncate flex-1"
                style={{ color: "var(--foreground)" }}
              >
                {item.name}
              </span>
              <StatusBadge status={item.status} />
              {item.status === "pending" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                  className="text-xs hover:text-red-500 transition-colors"
                  style={{ color: "var(--muted)" }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Component write tab ---------- */

const MONO_FONT =
  'ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Code", monospace';

function ComponentWriteTab({
  code,
  detectedName,
  onCodeChange,
}: {
  code: string;
  detectedName: string;
  onCodeChange: (code: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const highlighted = useMemo(
    () => highlightTsx(code),
    [code],
  );

  const handleScroll = useCallback(() => {
    if (!textareaRef.current || !preRef.current) return;
    preRef.current.scrollTop = textareaRef.current.scrollTop;
    preRef.current.scrollLeft =
      textareaRef.current.scrollLeft;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const next =
          val.substring(0, start) +
          "  " +
          val.substring(end);
        onCodeChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [onCodeChange],
  );

  const lines = code.split("\n");

  return (
    <div className="flex flex-col gap-3">
      {/* Code editor */}
      <div>
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #313244" }}
        >
          {/* Editor chrome bar */}
          <div
            className="flex items-center gap-1.5 px-3 py-2"
            style={{
              background: "#181825",
              borderBottom: "1px solid #313244",
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#f38ba8" }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#f9e2af" }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#a6e3a1" }}
            />
            <span
              className="text-[11px] ml-2 font-mono"
              style={{ color: "#6c7086" }}
            >
              {detectedName}.tsx
            </span>
          </div>

          {/* Editor area with line numbers */}
          <div
            className="flex"
            style={{ background: "#1e1e2e" }}
          >
            {/* Line numbers */}
            <div
              className="shrink-0 py-4 pr-2 text-right select-none"
              style={{
                fontFamily: MONO_FONT,
                fontSize: 13,
                lineHeight: "21px",
                color: "#45475a",
                width: 48,
                paddingLeft: 12,
                background: "#1b1b2b",
                borderRight: "1px solid #313244",
              }}
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Overlay editor */}
            <div
              className="flex-1 relative"
              style={{ minHeight: 380 }}
            >
              {/* Highlighted pre layer */}
              <pre
                ref={preRef}
                aria-hidden
                className="absolute inset-0 overflow-hidden pointer-events-none m-0"
                style={{
                  fontFamily: MONO_FONT,
                  fontSize: 13,
                  lineHeight: "21px",
                  padding: "16px 16px 16px 12px",
                  color: "#cdd6f4",
                  whiteSpace: "pre",
                  wordWrap: "normal",
                  background: "transparent",
                }}
                dangerouslySetInnerHTML={{
                  __html: highlighted + "\n",
                }}
              />
              {/* Textarea input layer */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                className="relative w-full h-full outline-none resize-none m-0"
                style={{
                  fontFamily: MONO_FONT,
                  fontSize: 13,
                  lineHeight: "21px",
                  padding: "16px 16px 16px 12px",
                  background: "transparent",
                  color: "transparent",
                  caretColor: "#f5e0dc",
                  minHeight: 380,
                  whiteSpace: "pre",
                  overflowWrap: "normal",
                  wordWrap: "normal",
                }}
              />
            </div>
          </div>
        </div>
        <p
          className="text-[10px] mt-1.5"
          style={{ color: "var(--muted)" }}
        >
          Write or paste a React component. Saved as a .tsx
          file. Tab key inserts spaces.
        </p>
      </div>
    </div>
  );
}

/* ---------- TSX syntax highlighter ---------- */

const C = {
  keyword: "#c678dd",
  string: "#98c379",
  number: "#fab387",
  comment: "#6c7086",
  jsxTag: "#89b4fa",
  jsxAttr: "#f9e2af",
  component: "#f9e2af",
  type: "#89dceb",
  operator: "#89dceb",
  bracket: "#f9e2af",
  punctuation: "#6c7086",
  text: "#cdd6f4",
  fn: "#89b4fa",
} as const;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightTsx(code: string): string {
  const TOKEN_RE = new RegExp(
    [
      "(\\/\\/[^\\n]*)",                          // single-line comment
      "(\\/\\*[\\s\\S]*?\\*\\/)",                  // multi-line comment
      "(`(?:[^`\\\\]|\\\\.)*`)",                   // template literal
      `("(?:[^"\\\\]|\\\\.)*")`,                   // double-quoted string
      `('(?:[^'\\\\]|\\\\.)*')`,                   // single-quoted string
      "(<\\/?[A-Z][A-Za-z0-9.]*)",                 // JSX component tag
      "(<\\/?[a-z][a-z0-9-]*)",                    // JSX html tag
      "(\\b(?:import|export|default|from|"
        + "const|let|var|function|return|"
        + "class|extends|interface|type|"
        + "async|await|if|else|new|"
        + "true|false|null|undefined|"
        + "typeof|instanceof|void|"
        + "switch|case|break|continue|"
        + "for|while|do|try|catch|"
        + "finally|throw|yield)\\b)",              // keywords
      "(\\b\\d+(?:\\.\\d+)?\\b)",                  // numbers
      "(=>|&&|\\|\\||[!=]==?|[<>]=?|\\?\\.)",      // operators
      "([{}()\\[\\]])",                            // brackets
      "(\\b[A-Z][A-Za-z0-9]*\\b)",                 // PascalCase (types/comps)
      "([;:,.])",                                  // punctuation
      "(\\b[a-z_$][A-Za-z0-9_$]*(?=\\s*\\())",    // function calls
      "([a-zA-Z_$][a-zA-Z0-9_$]*(?=\\s*[=:]))",   // JSX attr names
    ].join("|"),
    "gm",
  );

  let result = "";
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TOKEN_RE.exec(code))) {
    if (match.index > lastIndex) {
      result += esc(code.slice(lastIndex, match.index));
    }

    const [
      full,
      lineComment,
      blockComment,
      templateStr,
      doubleStr,
      singleStr,
      jsxCompTag,
      jsxHtmlTag,
      keyword,
      num,
      op,
      bracket,
      pascalCase,
      punct,
      fnCall,
      attrName,
    ] = match;

    let color: string = C.text;
    if (lineComment || blockComment) color = C.comment;
    else if (templateStr || doubleStr || singleStr)
      color = C.string;
    else if (jsxCompTag) color = C.component;
    else if (jsxHtmlTag) color = C.jsxTag;
    else if (keyword) color = C.keyword;
    else if (num) color = C.number;
    else if (op) color = C.operator;
    else if (bracket) color = C.bracket;
    else if (pascalCase) color = C.type;
    else if (punct) color = C.punctuation;
    else if (fnCall) color = C.fn;
    else if (attrName) color = C.jsxAttr;

    result +=
      `<span style="color:${color}">${esc(full)}</span>`;
    lastIndex = match.index + full.length;
  }

  if (lastIndex < code.length) {
    result += esc(code.slice(lastIndex));
  }

  return result;
}

/* ---------- Helpers ---------- */

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isComponent = ["tsx", "jsx", "ts", "js"].includes(ext);
  const isVideo = [
    "mp4",
    "mov",
    "webm",
    "avi",
    "mkv",
  ].includes(ext);
  const isAudio = [
    "mp3",
    "wav",
    "ogg",
    "m4a",
    "aac",
  ].includes(ext);

  let bg = "rgba(62,208,195,0.12)";
  let fg = "var(--brand-teal)";
  let icon = "◻";

  if (isComponent) {
    bg = "rgba(97,218,251,0.12)";
    fg = "#61dafb";
    icon = "⚛";
  } else if (isVideo) {
    bg = "rgba(255,92,40,0.12)";
    fg = "var(--brand-orange)";
    icon = "▶";
  } else if (isAudio) {
    bg = "rgba(168,130,255,0.12)";
    fg = "#a882ff";
    icon = "♪";
  }

  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
      style={{ background: bg, color: fg }}
    >
      {icon}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: QueuedFile["status"];
}) {
  const map = {
    pending: {
      bg: "var(--surface)",
      color: "var(--muted)",
      label: "Pending",
    },
    uploading: {
      bg: "rgba(62,208,195,0.1)",
      color: "var(--brand-teal)",
      label: "Uploading",
    },
    done: {
      bg: "rgba(166,227,161,0.12)",
      color: "#a6e3a1",
      label: "Done",
    },
    error: {
      bg: "rgba(243,138,168,0.12)",
      color: "#f38ba8",
      label: "Error",
    },
  };
  const s = map[status];
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function extractComponentName(source: string): string {
  const patterns = [
    /export\s+default\s+function\s+(\w+)/,
    /export\s+default\s+class\s+(\w+)/,
    /export\s+(?:const|let)\s+(\w+)\s*[=:]/,
    /function\s+(\w+)\s*\(/,
    /const\s+(\w+)\s*[:=]\s*(?:\([^)]*\)|)\s*(?:=>|React)/,
  ];
  for (const re of patterns) {
    const m = source.match(re);
    if (m) return m[1];
  }
  return "Component";
}

const STARTER_CODE = `export default function MyComponent() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
    }}>
      <h1>Hello World</h1>
    </div>
  );
}`;
