import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInUp,
  animatedMeshBg,
  noiseOverlayStyle,
  glowOrbStyle,
  scanLineStyle,
  spacing,
  easings,
} from "./shared";

function WordReveal({
  word,
  index,
  frame,
  baseDelay,
  perWord,
  gradientAngle,
  theme,
  secondary,
}: {
  word: string;
  index: number;
  frame: number;
  baseDelay: number;
  perWord: number;
  gradientAngle: number;
  theme: VideoTheme;
  secondary: string;
}) {
  const delay = baseDelay + index * perWord;

  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
  const blur = interpolate(frame, [delay, delay + 12], [18, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
  const y = interpolate(frame, [delay, delay + 14], [30, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });

  return (
    <span style={{
      display: "inline-block",
      opacity,
      transform: `translateY(${y}px)`,
      filter: `blur(${blur}px)`,
      backgroundImage: `linear-gradient(${gradientAngle}deg, ${theme.colors.primary}, ${theme.colors.accent}, ${secondary})`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
      marginRight: "0.25em",
    }}>
      {word}
    </span>
  );
}

export default function GradientTextScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();

  const gradientAngle = interpolate(frame, [0, 120], [120, 220], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });

  const secondary = theme.colors.secondary || theme.colors.accent;
  const headline = content.headline || "The Future is Here";
  const words = headline.split(/\s+/);

  const perWord = Math.max(3, Math.min(6, 40 / words.length));
  const totalRevealEnd = 5 + words.length * perWord + 14;

  return (
    <AbsoluteFill style={{
      background: theme.colors.background,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.scenePadding,
      overflow: "hidden",
    }}>
      <div style={animatedMeshBg(frame, theme)} />
      <div style={noiseOverlayStyle()} />
      <div style={glowOrbStyle(frame, theme.colors.primary, 800, "50%", "40%", 0)} />
      <div style={glowOrbStyle(frame, theme.colors.accent, 600, "15%", "55%", 8)} />
      <div style={glowOrbStyle(frame, secondary, 500, "80%", "20%", 16)} />

      <div style={scanLineStyle(frame, 2, theme.colors.primary, 35)} />

      <div style={{
        position: "relative",
        textAlign: "center",
        maxWidth: 1100,
      }}>
        <div style={{
          fontSize: 100,
          fontWeight: 800,
          lineHeight: 1.0,
          letterSpacing: "-0.045em",
        }}>
          {words.map((word, i) => (
            <WordReveal
              key={i}
              word={word}
              index={i}
              frame={frame}
              baseDelay={5}
              perWord={perWord}
              gradientAngle={gradientAngle}
              theme={theme}
              secondary={secondary}
            />
          ))}
        </div>

        {content.subtext && (
          <div style={{
            ...fadeInUp(frame, Math.max(26, totalRevealEnd), 30),
            fontSize: 28,
            fontWeight: 500,
            color: theme.colors.textMuted,
            marginTop: 36,
            lineHeight: 1.5,
            maxWidth: 660,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            {content.subtext}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
