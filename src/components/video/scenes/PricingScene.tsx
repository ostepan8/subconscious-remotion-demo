import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  scaleIn,
  animatedNumber,
  meshGradientStyle,
  noiseOverlayStyle,
  glowOrbStyle,
  glassCard,
  depthShadow,
  shimmerStyle,
  spacing,
  getTypography,
  easings,
} from "./shared";

export default function PricingScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const bullets = content.bullets || ["Unlimited access", "Priority support", "Custom integrations"];

  const badgeSlide = interpolate(frame, [22, 38], [-20, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.spring,
  });
  const badgeOpacity = interpolate(frame, [22, 34], [0, 1], {
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
      <div style={glowOrbStyle(frame, theme.colors.primary, 500, "50%", "60%", 0)} />

      <div style={{
        position: "relative",
        ...fadeInBlur(frame, 4),
        ...typography.sectionTitle,
        color: theme.colors.text,
        marginBottom: 52,
      }}>
        {content.headline || "Simple Pricing"}
      </div>

      <div style={{
        position: "relative",
        ...scaleIn(frame, 12),
        ...glassCard(theme, spacing.borderRadius.xl),
        boxShadow: `${depthShadow(theme)}, 0 0 40px ${theme.colors.primary}08`,
        padding: "52px 56px",
        minWidth: 400,
        textAlign: "center",
        border: `1.5px solid ${theme.colors.primary}20`,
        overflow: "hidden",
      }}>
        <div style={shimmerStyle(frame, 20)} />

        <div style={{
          position: "absolute",
          top: -14,
          left: "50%",
          transform: `translateX(-50%) translateY(${badgeSlide}px)`,
          opacity: badgeOpacity,
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
          color: "#fff",
          padding: "7px 22px",
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          boxShadow: `0 4px 16px ${theme.colors.primary}30`,
        }}>
          Most Popular
        </div>

        <div style={{
          ...typography.stat,
          fontSize: 66,
          color: theme.colors.primary,
          marginBottom: 6,
        }}>
          {animatedNumber(frame, 14, content.price || "$29/mo", 28)}
        </div>
        <div style={{
          fontSize: 20,
          color: theme.colors.textMuted,
          marginBottom: 40,
        }}>
          {content.subtext || "Everything you need"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
          {bullets.map((b, i) => {
            const delay = 30 + i * 7;
            return (
              <div key={i} style={{
                ...fadeInUp(frame, delay, 20),
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  background: `${theme.colors.primary}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: theme.colors.primary,
                  fontWeight: 700,
                  boxShadow: `0 0 10px ${theme.colors.primary}15`,
                }}>
                  ✓
                </div>
                <div style={{ fontSize: 19, color: theme.colors.text, fontWeight: 500 }}>
                  {b}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
