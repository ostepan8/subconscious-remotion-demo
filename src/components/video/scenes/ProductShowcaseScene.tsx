import { AbsoluteFill, Img, OffthreadVideo, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  scaleIn,
  meshGradientStyle,
  noiseOverlayStyle,
  glowOrbStyle,
  depthShadow,
  glassCard,
  isThemeDark,
  spacing,
  getTypography,
  easings,
} from "./shared";

export default function ProductShowcaseScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);
  const layout = (content.layout as string) || "centered";

  const mediaUrl = content.mediaUrl as string | undefined;
  const mimeHint = (content.mimeType as string) || "";
  const isVideo = !!(mediaUrl && (mediaUrl.match(/\.(mp4|webm|mov)$/i) || mimeHint.startsWith("video/")));
  const mW = content.mediaWidth as number | undefined;
  const mH = content.mediaHeight as number | undefined;
  const mediaFrame = (content.mediaFrame as string) || "browser";

  const callouts = (content.callouts as { text: string; position?: string }[] | undefined) || [];

  const imgScale = interpolate(frame, [0, 50], [1.04, 1], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });

  const isDark = isThemeDark(theme);
  const dotColors = ["#ff5f57", "#ffbd2e", "#28c840"];
  const chromeColor = isDark ? "#1e1e2e" : "#f1f1f5";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const barBgColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  const renderMedia = () => {
    if (!mediaUrl) return null;

    const fitMode = mW && mH ? "cover" : "contain";
    const mediaEl = isVideo ? (
      <OffthreadVideo src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      <Img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: fitMode }} />
    );

    if (mediaFrame === "phone") {
      return (
        <div style={{
          ...scaleIn(frame, 8, 24),
          width: 280,
          borderRadius: 32,
          overflow: "hidden",
          background: isDark ? "#1a1a2e" : "#e5e5ea",
          padding: 5,
          boxShadow: isDark
            ? "0 20px 70px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.3)"
            : "0 20px 70px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)",
          aspectRatio: mW && mH ? `${mW}/${mH}` : "9/16",
          maxHeight: "85%",
        }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 28, overflow: "hidden" }}>
            {mediaEl}
          </div>
        </div>
      );
    }

    return (
      <div style={{
        ...scaleIn(frame, 8, 24),
        width: layout === "centered" ? "78%" : "100%",
        maxWidth: 920,
        borderRadius: 16,
        overflow: "hidden",
        background: chromeColor,
        boxShadow: depthShadow(theme),
        border: `1px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          borderBottom: `1px solid ${borderColor}`,
          flexShrink: 0,
        }}>
          {dotColors.map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.85 }} />
          ))}
          <div style={{
            flex: 1,
            height: 22,
            borderRadius: 6,
            background: barBgColor,
            marginLeft: 12,
            marginRight: 40,
          }} />
        </div>
        <div style={{
          aspectRatio: mW && mH ? `${mW}/${mH}` : "16/9",
          overflow: "hidden",
          transform: `scale(${imgScale})`,
          transformOrigin: "center center",
        }}>
          {mediaEl}
        </div>
      </div>
    );
  };

  // --- SPLIT: media left, text + callouts right ---
  if (layout === "split") {
    return (
      <AbsoluteFill style={{ background: theme.colors.background }}>
        <div style={meshGradientStyle(theme)} />
        <div style={noiseOverlayStyle()} />
        <div style={glowOrbStyle(frame, theme.colors.primary, 450, "55%", "-5%", 0)} />

        <div style={{
          display: "flex",
          height: "100%",
          padding: `${spacing.scenePadding}px ${spacing.scenePaddingX}px`,
          gap: 56,
          position: "relative",
        }}>
          <div style={{
            flex: "0 0 50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {renderMedia()}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {content.headline && (
              <div style={{
                ...fadeInBlur(frame, 6),
                ...typography.sectionTitle,
                color: theme.colors.text,
                marginBottom: 20,
              }}>
                {content.headline}
              </div>
            )}
            {content.subtext && (
              <div style={{
                ...fadeInUp(frame, 18),
                ...typography.bodyLg,
                color: theme.colors.textMuted,
                marginBottom: 28,
                maxWidth: 440,
              }}>
                {content.subtext}
              </div>
            )}
            {callouts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {callouts.map((c, i) => (
                  <div key={i} style={{
                    ...fadeInUp(frame, 26 + i * 8, 20),
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 16px",
                    borderRadius: spacing.borderRadius.md,
                    ...glassCard(theme, spacing.borderRadius.md),
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: theme.colors.primary,
                      boxShadow: `0 0 8px ${theme.colors.primary}50`,
                      flexShrink: 0,
                    }} />
                    <div style={{ fontSize: 15, color: theme.colors.text, fontWeight: 500 }}>
                      {c.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // --- DEFAULT: centered hero media with headline above/below ---
  return (
    <AbsoluteFill style={{ background: theme.colors.background }}>
      <div style={meshGradientStyle(theme)} />
      <div style={noiseOverlayStyle()} />
      <div style={glowOrbStyle(frame, theme.colors.primary, 500, "50%", "30%", 0)} />
      <div style={glowOrbStyle(frame, theme.colors.accent, 350, "15%", "65%", 10)} />

      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: `40px ${spacing.scenePaddingX}px`,
        gap: 28,
      }}>
        {content.headline && (
          <div style={{
            ...fadeInBlur(frame, 4),
            ...typography.sectionTitle,
            color: theme.colors.text,
            textAlign: "center",
          }}>
            {content.headline}
          </div>
        )}

        {renderMedia()}

        {content.subtext && (
          <div style={{
            ...fadeInUp(frame, 24),
            ...typography.bodyLg,
            color: theme.colors.textMuted,
            textAlign: "center",
            maxWidth: 600,
          }}>
            {content.subtext}
          </div>
        )}

        {/* Floating callouts over the media */}
        {callouts.length > 0 && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}>
            {callouts.map((c, i) => {
              const positions = [
                { top: "18%", right: "8%" },
                { bottom: "22%", left: "6%" },
                { top: "35%", left: "5%" },
                { bottom: "18%", right: "6%" },
              ];
              const pos = positions[i % positions.length] as React.CSSProperties;

              return (
                <div key={i} style={{
                  position: "absolute",
                  ...pos,
                  ...fadeInUp(frame, 30 + i * 10, 18),
                  padding: "10px 20px",
                  borderRadius: 12,
                  background: isDark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${theme.colors.primary}35`,
                  color: isDark ? "#fff" : theme.colors.text,
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: isDark
                    ? `0 4px 24px rgba(0,0,0,0.4), 0 0 16px ${theme.colors.primary}20`
                    : `0 4px 24px rgba(0,0,0,0.1), 0 0 12px ${theme.colors.primary}15`,
                }}>
                  {c.text}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
