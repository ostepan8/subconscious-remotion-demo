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
  spacing,
  getTypography,
  easings,
} from "./shared";

function StarRating({ stars, color, size = 18 }: { stars: number; color: string; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{
          fontSize: size,
          color: i < stars ? color : `${color}25`,
          lineHeight: 1,
        }}>
          ★
        </div>
      ))}
    </div>
  );
}

export default function SocialProofScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const rating = (content.rating as number) || 4.9;
  const reviewCount = (content.reviewCount as string) || "2,847";
  const reviews = content.reviews || [
    { text: "Game changer for our workflow.", author: "Sarah K.", stars: 5 },
    { text: "Best tool we've adopted this year.", author: "James R.", stars: 5 },
    { text: "Simple, powerful, and reliable.", author: "Maria L.", stars: 4 },
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
      <div style={glowOrbStyle(frame, theme.colors.primary, 400, "50%", "30%", 0)} />

      <div style={{
        position: "relative",
        ...fadeInBlur(frame, 4),
        ...typography.sectionTitle,
        color: theme.colors.text,
        textAlign: "center",
        marginBottom: 20,
      }}>
        {content.headline || "Loved by Thousands"}
      </div>

      {/* Rating summary */}
      <div style={{
        position: "relative",
        ...scaleIn(frame, 10),
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 48,
      }}>
        <div style={{
          ...typography.stat,
          fontSize: 64,
          color: theme.colors.primary,
        }}>
          {animatedNumber(frame, 10, String(rating), 20)}
        </div>
        <div>
          <StarRating stars={Math.round(rating)} color={theme.colors.primary} size={26} />
          <div style={{
            fontSize: 17,
            color: theme.colors.textMuted,
            marginTop: 6,
            fontWeight: 500,
          }}>
            {animatedNumber(frame, 14, reviewCount, 22)} reviews
          </div>
        </div>
      </div>

      {/* Review cards */}
      <div style={{
        position: "relative",
        display: "flex",
        gap: 20,
        justifyContent: "center",
        maxWidth: 900,
      }}>
        {reviews.map((r, i) => {
          const delay = 22 + i * 10;
          return (
            <div key={i} style={{
              ...fadeInUp(frame, delay, 25),
              flex: 1,
              padding: "28px 26px",
              ...glassCard(theme, spacing.borderRadius.lg),
              boxShadow: depthShadow(theme),
              maxWidth: 300,
            }}>
              <StarRating stars={r.stars || 5} color={theme.colors.primary} size={18} />
              <div style={{
                fontSize: 18,
                fontWeight: 500,
                color: theme.colors.text,
                lineHeight: 1.55,
                marginTop: 14,
                marginBottom: 16,
              }}>
                &ldquo;{r.text}&rdquo;
              </div>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.colors.textMuted,
              }}>
                {r.author}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
