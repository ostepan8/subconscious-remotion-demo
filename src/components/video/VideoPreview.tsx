"use client";

import { type ForwardedRef, forwardRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import VideoComposition from "./VideoComposition";
import type { SceneData } from "./VideoComposition";
import { TRANSITION_DURATION_FRAMES } from "./VideoComposition";
import type { VideoTheme } from "@/types";

interface VideoPreviewProps {
  scenes: SceneData[];
  theme: VideoTheme;
}

const VideoPreview = forwardRef(function VideoPreview(
  { scenes, theme }: VideoPreviewProps,
  ref: ForwardedRef<PlayerRef>,
) {
  const transitionCount = scenes.filter(
    (s, i) => i < scenes.length - 1 && s.transition !== "none",
  ).length;
  const rawDuration = scenes.reduce(
    (sum, s) => sum + (s.durationInFrames || 0),
    0,
  );
  const totalDuration = Math.max(
    rawDuration - transitionCount * TRANSITION_DURATION_FRAMES,
    1,
  );

  if (scenes.length === 0) {
    return (
      <div
        className="w-full rounded-xl overflow-hidden shadow-lg flex items-center justify-center"
        style={{ border: "1px solid var(--border)", aspectRatio: "16/9", background: "#0a0a1a" }}
      >
        <div className="text-center">
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🎬</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 500 }}>
            No scenes yet
          </div>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 4 }}>
            Add scenes from the panel or drag media here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg" style={{ border: "1px solid var(--border)" }}>
      <Player
        ref={ref}
        component={VideoComposition}
        inputProps={{ scenes, theme }}
        durationInFrames={totalDuration}
        compositionWidth={1920}
        compositionHeight={1080}
        fps={30}
        style={{ width: "100%", aspectRatio: "16/9" }}
        controls
        autoPlay={false}
        loop
        spaceKeyToPlayOrPause={false}
      />
    </div>
  );
});

export default VideoPreview;
