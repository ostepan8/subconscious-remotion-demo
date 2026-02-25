import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  slideFromLeft,
  meshGradientStyle,
  noiseOverlayStyle,
  glowOrbStyle,
  glassCard,
  depthShadow,
  spacing,
  getTypography,
} from "./shared";

export default function CustomScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  return (
    <AbsoluteFill style={{ background: theme.colors.background }}>
      <div style={meshGradientStyle(theme)} />
      <div style={noiseOverlayStyle()} />
      <div style={glowOrbStyle(frame, theme.colors.primary, 450, "50%", "45%", 0)} />

      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: spacing.scenePadding,
      }}>
        {(content.headline || content.subtext) && (
          <div style={{
            ...glassCard(theme, spacing.borderRadius.xl),
            boxShadow: depthShadow(theme),
            padding: "48px 56px",
            maxWidth: 780,
            textAlign: "center",
          }}>
            {content.headline && (
              <div style={{
                ...fadeInBlur(frame, 5),
                fontSize: (content.headlineFontSize as number) || 52,
                fontWeight: 800,
                color: theme.colors.text,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}>
                {content.headline}
              </div>
            )}
            {content.subtext && (
              <div style={{
                ...fadeInUp(frame, 18),
                ...typography.bodyLg,
                fontSize: (content.subtextFontSize as number) || typography.bodyLg.fontSize,
                color: theme.colors.textMuted,
                marginTop: 22,
              }}>
                {content.subtext}
              </div>
            )}
            {content.bullets && content.bullets.length > 0 && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                alignItems: "flex-start",
                marginTop: 32,
                paddingLeft: 20,
              }}>
                {content.bullets.map((b, i) => {
                  const delay = 26 + i * 8;
                  return (
                    <div key={i} style={{
                      ...slideFromLeft(frame, delay, 25, 14),
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                        boxShadow: `0 0 8px ${theme.colors.primary}30`,
                        flexShrink: 0,
                      }} />
                      <div style={{ fontSize: 18, color: theme.colors.text, fontWeight: 500 }}>
                        {b}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
