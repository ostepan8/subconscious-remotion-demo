import { AbsoluteFill, OffthreadVideo, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import { fadeInUp, easings } from "./shared";

export default function VideoClipScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });

  // Cinematic letterbox bars
  const barHeight = interpolate(frame, [0, 20], [120, 60], {
    extrapolateRight: "clamp",
    easing: easings.snappy,
  });
  const barOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const mediaUrl = content.mediaUrl as string | undefined;

  return (
    <AbsoluteFill style={{ background: theme.colors.background, overflow: "hidden" }}>
      {mediaUrl ? (
        <AbsoluteFill style={{ opacity }}>
          <OffthreadVideo
            src={mediaUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {content.headline && (
            <AbsoluteFill style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 40%)",
            }} />
          )}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{
          background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.background})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: `${theme.colors.primary}10`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            opacity: 0.3,
            color: theme.colors.text,
            border: `2px solid ${theme.colors.textMuted}10`,
          }}>
            ▶
          </div>
        </AbsoluteFill>
      )}

      {/* Letterbox bars */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: barHeight,
        background: "#000",
        opacity: barOpacity,
        zIndex: 5,
      }} />
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: barHeight,
        background: "#000",
        opacity: barOpacity,
        zIndex: 5,
      }} />

      {content.headline && (
        <AbsoluteFill style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: `${barHeight + 20}px 60px`,
          zIndex: 6,
        }}>
          <div style={{
            ...fadeInUp(frame, 14, 25),
            fontSize: 42,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            letterSpacing: "-0.02em",
            textShadow: "0 2px 28px rgba(0,0,0,0.7), 0 6px 60px rgba(0,0,0,0.35)",
          }}>
            {content.headline}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
