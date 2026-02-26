import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  animatedMeshBg,
  noiseOverlayStyle,
  easings,
  fadeInBlur,
  scaleIn,
  fadeInUp,
  glowOrbStyle,
  glowBorderStyle,
  shimmerStyle,
  breathe,
  scanLineStyle,
  gradientText,
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

const themes = [
  {
    name: "Tech Startup",
    vibe: "Cyberpunk",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
    primary: "#6366f1",
    icon: "\u26A1",
    fontLabel: "Geist Mono",
  },
  {
    name: "SaaS",
    vibe: "Minimal",
    gradient: "linear-gradient(135deg, #3b82f6, #60a5fa, #dbeafe)",
    primary: "#3b82f6",
    icon: "\u2014",
    fontLabel: "DM Sans",
  },
  {
    name: "Portfolio",
    vibe: "Editorial",
    gradient: "linear-gradient(135deg, #d4a574, #8b7355, #f5f0eb)",
    primary: "#d4a574",
    icon: "\u00A7",
    fontLabel: "Playfair",
  },
  {
    name: "Agency",
    vibe: "Luxury",
    gradient: "linear-gradient(135deg, #f97316, #fbbf24, #fde68a)",
    primary: "#f97316",
    icon: "//",
    fontLabel: "Syne",
  },
  {
    name: "E-commerce",
    vibe: "Energetic",
    gradient: "linear-gradient(135deg, #eab308, #f59e0b, #fef3c7)",
    primary: "#eab308",
    icon: "\u2726",
    fontLabel: "Space Grotesk",
  },
];

const selectedIndex = 2;

export default function DemoThemePickerScene({
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

  // Header
  const headerStyle = fadeInBlur(frame, 8, 18);

  // Subtitle
  const subtitleStyle = fadeInUp(frame, 14, 20, 16);

  // Selection animation (card 2 gets selected)
  const selectScale = interpolate(frame, [80, 96], [1, 1.06], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.spring,
  });
  const selectRingO = interpolate(frame, [80, 92], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // "Selected" badge
  const badgeStyle = fadeInUp(frame, 100, 18, 16);

  // Color preview bar
  const previewWipe = interpolate(frame, [88, 118], [0, 100], {
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
      <div style={glowOrbStyle(frame, b.orange, 450, "15%", "15%", 0)} />
      <div style={glowOrbStyle(frame, b.teal, 350, "80%", "65%", 10)} />
      <div style={glowOrbStyle(frame, b.green, 280, "55%", "85%", 18)} />

      {/* Scan line */}
      <div style={scanLineStyle(frame, 5, b.orange, 35)} />

      {/* Main panel */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: "50%",
          transform: `translateX(-50%) scale(${(panelEntrance.transform as string).includes("scale") ? (panelEntrance.transform as string).match(/scale\(([^)]+)\)/)?.[1] || "1" : "1"})`,
          width: 780,
          bottom: 50,
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
            padding: "0 28px",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Img
                src="/brand/Subconscious_Logo_Graphic.svg"
                style={{ width: 26, height: 26 }}
              />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: b.black,
                  fontFamily: font,
                }}
              >
                Choose Your Theme
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            overflow: "hidden",
          }}
        >
          {/* Subtitle */}
          <div style={subtitleStyle}>
            <div
              style={{
                fontSize: 14,
                color: b.muted,
                fontFamily: font,
                fontWeight: 500,
              }}
            >
              Each theme sets colors, fonts, animations, and vibe for your
              entire video.
            </div>
          </div>

          {/* Theme cards grid */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "nowrap",
            }}
          >
            {themes.map((t, i) => {
              const cardEntrance = scaleIn(frame, 24 + i * 8, 18);
              const isSelected = i === selectedIndex;
              const cardScale = isSelected ? selectScale : 1;
              const cardBreath = breathe(frame, 0.03, 0.005, i * 40);
              const breathScale = isSelected
                ? 1
                : parseFloat(
                    (cardBreath.transform as string)
                      .match(/scale\(([^)]+)\)/)?.[1] || "1",
                  );

              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    overflow: "visible",
                    position: "relative",
                    ...(cardEntrance as React.CSSProperties),
                    transform: `scale(${parseFloat((cardEntrance.transform as string).match(/scale\(([^)]+)\)/)?.[1] || "1") * cardScale * breathScale})`,
                  }}
                >
                  {/* Glow border for selected card */}
                  {isSelected && selectRingO > 0 && (
                    <div
                      style={{
                        ...glowBorderStyle(frame, t.primary, 80),
                        borderRadius: 14,
                        opacity: selectRingO,
                      }}
                    />
                  )}

                  <div
                    style={{
                      borderRadius: 14,
                      border: isSelected
                        ? `2px solid ${t.primary}`
                        : `1px solid ${b.border}`,
                      background: b.white,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Gradient preview */}
                    <div
                      style={{
                        width: "100%",
                        height: 72,
                        background: t.gradient,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.9)",
                          fontFamily: font,
                        }}
                      >
                        {t.icon}
                      </span>
                    </div>

                    {/* Card info */}
                    <div style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: b.black,
                          fontFamily: font,
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: b.muted,
                          marginTop: 3,
                          fontFamily: font,
                        }}
                      >
                        {t.vibe} &middot; {t.fontLabel}
                      </div>
                    </div>

                    {/* Shimmer on selected card */}
                    {isSelected && frame >= 100 && (
                      <div style={shimmerStyle(frame, 100)} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color preview bar */}
          <div
            style={{
              marginTop: 8,
              height: 48,
              borderRadius: 12,
              background: b.white,
              border: `1px solid ${b.border}`,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: themes[selectedIndex].gradient,
                clipPath: `inset(0 ${100 - previewWipe}% 0 0)`,
                display: "flex",
                alignItems: "center",
                padding: "0 20px",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.95)",
                  fontFamily: font,
                  ...gradientText("#fff", "#f0f0f0"),
                  WebkitTextFillColor: "white",
                }}
              >
                Portfolio — Editorial elegance with warm tones
              </span>
            </div>
          </div>

          {/* Selected badge */}
          <div
            style={{
              ...badgeStyle,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: themes[selectedIndex].primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                color: themes[selectedIndex].primary,
                fontFamily: font,
              }}
            >
              Portfolio theme selected
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
