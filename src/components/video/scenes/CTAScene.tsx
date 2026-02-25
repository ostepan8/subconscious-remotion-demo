import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  glowPulse,
  animatedMeshBg,
  noiseOverlayStyle,
  glowOrbStyle,
  scanLineStyle,
  themedHeadlineStyle,
  themedButtonStyle,
  spacing,
  getTypography,
  easings,
} from "./shared";

function FloatingOrb({
  frame,
  size,
  x,
  y,
  speed,
  amplitude,
}: {
  frame: number;
  size: number;
  x: string;
  y: string;
  speed: number;
  amplitude: number;
}) {
  const yOff = Math.sin(frame * speed) * amplitude;
  const xOff = Math.cos(frame * speed * 0.7) * (amplitude * 0.5);
  const scale = 1 + Math.sin(frame * speed * 0.5) * 0.1;

  return (
    <div style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.06)",
      filter: "blur(40px)",
      transform: `translate(${xOff}px, ${yOff}px) scale(${scale})`,
      pointerEvents: "none",
    }} />
  );
}

export default function CTAScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);
  const layout = (content.layout as string) || "bold";

  const headlineSize = content.headlineFontSize as number | undefined;
  const subtextSize = content.subtextFontSize as number | undefined;

  if (layout === "minimal") {
    return (
      <AbsoluteFill style={{
        background: theme.colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.scenePadding,
        overflow: "hidden",
      }}>
        <div style={animatedMeshBg(frame, theme)} />
        <div style={noiseOverlayStyle()} />
        <div style={glowOrbStyle(frame, theme.colors.primary, 600, "50%", "50%", 0)} />

        <div style={{
          position: "relative",
          ...fadeInBlur(frame, 4, 24),
          ...typography.heroTitle,
          fontSize: headlineSize || 64,
          ...themedHeadlineStyle(theme),
          textAlign: "center",
          maxWidth: 780,
        }}>
          {content.headline || "Let's Build Together"}
        </div>
        {content.buttonText && (
          <div style={{ marginTop: 48 }}>
            <div style={{
              ...glowPulse(frame, 24, theme.colors.primary),
              ...themedButtonStyle(theme),
            }}>
              {content.buttonText}
            </div>
          </div>
        )}
      </AbsoluteFill>
    );
  }

  const vibe = theme.personality?.vibe;
  const secondary = theme.colors.secondary || theme.colors.accent;

  const gradientShift = interpolate(frame, [0, 90], [135, 270], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });

  const boldBg = vibe === "editorial"
    ? theme.colors.primary
    : vibe === "luxury"
      ? theme.colors.primary
      : `linear-gradient(${gradientShift}deg, ${theme.colors.primary}, ${secondary}, ${theme.colors.primary}cc)`;

  const boldBtnBg = vibe === "editorial"
    ? theme.colors.accent
    : vibe === "luxury"
      ? theme.colors.accent
      : "#ffffff";

  const boldBtnColor = vibe === "editorial" || vibe === "luxury"
    ? "#ffffff"
    : theme.colors.primary;

  return (
    <AbsoluteFill style={{
      background: boldBg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.scenePadding,
      overflow: "hidden",
    }}>
      <div style={noiseOverlayStyle()} />

      <FloatingOrb frame={frame} size={400} x="-5%" y="-10%" speed={0.035} amplitude={25} />
      <FloatingOrb frame={frame} size={500} x="70%" y="60%" speed={0.025} amplitude={30} />
      <FloatingOrb frame={frame} size={250} x="25%" y="70%" speed={0.045} amplitude={18} />
      <FloatingOrb frame={frame} size={180} x="80%" y="10%" speed={0.04} amplitude={15} />

      {(vibe === "cyberpunk" || vibe === "energetic") && (
        <div style={scanLineStyle(frame, 6, "rgba(255,255,255,0.5)", 40)} />
      )}

      <div style={{
        position: "relative",
        ...fadeInBlur(frame, 4, 22),
        ...typography.heroTitle,
        fontSize: headlineSize || 72,
        color: "#ffffff",
        textAlign: "center",
        maxWidth: 880,
        textShadow: "0 2px 40px rgba(0,0,0,0.2)",
        ...(vibe === "editorial" ? { fontStyle: "italic" as const } : {}),
      }}>
        {content.headline || "Ready to get started?"}
      </div>
      {content.subtext && (
        <div style={{
          position: "relative",
          ...fadeInUp(frame, 18),
          fontSize: subtextSize || 26,
          color: "rgba(255,255,255,0.88)",
          textAlign: "center",
          maxWidth: 640,
          marginTop: 26,
          lineHeight: 1.55,
        }}>
          {content.subtext}
        </div>
      )}
      {content.buttonText && (
        <div style={{ position: "relative", marginTop: 52 }}>
          <div style={{
            ...glowPulse(frame, 28, "rgba(255,255,255,0.6)"),
            padding: "20px 60px",
            borderRadius: theme.borderRadius,
            background: boldBtnBg,
            color: boldBtnColor,
            fontSize: 20,
            fontWeight: vibe === "editorial" ? 500 : 700,
            letterSpacing: vibe === "editorial" || vibe === "luxury" ? "0.1em" : "0.01em",
            textTransform: vibe === "editorial" || vibe === "luxury" ? "uppercase" as const : "none" as const,
          }}>
            {content.buttonText}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
