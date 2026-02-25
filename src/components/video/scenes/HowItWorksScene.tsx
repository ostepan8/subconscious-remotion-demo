import { AbsoluteFill, Img, OffthreadVideo, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  meshGradientStyle,
  gridPatternStyle,
  noiseOverlayStyle,
  glassCard,
  depthShadow,
  revealLine,
  spacing,
  getTypography,
  easings,
} from "./shared";

export default function HowItWorksScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const steps = content.steps || [
    { number: 1, title: "Sign Up", description: "Create your account in seconds" },
    { number: 2, title: "Configure", description: "Set up your preferences" },
    { number: 3, title: "Launch", description: "Go live and start growing" },
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
          padding: `60px ${spacing.scenePaddingX}px`,
          gap: 56,
          position: "relative",
        }}>
          {/* Steps side */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              ...fadeInBlur(frame, 4),
              ...typography.sectionTitle,
              color: theme.colors.text,
              marginBottom: 40,
            }}>
              {content.headline || "How It Works"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {steps.map((step, i) => {
                const delay = 16 + i * 14;
                return (
                  <div key={i} style={{
                    ...fadeInUp(frame, delay, 30),
                    display: "flex",
                    gap: 18,
                    alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 800,
                      flexShrink: 0,
                      boxShadow: `0 4px 16px ${theme.colors.primary}30`,
                    }}>
                      {step.number}
                    </div>
                    <div style={{
                      padding: "10px 16px",
                      borderRadius: spacing.borderRadius.md,
                      ...glassCard(theme, spacing.borderRadius.md),
                      flex: 1,
                    }}>
                      <div style={{ ...typography.cardTitle, color: theme.colors.text, marginBottom: 4 }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted, lineHeight: 1.5 }}>
                        {step.description}
                      </div>
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
      padding: `70px ${spacing.scenePaddingX}px`,
    }}>
      <div style={meshGradientStyle(theme)} />
      <div style={gridPatternStyle(theme)} />
      <div style={noiseOverlayStyle()} />

      <div style={{
        position: "relative",
        ...fadeInBlur(frame, 4),
        ...typography.sectionTitle,
        color: theme.colors.text,
        marginBottom: 64,
      }}>
        {content.headline || "How It Works"}
      </div>

      <div style={{
        position: "relative",
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        width: "100%",
        maxWidth: 940,
        justifyContent: "center",
      }}>
        {steps.map((step, i) => {
          const delay = 18 + i * 16;
          const connectorDelay = delay + 12;

          const ringProgress = interpolate(frame, [delay, delay + 16], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
            easing: easings.snappy,
          });

          const glowOpacity = interpolate(frame, [delay + 10, delay + 20], [0, 0.5], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });

          return (
            <div key={i} style={{
              ...fadeInUp(frame, delay, 40),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              textAlign: "center",
              position: "relative",
            }}>
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute",
                  top: 28,
                  left: "58%",
                  right: "-42%",
                  height: 2,
                  background: `${theme.colors.primary}15`,
                  borderRadius: 1,
                  overflow: "hidden",
                }}>
                  <div style={{
                    ...revealLine(frame, connectorDelay),
                    height: "100%",
                    background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                    borderRadius: 1,
                    boxShadow: `0 0 8px ${theme.colors.primary}30`,
                  }} />
                </div>
              )}

              <div style={{ position: "relative", marginBottom: 22 }}>
                <svg
                  width={58}
                  height={58}
                  viewBox="0 0 58 58"
                  style={{ position: "absolute", top: -3, left: -3, transform: "rotate(-90deg)" }}
                >
                  <circle cx={29} cy={29} r={27} fill="none" stroke={`${theme.colors.primary}12`} strokeWidth={2} />
                  <circle
                    cx={29}
                    cy={29}
                    r={27}
                    fill="none"
                    stroke={theme.colors.primary}
                    strokeWidth={2}
                    strokeDasharray={170}
                    strokeDashoffset={170 * (1 - ringProgress)}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  position: "relative",
                  zIndex: 1,
                  boxShadow: `0 4px 20px ${theme.colors.primary}35`,
                }}>
                  {step.number}
                </div>
                <div style={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: 22,
                  background: `radial-gradient(circle, ${theme.colors.primary}${Math.round(glowOpacity * 25).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
                  pointerEvents: "none",
                }} />
              </div>

              <div style={{
                padding: "18px 22px",
                borderRadius: spacing.borderRadius.md,
                ...glassCard(theme, spacing.borderRadius.md),
                boxShadow: depthShadow(theme),
                width: "100%",
                maxWidth: 260,
              }}>
                <div style={{ ...typography.cardTitle, color: theme.colors.text, marginBottom: 6 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 16, color: theme.colors.textMuted, lineHeight: 1.55 }}>
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
