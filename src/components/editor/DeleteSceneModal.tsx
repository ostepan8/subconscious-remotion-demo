"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface DeleteSceneModalProps {
  scene: {
    _id: Id<"scenes">;
    title: string;
    type: string;
    durationInFrames: number;
  };
  onClose: () => void;
}

export default function DeleteSceneModal({ scene, onClose }: DeleteSceneModalProps) {
  const removeScene = useMutation(api.scenes.removeScene);
  const [deleting, setDeleting] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function animateOut(then: () => void) {
    setVisible(false);
    setTimeout(then, 200);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await removeScene({ sceneId: scene._id });
      animateOut(onClose);
    } finally {
      setDeleting(false);
    }
  }

  const duration = (scene.durationInFrames / 30).toFixed(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={() => animateOut(onClose)}
      style={{
        background: visible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(4px)" : "blur(0px)",
        transition: "background 200ms ease, backdrop-filter 200ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] rounded-2xl border overflow-hidden"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          opacity: visible ? 1 : 0,
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.85) translateY(12px)",
          transition: [
            "opacity 200ms cubic-bezier(0.16,1,0.3,1)",
            "transform 200ms cubic-bezier(0.16,1,0.3,1)",
          ].join(", "),
        }}
      >
        {/* Red accent bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #E85D3A 0%, #D32F2F 100%)" }} />

        <div className="p-5">
          {/* Icon + title */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(232,93,58,0.12)" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E85D3A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Delete Scene
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Scene preview card */}
          <div
            className="rounded-lg p-3 mb-4 flex items-center gap-3"
            style={{
              background: "var(--background)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center
                text-[10px] font-bold text-white uppercase shrink-0"
              style={{ background: "rgba(232,93,58,0.7)" }}
            >
              {scene.type.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-xs font-medium truncate"
                style={{ color: "var(--foreground)" }}
              >
                {scene.title}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] capitalize" style={{ color: "var(--muted)" }}>
                  {scene.type.replace("-", " ")}
                </span>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>·</span>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                  {duration}s
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => animateOut(onClose)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium
                border transition-colors hover:bg-(--surface-hover)"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-white
                transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: "#E85D3A" }}
            >
              {deleting ? "Deleting..." : "Delete Scene"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
