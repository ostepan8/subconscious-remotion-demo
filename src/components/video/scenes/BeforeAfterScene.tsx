import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  slideFromLeft,
  slideFromRight,
  meshGradientStyle,
  noiseOverlayStyle,
  glassCard,
  depthShadow,
  spacing,
  getTypography,
  easings,
} from "./shared";

export default function BeforeAfterScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const before = content.before || {
    title: "Before",
    points: ["Manual processes", "Slow turnaround", "Scattered tools"],
  };
  const after = content.after || {
    title: "After",
    points: ["Fully automated", "10x faster", "All-in-one platform"],
  };

  // Animated divider line
  const dividerHeight = interpolate(frame, [20, 42], [0, 100], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });
  const dividerGlow = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

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

      <div style={{
        position: "relative",
        ...fadeInBlur(frame, 4),
        ...typography.sectionTitle,
        color: theme.colors.text,
        textAlign: "center",
        marginBottom: spacing.sectionGap,
      }}>
        {content.headline || "The Transformation"}
      </div>

      <div style={{
        position: "relative",
        display: "flex",
        gap: 0,
        width: "100%",
        maxWidth: 900,
        alignItems: "stretch",
      }}>
        {/* Before side */}
        <div style={{
          flex: 1,
          ...slideFromLeft(frame, 12, 50, 22),
          padding: "36px 40px",
          ...glassCard(theme, spacing.borderRadius.lg),
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: depthShadow(theme),
          borderRight: "none",
        }}>
          <div style={{
            ...typography.caption,
            color: theme.colors.textMuted,
            marginBottom: 20,
            opacity: 0.6,
          }}>
            {before.title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {before.points.map((p, i) => {
              const delay = 30 + i * 8;
              return (
                <div key={i} style={{
                  ...fadeInUp(frame, delay, 16),
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}>
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: `${theme.colors.textMuted}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: theme.colors.textMuted,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    ✕
                  </div>
                  <div style={{ fontSize: 19, color: theme.colors.textMuted, fontWeight: 500 }}>
                    {p}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Animated divider */}
        <div style={{
          width: 3,
          alignSelf: "stretch",
          position: "relative",
          zIndex: 2,
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: `${dividerHeight}%`,
            background: `linear-gradient(180deg, ${theme.colors.primary}, ${theme.colors.accent})`,
            borderRadius: 2,
            boxShadow: dividerGlow > 0
              ? `0 0 16px ${theme.colors.primary}${Math.round(dividerGlow * 50).toString(16).padStart(2, "0")}`
              : "none",
          }} />
        </div>

        {/* After side */}
        <div style={{
          flex: 1,
          ...slideFromRight(frame, 12, 50, 22),
          padding: "36px 40px",
          ...glassCard(theme, spacing.borderRadius.lg),
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          boxShadow: depthShadow(theme),
          borderLeft: "none",
          background: `${theme.colors.primary}08`,
        }}>
          <div style={{
            ...typography.caption,
            color: theme.colors.primary,
            marginBottom: 20,
          }}>
            {after.title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {after.points.map((p, i) => {
              const delay = 30 + i * 8;
              return (
                <div key={i} style={{
                  ...fadeInUp(frame, delay, 16),
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}>
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: `${theme.colors.primary}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: theme.colors.primary,
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${theme.colors.primary}15`,
                  }}>
                    ✓
                  </div>
                  <div style={{ fontSize: 19, color: theme.colors.text, fontWeight: 600 }}>
                    {p}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
