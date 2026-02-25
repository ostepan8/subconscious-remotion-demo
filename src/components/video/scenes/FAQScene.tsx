import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  slideFromLeft,
  meshGradientStyle,
  noiseOverlayStyle,
  glassCard,
  depthShadow,
  spacing,
  getTypography,
  easings,
} from "./shared";

export default function FAQScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const questions = content.questions || [
    { question: "How do I get started?", answer: "Sign up in 30 seconds — no credit card required." },
    { question: "Is there a free plan?", answer: "Yes, our free tier includes all core features." },
    { question: "Can I cancel anytime?", answer: "Absolutely. No contracts, no commitments." },
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
        marginBottom: 52,
      }}>
        {content.headline || "FAQ"}
      </div>

      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 700,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {questions.map((q, i) => {
          const delay = 18 + i * 12;
          const expandH = interpolate(frame, [delay + 8, delay + 18], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
            easing: easings.snappy,
          });

          return (
            <div key={i} style={{
              ...slideFromLeft(frame, delay, 40, 18),
              padding: "22px 28px",
              ...glassCard(theme, spacing.borderRadius.md),
              boxShadow: depthShadow(theme),
              overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `${theme.colors.primary}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: theme.colors.primary,
                  flexShrink: 0,
                }}>
                  Q{i + 1}
                </div>
                <div style={{
                  ...typography.cardTitle,
                  fontSize: 18,
                  color: theme.colors.text,
                }}>
                  {q.question}
                </div>
              </div>
              <div style={{
                marginTop: 10,
                paddingLeft: 42,
                opacity: expandH,
                maxHeight: expandH * 60,
              }}>
                <div style={{
                  fontSize: 14,
                  color: theme.colors.textMuted,
                  lineHeight: 1.6,
                }}>
                  {q.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
