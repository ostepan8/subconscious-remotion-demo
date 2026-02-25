import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  scaleIn,
  meshGradientStyle,
  noiseOverlayStyle,
  glassCard,
  depthShadow,
  accentColor,
  spacing,
  getTypography,
  easings,
} from "./shared";

export default function TeamScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const members = content.members || [
    { name: "Alex Chen", role: "CEO & Founder", initial: "A" },
    { name: "Sarah Park", role: "CTO", initial: "S" },
    { name: "Mike Torres", role: "Head of Design", initial: "M" },
    { name: "Jamie Lee", role: "Head of Growth", initial: "J" },
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
        ...typography.sectionTitle,
        color: theme.colors.text,
        textAlign: "center",
        marginBottom: spacing.sectionGap,
      }}>
        {content.headline || "Meet the Team"}
      </div>

      <div style={{
        position: "relative",
        display: "flex",
        gap: 28,
        justifyContent: "center",
        flexWrap: "wrap",
      }}>
        {members.map((m, i) => {
          const delay = 16 + i * 10;
          const color = accentColor(theme, i);

          const ringProgress = interpolate(frame, [delay + 6, delay + 24], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
            easing: easings.decel,
          });

          return (
            <div key={i} style={{
              ...scaleIn(frame, delay, 20),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: 180,
            }}>
              {/* Avatar */}
              <div style={{ position: "relative", marginBottom: 18, width: 80, height: 80 }}>
                <svg
                  width={80}
                  height={80}
                  viewBox="0 0 80 80"
                  style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
                >
                  <circle cx={40} cy={40} r={38} fill="none" stroke={`${color}15`} strokeWidth={2} />
                  <circle
                    cx={40}
                    cy={40}
                    r={38}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray={239}
                    strokeDashoffset={239 * (1 - ringProgress)}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{
                  position: "absolute",
                  inset: 6,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${color}20, ${color}08)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  color,
                }}>
                  {m.initial || m.name[0]}
                </div>
              </div>

              {/* Info card */}
              <div style={{
                ...glassCard(theme, spacing.borderRadius.md),
                boxShadow: depthShadow(theme),
                padding: "16px 20px",
                textAlign: "center",
                width: "100%",
              }}>
                <div style={{
                  ...typography.cardTitle,
                  fontSize: 19,
                  color: theme.colors.text,
                  marginBottom: 4,
                }}>
                  {m.name}
                </div>
                <div style={{ fontSize: 15, color: theme.colors.textMuted, fontWeight: 500 }}>
                  {m.role}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
