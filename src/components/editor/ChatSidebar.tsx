"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useChat } from "@/hooks/useChat";
import type { Id } from "../../../convex/_generated/dataModel";

interface ChatSidebarProps {
  projectId: string;
  internalProjectId: Id<"projects">;
}

export default function ChatSidebar({
  projectId,
  internalProjectId,
}: ChatSidebarProps) {
  const messages = useQuery(api.chat.getMessages, {
    projectId: internalProjectId,
  });
  const { sendMessage, isStreaming, currentThought } = useChat({
    projectId,
  });

  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentThought]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || isStreaming || uploading) return;
    setInput("");
    await sendMessage(msg);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleFileUpload(files: FileList) {
    setUploading(true);
    const uploadedNames: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", internalProjectId as string);
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          uploadedNames.push(file.name);
        }
      }
      if (uploadedNames.length > 0) {
        const msg = `I just uploaded ${uploadedNames.length} file${uploadedNames.length > 1 ? "s" : ""}: ${uploadedNames.join(", ")}. Please use ${uploadedNames.length > 1 ? "them" : "it"} in my video.`;
        await sendMessage(msg);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="px-3 py-2 border-b flex items-center gap-2"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white"
          style={{ background: "var(--brand-orange)" }}
        >
          AI
        </div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Video Assistant
        </h3>
        {isStreaming && (
          <div
            className="ml-auto text-xs px-2 py-0.5 rounded-full animate-pulse-soft"
            style={{
              background: "rgba(255,92,40,0.1)",
              color: "var(--brand-orange)",
            }}
          >
            Working...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages?.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed"
              style={{
                background:
                  msg.role === "user" ? "var(--brand-orange)" : "var(--surface)",
                color: msg.role === "user" ? "#fff" : "var(--foreground)",
                border:
                  msg.role === "user" ? "none" : "1px solid var(--border-subtle)",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isStreaming && currentThought && (
          <div className="flex justify-start">
            <div
              className="max-w-[85%] rounded-xl px-3 py-2 text-sm italic"
              style={{
                background: "rgba(62,208,195,0.08)",
                color: "var(--brand-teal)",
                border: "1px solid rgba(62,208,195,0.15)",
              }}
            >
              {currentThought}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div
        className="p-3 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {uploading && (
          <div
            className="text-xs px-3 py-1.5 rounded-lg mb-2 flex items-center gap-2"
            style={{ background: "rgba(62,208,195,0.08)", color: "var(--brand-teal)" }}
          >
            <div className="w-3 h-3 border-2 border-[var(--brand-teal)] border-t-transparent rounded-full animate-spin" />
            Uploading...
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming
                  ? "Waiting for response..."
                  : "Describe your product or ask for changes..."
              }
              disabled={isStreaming}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none focus:border-[var(--brand-orange)] disabled:opacity-50"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming || uploading}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-40"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                title="Upload images, videos, or audio"
              >
                📎 Media
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files && handleFileUpload(e.target.files)
                }
              />
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                Images, video clips, audio
              </span>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={isStreaming || uploading || !input.trim()}
            className="px-3 py-2 rounded-lg text-white text-sm font-medium self-end transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--brand-orange)" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
