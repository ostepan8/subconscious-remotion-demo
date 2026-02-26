import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  animatedMeshBg,
  noiseOverlayStyle,
  easings,
  fadeInBlur,
  slideFromRight,
  slideFromLeft,
  scaleIn,
  glowOrbStyle,
  glowPulse,
  shimmerStyle,
  scanLineStyle,
  typewriterReveal,
} from "./shared";

const font = "Inter, system-ui, -apple-system, sans-serif";
const b = {
  black: "#101820",
  cream: "#f0f3ef",
  orange: "#ff5c28",
  teal: "#3ed0c3",
  muted: "#8a9a9e",
  surface: "#1a2430",
  panelBg: "#f8faf7",
  white: "#ffffff",
  border: "#e8ebe5",
};

const userMsg =
  "generate me a custom scene for 10 seconds with 10 seconds of eleven labs script for the resume tailor project. be sure to use my branding";

const agentMsg =
  "A custom 10-second hero scene was built for Resume Tailor, using the brand logo, modern dark theme, and a punchy voiceover. The scene is cinematic, on-brand, and ready for your video. The ElevenLabs voiceover script is generated and will appear in the timeline shortly.";

export default function DemoChatScene({
  content: _content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();

  // Panel entrance — combined scaleIn + fadeInBlur
  const panelScale = scaleIn(frame, 0, 20);
  const panelBlur = fadeInBlur(frame, 0, 18);
  const panelScaleVal = parseFloat(
    (panelScale.transform as string).match(/scale\(([^)]+)\)/)?.[1] || "1",
  );
  const panelOpacity =
    (panelScale.opacity as number) * (panelBlur.opacity as number);

  // User message — spring slide from right
  const userSlide = slideFromRight(frame, 18, 30, 14);

  // Thinking dots
  const thinkO = interpolate(frame, [38, 46], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const thinkGone = interpolate(frame, [54, 58], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Agent response — spring slide from left
  const agentSlide = slideFromLeft(frame, 56, 30, 14);

  // Typewriter from shared utility
  const { visibleChars: agentChars, showCursor } = typewriterReveal(
    frame,
    60,
    agentMsg.length,
    70,
  );

  // Status badge with glow pulse
  const statusGlow = glowPulse(frame, 136, b.teal);
  const statusO = interpolate(frame, [136, 146], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });

  return (
    <AbsoluteFill
      style={{ background: theme.colors.background, overflow: "hidden" }}
    >
      <div style={animatedMeshBg(frame, theme)} />
      <div style={noiseOverlayStyle()} />

      {/* Glow orbs */}
      <div style={glowOrbStyle(frame, b.orange, 400, "80%", "15%", 0)} />
      <div style={glowOrbStyle(frame, b.teal, 300, "10%", "70%", 12)} />

      {/* Chat panel */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: `translateX(-50%) scale(${panelScaleVal})`,
          width: 680,
          bottom: 60,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow:
            "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          opacity: panelOpacity,
          filter: panelBlur.filter as string,
          display: "flex",
          flexDirection: "column",
          background: b.panelBg,
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 64,
            borderBottom: `1px solid ${b.border}`,
            background: b.white,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <Img
            src="/brand/Subconscious_Logo_Graphic.svg"
            style={{ width: 28, height: 28 }}
          />
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: b.black,
                fontFamily: font,
              }}
            >
              Subconscious Agent
            </div>
          </div>
          {/* Active badge */}
          <div
            style={{
              marginLeft: "auto",
              fontSize: 12,
              fontWeight: 600,
              color: b.teal,
              fontFamily: font,
              opacity: statusO,
            }}
          >
            Active
          </div>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Scan line during thinking */}
          {frame >= 38 && frame <= 62 && (
            <div style={scanLineStyle(frame, 38, b.orange, 20)} />
          )}

          {/* User message */}
          <div
            style={{
              alignSelf: "flex-end",
              maxWidth: "85%",
              ...(userSlide as React.CSSProperties),
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                borderBottomRightRadius: 4,
                background: b.orange,
                color: "#fff",
                fontSize: 15,
                lineHeight: 1.5,
                fontFamily: font,
                fontWeight: 500,
              }}
            >
              {userMsg}
            </div>
          </div>

          {/* Thinking indicator */}
          {thinkO > 0 && thinkGone > 0 && (
            <div
              style={{
                alignSelf: "flex-start",
                opacity: thinkO * thinkGone,
                display: "flex",
                gap: 6,
                padding: "12px 18px",
              }}
            >
              {[0, 1, 2].map((dot) => {
                const bounce = Math.sin((frame - 40 + dot * 5) * 0.2) * 4;
                return (
                  <div
                    key={dot}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: b.orange,
                      opacity: 0.6,
                      transform: `translateY(${bounce}px)`,
                      boxShadow: `0 0 8px ${b.orange}60`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Agent response */}
          <div
            style={{
              alignSelf: "flex-start",
              maxWidth: "88%",
              ...(agentSlide as React.CSSProperties),
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <Img
                src="/brand/Subconscious_Logo_Graphic.svg"
                style={{
                  width: 24,
                  height: 24,
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: 16,
                  borderBottomLeftRadius: 4,
                  background: b.white,
                  border: `1px solid ${b.border}`,
                  color: b.black,
                  fontSize: 15,
                  lineHeight: 1.55,
                  fontFamily: font,
                }}
              >
                {agentMsg.slice(0, agentChars)}
                {showCursor && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 16,
                      background: b.orange,
                      marginLeft: 1,
                      verticalAlign: "text-bottom",
                      boxShadow: `0 0 8px ${b.orange}, 0 0 16px ${b.orange}60`,
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Success status */}
          {frame >= 136 && (
            <div
              style={{
                alignSelf: "flex-start",
                marginLeft: 36,
                opacity: statusO,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: b.teal,
                fontWeight: 600,
                fontFamily: font,
                ...statusGlow,
                transform: statusGlow.transform || "scale(1)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill={b.teal} opacity={0.15} />
                <path
                  d="M8 12l3 3 5-5"
                  stroke={b.teal}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Scene generated + voiceover queued
            </div>
          )}
        </div>

        {/* Input bar */}
        <div
          style={{
            height: 72,
            borderTop: `1px solid ${b.border}`,
            background: b.white,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 12,
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 42,
              borderRadius: 12,
              border: `1px solid ${b.border}`,
              background: b.panelBg,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              fontSize: 14,
              color: b.muted,
              fontFamily: font,
            }}
          >
            Describe your product or ask for changes...
          </div>
          <div
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              background: b.orange,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: font,
            }}
          >
            Send
          </div>
          {/* Shimmer on input bar after settling */}
          {frame >= 140 && <div style={shimmerStyle(frame, 140)} />}
        </div>
      </div>
    </AbsoluteFill>
  );
}
