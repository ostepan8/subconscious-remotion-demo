import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  scaleIn,
  glowPulse,
  meshGradientStyle,
  noiseOverlayStyle,
  glowOrbStyle,
  glassCard,
  depthShadow,
  spacing,
  getTypography,
  easings,
} from "./shared";

export default function CountdownScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const blocks = [
    { value: "12", label: "Days" },
    { value: "08", label: "Hours" },
    { value: "45", label: "Min" },
    { value: "30", label: "Sec" },
  ];

  // Tick animation for seconds
  const secTick = interpolate(frame, [0, 30], [30, 0], {
    extrapolateRight: "clamp",
    easing: easings.decel,
  });
  blocks[3].value = String(Math.round(secTick)).padStart(2, "0");

  return (
    <AbsoluteFill style={{
      background: theme.colors.background,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.scenePadding,
    }}>
      <div style={meshGradientStyle(theme)} />
      <div style={noiseOverlayStyle()} />
      <div style={glowOrbStyle(frame, theme.colors.primary, 600, "50%", "50%", 0)} />

      <div style={{
        position: "relative",
        ...fadeInBlur(frame, 4),
        ...typography.sectionTitle,
        fontSize: 58,
        color: theme.colors.text,
        textAlign: "center",
        marginBottom: 18,
      }}>
        {content.headline || "Launching Soon"}
      </div>

      {content.subtext && (
        <div style={{
          position: "relative",
          ...fadeInUp(frame, 14),
          fontSize: 24,
          color: theme.colors.textMuted,
          textAlign: "center",
          marginBottom: 52,
          maxWidth: 560,
          lineHeight: 1.5,
        }}>
          {content.subtext}
        </div>
      )}

      <div style={{
        position: "relative",
        display: "flex",
        gap: 16,
        justifyContent: "center",
      }}>
        {blocks.map((block, i) => {
          const delay = 18 + i * 8;
          return (
            <div key={i} style={{
              ...scaleIn(frame, delay, 18),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
              <div style={{
                ...glassCard(theme, spacing.borderRadius.lg),
                boxShadow: `${depthShadow(theme)}, 0 0 24px ${theme.colors.primary}12`,
                padding: "32px 28px",
                minWidth: 130,
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${theme.colors.primary}18`,
              }}>
                <div style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "50%",
                  height: 1,
                  background: `${theme.colors.textMuted}0a`,
                }} />
                <div style={{
                  ...typography.stat,
                  fontSize: 60,
                  color: theme.colors.text,
                  position: "relative",
                }}>
                  {block.value}
                </div>
              </div>
              <div style={{
                ...typography.caption,
                color: theme.colors.textMuted,
                marginTop: 12,
              }}>
                {block.label}
              </div>
            </div>
          );
        })}
      </div>

      {content.buttonText && (
        <div style={{ position: "relative", marginTop: 48 }}>
          <div style={{
            ...glowPulse(frame, 46, theme.colors.primary),
            padding: "18px 48px",
            borderRadius: spacing.borderRadius.md,
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
            color: "#fff",
            fontSize: 19,
            fontWeight: 700,
          }}>
            {content.buttonText}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
