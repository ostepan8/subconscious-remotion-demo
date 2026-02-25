import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  scaleIn,
  meshGradientStyle,
  noiseOverlayStyle,
  glassCard,
  spacing,
  getTypography,
  easings,
} from "./shared";

export default function LogoCloudScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const logos = content.logos || [
    "Acme Inc",
    "TechCorp",
    "StartupXYZ",
    "GlobalCo",
    "NextGen",
    "CloudBase",
  ];

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
        ...typography.caption,
        fontSize: 16,
        color: theme.colors.textMuted,
        marginBottom: spacing.sectionGap,
      }}>
        {content.headline || "Trusted By"}
      </div>

      <div style={{
        position: "relative",
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        justifyContent: "center",
        alignItems: "center",
        maxWidth: 840,
      }}>
        {logos.map((logo, i) => {
          const delay = 14 + i * 7;
          const floatY = interpolate(
            frame,
            [0, 40, 80, 120],
            [0, -3, 0, 3],
            { extrapolateRight: "extend" },
          );
          const offset = (i % 3) * 12;

          return (
            <div key={i} style={{
              ...scaleIn(frame, delay),
              transform: `${(scaleIn(frame, delay).transform || "")} translateY(${floatY + (i % 2 === 0 ? offset * 0.1 : -offset * 0.1)}px)`,
            }}>
              <div style={{
                padding: "16px 32px",
                ...glassCard(theme, spacing.borderRadius.md),
                fontSize: 17,
                fontWeight: 700,
                color: theme.colors.text,
                letterSpacing: "-0.01em",
                opacity: 0.65,
              }}>
                {logo}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
