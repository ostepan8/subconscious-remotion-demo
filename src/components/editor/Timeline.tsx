"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type MouseEvent as RME,
} from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/* ═══════════════════ Constants ═══════════════════ */

const FPS = 30;
const MIN_FRAMES = 15;
const RULER_H = 28;
const TRACK_H = 56;
const OVERLAY_H = 48;
const AUDIO_H = 36;
const HEADER_W = 48;
const DEFAULT_PPS = 100;
const MIN_PPS = 25;
const MAX_PPS = 400;
const GAP = 2;
const HANDLE_W = 7;
const DRAG_THRESHOLD = 3;

const C = {
  panelBg: "#191920",
  toolbarBg: "#131318",
  trackBg: "#1e1e26",
  overlayBg: "#1c2028",
  border: "#2c2c38",
  rulerBg: "#131318",
  rulerText: "#7a7a90",
  tick: "#333345",
  tickMajor: "#4a4a60",
  text: "#c0c0d4",
  muted: "#5e5e74",
  playhead: "#ff5c28",
  selection: "#3a7bff",
  ctxBg: "#202030",
  ctxBorder: "#38384a",
};

const TYPE_COLORS: Record<string, string> = {
  hero: "#E85D3A",
  features: "#2AB5A8",
  stats: "#D4881A",
  testimonial: "#9070DB",
  "logo-cloud": "#6B8EC9",
  "how-it-works": "#5196DE",
  comparison: "#C95D8F",
  pricing: "#DBA01D",
  faq: "#4DB89A",
  cta: "#D65050",
  "image-showcase": "#2EBE7E",
  "video-clip": "#7580D8",
  custom: "#6E7A85",
};

/* ═══════════════════ Helpers ═══════════════════ */

function formatTC(frame: number): string {
  const sec = Math.floor(Math.abs(frame) / FPS);
  const fr = Math.round(Math.abs(frame) % FPS);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(fr).padStart(2, "0")}`;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function tickInterval(pps: number): { major: number; minor: number } {
  if (pps < 40) return { major: 10, minor: 2 };
  if (pps < 80) return { major: 5, minor: 1 };
  if (pps < 160) return { major: 2, minor: 0.5 };
  return { major: 1, minor: 0.25 };
}

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function findDropIndex(
  positions: { x: number; w: number }[],
  xInTrack: number,
): number {
  for (let i = 0; i < positions.length; i++) {
    const mid = positions[i].x + positions[i].w / 2;
    if (xInTrack < mid) return i;
  }
  return positions.length;
}

/* ═══════════════════ Types ═══════════════════ */

interface Scene {
  _id: Id<"scenes">;
  order: number;
  type: string;
  title: string;
  durationInFrames: number;
  content: unknown;
  projectId: Id<"projects">;
  transition: string;
  voiceoverScript?: string;
  track?: number;
}

interface TimelineProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSelectScene: (id: string) => void;
  onEditScene?: (id: string) => void;
  onSplitScene?: (id: string) => void;
  onDeleteScene?: (id: string) => void;
  onBeforeMutate?: () => void;
  currentFrame?: number;
  onSeek?: (frame: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onFrameStep?: (delta: number) => void;
}

type Tool = "select" | "razor" | "track-forward";

interface DragInfo {
  sceneId: string;
  fromTrack: number;
  cursorX: number;
  cursorY: number;
  offsetX: number;
  offsetY: number;
  clipW: number;
  clipH: number;
  color: string;
  title: string;
  sceneType: string;
  overTrack: number | null;
  overIndex: number | null;
}

/* ═══════════════════ Component ═══════════════════ */

export default function Timeline({
  scenes,
  activeSceneId,
  onSelectScene,
  onEditScene,
  onDeleteScene,
  onBeforeMutate,
  currentFrame = 0,
  onSeek,
  isPlaying = false,
  onTogglePlay,
  onFrameStep,
}: TimelineProps) {
  /* ── Mutations ── */
  const updateScene = useMutation(api.scenes.updateScene);
  const reorderScenes = useMutation(api.scenes.reorderScenes);
  const splitSceneMut = useMutation(api.scenes.splitScene);
  const duplicateSceneMut = useMutation(api.scenes.duplicateScene);
  const removeScenesMut = useMutation(api.scenes.removeScenes);
  const moveSceneToTrackMut = useMutation(api.scenes.moveSceneToTrack);

  /* ── Refs ── */
  const scrollRef = useRef<HTMLDivElement>(null);
  const v1TrackRef = useRef<HTMLDivElement>(null);
  const v2TrackRef = useRef<HTMLDivElement>(null);
  const ppsRef = useRef(DEFAULT_PPS);
  const dragRef = useRef<DragInfo | null>(null);
  const onBeforeMutateRef = useRef(onBeforeMutate);
  onBeforeMutateRef.current = onBeforeMutate;

  /* ── State ── */
  const [tool, setTool] = useState<Tool>("select");
  const [pps, setPps] = useState(DEFAULT_PPS);
  const [snap, setSnap] = useState(true);
  const [playhead, setPlayhead] = useState(currentFrame);
  const [panelH, setPanelH] = useState(240);
  const [trimPreview, setTrimPreview] = useState<{
    sceneId: string;
    duration: number;
  } | null>(null);
  const [drag, setDrag] = useState<DragInfo | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    sceneId: string;
  } | null>(null);
  const [selectedScenes, setSelectedScenes] = useState<Set<string>>(
    new Set(),
  );

  ppsRef.current = pps;

  const updateDrag = useCallback((info: DragInfo | null) => {
    dragRef.current = info;
    setDrag(info);
  }, []);

  /* ── Sync playhead with prop ── */
  useEffect(() => {
    setPlayhead(currentFrame);
  }, [currentFrame]);

  /* ── Track filtering ── */
  const v1Scenes = useMemo(
    () => scenes.filter((s) => (s.track ?? 0) === 0),
    [scenes],
  );
  const v2Scenes = useMemo(
    () => scenes.filter((s) => (s.track ?? 0) === 1),
    [scenes],
  );

  /* ── Computed ── */
  const pxPerFrame = pps / FPS;

  const v1TotalFrames = useMemo(
    () => v1Scenes.reduce((s, sc) => s + sc.durationInFrames, 0),
    [v1Scenes],
  );
  const v2TotalFrames = useMemo(
    () => v2Scenes.reduce((s, sc) => s + sc.durationInFrames, 0),
    [v2Scenes],
  );
  const totalFrames = Math.max(v1TotalFrames, v2TotalFrames);
  const timelineW = Math.max((totalFrames / FPS) * pps + 300, 600);

  const computePositions = useCallback(
    (trackScenes: Scene[]) => {
      let x = 0;
      return trackScenes.map((sc) => {
        const dur =
          trimPreview?.sceneId === sc._id
            ? trimPreview.duration
            : sc.durationInFrames;
        const w = dur * pxPerFrame;
        const pos = { x, w };
        x += w;
        return pos;
      });
    },
    [pxPerFrame, trimPreview],
  );

  const v1Positions = useMemo(
    () => computePositions(v1Scenes),
    [computePositions, v1Scenes],
  );
  const v2Positions = useMemo(
    () => computePositions(v2Scenes),
    [computePositions, v2Scenes],
  );

  const v1LastClipEnd =
    v1Positions.length > 0
      ? v1Positions[v1Positions.length - 1].x +
        v1Positions[v1Positions.length - 1].w
      : 0;
  const v2LastClipEnd =
    v2Positions.length > 0
      ? v2Positions[v2Positions.length - 1].x +
        v2Positions[v2Positions.length - 1].w
      : 0;

  // Store positions in refs so drag handlers have access to latest
  const v1PosRef = useRef(v1Positions);
  const v2PosRef = useRef(v2Positions);
  const v1ScenesRef = useRef(v1Scenes);
  const v2ScenesRef = useRef(v2Scenes);
  const scenesRef = useRef(scenes);
  v1PosRef.current = v1Positions;
  v2PosRef.current = v2Positions;
  v1ScenesRef.current = v1Scenes;
  v2ScenesRef.current = v2Scenes;
  scenesRef.current = scenes;

  /* ── Ruler ticks ── */
  const ticks = useMemo(() => {
    const { major, minor } = tickInterval(pps);
    const maxSec = timelineW / pps;
    const result: { x: number; label: string | null; isMajor: boolean }[] =
      [];
    for (let t = 0; t <= maxSec; t = +(t + minor).toFixed(4)) {
      const isMajor =
        Math.abs(t % major) < 0.001 ||
        Math.abs((t % major) - major) < 0.001;
      result.push({
        x: t * pps,
        label: isMajor ? formatTC(Math.round(t * FPS)) : null,
        isMajor,
      });
    }
    return result;
  }, [pps, timelineW]);

  /* ── Selection helpers ── */
  const handleSceneClick = useCallback(
    (sceneId: string, e: React.MouseEvent) => {
      if (tool === "track-forward") {
        const scene = scenes.find((s) => s._id === sceneId);
        if (!scene) return;
        const track = scene.track ?? 0;
        const trackScenes = scenes.filter(
          (s) => (s.track ?? 0) === track,
        );
        const idx = trackScenes.findIndex((s) => s._id === sceneId);
        setSelectedScenes(
          new Set(trackScenes.slice(idx).map((s) => s._id)),
        );
        onSelectScene(sceneId);
      } else if (e.shiftKey) {
        setSelectedScenes((prev) => {
          const next = new Set(prev);
          if (next.has(sceneId)) next.delete(sceneId);
          else next.add(sceneId);
          return next;
        });
      } else {
        setSelectedScenes(new Set([sceneId]));
        onSelectScene(sceneId);
      }
    },
    [tool, scenes, onSelectScene],
  );

  /* ── Delete selected ── */
  const handleDeleteSelected = useCallback(async () => {
    const toDelete =
      selectedScenes.size > 0
        ? Array.from(selectedScenes)
        : activeSceneId
          ? [activeSceneId]
          : [];
    if (toDelete.length === 0) return;
    onBeforeMutateRef.current?.();

    if (toDelete.length === 1) {
      onDeleteScene?.(toDelete[0]);
    } else {
      await removeScenesMut({
        sceneIds: toDelete as Id<"scenes">[],
      });
    }
    setSelectedScenes(new Set());
  }, [
    selectedScenes,
    activeSceneId,
    onDeleteScene,
    removeScenesMut,
  ]);

  /* ── Trim ── */
  const handleTrimStart = useCallback(
    (
      e: RME,
      sceneId: string,
      edge: "left" | "right",
      duration: number,
      sceneIndex: number,
      trackScenes: Scene[],
    ) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      const origDuration = duration;
      const localPxPerFrame = ppsRef.current / FPS;

      let sceneStartFrame = 0;
      for (let si = 0; si < sceneIndex; si++) {
        sceneStartFrame += trackScenes[si].durationInFrames;
      }

      const handleMove = (mv: MouseEvent) => {
        const dx = mv.clientX - startX;
        const frameDelta = Math.round(dx / localPxPerFrame);
        const newDur =
          edge === "right"
            ? Math.max(MIN_FRAMES, origDuration + frameDelta)
            : Math.max(MIN_FRAMES, origDuration - frameDelta);
        setTrimPreview({ sceneId, duration: newDur });
        const edgeFrame =
          edge === "right"
            ? sceneStartFrame + newDur - 1
            : sceneStartFrame;
        onSeek?.(edgeFrame);
      };

      const handleUp = () => {
        onBeforeMutateRef.current?.();
        setTrimPreview((prev) => {
          if (prev) {
            updateScene({
              sceneId: prev.sceneId as Id<"scenes">,
              durationInFrames: prev.duration,
            });
          }
          return null;
        });
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [updateScene, onSeek],
  );

  /* ── Ruler scrub ── */
  const handleRulerDown = useCallback(
    (e: RME) => {
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const localPx = ppsRef.current / FPS;

      const update = (clientX: number) => {
        const x = clientX - rect.left;
        const frame = clamp(Math.round(x / localPx), 0, totalFrames);
        setPlayhead(frame);
        onSeek?.(frame);
      };

      update(e.clientX);

      const handleMove = (mv: MouseEvent) => update(mv.clientX);
      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [totalFrames, onSeek],
  );

  /* ── Razor ── */
  const handleRazorClick = useCallback(
    (e: RME, sceneId: string) => {
      if (tool !== "razor") return;
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const localPx = ppsRef.current / FPS;
      const frameWithin = Math.round(clickX / localPx);
      const scene = scenes.find((s) => s._id === sceneId);
      if (
        !scene ||
        frameWithin <= 0 ||
        frameWithin >= scene.durationInFrames
      )
        return;
      onBeforeMutateRef.current?.();
      splitSceneMut({
        sceneId: sceneId as Id<"scenes">,
        splitAtFrame: frameWithin,
      });
    },
    [tool, scenes, splitSceneMut],
  );

  /* ── Custom mouse-based drag ── */
  const handleClipMouseDown = useCallback(
    (
      e: React.MouseEvent,
      sceneId: string,
      track: number,
      color: string,
      title: string,
      sceneType: string,
    ) => {
      if (tool === "razor") return;
      if (e.button !== 0) return;

      const clipEl = e.currentTarget as HTMLElement;
      const rect = clipEl.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const startX = e.clientX;
      const startY = e.clientY;
      let dragging = false;

      const onMove = (mv: MouseEvent) => {
        if (!dragging) {
          const dx = mv.clientX - startX;
          const dy = mv.clientY - startY;
          if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
          dragging = true;
          document.body.style.cursor = "grabbing";
        }

        let overTrack: number | null = null;
        let overIndex: number | null = null;

        const v1Rect = v1TrackRef.current?.getBoundingClientRect();
        const v2Rect = v2TrackRef.current?.getBoundingClientRect();
        const scrollLeft = scrollRef.current?.scrollLeft ?? 0;

        if (
          v2Rect &&
          mv.clientY >= v2Rect.top &&
          mv.clientY <= v2Rect.bottom
        ) {
          overTrack = 1;
          const xInTrack = mv.clientX - v2Rect.left + scrollLeft;
          overIndex = findDropIndex(v2PosRef.current, xInTrack);
        } else if (
          v1Rect &&
          mv.clientY >= v1Rect.top &&
          mv.clientY <= v1Rect.bottom
        ) {
          overTrack = 0;
          const xInTrack = mv.clientX - v1Rect.left + scrollLeft;
          overIndex = findDropIndex(v1PosRef.current, xInTrack);
        }

        updateDrag({
          sceneId,
          fromTrack: track,
          cursorX: mv.clientX,
          cursorY: mv.clientY,
          offsetX,
          offsetY,
          clipW: rect.width,
          clipH: rect.height,
          color,
          title,
          sceneType,
          overTrack,
          overIndex,
        });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";

        const info = dragRef.current;
        updateDrag(null);

        if (!dragging || !info) return;
        if (info.overTrack == null || info.overIndex == null) return;

        const allScenes = scenesRef.current;
        if (allScenes.length === 0) return;
        onBeforeMutateRef.current?.();

        if (info.fromTrack !== info.overTrack) {
          moveSceneToTrackMut({
            sceneId: info.sceneId as Id<"scenes">,
            toTrack: info.overTrack,
            insertAtIndex: info.overIndex,
          });
        } else {
          const trackScenes =
            info.overTrack === 0
              ? v1ScenesRef.current
              : v2ScenesRef.current;
          const fromIndex = trackScenes.findIndex(
            (s) => s._id === info.sceneId,
          );
          if (fromIndex < 0 || fromIndex === info.overIndex) return;
          const ids = trackScenes.map((s) => s._id);
          const [moved] = ids.splice(fromIndex, 1);
          const insertAt =
            info.overIndex > fromIndex
              ? info.overIndex - 1
              : info.overIndex;
          ids.splice(Math.min(insertAt, ids.length), 0, moved);
          reorderScenes({
            projectId: allScenes[0].projectId,
            sceneIds: ids,
          });
        }
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [tool, updateDrag, moveSceneToTrackMut, reorderScenes],
  );

  /* ── Zoom via Ctrl+Wheel ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const cur = ppsRef.current;
      const curPx = cur / FPS;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const frameAtMouse = (el.scrollLeft + mouseX) / curPx;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const next = clamp(cur * factor, MIN_PPS, MAX_PPS);
      const nextPx = next / FPS;
      const newScroll = frameAtMouse * nextPx - mouseX;
      setPps(next);
      requestAnimationFrame(() => {
        el.scrollLeft = Math.max(0, newScroll);
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* ── Fit to width ── */
  const fitToWidth = useCallback(() => {
    if (!scrollRef.current || totalFrames === 0) return;
    const avail = scrollRef.current.clientWidth - 40;
    const totalSec = totalFrames / FPS;
    setPps(clamp(avail / totalSec, MIN_PPS, MAX_PPS));
    scrollRef.current.scrollLeft = 0;
  }, [totalFrames]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          onTogglePlay?.();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onFrameStep?.(e.shiftKey ? -10 : -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          onFrameStep?.(e.shiftKey ? 10 : 1);
          break;
        case "j":
        case "J":
          e.preventDefault();
          onFrameStep?.(e.shiftKey ? -10 : -1);
          break;
        case "k":
        case "K":
          e.preventDefault();
          onTogglePlay?.();
          break;
        case "l":
        case "L":
          e.preventDefault();
          onFrameStep?.(e.shiftKey ? 10 : 1);
          break;
        case "v":
        case "V":
          if (!e.ctrlKey && !e.metaKey) setTool("select");
          break;
        case "a":
        case "A":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setSelectedScenes(new Set(scenes.map((s) => s._id)));
          } else {
            setTool("track-forward");
          }
          break;
        case "c":
        case "C":
          if (!e.ctrlKey && !e.metaKey) setTool("razor");
          break;
        case "s":
        case "S":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setSnap((s) => !s);
          }
          break;
        case "Delete":
        case "Backspace":
          handleDeleteSelected();
          break;
        case "Escape":
          setSelectedScenes(new Set());
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scenes, handleDeleteSelected, onTogglePlay, onFrameStep]);

  /* ── Panel resize ── */
  const handlePanelResizeStart = useCallback(
    (e: RME) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = panelH;

      const handleMove = (mv: MouseEvent) => {
        setPanelH(clamp(startH + (startY - mv.clientY), 140, 500));
      };
      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [panelH],
  );

  /* ── Context menu ── */
  const handleCtx = useCallback((e: RME, sceneId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, sceneId });
  }, []);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [ctxMenu]);

  const ctxActions = useMemo(
    () => [
      {
        label: "Edit Scene",
        shortcut: "Enter",
        action: (id: string) => onEditScene?.(id),
      },
      {
        label: "Duplicate",
        shortcut: "Ctrl+D",
        action: (id: string) => {
          onBeforeMutateRef.current?.();
          duplicateSceneMut({ sceneId: id as Id<"scenes"> });
        },
      },
      {
        label: "Split at Playhead",
        shortcut: "Ctrl+K",
        action: (id: string) => {
          let acc = 0;
          for (const sc of scenes) {
            if (sc._id === id) {
              const splitAt = playhead - acc;
              if (splitAt > 0 && splitAt < sc.durationInFrames) {
                onBeforeMutateRef.current?.();
                splitSceneMut({
                  sceneId: id as Id<"scenes">,
                  splitAtFrame: splitAt,
                });
              }
              break;
            }
            acc += sc.durationInFrames;
          }
        },
      },
      { divider: true as const },
      {
        label: "Select All After",
        shortcut: "A+Click",
        action: (id: string) => {
          const scene = scenes.find((s) => s._id === id);
          if (!scene) return;
          const track = scene.track ?? 0;
          const trackScenes = scenes.filter(
            (s) => (s.track ?? 0) === track,
          );
          const idx = trackScenes.findIndex((s) => s._id === id);
          setSelectedScenes(
            new Set(trackScenes.slice(idx).map((s) => s._id)),
          );
        },
      },
      {
        label: "Delete",
        shortcut: "Del",
        danger: true as const,
        action: (id: string) => {
          onBeforeMutateRef.current?.();
          onDeleteScene?.(id);
        },
      },
    ],
    [
      onEditScene,
      onDeleteScene,
      duplicateSceneMut,
      splitSceneMut,
      scenes,
      playhead,
    ],
  );

  /* ── Drop indicators ── */
  const getInsertX = (trackNum: number) => {
    if (!drag || drag.overTrack !== trackNum || drag.overIndex == null)
      return null;
    const positions = trackNum === 0 ? v1Positions : v2Positions;
    const lastEnd = trackNum === 0 ? v1LastClipEnd : v2LastClipEnd;
    if (drag.overIndex < positions.length)
      return positions[drag.overIndex].x;
    return lastEnd;
  };

  /* ═══════════════════ Empty ═══════════════════ */

  /* ═══════════════════ Render helpers ═══════════════════ */

  const renderClips = (
    trackScenes: Scene[],
    positions: { x: number; w: number }[],
    trackNum: number,
    clipH: number,
  ) =>
    trackScenes.map((sc, i) => {
      const { x, w } = positions[i];
      const color = TYPE_COLORS[sc.type] || TYPE_COLORS.custom;
      const isActive = activeSceneId === sc._id;
      const isSelected = selectedScenes.has(sc._id);
      const isDragged = drag?.sceneId === sc._id;
      const dur =
        trimPreview?.sceneId === sc._id
          ? trimPreview.duration
          : sc.durationInFrames;

      const borderColor = isSelected
        ? C.selection
        : isActive
          ? color
          : rgba(color, 0.25);

      return (
        <div
          key={sc._id}
          onMouseDown={(e) => {
            if (tool !== "razor") {
              handleClipMouseDown(
                e,
                sc._id,
                trackNum,
                color,
                sc.title,
                sc.type,
              );
            }
          }}
          onClick={(e) => {
            if (!drag) handleSceneClick(sc._id, e);
          }}
          onDoubleClick={() => onEditScene?.(sc._id)}
          onContextMenu={(e) => handleCtx(e, sc._id)}
          className="premiere-clip"
          style={{
            position: "absolute",
            left: x + GAP / 2,
            top: 4,
            width: Math.max(24, w - GAP),
            height: clipH,
            borderRadius: 4,
            background: `linear-gradient(180deg, ${rgba(color, 0.82)} 0%, ${rgba(color, 0.55)} 100%)`,
            border: `${isSelected || isActive ? 2 : 1}px solid ${borderColor}`,
            cursor:
              tool === "razor"
                ? "crosshair"
                : tool === "track-forward"
                  ? "e-resize"
                  : isDragged
                    ? "grabbing"
                    : "grab",
            overflow: "hidden",
            opacity: isDragged ? 0.25 : 1,
            boxShadow: isSelected
              ? `0 0 12px ${rgba(C.selection, 0.35)}, inset 0 1px 0 ${rgba("#fff", 0.08)}`
              : isActive
                ? `0 0 12px ${rgba(color, 0.35)}, inset 0 1px 0 ${rgba("#fff", 0.08)}`
                : `0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 ${rgba("#fff", 0.06)}`,
            transition: isDragged
              ? "opacity 0.12s"
              : "box-shadow 0.15s",
            zIndex: isDragged ? 0 : 1,
          }}
        >
          {tool === "razor" && (
            <div
              onClick={(e) => handleRazorClick(e, sc._id)}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 5,
                cursor: "crosshair",
              }}
            />
          )}

          <div
            style={{
              height: 2,
              background: color,
              borderRadius: "4px 4px 0 0",
            }}
          />

          <div
            style={{
              padding: "2px 8px",
              display: "flex",
              flexDirection: "column",
              height: "calc(100% - 2px)",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#fff",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}
            >
              {sc.title}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontWeight: 500,
                }}
              >
                {sc.type}
              </span>
              <span
                style={{
                  fontSize: 8,
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {(dur / FPS).toFixed(1)}s
              </span>
            </div>
          </div>

          <TrimHandle
            edge="left"
            onMouseDown={(e) =>
              handleTrimStart(
                e,
                sc._id,
                "left",
                sc.durationInFrames,
                i,
                trackScenes,
              )
            }
          />
          <TrimHandle
            edge="right"
            onMouseDown={(e) =>
              handleTrimStart(
                e,
                sc._id,
                "right",
                sc.durationInFrames,
                i,
                trackScenes,
              )
            }
          />
        </div>
      );
    });

  const allTracksH = OVERLAY_H + TRACK_H + AUDIO_H;
  const v1InsertX = getInsertX(0);
  const v2InsertX = getInsertX(1);

  return (
    <div
      style={{
        height: panelH,
        background: C.panelBg,
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* ── Panel resize handle ── */}
      <div
        className="tl-resize-handle"
        onMouseDown={handlePanelResizeStart}
        style={{
          height: 5,
          cursor: "ns-resize",
          position: "absolute",
          top: -2,
          left: 0,
          right: 0,
          zIndex: 20,
        }}
      />

      {/* ── Toolbar ── */}
      <div
        style={{
          height: 36,
          background: C.toolbarBg,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 6px",
          gap: 2,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 1,
            background: rgba(C.border, 0.5),
            borderRadius: 5,
            padding: 2,
          }}
        >
          <ToolBtn
            active={tool === "select"}
            label="Selection"
            shortcut="V"
            onClick={() => setTool("select")}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M4 1v13l3.5-3.5L10.5 15l2-1-3-4.5L14 8z" />
            </svg>
          </ToolBtn>

          <ToolBtn
            active={tool === "track-forward"}
            label="Track Select Forward"
            shortcut="A"
            onClick={() => setTool("track-forward")}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M2 3v10l5-5z" />
              <rect x="8" y="3" width="2" height="10" rx="0.5" />
              <rect x="12" y="3" width="2" height="10" rx="0.5" />
            </svg>
          </ToolBtn>

          <ToolBtn
            active={tool === "razor"}
            label="Razor"
            shortcut="C"
            onClick={() => setTool("razor")}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M9.5 7.5L14 2l-1.5-1L7 7 3.5 4 2 4l3.5 4L2 12l1.5 0L7 9l5.5 6 1.5-1L9.5 8.5z" />
            </svg>
          </ToolBtn>
        </div>

        <Sep />

        <button
          onClick={() => setSnap(!snap)}
          className="tl-btn"
          title="Snap (S)"
          style={{
            height: 22,
            borderRadius: 3,
            border: "none",
            background: snap
              ? rgba(C.playhead, 0.15)
              : "transparent",
            color: snap ? C.playhead : C.muted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: "0 5px",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M3 7a5 5 0 0110 0h-3a2 2 0 00-4 0H3z" />
            <rect x="3" y="8" width="3" height="5" rx=".5" />
            <rect x="10" y="8" width="3" height="5" rx=".5" />
          </svg>
          SNAP
        </button>

        <Sep />

        <button
          className="tl-btn"
          onClick={() =>
            setPps((p) => clamp(p * 0.8, MIN_PPS, MAX_PPS))
          }
          title="Zoom Out"
          style={zoomBtnStyle}
        >
          −
        </button>
        <input
          type="range"
          min={MIN_PPS}
          max={MAX_PPS}
          value={pps}
          onChange={(e) => setPps(Number(e.target.value))}
          style={{ width: 70, height: 3, accentColor: C.playhead }}
        />
        <button
          className="tl-btn"
          onClick={() =>
            setPps((p) => clamp(p * 1.25, MIN_PPS, MAX_PPS))
          }
          title="Zoom In"
          style={zoomBtnStyle}
        >
          +
        </button>
        <button
          className="tl-btn"
          onClick={fitToWidth}
          title="Fit to Width"
          style={{
            ...zoomBtnStyle,
            fontSize: 9,
            width: "auto",
            padding: "0 5px",
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          FIT
        </button>

        <div style={{ flex: 1 }} />

        {selectedScenes.size > 1 && (
          <span
            style={{
              fontSize: 10,
              color: C.selection,
              fontWeight: 600,
              marginRight: 8,
            }}
          >
            {selectedScenes.size} selected
          </span>
        )}

        <button
          className="tl-btn"
          onClick={() => onFrameStep?.(-1)}
          title="Step Back (J / ←)"
          style={transportBtnStyle}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <rect x="2" y="3" width="2" height="10" rx="0.5" />
            <path d="M14 3v10L6 8z" />
          </svg>
        </button>

        <button
          className="tl-btn"
          onClick={() => onTogglePlay?.()}
          title="Play / Pause (K / Space)"
          style={{
            ...transportBtnStyle,
            width: 28,
            background: isPlaying
              ? rgba(C.playhead, 0.2)
              : "transparent",
          }}
        >
          {isPlaying ? (
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M4 2v12l10-6z" />
            </svg>
          )}
        </button>

        <button
          className="tl-btn"
          onClick={() => onFrameStep?.(1)}
          title="Step Forward (L / →)"
          style={transportBtnStyle}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M2 3v10l8-5z" />
            <rect x="12" y="3" width="2" height="10" rx="0.5" />
          </svg>
        </button>

        <Sep />

        <div
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            color: C.text,
            background: "#111118",
            padding: "2px 8px",
            borderRadius: 3,
            letterSpacing: 1,
            border: `1px solid ${C.border}`,
          }}
        >
          {formatTC(playhead)}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Track headers */}
        <div
          style={{
            width: HEADER_W,
            flexShrink: 0,
            borderRight: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              height: RULER_H,
              borderBottom: `1px solid ${C.border}`,
              background: C.rulerBg,
            }}
          />
          <TrackHeader
            label="V2"
            color="#7580D8"
            h={OVERLAY_H}
            muted={v2Scenes.length === 0}
          />
          <TrackHeader label="V1" color="#E85D3A" h={TRACK_H} />
          <TrackHeader label="A1" color="#2AB5A8" h={AUDIO_H} />
        </div>

        {/* Scrollable area */}
        <div
          ref={scrollRef}
          className="premiere-scroll"
          style={{
            flex: 1,
            overflowX: "auto",
            overflowY: "hidden",
            position: "relative",
          }}
        >
          <div style={{ width: timelineW, position: "relative" }}>
            {/* ── Ruler ── */}
            <div
              onMouseDown={handleRulerDown}
              style={{
                height: RULER_H,
                background: C.rulerBg,
                borderBottom: `1px solid ${C.border}`,
                position: "relative",
                cursor: "text",
              }}
            >
              {ticks.map((t, i) => (
                <div
                  key={i}
                  style={{ position: "absolute", left: t.x }}
                >
                  <div
                    style={{
                      width: 1,
                      height: t.isMajor ? 14 : 6,
                      background: t.isMajor
                        ? C.tickMajor
                        : C.tick,
                      position: "absolute",
                      bottom: 0,
                    }}
                  />
                  {t.label && (
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: 4,
                        fontSize: 9,
                        color: C.rulerText,
                        whiteSpace: "nowrap",
                        fontFamily: "monospace",
                      }}
                    >
                      {t.label}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* ── V2 Track (Overlay) ── */}
            <div
              ref={v2TrackRef}
              style={{
                height: OVERLAY_H,
                background:
                  drag && drag.overTrack === 1
                    ? rgba("#7580D8", 0.08)
                    : C.overlayBg,
                borderBottom: `1px solid ${C.border}`,
                position: "relative",
                transition: "background 0.15s",
              }}
            >
              {v2Scenes.length === 0 && !drag && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      color: rgba(C.muted, 0.4),
                      letterSpacing: 0.5,
                    }}
                  >
                    Drag clips here to overlay
                  </span>
                </div>
              )}
              {drag &&
                drag.overTrack === 1 &&
                v2Scenes.length === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: "#7580D8",
                        fontWeight: 600,
                      }}
                    >
                      Drop here
                    </span>
                  </div>
                )}
              {renderClips(
                v2Scenes,
                v2Positions,
                1,
                OVERLAY_H - 8,
              )}

              {v2InsertX != null && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    height: OVERLAY_H,
                    width: 2,
                    left: v2InsertX - 1,
                    background: "#7580D8",
                    zIndex: 16,
                    pointerEvents: "none",
                    boxShadow:
                      "0 0 6px rgba(117,128,216,0.5)",
                  }}
                />
              )}
            </div>

            {/* ── V1 Track ── */}
            <div
              ref={v1TrackRef}
              style={{
                height: TRACK_H,
                background:
                  drag && drag.overTrack === 0
                    ? rgba("#E85D3A", 0.04)
                    : C.trackBg,
                borderBottom: `1px solid ${C.border}`,
                position: "relative",
                transition: "background 0.15s",
              }}
            >
              {v1Scenes.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: rgba(C.muted, 0.5),
                      letterSpacing: 0.3,
                    }}
                  >
                    Add scenes from the Scenes panel or drag media to the preview
                  </span>
                </div>
              )}
              {renderClips(
                v1Scenes,
                v1Positions,
                0,
                TRACK_H - 8,
              )}

              {v1InsertX != null && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    height: TRACK_H,
                    width: 2,
                    left: v1InsertX - 1,
                    background: "#fff",
                    zIndex: 16,
                    pointerEvents: "none",
                    boxShadow:
                      "0 0 6px rgba(255,255,255,0.5)",
                  }}
                />
              )}
            </div>

            {/* ── A1 Track (voiceover) ── */}
            <div
              style={{
                height: AUDIO_H,
                background: rgba(C.trackBg, 0.75),
                position: "relative",
              }}
            >
              {v1Scenes.map((sc, i) => {
                if (!sc.voiceoverScript) return null;
                const { x, w } = v1Positions[i];
                return (
                  <div
                    key={`a-${sc._id}`}
                    style={{
                      position: "absolute",
                      left: x + GAP / 2,
                      top: 4,
                      width: Math.max(20, w - GAP),
                      height: AUDIO_H - 8,
                      borderRadius: 3,
                      background: `linear-gradient(180deg, ${rgba("#2AB5A8", 0.4)} 0%, ${rgba("#2AB5A8", 0.2)} 100%)`,
                      border: `1px solid ${rgba("#2AB5A8", 0.2)}`,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 5px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0.12,
                        background:
                          "repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(42,181,168,0.5) 3px, rgba(42,181,168,0.5) 4px)",
                      }}
                    />
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 16 16"
                      fill="rgba(255,255,255,0.5)"
                      style={{
                        flexShrink: 0,
                        marginRight: 3,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <path
                        d={
                          "M8 1a3 3 0 00-3 3v4a3 3 0 006 0V4a3 3 0 00-3-3z" +
                          "M4 8a4 4 0 008 0h1a5 5 0 01-4.5 4.97V15h-1v-2.03A5 5 0 013 8h1z"
                        }
                      />
                    </svg>
                    <span
                      style={{
                        fontSize: 8,
                        color: "rgba(255,255,255,0.45)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      VO
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ── Playhead ── */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: playhead * pxPerFrame,
                width: 0,
                zIndex: 15,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: RULER_H - 8,
                  left: -5,
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: `8px solid ${C.playhead}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: RULER_H,
                  height: allTracksH,
                  width: 2,
                  left: -1,
                  background: C.playhead,
                  boxShadow: `0 0 6px ${rgba(C.playhead, 0.4)}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Drag ghost (follows cursor) ── */}
      {drag && (
        <div
          style={{
            position: "fixed",
            left: drag.cursorX - drag.offsetX,
            top: drag.cursorY - drag.offsetY,
            width: drag.clipW,
            height: drag.clipH,
            borderRadius: 4,
            background: `linear-gradient(180deg, ${rgba(drag.color, 0.9)} 0%, ${rgba(drag.color, 0.65)} 100%)`,
            border: `2px solid ${drag.color}`,
            opacity: 0.9,
            pointerEvents: "none",
            zIndex: 10000,
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${rgba(drag.color, 0.3)}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 2,
              background: drag.color,
              borderRadius: "4px 4px 0 0",
            }}
          />
          <div
            style={{
              padding: "2px 8px",
              display: "flex",
              flexDirection: "column",
              height: "calc(100% - 2px)",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#fff",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}
            >
              {drag.title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  fontSize: 8,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontWeight: 500,
                }}
              >
                {drag.sceneType}
              </span>
              {drag.overTrack != null && (
                <span
                  style={{
                    fontSize: 7,
                    color: "#fff",
                    background: rgba("#fff", 0.15),
                    padding: "1px 4px",
                    borderRadius: 2,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                  }}
                >
                  → {drag.overTrack === 0 ? "V1" : "V2"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Context menu ── */}
      {ctxMenu && (
        <div
          style={{
            position: "fixed",
            left: ctxMenu.x,
            top: ctxMenu.y,
            background: C.ctxBg,
            border: `1px solid ${C.ctxBorder}`,
            borderRadius: 6,
            padding: "4px 0",
            zIndex: 100,
            minWidth: 200,
            boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          }}
        >
          {ctxActions.map((act, i) => {
            if ("divider" in act && act.divider) {
              return (
                <div
                  key={i}
                  style={{
                    height: 1,
                    background: C.ctxBorder,
                    margin: "4px 8px",
                  }}
                />
              );
            }
            return (
              <button
                key={i}
                className="tl-ctx-item"
                onClick={() => {
                  if ("action" in act)
                    act.action(ctxMenu.sceneId);
                  setCtxMenu(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "6px 12px",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 11,
                  color:
                    "danger" in act && act.danger
                      ? "#E85D3A"
                      : C.text,
                }}
              >
                <span>{"label" in act ? act.label : ""}</span>
                {"shortcut" in act && act.shortcut && (
                  <span
                    style={{
                      fontSize: 9,
                      color: C.muted,
                      marginLeft: 16,
                    }}
                  >
                    {act.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ Sub-components ═══════════════════ */

const zoomBtnStyle: React.CSSProperties = {
  width: 22,
  height: 20,
  borderRadius: 3,
  border: "none",
  background: "transparent",
  color: C.text,
  cursor: "pointer",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const transportBtnStyle: React.CSSProperties = {
  width: 24,
  height: 22,
  borderRadius: 3,
  border: "none",
  background: "transparent",
  color: C.text,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function ToolBtn({
  active,
  label,
  shortcut,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  shortcut: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        className="tl-btn"
        style={{
          width: 28,
          height: 24,
          borderRadius: 4,
          border: "none",
          background: active ? C.playhead : "transparent",
          color: active ? "#fff" : C.text,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {children}
        <span
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            fontSize: 7,
            fontWeight: 700,
            color: active
              ? "rgba(255,255,255,0.7)"
              : rgba(C.muted, 0.8),
            lineHeight: 1,
          }}
        >
          {shortcut}
        </span>
      </button>

      {hovered && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 6,
            background: "#111120",
            border: `1px solid ${C.border}`,
            borderRadius: 5,
            padding: "5px 10px",
            whiteSpace: "nowrap",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: C.text,
              fontWeight: 500,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 10,
              color: C.muted,
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Shortcut:
            <kbd
              style={{
                background: rgba(C.border, 0.8),
                padding: "1px 5px",
                borderRadius: 3,
                fontSize: 10,
                fontFamily: "monospace",
                fontWeight: 600,
                color: C.text,
                border: `1px solid ${C.border}`,
              }}
            >
              {shortcut}
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
}

function Sep() {
  return (
    <div
      style={{
        width: 1,
        height: 14,
        background: C.border,
        margin: "0 3px",
      }}
    />
  );
}

function TrackHeader({
  label,
  color,
  h,
  muted,
}: {
  label: string;
  color: string;
  h: number;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        height: h,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 1,
        background: C.trackBg,
        opacity: muted ? 0.5 : 1,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: color,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function TrimHandle({
  edge,
  onMouseDown,
}: {
  edge: "left" | "right";
  onMouseDown: (e: RME) => void;
}) {
  const isLeft = edge === "left";
  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e);
      }}
      className="tl-trim-handle"
      style={{
        position: "absolute",
        [isLeft ? "left" : "right"]: 0,
        top: 0,
        bottom: 0,
        width: HANDLE_W,
        cursor: "col-resize",
        background: "transparent",
        zIndex: 6,
        borderRadius: isLeft ? "4px 0 0 4px" : "0 4px 4px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="tl-trim-handle-bar"
        style={{
          width: 2,
          height: 16,
          borderRadius: 1,
          background: "rgba(255,255,255,0.35)",
          opacity: 0,
          transition: "opacity 0.15s",
        }}
      />
    </div>
  );
}
