"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface VoiceoverPanelProps {
  scene: {
    _id: Id<"scenes">;
    title: string;
    voiceoverScript?: string;
    projectId: Id<"projects">;
  };
  onClose: () => void;
}

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Calm, natural" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Soft, warm" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Professional, clear" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Young, friendly" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", description: "Deep, authoritative" },
];

export default function VoiceoverPanel({ scene, onClose }: VoiceoverPanelProps) {
  const voiceover = useQuery(api.voiceovers.getVoiceoverForScene, {
    sceneId: scene._id,
  });

  const [script, setScript] = useState(scene.voiceoverScript || "");
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVoiceover = useMutation(api.voiceovers.createVoiceover);

  async function handleGenerate() {
    if (!script.trim()) return;
    setGenerating(true);
    setError(null);

    try {
      await createVoiceover({
        projectId: scene.projectId,
        sceneId: scene._id,
        script: script.trim(),
        voiceId,
      });

      const res = await fetch("/api/voiceover/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: script.trim(),
          voiceId,
          sceneId: scene._id,
          projectId: scene.projectId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate voiceover");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-md rounded-2xl border p-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>
          Generate Voiceover
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          {scene.title}
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>
              Script
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={3}
              placeholder="Enter voiceover script..."
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none focus:border-[var(--brand-orange)]"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>
              Voice
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoiceId(v.id)}
                  className={`rounded-lg border p-2 text-left text-sm transition-all ${
                    voiceId === v.id ? "ring-2 ring-[var(--brand-orange)]" : ""
                  }`}
                  style={{
                    background: "var(--background)",
                    borderColor: voiceId === v.id ? "var(--brand-orange)" : "var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  <div className="font-medium text-xs">{v.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {v.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {voiceover?.status === "ready" && (
            <div
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                background: "rgba(181,232,0,0.1)",
                color: "var(--brand-green)",
              }}
            >
              Voiceover generated successfully.
            </div>
          )}

          {error && (
            <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-[var(--surface-hover)]"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Close
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !script.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--brand-orange)" }}
          >
            {generating ? "Generating..." : "Generate Audio"}
          </button>
        </div>
      </div>
    </div>
  );
}
