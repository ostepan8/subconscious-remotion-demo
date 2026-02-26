"use client";

import { useState, useRef } from "react";
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
  const audioUrl = useQuery(
    api.voiceovers.getAudioUrl,
    voiceover?.status === "ready" && voiceover?.audioStorageId
      ? { storageId: voiceover.audioStorageId }
      : "skip",
  );

  const [script, setScript] = useState(scene.voiceoverScript || "");
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const createVoiceover = useMutation(api.voiceovers.createVoiceover);

  async function handleGenerate() {
    if (!script.trim()) return;
    setGenerating(true);
    setError(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

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

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
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

          {voiceover?.status === "generating" && (
            <div
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
              style={{
                background: "rgba(255,92,40,0.1)",
                color: "var(--brand-orange)",
              }}
            >
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
              Generating audio...
            </div>
          )}

          {voiceover?.status === "ready" && audioUrl && (
            <div
              className="rounded-lg px-3 py-2.5"
              style={{ background: "rgba(181,232,0,0.08)", border: "1px solid rgba(181,232,0,0.2)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand-green)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--brand-green)" }}>
                  Audio ready
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayback}
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                  style={{ background: "var(--brand-orange)", color: "white" }}
                >
                  {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full rounded-full transition-all" style={{ background: "var(--brand-orange)", width: isPlaying ? "100%" : "0%" }} />
                </div>
              </div>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
            </div>
          )}

          {voiceover?.status === "ready" && !audioUrl && (
            <div
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: "rgba(181,232,0,0.1)", color: "var(--brand-green)" }}
            >
              Voiceover generated successfully.
            </div>
          )}

          {error && (
            <div className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
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
            {voiceover?.status === "ready" ? "Regenerate Audio" : generating ? "Generating..." : "Generate Audio"}
          </button>
        </div>
      </div>
    </div>
  );
}
