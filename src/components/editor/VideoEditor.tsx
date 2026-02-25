"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import type { PlayerRef } from "@remotion/player";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getTheme } from "@/components/video/themes";
import VideoPreview from "@/components/video/VideoPreview";
import SceneList from "./SceneList";
import ChatSidebar from "./ChatSidebar";
import SceneEditor from "./SceneEditor";
import VoiceoverPanel from "./VoiceoverPanel";
import MediaGallery from "./MediaGallery";
import Timeline from "./Timeline";
import SplitModal from "./SplitModal";
import type { SceneData } from "@/components/video/VideoComposition";
import type { SceneContent, SceneType } from "@/types";

type SceneSnapshot = Array<{
  order: number;
  type: string;
  title: string;
  content: unknown;
  durationInFrames: number;
  transition: string;
  voiceoverScript?: string;
  track?: number;
}>;

interface VideoEditorProps {
  project: {
    _id: Id<"projects">;
    externalId: string;
    title: string;
    description: string;
    theme: string;
    status: string;
    githubUrl?: string;
    githubExtract?: Record<string, unknown> | null;
  };
}

type DropStatus = "idle" | "hovering" | "uploading" | "success" | "error";

function classifyDroppedFile(file: File): "image" | "video" | "audio" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  return null;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({ width: 1920, height: 1080 });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function VideoEditor({ project }: VideoEditorProps) {
  const scenes = useQuery(api.scenes.getScenes, {
    projectId: project._id,
  });
  const addScene = useMutation(api.scenes.addScene);
  const removeScene = useMutation(api.scenes.removeScene);
  const restoreScenesMut = useMutation(api.scenes.restoreScenes);

  const playerRef = useRef<PlayerRef>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [voiceoverScene, setVoiceoverScene] = useState<string | null>(null);
  const [splittingScene, setSplittingScene] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<"scenes" | "media">("media");
  const [githubExtracting, setGithubExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState("");
  const [componentScanning, setComponentScanning] = useState(false);
  const [componentScanStatus, setComponentScanStatus] = useState("");
  const extractionTriggered = useRef(false);

  const [dropStatus, setDropStatus] = useState<DropStatus>("idle");
  const [dropMessage, setDropMessage] = useState("");
  const dropCounter = useRef(0);
  const scenesRef = useRef(scenes);
  scenesRef.current = scenes;
  const undoStackRef = useRef<SceneSnapshot[]>([]);
  const redoStackRef = useRef<SceneSnapshot[]>([]);
  const isRestoringRef = useRef(false);

  const theme = getTheme(project.theme);

  // Re-run when scenes appear/disappear so we reattach after Player mounts
  const playerMounted = !!scenes?.length;
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    player.addEventListener("frameupdate", onFrameUpdate);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrameUpdate);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [playerMounted]);

  useEffect(() => {
    if (extractionTriggered.current) return;
    if (!project.githubUrl || project.githubExtract) return;
    extractionTriggered.current = true;

    const payload = {
      githubUrl: project.githubUrl,
      projectId: project._id,
    };

    setGithubExtracting(true);
    setExtractionStatus("Analyzing repository...");

    (async () => {
      try {
        const res = await fetch("/api/github/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "status" || event.type === "progress") {
                setExtractionStatus(event.message);
              } else if (event.type === "asset_imported") {
                setExtractionStatus(`Imported: ${event.name}`);
              } else if (event.type === "importing_assets") {
                setExtractionStatus(event.message);
              } else if (event.type === "done") {
                setExtractionStatus("");
              } else if (event.type === "error") {
                setExtractionStatus(`Error: ${event.message}`);
              }
            } catch {
              /* skip parse errors */
            }
          }
        }
      } catch (err) {
        setExtractionStatus(
          `Error: ${err instanceof Error ? err.message : "Failed"}`
        );
      } finally {
        setGithubExtracting(false);
      }
    })();

    setComponentScanning(true);
    setComponentScanStatus("Starting AI component scan...");

    (async () => {
      try {
        const res = await fetch("/api/github/scan-components", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "status" || event.type === "progress") {
                setComponentScanStatus(event.message);
              } else if (event.type === "component_found") {
                setComponentScanStatus(event.message);
              } else if (event.type === "design_extracted") {
                setComponentScanStatus(event.message);
              } else if (event.type === "scan_complete") {
                setComponentScanStatus("");
              } else if (event.type === "error") {
                setComponentScanStatus(`Error: ${event.message}`);
              }
            } catch {
              /* skip parse errors */
            }
          }
        }
      } catch (err) {
        setComponentScanStatus(
          `Error: ${err instanceof Error ? err.message : "Failed"}`
        );
      } finally {
        setComponentScanning(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.githubUrl, project._id]);

  const handleSeek = useCallback((frame: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(frame);
    player.pause();
  }, []);

  const handleTogglePlay = useCallback(() => {
    playerRef.current?.toggle();
  }, []);

  const handleFrameStep = useCallback((delta: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.pause();
    const frame = player.getCurrentFrame();
    player.seekTo(frame + delta);
  }, []);

  const sceneData: SceneData[] = (scenes || []).map((s) => ({
    id: s._id as string,
    type: s.type as SceneType,
    title: s.title,
    content: (s.content || {}) as SceneContent,
    durationInFrames: s.durationInFrames,
    transition: s.transition,
  }));

  const activeScene = scenes?.find((s) => s._id === activeSceneId);
  const splittingSceneData = scenes?.find((s) => s._id === splittingScene);

  const captureSnapshot = useCallback((): SceneSnapshot => {
    const current = scenesRef.current;
    if (!current) return [];
    return current.map((s) => ({
      order: s.order,
      type: s.type,
      title: s.title,
      content: s.content,
      durationInFrames: s.durationInFrames,
      transition: s.transition,
      voiceoverScript: s.voiceoverScript,
      track: s.track,
    }));
  }, []);

  const saveSnapshot = useCallback(() => {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-49),
      captureSnapshot(),
    ];
    redoStackRef.current = [];
  }, [captureSnapshot]);

  const handleUndo = useCallback(async () => {
    if (isRestoringRef.current || undoStackRef.current.length === 0) return;
    isRestoringRef.current = true;
    try {
      redoStackRef.current = [...redoStackRef.current, captureSnapshot()];
      const snapshot = undoStackRef.current[undoStackRef.current.length - 1];
      undoStackRef.current = undoStackRef.current.slice(0, -1);
      setActiveSceneId(null);
      await restoreScenesMut({ projectId: project._id, scenes: snapshot });
    } finally {
      isRestoringRef.current = false;
    }
  }, [project._id, restoreScenesMut, captureSnapshot]);

  const handleRedo = useCallback(async () => {
    if (isRestoringRef.current || redoStackRef.current.length === 0) return;
    isRestoringRef.current = true;
    try {
      undoStackRef.current = [...undoStackRef.current, captureSnapshot()];
      const snapshot = redoStackRef.current[redoStackRef.current.length - 1];
      redoStackRef.current = redoStackRef.current.slice(0, -1);
      setActiveSceneId(null);
      await restoreScenesMut({ projectId: project._id, scenes: snapshot });
    } finally {
      isRestoringRef.current = false;
    }
  }, [project._id, restoreScenesMut, captureSnapshot]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

  const handleDeleteScene = useCallback(
    async (id: string) => {
      await removeScene({ sceneId: id as Id<"scenes"> });
      if (activeSceneId === id) setActiveSceneId(null);
    },
    [removeScene, activeSceneId],
  );

  const handleSelectScene = useCallback((id: string) => {
    setActiveSceneId(id);
  }, []);

  const hasMediaFiles = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) return true;
    if (e.dataTransfer.types.includes("application/x-media-item")) return true;
    return false;
  }, []);

  const handlePreviewDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMediaFiles(e)) return;
    dropCounter.current++;
    if (dropCounter.current === 1) {
      setDropStatus("hovering");
    }
  }, [hasMediaFiles]);

  const handlePreviewDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasMediaFiles(e)) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, [hasMediaFiles]);

  const handlePreviewDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropCounter.current--;
    if (dropCounter.current <= 0) {
      dropCounter.current = 0;
      setDropStatus("idle");
    }
  }, []);

  const handleFileDrop = useCallback(async (files: FileList) => {
    const sceneCount = scenes?.length ?? 0;
    let added = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = classifyDroppedFile(file);
      if (!mediaType || mediaType === "audio") continue;

      setDropMessage(`Uploading ${file.name}...`);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", project._id as string);

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        const mediaUrl = data.url as string;

        let dims: { width?: number; height?: number } = {};
        if (mediaType === "image") {
          dims = await getImageDimensions(file);
        }

        const isVideo = mediaType === "video";
        const sceneName = file.name.replace(/\.[^.]+$/, "");

        const sceneId = await addScene({
          projectId: project._id,
          order: sceneCount + added,
          type: isVideo ? "video-clip" : "image-showcase",
          title: sceneName,
          content: {
            mediaUrl,
            mediaId: data.mediaId,
            headline: "",
            subtext: "",
            ...(dims.width && dims.height
              ? { mediaWidth: dims.width, mediaHeight: dims.height }
              : {}),
          },
          durationInFrames: isVideo ? 300 : 150,
          transition: "fade",
        });

        added++;
        setActiveSceneId(sceneId);
      } catch {
        setDropMessage(`Failed to add ${file.name}`);
        setDropStatus("error");
        setTimeout(() => setDropStatus("idle"), 2000);
        return;
      }
    }

    if (added > 0) {
      setDropMessage(`Added ${added} scene${added > 1 ? "s" : ""}`);
      setDropStatus("success");
      setLeftTab("scenes");
      setTimeout(() => setDropStatus("idle"), 1500);
    } else {
      setDropMessage("No supported media files found");
      setDropStatus("error");
      setTimeout(() => setDropStatus("idle"), 2000);
    }
  }, [scenes, project._id, addScene]);

  const handleMediaItemDrop = useCallback(async (jsonData: string) => {
    try {
      const item = JSON.parse(jsonData) as {
        url: string;
        name: string;
        type: string;
        mediaId: string;
        width?: number;
        height?: number;
        componentName?: string;
      };

      if (item.type !== "image" && item.type !== "video" && item.type !== "component") {
        setDropMessage("Only image, video, or component media can be added as scenes");
        setDropStatus("error");
        setTimeout(() => setDropStatus("idle"), 2000);
        return;
      }

      const sceneCount = scenes?.length ?? 0;
      const isVideo = item.type === "video";
      const isComponent = item.type === "component";
      const sceneName = item.componentName || item.name.replace(/\.[^.]+$/, "");

      const sceneId = await addScene({
        projectId: project._id,
        order: sceneCount,
        type: isComponent ? "custom" : isVideo ? "video-clip" : "image-showcase",
        title: sceneName,
        content: {
          mediaUrl: item.url,
          mediaId: item.mediaId,
          headline: isComponent ? sceneName : "",
          subtext: "",
          ...(item.width && item.height
            ? { mediaWidth: item.width, mediaHeight: item.height }
            : {}),
        },
        durationInFrames: isVideo ? 300 : 150,
        transition: "fade",
      });

      setActiveSceneId(sceneId);
      setDropMessage(`Added "${sceneName}" as scene`);
      setDropStatus("success");
      setLeftTab("scenes");
      setTimeout(() => setDropStatus("idle"), 1500);
    } catch {
      setDropMessage("Failed to create scene");
      setDropStatus("error");
      setTimeout(() => setDropStatus("idle"), 2000);
    }
  }, [scenes, project._id, addScene]);

  const handlePreviewDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropCounter.current = 0;

    const mediaItemData = e.dataTransfer.getData("application/x-media-item");
    if (mediaItemData) {
      setDropStatus("uploading");
      setDropMessage("Creating scene...");
      await handleMediaItemDrop(mediaItemData);
      return;
    }

    if (e.dataTransfer.files.length > 0) {
      setDropStatus("uploading");
      setDropMessage("Preparing...");
      await handleFileDrop(e.dataTransfer.files);
    } else {
      setDropStatus("idle");
    }
  }, [handleFileDrop, handleMediaItemDrop]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="flex flex-1 min-h-0">
        {/* Left panel: Scenes / Media tabs */}
        <div
          className={`${editingScene ? "w-72" : "w-60"} shrink-0 border-r flex flex-col min-h-0 overflow-hidden transition-[width] duration-200`}
          style={{ borderColor: "var(--border-subtle)", background: "var(--background)" }}
        >
          {editingScene && activeScene ? (
            <SceneEditor
              scene={{
                _id: activeScene._id,
                type: activeScene.type,
                title: activeScene.title,
                content: (activeScene.content || {}) as Record<string, unknown>,
                durationInFrames: activeScene.durationInFrames,
                transition: activeScene.transition,
                voiceoverScript: activeScene.voiceoverScript,
              }}
              onClose={() => setEditingScene(null)}
            />
          ) : (
            <>
              <div className="flex border-b" style={{ borderColor: "var(--border-subtle)" }}>
                {(["media", "scenes"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setLeftTab(tab)}
                    className="flex-1 text-[11px] font-medium py-2 transition-colors"
                    style={{
                      color:
                        leftTab === tab
                          ? tab === "media"
                            ? "var(--brand-teal)"
                            : "var(--brand-orange)"
                          : "var(--muted)",
                      borderBottom:
                        leftTab === tab
                          ? `2px solid ${tab === "media" ? "var(--brand-teal)" : "var(--brand-orange)"}`
                          : "2px solid transparent",
                    }}
                  >
                    {tab === "media" ? "Media" : "Scenes"}
                  </button>
                ))}
              </div>

              {leftTab === "media" ? (
                <MediaGallery
                  projectId={project._id}
                  isExtracting={githubExtracting}
                  extractionStatus={extractionStatus}
                  isScanning={componentScanning}
                  scanStatus={componentScanStatus}
                />
              ) : (
                <>
                  <SceneList
                    scenes={scenes || []}
                    activeSceneId={activeSceneId}
                    projectId={project._id}
                    onSelectScene={handleSelectScene}
                    onEditScene={setEditingScene}
                    onSplitScene={setSplittingScene}
                    onDeleteScene={handleDeleteScene}
                  />
                  {activeScene && (
                    <div
                      className="p-2 border-t flex gap-1.5"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <button
                        onClick={() => setEditingScene(activeSceneId)}
                        className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors hover:bg-[var(--surface-hover)]"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setVoiceoverScene(activeSceneId)}
                        className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-white transition-opacity hover:opacity-90"
                        style={{ background: "var(--brand-teal)" }}
                      >
                        Voiceover
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Center: Video preview + drop zone */}
        <div
          className="flex-1 flex flex-col min-w-0 relative"
          style={{ background: "var(--background)" }}
          onDragEnter={handlePreviewDragEnter}
          onDragOver={handlePreviewDragOver}
          onDragLeave={handlePreviewDragLeave}
          onDrop={handlePreviewDrop}
        >
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {project.title}
              </h2>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {theme.name} theme
              </span>
            </div>
            <div
              className="text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: "rgba(62,208,195,0.1)", color: "var(--brand-teal)" }}
            >
              {project.status}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div className="w-full max-w-4xl">
              <VideoPreview ref={playerRef} scenes={sceneData} theme={theme} />
            </div>
          </div>

          {/* Drop overlay */}
          {dropStatus !== "idle" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: dropStatus === "hovering" ? "none" : "auto",
                transition: "opacity 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    dropStatus === "hovering"
                      ? "rgba(10, 10, 20, 0.82)"
                      : dropStatus === "uploading"
                        ? "rgba(10, 10, 20, 0.88)"
                        : dropStatus === "success"
                          ? "rgba(10, 30, 20, 0.85)"
                          : "rgba(30, 10, 10, 0.85)",
                  backdropFilter: "blur(6px)",
                  transition: "background 0.3s",
                }}
              />

              {dropStatus === "hovering" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 16,
                    border: "2px dashed rgba(62, 208, 195, 0.6)",
                    borderRadius: 16,
                    pointerEvents: "none",
                    animation: "dropPulse 1.5s ease-in-out infinite",
                  }}
                />
              )}

              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {dropStatus === "hovering" && (
                  <>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: "rgba(62, 208, 195, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "dropBounce 1s ease-in-out infinite",
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(62, 208, 195)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
                        Drop to add as scene
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                        Images and videos will become new scenes on the timeline
                      </div>
                    </div>
                  </>
                )}

                {dropStatus === "uploading" && (
                  <>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        border: "3px solid rgba(62, 208, 195, 0.2)",
                        borderTopColor: "rgb(62, 208, 195)",
                        borderRadius: "50%",
                        animation: "dropSpin 0.8s linear infinite",
                      }}
                    />
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                      {dropMessage}
                    </div>
                  </>
                )}

                {dropStatus === "success" && (
                  <>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "rgba(42, 181, 168, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(42, 181, 168)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, color: "rgb(42, 181, 168)", fontWeight: 600 }}>
                      {dropMessage}
                    </div>
                  </>
                )}

                {dropStatus === "error" && (
                  <>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "rgba(232, 93, 58, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(232, 93, 58)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, color: "rgb(232, 93, 58)", fontWeight: 600 }}>
                      {dropMessage}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <style>{`
            @keyframes dropPulse {
              0%, 100% { opacity: 0.5; transform: scale(1); }
              50% { opacity: 1; transform: scale(0.995); }
            }
            @keyframes dropBounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
            @keyframes dropSpin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>

        {/* Right panel: Chat */}
        <div
          className="w-80 shrink-0 border-l flex flex-col"
          style={{ borderColor: "var(--border-subtle)", background: "var(--background)" }}
        >
          <ChatSidebar
            projectId={project.externalId}
            internalProjectId={project._id}
          />
        </div>
      </div>

      {/* Bottom: Timeline */}
      <Timeline
        scenes={scenes || []}
        activeSceneId={activeSceneId}
        onSelectScene={handleSelectScene}
        onEditScene={setEditingScene}
        onSplitScene={setSplittingScene}
        onDeleteScene={handleDeleteScene}
        onBeforeMutate={saveSnapshot}
        currentFrame={currentFrame}
        onSeek={handleSeek}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onFrameStep={handleFrameStep}
      />

      {/* Modals */}
      {voiceoverScene && activeScene && (
        <VoiceoverPanel
          scene={{
            _id: activeScene._id,
            title: activeScene.title,
            voiceoverScript: activeScene.voiceoverScript,
            projectId: project._id,
          }}
          onClose={() => setVoiceoverScene(null)}
        />
      )}

      {splittingScene && splittingSceneData && (
        <SplitModal
          scene={{
            _id: splittingSceneData._id,
            title: splittingSceneData.title,
            durationInFrames: splittingSceneData.durationInFrames,
          }}
          onClose={() => setSplittingScene(null)}
        />
      )}

    </div>
  );
}
