import { AbsoluteFill, Img, OffthreadVideo, useCurrentFrame } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  scaleIn,
  fadeInUp,
  animatedNumber,
  meshGradientStyle,
  gridPatternStyle,
  noiseOverlayStyle,
  glowOrbStyle,
  depthShadow,
  accentColor,
  spacing,
  getTypography,
} from "./shared";

export default function StatsScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);
  const headlineSize = content.headlineFontSize as number | undefined;

  const stats = content.stats || [
    { value: "10K+", label: "Users" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9★", label: "Rating" },
    { value: "150+", label: "Countries" },
  ];

  const layout = (content.layout as string) || "default";
  const mediaUrl = content.mediaUrl as string | undefined;
  const mimeHint = (content.mimeType as string) || "";
  const isVideo = !!(mediaUrl && (mediaUrl.match(/\.(mp4|webm|mov)$/i) || mimeHint.startsWith("video/")));
  const mW = content.mediaWidth as number | undefined;
  const mH = content.mediaHeight as number | undefined;

  if ((layout === "split" || layout === "media-right") && mediaUrl) {
    return (
      <AbsoluteFill style={{ background: theme.colors.background }}>
        <div style={meshGradientStyle(theme)} />
        <div style={gridPatternStyle(theme)} />
        <div style={noiseOverlayStyle()} />

        <div style={{
          display: "flex",
          height: "100%",
          padding: `${spacing.scenePadding}px ${spacing.scenePaddingX}px`,
          gap: 60,
          position: "relative",
        }}>
          {/* Stats side */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {content.headline && (
              <div style={{
                ...fadeInBlur(frame, 4),
                ...typography.sectionTitle,
                ...(headlineSize ? { fontSize: headlineSize } : {}),
                color: theme.colors.text,
                marginBottom: 48,
              }}>
                {content.headline}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
              {stats.map((stat, i) => {
                const delay = 16 + i * 10;
                const color = accentColor(theme, i);
                return (
                  <div key={i} style={{
                    ...scaleIn(frame, delay, 22),
                    textAlign: "center",
                    padding: "20px 16px",
                    position: "relative",
                  }}>
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: spacing.borderRadius.lg,
                      background: `radial-gradient(circle at 50% 40%, ${color}08 0%, transparent 70%)`,
                      pointerEvents: "none",
                    }} />
                    <div style={{
                      ...typography.stat,
                      color,
                      marginBottom: 8,
                      position: "relative",
                      textShadow: `0 0 30px ${color}20`,
                    }}>
                      {animatedNumber(frame, delay, stat.value)}
                    </div>
                    <div style={{
                      ...typography.caption,
                      color: theme.colors.textMuted,
                      position: "relative",
                    }}>
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media side */}
          <div style={{
            flex: "0 0 42%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...fadeInUp(frame, 10, 40),
          }}>
            <div style={{
              width: "90%",
              maxHeight: "85%",
              borderRadius: spacing.borderRadius.lg,
              overflow: "hidden",
              boxShadow: content.mediaShadow !== false ? depthShadow(theme) : "none",
              aspectRatio: mW && mH ? `${mW}/${mH}` : "16/9",
            }}>
              {isVideo ? (
                <OffthreadVideo src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: mW && mH ? "cover" : "contain" }} />
              )}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

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
      <div style={gridPatternStyle(theme)} />
      <div style={noiseOverlayStyle()} />
      <div style={glowOrbStyle(frame, theme.colors.primary, 500, "50%", "50%", 0)} />

      {content.headline && (
        <div style={{
          position: "relative",
          ...fadeInBlur(frame, 4),
          ...typography.sectionTitle,
          ...(headlineSize ? { fontSize: headlineSize } : {}),
          color: theme.colors.text,
          textAlign: "center",
          marginBottom: 64,
        }}>
          {content.headline}
        </div>
      )}

      <div style={{
        position: "relative",
        display: "flex",
        gap: 40,
        justifyContent: "center",
        flexWrap: "wrap",
      }}>
        {stats.map((stat, i) => {
          const delay = 16 + i * 10;
          const color = accentColor(theme, i);

          return (
            <div key={i} style={{
              ...scaleIn(frame, delay, 22),
              textAlign: "center",
              minWidth: 160,
              position: "relative",
              padding: "24px 20px",
            }}>
              <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: spacing.borderRadius.lg,
                background: `radial-gradient(circle at 50% 40%, ${color}08 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />
              <div style={{
                ...typography.stat,
                color,
                marginBottom: 10,
                position: "relative",
                textShadow: `0 0 30px ${color}20`,
              }}>
                {animatedNumber(frame, delay, stat.value)}
              </div>
              <div style={{
                ...typography.caption,
                color: theme.colors.textMuted,
                position: "relative",
              }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
