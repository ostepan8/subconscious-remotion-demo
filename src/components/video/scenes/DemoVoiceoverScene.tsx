import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  animatedMeshBg,
  noiseOverlayStyle,
  easings,
  fadeInBlur,
  fadeInUp,
  scaleIn,
  glowOrbStyle,
  glowPulse,
  glowBorderStyle,
  shimmerStyle,
  scanLineStyle,
  breathe,
  typewriterReveal,
  resolvePublicAsset,
} from "./shared";

const font = "Inter, system-ui, -apple-system, sans-serif";
const b = {
  black: "#101820",
  cream: "#f0f3ef",
  orange: "#ff5c28",
  teal: "#3ed0c3",
  green: "#b5e800",
  white: "#ffffff",
  border: "#e8ebe5",
  muted: "#8a9a9e",
  surface: "#1a2430",
  panelBg: "#f8faf7",
};

const voices = [
  { name: "Rachel", desc: "Calm, natural", color: "#8b5cf6" },
  { name: "Bella", desc: "Soft, warm", color: "#ec4899" },
  { name: "Antoni", desc: "Professional", color: "#f97316" },
  { name: "Elli", desc: "Young, friendly", color: "#06b6d4" },
  { name: "Josh", desc: "Deep, authoritative", color: "#3b82f6" },
];

const sampleScript =
  "Introducing Resume Tailor — the AI-powered resume builder that crafts the perfect resume for every job application.";

const selectedVoice = 2; // Antoni
const NUM_BARS = 12;

export default function DemoVoiceoverScene({
  content: _content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();

  // Panel entrance
  const panelEntrance = scaleIn(frame, 0, 22);
  const panelBlur = fadeInBlur(frame, 0, 20);
  const panelOpacity =
    (panelEntrance.opacity as number) * (panelBlur.opacity as number);
  const panelScale = parseFloat(
    (panelEntrance.transform as string).match(/scale\(([^)]+)\)/)?.[1] || "1",
  );

  // Header
  const headerStyle = fadeInBlur(frame, 6, 16);

  // Script typewriter
  const { visibleChars, showCursor } = typewriterReveal(
    frame,
    16,
    sampleScript.length,
    50,
  );

  // Voice selection ring
  const voiceRingO = interpolate(frame, [86, 96], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Generate button
  const btnStyle = fadeInUp(frame, 96, 16, 14);
  const btnGlow = glowPulse(frame, 100, b.orange);

  // Waveform active during generation (frame 110–148)
  const waveO = interpolate(frame, [108, 114], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const waveSettled = frame >= 148;

  // Success badge
  const successO = interpolate(frame, [150, 162], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.spring,
  });
  const successGlow = glowPulse(frame, 152, b.green);

  // Playback bar
  const playStyle = fadeInUp(frame, 162, 14, 12);
  const playProgress = interpolate(frame, [168, 210], [0, 45], {
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
      <div style={glowOrbStyle(frame, b.orange, 400, "75%", "12%", 0)} />
      <div style={glowOrbStyle(frame, b.teal, 350, "8%", "70%", 8)} />
      <div style={glowOrbStyle(frame, b.green, 280, "85%", "85%", 16)} />

      {/* Scan line during generation */}
      {frame >= 108 && frame <= 155 && (
        <div style={scanLineStyle(frame, 108, b.orange, 30)} />
      )}

      {/* Main panel */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: "50%",
          transform: `translateX(-50%) scale(${panelScale})`,
          width: 720,
          bottom: 40,
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
        {/* Header bar */}
        <div
          style={{
            height: 60,
            borderBottom: `1px solid ${b.border}`,
            background: b.white,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Img
                src={resolvePublicAsset("/brand/Subconscious_Logo_Graphic.svg")}
                style={{ width: 24, height: 24 }}
              />
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: b.black,
                  fontFamily: font,
                }}
              >
                Generate Voiceover
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            padding: "24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            overflow: "hidden",
          }}
        >
          {/* Script section */}
          <div style={fadeInUp(frame, 10, 16, 14)}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: b.muted,
                fontFamily: font,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 8,
              }}
            >
              Script
            </div>
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${b.border}`,
                background: b.white,
                minHeight: 60,
                fontSize: 14,
                lineHeight: 1.6,
                color: b.black,
                fontFamily: font,
                position: "relative",
              }}
            >
              {sampleScript.slice(0, visibleChars)}
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

          {/* Voice selection */}
          <div style={fadeInUp(frame, 50, 14, 14)}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: b.muted,
                fontFamily: font,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 8,
              }}
            >
              Voice
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {voices.map((v, i) => {
                const cardAnim = scaleIn(frame, 55 + i * 6, 16);
                const isSelected = i === selectedVoice;
                const cardBreath = breathe(frame, 0.03, 0.004, i * 35);
                const bScale = isSelected
                  ? 1
                  : parseFloat(
                      (cardBreath.transform as string)
                        .match(/scale\(([^)]+)\)/)?.[1] || "1",
                    );

                return (
                  <div
                    key={i}
                    style={{
                      flex: "1 1 0",
                      minWidth: 110,
                      position: "relative",
                      overflow: "visible",
                      ...(cardAnim as React.CSSProperties),
                      transform: `scale(${parseFloat((cardAnim.transform as string).match(/scale\(([^)]+)\)/)?.[1] || "1") * bScale})`,
                    }}
                  >
                    {isSelected && voiceRingO > 0 && (
                      <div
                        style={{
                          ...glowBorderStyle(frame, v.color, 86),
                          borderRadius: 10,
                          opacity: voiceRingO,
                        }}
                      />
                    )}
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: isSelected
                          ? `2px solid ${v.color}`
                          : `1px solid ${b.border}`,
                        background: isSelected
                          ? `${v.color}08`
                          : b.white,
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: `${v.color}20`,
                          margin: "0 auto 6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                            fill={v.color}
                          />
                          <path
                            d="M19 10v2a7 7 0 0 1-14 0v-2"
                            stroke={v.color}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <line
                            x1="12"
                            y1="19"
                            x2="12"
                            y2="23"
                            stroke={v.color}
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: b.black,
                          fontFamily: font,
                        }}
                      >
                        {v.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: b.muted,
                          fontFamily: font,
                          marginTop: 2,
                        }}
                      >
                        {v.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate button */}
          {frame >= 96 && (
            <div
              style={{
                ...btnStyle,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  padding: "10px 28px",
                  borderRadius: 12,
                  background: b.orange,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: font,
                  ...(frame >= 100 ? btnGlow : {}),
                  transform: btnGlow.transform || "scale(1)",
                }}
              >
                {frame >= 110 ? "Generating..." : "Generate Audio"}
              </div>
            </div>
          )}

          {/* Waveform visualization */}
          {frame >= 108 && (
            <div
              style={{
                display: "flex",
                alignItems: "end",
                justifyContent: "center",
                gap: 4,
                height: 44,
                opacity: waveO,
              }}
            >
              {Array.from({ length: NUM_BARS }).map((_, i) => {
                const barHeight = waveSettled
                  ? interpolate(frame, [148, 160], [
                      8 + Math.sin(i * 1.2) * 16 + 16,
                      6,
                    ], {
                      extrapolateRight: "clamp",
                      extrapolateLeft: "clamp",
                      easing: easings.smooth,
                    })
                  : interpolate(
                      Math.sin((frame - 110 + i * 5) * 0.35),
                      [-1, 1],
                      [6, 38],
                    );
                return (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: barHeight,
                      borderRadius: 3,
                      background:
                        waveSettled && frame >= 160
                          ? b.green
                          : b.orange,
                      transition: "background 0.2s",
                      boxShadow: waveSettled
                        ? "none"
                        : `0 0 8px ${b.orange}40`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Success badge */}
          {frame >= 150 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                opacity: successO,
                transform: successGlow.transform || "scale(1)",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: b.green,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 16px ${b.green}50`,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l5 5L19 7"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: b.green,
                  fontFamily: font,
                }}
              >
                Audio ready
              </span>
              {frame >= 155 && <div style={shimmerStyle(frame, 155)} />}
            </div>
          )}

          {/* Playback bar */}
          {frame >= 162 && (
            <div style={playStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: b.white,
                  border: `1px solid ${b.border}`,
                }}
              >
                {/* Play button */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: b.orange,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 0 12px ${b.orange}40`,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: `${b.border}`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${playProgress}%`,
                      height: "100%",
                      borderRadius: 2,
                      background: b.orange,
                      boxShadow: `0 0 6px ${b.orange}50`,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: b.muted,
                    fontFamily: font,
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  0:04 / 0:10
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
}
