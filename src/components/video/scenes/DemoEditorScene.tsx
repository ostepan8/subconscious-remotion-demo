import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  animatedMeshBg,
  noiseOverlayStyle,
  scaleIn,
  glowOrbStyle,
  scanLineStyle,
  shimmerStyle,
  breathe,
  resolvePublicAsset,
} from "./shared";

const font = "Inter, system-ui, -apple-system, sans-serif";

const callouts: {
  label: string;
  x: string;
  y: string;
  anchor: "left" | "right";
  delay: number;
  color: string;
}[] = [
  {
    label: "AI Chat Agent",
    x: "85%",
    y: "18%",
    anchor: "right",
    delay: 30,
    color: "#ff5c28",
  },
  {
    label: "Live Video Preview",
    x: "48%",
    y: "12%",
    anchor: "left",
    delay: 42,
    color: "#3ed0c3",
  },
  {
    label: "Media & Scenes",
    x: "6%",
    y: "18%",
    anchor: "left",
    delay: 54,
    color: "#b5e800",
  },
  {
    label: "Timeline Editor",
    x: "35%",
    y: "88%",
    anchor: "left",
    delay: 66,
    color: "#ff5c28",
  },
];

export default function DemoEditorScene({
  content: _content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();

  // Screenshot entrance
  const imgEntrance = scaleIn(frame, 0, 25);
  const imgScale = parseFloat(
    (imgEntrance.transform as string).match(/scale\(([^)]+)\)/)?.[1] || "1",
  );
  const imgO = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ background: theme.colors.background, overflow: "hidden" }}
    >
      <div style={animatedMeshBg(frame, theme)} />
      <div style={noiseOverlayStyle()} />

      {/* Glow orbs */}
      <div style={glowOrbStyle(frame, "#ff5c28", 450, "75%", "10%", 0)} />
      <div style={glowOrbStyle(frame, "#3ed0c3", 350, "5%", "75%", 10)} />
      <div style={glowOrbStyle(frame, "#b5e800", 250, "60%", "85%", 18)} />

      {/* Screenshot in browser frame */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          right: 60,
          bottom: 40,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow:
            "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          opacity: imgO,
          transform: `scale(${imgScale})`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Chrome bar */}
        <div
          style={{
            height: 40,
            background: "#2a2a2e",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ff5f56",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ffbd2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#27c93f",
            }}
          />
          <div
            style={{
              flex: 1,
              marginLeft: 16,
              height: 26,
              borderRadius: 6,
              background: "#1a1a1e",
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              fontSize: 12,
              color: "#777",
              fontFamily: font,
            }}
          >
            subconscious.dev/editor/resume-tailor
          </div>
          <div style={shimmerStyle(frame, 15)} />
        </div>

        {/* Screenshot — static, no zoom */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <Img
            src={resolvePublicAsset("/screenshots/editor.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top left",
            }}
          />

          {/* Scan line */}
          <div style={scanLineStyle(frame, 20, "#3ed0c3", 40)} />

          {/* Callout overlays */}
          {callouts.map((c, i) => {
            const entrance = scaleIn(frame, c.delay, 16);
            const entranceScale = parseFloat(
              (entrance.transform as string)
                .match(/scale\(([^)]+)\)/)?.[1] || "1",
            );

            // Pulsing dot
            const dotBreath = breathe(frame, 0.08, 0.15, i * 20);
            const dotScale = parseFloat(
              (dotBreath.transform as string)
                .match(/scale\(([^)]+)\)/)?.[1] || "1",
            );

            // Glow intensity
            const glow = interpolate(
              frame,
              [c.delay + 20, c.delay + 40, c.delay + 60],
              [10, 22, 10],
              { extrapolateRight: "extend", extrapolateLeft: "clamp" },
            );

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: c.x,
                  top: c.y,
                  transform: `translate(${c.anchor === "right" ? "-100%" : "0"}, 0) scale(${entranceScale})`,
                  opacity: entrance.opacity as number,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: c.color,
                    boxShadow: `0 0 ${glow}px ${c.color}80, 0 0 ${glow * 2}px ${c.color}30`,
                    flexShrink: 0,
                    transform: `scale(${dotScale})`,
                  }}
                />
                <div
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: "rgba(16,24,32,0.85)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${c.color}40`,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f0f3ef",
                    fontFamily: font,
                    whiteSpace: "nowrap",
                    boxShadow: `0 0 20px ${c.color}20`,
                  }}
                >
                  {c.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
