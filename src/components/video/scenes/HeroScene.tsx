import { AbsoluteFill, Img, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  glowPulse,
  animatedMeshBg,
  gridPatternStyle,
  noiseOverlayStyle,
  glowOrbStyle,
  scanLineStyle,
  depthShadow,
  spacing,
  getTypography,
  themedHeadlineStyle,
  themedButtonStyle,
  isThemeDark,
  easings,
} from "./shared";
import MockupPlaceholder from "./MockupPlaceholder";

export default function HeroScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);
  const layout = (content.layout as string) || "centered";

  const headlineSize = content.headlineFontSize as number | undefined;
  const subtextSize = content.subtextFontSize as number | undefined;

  if (layout === "split") {
    const vibe = theme.personality?.vibe;
    const showScanLine = vibe === "cyberpunk" || vibe === "energetic";
    const showGrid = vibe !== "editorial" && vibe !== "luxury";

    const imgScale = interpolate(frame, [10, 40], [1.06, 1], {
      extrapolateRight: "clamp",
      easing: easings.smooth,
    });

    return (
      <AbsoluteFill style={{ background: theme.colors.background, overflow: "hidden" }}>
        <div style={animatedMeshBg(frame, theme)} />
        {showGrid && <div style={gridPatternStyle(theme)} />}
        <div style={noiseOverlayStyle()} />
        <div style={glowOrbStyle(frame, theme.colors.primary, 600, "60%", "-10%", 0)} />
        <div style={glowOrbStyle(frame, theme.colors.accent, 400, "-5%", "60%", 10)} />
        {showScanLine && <div style={scanLineStyle(frame, 4, theme.colors.primary, 30)} />}

        <div style={{ display: "flex", height: "100%", padding: `${spacing.scenePadding}px ${spacing.scenePaddingX}px`, gap: 72, position: "relative" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              ...fadeInBlur(frame, 6),
              ...typography.heroTitle,
              fontSize: headlineSize || 68,
              ...themedHeadlineStyle(theme),
            }}>
              {content.headline || "Your Product"}
            </div>
            <div style={{
              ...fadeInUp(frame, 20),
              ...typography.bodyLg,
              fontSize: subtextSize || typography.bodyLg.fontSize,
              color: theme.colors.textMuted,
              marginTop: 24,
              maxWidth: 520,
            }}>
              {content.subtext || "The best way to do what you do."}
            </div>
            {content.buttonText && (
              <div style={{ marginTop: 40, display: "flex" }}>
                <div style={{
                  ...glowPulse(frame, 32, theme.colors.primary),
                  ...themedButtonStyle(theme),
                }}>
                  {content.buttonText}
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 0.9, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {content.mediaUrl ? (
              <div style={{
                ...fadeInUp(frame, 12, 45),
                width: "90%",
                maxHeight: "85%",
                aspectRatio: content.mediaWidth && content.mediaHeight
                  ? `${content.mediaWidth}/${content.mediaHeight}`
                  : "16/9",
                borderRadius: theme.borderRadius * 2,
                overflow: "hidden",
                boxShadow: content.mediaShadow !== false ? depthShadow(theme) : "none",
                transform: `scale(${imgScale})`,
                transformOrigin: "center center",
              }}>
                <Img
                  src={content.mediaUrl as string}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: content.mediaWidth && content.mediaHeight ? "cover" : "contain",
                  }}
                />
              </div>
            ) : (
              <MockupPlaceholder theme={theme} variant="browser" />
            )}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (layout === "minimal") {
    return (
      <AbsoluteFill style={{ background: theme.colors.background, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={animatedMeshBg(frame, theme)} />
        <div style={noiseOverlayStyle()} />
        <div style={glowOrbStyle(frame, theme.colors.primary, 800, "50%", "50%", 0)} />
        <div style={{ textAlign: "center", maxWidth: 1000, position: "relative" }}>
          <div style={{
            ...fadeInBlur(frame, 5, 26),
            fontSize: 96,
            fontWeight: 800,
            color: theme.colors.text,
            lineHeight: 0.98,
            letterSpacing: "-0.045em",
          }}>
            {content.headline || "Your Product"}
          </div>
          {content.subtext && (
            <div style={{
              ...fadeInUp(frame, 22),
              ...typography.bodyLg,
              fontSize: 28,
              color: theme.colors.textMuted,
              marginTop: 32,
            }}>
              {content.subtext}
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  const vibe = theme.personality?.vibe;
  const showScanLine = vibe === "cyberpunk" || vibe === "energetic";
  const showGridPattern = vibe !== "editorial" && vibe !== "luxury";
  const showOrbs = vibe !== "editorial";

  return (
    <AbsoluteFill style={{ background: theme.colors.background, overflow: "hidden" }}>
      <div style={animatedMeshBg(frame, theme)} />
      {showGridPattern && <div style={gridPatternStyle(theme)} />}
      <div style={noiseOverlayStyle()} />
      {showOrbs && (
        <>
          <div style={glowOrbStyle(frame, theme.colors.primary, 700, "50%", "20%", 0)} />
          <div style={glowOrbStyle(frame, theme.colors.accent, 500, "10%", "60%", 8)} />
          <div style={glowOrbStyle(frame, theme.colors.secondary, 400, "80%", "10%", 16)} />
        </>
      )}
      {showScanLine && <div style={scanLineStyle(frame, 3, theme.colors.accent, 35)} />}

      {vibe === "editorial" && (
        <div style={{
          position: "absolute",
          left: spacing.scenePaddingX,
          right: spacing.scenePaddingX,
          top: "50%",
          height: 1,
          background: `${theme.colors.secondary}30`,
          transform: "translateY(80px)",
        }} />
      )}

      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: spacing.scenePadding,
      }}>
        {vibe === "editorial" && (
          <div style={{
            ...fadeInUp(frame, 2, 20),
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: theme.colors.accent,
            marginBottom: 32,
            fontFamily: `"${theme.fonts.body}", serif`,
          }}>
            ✦
          </div>
        )}

        <div style={{
          ...fadeInBlur(frame, 6, 24),
          ...typography.heroTitle,
          fontSize: headlineSize || 88,
          ...themedHeadlineStyle(theme),
          textAlign: "center",
          maxWidth: 960,
        }}>
          {content.headline || "Your Product"}
        </div>
        <div style={{
          ...fadeInUp(frame, 22),
          ...typography.bodyLg,
          fontSize: subtextSize || 26,
          color: theme.colors.textMuted,
          textAlign: "center",
          marginTop: 28,
          maxWidth: 680,
        }}>
          {content.subtext || "The best way to do what you do."}
        </div>
        {content.buttonText && (
          <div style={{ marginTop: 48 }}>
            <div style={{
              ...glowPulse(frame, 34, theme.colors.primary),
              ...themedButtonStyle(theme),
            }}>
              {content.buttonText}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
