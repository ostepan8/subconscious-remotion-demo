import { AbsoluteFill, Img, OffthreadVideo, useCurrentFrame } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  scaleIn,
  fadeInUp,
  staggerEntrance,
  animatedMeshBg,
  meshGradientStyle,
  gridPatternStyle,
  noiseOverlayStyle,
  glassCard,
  depthShadow,
  accentColor,
  shimmerStyle,
  breathe,
  spacing,
  getTypography,
} from "./shared";

export default function FeaturesScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);
  const layout = (content.layout as string) || "grid";
  const headlineSize = content.headlineFontSize as number | undefined;

  const features = content.features || [
    { title: "Feature One", description: "A great feature" },
    { title: "Feature Two", description: "Another great feature" },
    { title: "Feature Three", description: "One more great feature" },
  ];

  const mediaUrl = content.mediaUrl as string | undefined;
  const mimeHint = (content.mimeType as string) || "";
  const isVideo = !!(mediaUrl && (mediaUrl.match(/\.(mp4|webm|mov)$/i) || mimeHint.startsWith("video/")));
  const mediaWidth = content.mediaWidth as number | undefined;
  const mediaHeight = content.mediaHeight as number | undefined;

  if (layout === "split" || layout === "media-left") {
    const mediaOnLeft = layout === "media-left";
    return (
      <AbsoluteFill style={{ background: theme.colors.background }}>
        <div style={animatedMeshBg(frame, theme)} />
        <div style={gridPatternStyle(theme)} />
        <div style={noiseOverlayStyle()} />

        <div style={{
          display: "flex",
          flexDirection: mediaOnLeft ? "row" : "row-reverse",
          height: "100%",
          padding: `${spacing.scenePadding}px ${spacing.scenePaddingX}px`,
          gap: 60,
          position: "relative",
        }}>
          {/* Media side */}
          {mediaUrl && (
            <div style={{
              flex: "0 0 42%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...fadeInUp(frame, 8, 40),
            }}>
              <div style={{
                width: "90%",
                maxHeight: "85%",
                borderRadius: spacing.borderRadius.lg,
                overflow: "hidden",
                boxShadow: content.mediaShadow !== false ? depthShadow(theme) : "none",
                aspectRatio: mediaWidth && mediaHeight ? `${mediaWidth}/${mediaHeight}` : "16/9",
              }}>
                {isVideo ? (
                  <OffthreadVideo src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: mediaWidth && mediaHeight ? "cover" : "contain" }} />
                )}
              </div>
            </div>
          )}

          {/* Content side */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            <div style={{
              ...fadeInBlur(frame, 4),
              ...typography.sectionTitle,
              ...(headlineSize ? { fontSize: headlineSize } : {}),
              color: theme.colors.text,
              marginBottom: 36,
            }}>
              {content.headline || "Key Features"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {features.map((f, i) => {
                const delay = 18 + i * 10;
                const color = accentColor(theme, i);
                return (
                  <div key={i} style={{
                    ...fadeInUp(frame, delay, 25),
                    display: "flex",
                    gap: 18,
                    alignItems: "flex-start",
                    padding: "14px 18px",
                    borderRadius: spacing.borderRadius.md,
                    ...glassCard(theme, spacing.borderRadius.md),
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${color}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 14,
                      fontWeight: 800,
                      color,
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ ...typography.cardTitle, color: theme.colors.text, marginBottom: 3 }}>
                        {f.title}
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted, lineHeight: 1.5 }}>
                        {f.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (layout === "list") {
    return (
      <AbsoluteFill style={{ background: theme.colors.background, padding: `70px ${spacing.scenePaddingX}px` }}>
        <div style={animatedMeshBg(frame, theme)} />
        <div style={noiseOverlayStyle()} />

        <div style={{ position: "relative" }}>
          <div style={{
            ...fadeInBlur(frame, 4),
            ...typography.sectionTitle,
            ...(headlineSize ? { fontSize: headlineSize } : {}),
            color: theme.colors.text,
            marginBottom: 48,
          }}>
            {content.headline || "Key Features"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {features.map((f, i) => {
              const delay = 16 + i * 12;
              const color = accentColor(theme, i);
              return (
                <div key={i} style={{
                  ...fadeInUp(frame, delay, 30),
                  display: "flex",
                  gap: 24,
                  alignItems: "flex-start",
                  padding: "20px 24px",
                  borderRadius: spacing.borderRadius.md,
                  ...glassCard(theme, spacing.borderRadius.md),
                }}>
                  <div style={{
                    width: 4,
                    height: 44,
                    borderRadius: 2,
                    background: `linear-gradient(180deg, ${color}, ${color}60)`,
                    flexShrink: 0,
                    marginTop: 2,
                    boxShadow: `0 0 12px ${color}30`,
                  }} />
                  <div>
                    <div style={{ ...typography.cardTitle, color: theme.colors.text, marginBottom: 4 }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: 15, color: theme.colors.textMuted, lineHeight: 1.55 }}>
                      {f.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (layout === "cards") {
    const cardIconGlyphs = ["✦", "◆", "●", "▲", "★", "◈"];
    return (
      <AbsoluteFill style={{
        background: theme.colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.scenePadding,
      }}>
        <div style={animatedMeshBg(frame, theme)} />
        <div style={noiseOverlayStyle()} />

        <div style={{
          position: "relative",
          ...fadeInBlur(frame, 4),
          ...typography.sectionTitle,
          ...(headlineSize ? { fontSize: headlineSize } : {}),
          color: theme.colors.text,
          textAlign: "center",
          marginBottom: spacing.sectionGap,
        }}>
          {content.headline || "Key Features"}
        </div>
        <div style={{ position: "relative", display: "flex", gap: 28, justifyContent: "center" }}>
          {features.map((f, i) => {
            const delay = 18 + i * 10;
            const color = accentColor(theme, i);
            return (
              <div key={i} style={{
                ...scaleIn(frame, delay),
                width: 320,
                padding: "36px 32px",
                ...glassCard(theme, spacing.borderRadius.lg),
                boxShadow: depthShadow(theme),
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={shimmerStyle(frame, delay + 10)} />
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 22,
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: 19,
                    border: `2px solid ${color}28`,
                    boxShadow: `0 0 20px ${color}18`,
                  }} />
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>{cardIconGlyphs[i % cardIconGlyphs.length]}</div>
                </div>
                <div style={{ ...typography.cardTitle, color: theme.colors.text, marginBottom: 8 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 16, color: theme.colors.textMuted, lineHeight: 1.6 }}>
                  {f.description}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }

  const iconGlyphs = ["✦", "◆", "●", "▲", "★", "◈"];

  return (
    <AbsoluteFill style={{
      background: theme.colors.background,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.scenePadding,
    }}>
      <div style={animatedMeshBg(frame, theme)} />
      <div style={gridPatternStyle(theme)} />
      <div style={noiseOverlayStyle()} />

      <div style={{
        position: "relative",
        ...fadeInBlur(frame, 4),
        ...typography.sectionTitle,
        ...(headlineSize ? { fontSize: headlineSize } : {}),
        color: theme.colors.text,
        textAlign: "center",
        marginBottom: spacing.sectionGap,
      }}>
        {content.headline || "Key Features"}
      </div>
      <div style={{ position: "relative", display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {features.map((f, i) => {
          const entrance = staggerEntrance(frame, i, 18, 10);
          const float = breathe(frame, 0.03, 0.005, i * 40);
          const color = accentColor(theme, i);
          const delay = 18 + i * 10;
          return (
            <div key={i} style={{
              ...entrance,
              transform: `${entrance.transform || ""} ${float.transform || ""}`,
              width: 310,
              padding: "36px 32px",
              ...glassCard(theme, spacing.borderRadius.lg),
              boxShadow: depthShadow(theme),
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={shimmerStyle(frame, delay + 8)} />
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  inset: -2,
                  borderRadius: 16,
                  border: `2px solid ${color}25`,
                  boxShadow: `0 0 20px ${color}18`,
                }} />
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{iconGlyphs[i % iconGlyphs.length]}</div>
              </div>
              <div style={{ ...typography.cardTitle, color: theme.colors.text, marginBottom: 8 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 16, color: theme.colors.textMuted, lineHeight: 1.6 }}>
                {f.description}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
