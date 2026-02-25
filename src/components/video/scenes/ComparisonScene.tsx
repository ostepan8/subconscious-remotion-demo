import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  slideFromLeft,
  meshGradientStyle,
  noiseOverlayStyle,
  glassCard,
  depthShadow,
  spacing,
  getTypography,
  easings,
} from "./shared";

export default function ComparisonScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const items = content.items || [
    { label: "Speed", us: "Lightning fast", them: "Average" },
    { label: "Price", us: "$29/mo", them: "$99/mo" },
    { label: "Support", us: "24/7", them: "Business hours" },
    { label: "Integrations", us: "150+", them: "30" },
  ];

  const usLabel = (content.usLabel as string) || "Us";
  const themLabel = (content.themLabel as string) || "Others";

  return (
    <AbsoluteFill style={{
      background: theme.colors.background,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: `70px ${spacing.scenePaddingX}px`,
    }}>
      <div style={meshGradientStyle(theme)} />
      <div style={noiseOverlayStyle()} />

      <div style={{
        position: "relative",
        ...fadeInBlur(frame, 4),
        ...typography.sectionTitle,
        color: theme.colors.text,
        marginBottom: 52,
      }}>
        {content.headline || "Why Us?"}
      </div>

      <div style={{
        position: "relative",
        ...fadeInUp(frame, 14, 30),
        width: "100%",
        maxWidth: 800,
        borderRadius: spacing.borderRadius.lg,
        overflow: "hidden",
        ...glassCard(theme, spacing.borderRadius.lg),
        boxShadow: depthShadow(theme),
      }}>
        <div style={{
          display: "flex",
          borderBottom: `1px solid ${theme.colors.textMuted}15`,
          padding: "4px 0",
        }}>
          <div style={{ flex: 1.2, padding: "18px 32px" }} />
          <div style={{
            flex: 1,
            padding: "18px 28px",
            fontSize: 17,
            fontWeight: 700,
            color: theme.colors.primary,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: theme.colors.primary,
              boxShadow: `0 0 10px ${theme.colors.primary}50`,
            }} />
            {usLabel}
          </div>
          <div style={{
            flex: 1,
            padding: "18px 28px",
            fontSize: 17,
            fontWeight: 600,
            color: theme.colors.textMuted,
            textAlign: "center",
          }}>
            {themLabel}
          </div>
        </div>

        {items.map((item, i) => {
          const delay = 26 + i * 8;
          const rowAnim = slideFromLeft(frame, delay, 30, 16);

          return (
            <div key={i} style={{
              ...rowAnim,
              display: "flex",
              borderBottom: i < items.length - 1 ? `1px solid ${theme.colors.textMuted}0a` : "none",
              background: i % 2 === 0 ? "transparent" : `${theme.colors.surface}40`,
            }}>
              <div style={{
                flex: 1.2,
                padding: "17px 32px",
                fontSize: 18,
                fontWeight: 600,
                color: theme.colors.text,
              }}>
                {item.label}
              </div>
              <div style={{
                flex: 1,
                padding: "17px 28px",
                fontSize: 18,
                fontWeight: 600,
                color: theme.colors.primary,
                textAlign: "center",
                background: `${theme.colors.primary}08`,
              }}>
                {item.us}
              </div>
              <div style={{
                flex: 1,
                padding: "17px 28px",
                fontSize: 18,
                color: theme.colors.textMuted,
                textAlign: "center",
              }}>
                {item.them}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
