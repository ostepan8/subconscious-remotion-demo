"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface SplitModalProps {
  scene: {
    _id: Id<"scenes">;
    title: string;
    durationInFrames: number;
  };
  onClose: () => void;
}

export default function SplitModal({ scene, onClose }: SplitModalProps) {
  const splitScene = useMutation(api.scenes.splitScene);
  const totalSec = scene.durationInFrames / 30;
  const [splitSec, setSplitSec] = useState(totalSec / 2);
  const [saving, setSaving] = useState(false);

  const splitFrame = Math.round(splitSec * 30);
  const valid = splitFrame > 0 && splitFrame < scene.durationInFrames;

  async function handleSplit() {
    if (!valid) return;
    setSaving(true);
    try {
      await splitScene({ sceneId: scene._id, splitAtFrame: splitFrame });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-sm rounded-2xl border p-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h2
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--foreground)" }}
        >
          Split "{scene.title}"
        </h2>

        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          Total duration: {totalSec.toFixed(1)}s ({scene.durationInFrames} frames).
          Choose where to split.
        </p>

        {/* Visual bar */}
        <div className="mb-3">
          <div
            className="h-8 rounded-lg overflow-hidden flex relative"
            style={{ background: "var(--background)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="h-full"
              style={{
                width: `${(splitFrame / scene.durationInFrames) * 100}%`,
                background: "rgba(255,92,40,0.2)",
              }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5"
              style={{
                left: `${(splitFrame / scene.durationInFrames) * 100}%`,
                background: "var(--brand-orange)",
              }}
            />
            <div
              className="h-full flex-1"
              style={{ background: "rgba(62,208,195,0.15)" }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: "var(--brand-orange)" }}>
              Part 1: {(splitFrame / 30).toFixed(1)}s
            </span>
            <span className="text-[10px]" style={{ color: "var(--brand-teal)" }}>
              Part 2: {((scene.durationInFrames - splitFrame) / 30).toFixed(1)}s
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label
            className="text-xs font-medium mb-1 block"
            style={{ color: "var(--muted)" }}
          >
            Split at (seconds)
          </label>
          <input
            type="range"
            min={1 / 30}
            max={totalSec - 1 / 30}
            step={1 / 30}
            value={splitSec}
            onChange={(e) => setSplitSec(Number(e.target.value))}
            className="w-full accent-[var(--brand-orange)]"
          />
          <input
            type="number"
            value={Number(splitSec.toFixed(2))}
            onChange={(e) => setSplitSec(Number(e.target.value))}
            min={0.03}
            max={totalSec - 0.03}
            step={0.1}
            className="w-20 mt-1 px-2 py-1 rounded border text-xs outline-none"
            style={{
              background: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-[var(--surface-hover)]"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSplit}
            disabled={!valid || saving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--brand-orange)" }}
          >
            {saving ? "Splitting..." : "Split"}
          </button>
        </div>
      </div>
    </div>
  );
}
