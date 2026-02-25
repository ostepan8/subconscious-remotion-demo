import { AbsoluteFill, Img, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import { fadeInUp, easings } from "./shared";

export default function ImageShowcaseScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();

  const imgScale = interpolate(frame, [0, 60], [1.1, 1.02], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });
  const imgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });
  const vignetteOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const mediaUrl = content.mediaUrl as string | undefined;
  const mediaWidth = content.mediaWidth as number | undefined;
  const mediaHeight = content.mediaHeight as number | undefined;
  const isPortrait = mediaWidth && mediaHeight && mediaHeight > mediaWidth;

  return (
    <AbsoluteFill style={{ background: theme.colors.background, overflow: "hidden" }}>
      {mediaUrl ? (
        <AbsoluteFill style={{
          opacity: imgOpacity,
          transform: `scale(${imgScale})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Img
            src={mediaUrl}
            style={{
              width: isPortrait ? "auto" : "100%",
              height: isPortrait ? "100%" : "100%",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: isPortrait ? "contain" : "cover",
            }}
          />
          {/* Cinematic vignette */}
          <AbsoluteFill style={{
            opacity: vignetteOpacity,
            background: `
              radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, ${theme.colors.background}90 100%),
              linear-gradient(to top, ${theme.colors.background} 0%, ${theme.colors.background}60 25%, transparent 55%)
            `,
          }} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{
          background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.background})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: 140,
            height: 140,
            borderRadius: 28,
            background: `${theme.colors.primary}08`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 52,
            opacity: 0.25,
            border: `2px solid ${theme.colors.textMuted}10`,
          }}>
            ◻
          </div>
        </AbsoluteFill>
      )}

      {(content.headline || content.subtext) && (
        <AbsoluteFill style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: 80,
        }}>
          {content.headline && (
            <div style={{
              ...fadeInUp(frame, 16, 30),
              fontSize: 56,
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              letterSpacing: "-0.025em",
              textShadow: "0 2px 36px rgba(0,0,0,0.6), 0 8px 80px rgba(0,0,0,0.35)",
              marginBottom: 14,
            }}>
              {content.headline}
            </div>
          )}
          {content.subtext && (
            <div style={{
              ...fadeInUp(frame, 24, 25),
              fontSize: 24,
              color: "rgba(255,255,255,0.88)",
              textAlign: "center",
              textShadow: "0 1px 20px rgba(0,0,0,0.5)",
            }}>
              {content.subtext}
            </div>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
