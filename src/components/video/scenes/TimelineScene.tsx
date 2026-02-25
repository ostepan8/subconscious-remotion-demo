import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  revealLine,
  meshGradientStyle,
  noiseOverlayStyle,
  glassCard,
  depthShadow,
  accentColor,
  spacing,
  getTypography,
  easings,
} from "./shared";

export default function TimelineScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const milestones = content.milestones || [
    { year: "2020", title: "Founded", description: "Started with a vision" },
    { year: "2022", title: "10K Users", description: "Rapid growth phase" },
    { year: "2024", title: "Series A", description: "$12M funding raised" },
    { year: "2025", title: "Global", description: "Launched in 40+ countries" },
  ];

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
        marginBottom: 64,
      }}>
        {content.headline || "Our Journey"}
      </div>

      <div style={{
        position: "relative",
        display: "flex",
        gap: 0,
        alignItems: "flex-start",
        width: "100%",
        maxWidth: 940,
        justifyContent: "center",
      }}>
        {/* Horizontal connector line */}
        <div style={{
          position: "absolute",
          top: 20,
          left: "8%",
          right: "8%",
          height: 2,
          background: `${theme.colors.textMuted}12`,
          borderRadius: 1,
        }}>
          <div style={{
            ...revealLine(frame, 12, 50),
            height: "100%",
            background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})`,
            borderRadius: 1,
            boxShadow: `0 0 10px ${theme.colors.primary}25`,
          }} />
        </div>

        {milestones.map((m, i) => {
          const delay = 16 + i * 14;
          const color = accentColor(theme, i);

          const nodeScale = interpolate(frame, [delay, delay + 14], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
            easing: easings.spring,
          });

          const pulseRing = interpolate(
            frame,
            [delay + 20, delay + 40, delay + 60],
            [1, 1.6, 2],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
          );
          const pulseOpacity = interpolate(
            frame,
            [delay + 20, delay + 40, delay + 60],
            [0.3, 0.15, 0],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
          );

          return (
            <div key={i} style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
            }}>
              {/* Node */}
              <div style={{
                position: "relative",
                marginBottom: 20,
                width: 40,
                height: 40,
              }}>
                <div style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `2px solid ${color}`,
                  transform: `scale(${pulseRing})`,
                  opacity: pulseOpacity,
                }} />
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  transform: `scale(${nodeScale})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 16px ${color}35`,
                  position: "relative",
                  zIndex: 2,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                </div>
              </div>

              {/* Card */}
              <div style={{
                ...fadeInUp(frame, delay + 6, 22),
                padding: "18px 20px",
                ...glassCard(theme, spacing.borderRadius.md),
                boxShadow: depthShadow(theme),
                width: "92%",
                maxWidth: 220,
              }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color,
                  letterSpacing: "0.04em",
                  marginBottom: 8,
                }}>
                  {m.year}
                </div>
                <div style={{
                  ...typography.cardTitle,
                  fontSize: 20,
                  color: theme.colors.text,
                  marginBottom: 5,
                }}>
                  {m.title}
                </div>
                <div style={{ fontSize: 15, color: theme.colors.textMuted, lineHeight: 1.5 }}>
                  {m.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
