"use client";

import { useState, useRef, useEffect } from "react";

interface SceneCardProps {
  scene: {
    _id: string;
    order: number;
    type: string;
    title: string;
    durationInFrames: number;
    voiceoverScript?: string;
  };
  isActive: boolean;
  isDragTarget: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSplit: () => void;
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>;
}

export default function SceneCard({
  scene,
  isActive,
  onClick,
  onDelete,
  onDuplicate,
  onSplit,
  dragHandleProps,
}: SceneCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const durationSec = (scene.durationInFrames / 30).toFixed(1);

  return (
    <div
      {...dragHandleProps}
      onClick={onClick}
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        cursor: "pointer",
        background: isActive
          ? "rgba(232,93,58,0.12)"
          : "transparent",
        border: isActive
          ? "1px solid rgba(232,93,58,0.4)"
          : "1px solid transparent",
        transition: "all 0.15s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.background =
            "rgba(255,255,255,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.background =
            "transparent";
        }
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--muted)",
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}
          >
            {scene.order + 1}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: isActive ? "var(--brand-orange)" : "var(--foreground)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {scene.title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>{durationSec}s</span>
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((p) => !p);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                fontSize: 14,
                color: "var(--muted)",
                lineHeight: 1,
              }}
              title="Scene actions"
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  zIndex: 50,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  padding: 4,
                  minWidth: 120,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                {[
                  { label: "Duplicate", action: onDuplicate },
                  { label: "Split", action: onSplit },
                  { label: "Delete", action: onDelete, danger: true },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      item.action();
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "6px 10px",
                      fontSize: 12,
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      background: "transparent",
                      color: (item as { danger?: boolean }).danger
                        ? "#ef4444"
                        : "var(--foreground)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {scene.voiceoverScript && (
        <p
          style={{
            fontSize: 10,
            color: "var(--muted)",
            marginTop: 4,
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {scene.voiceoverScript}
        </p>
      )}
    </div>
  );
}
