import { AbsoluteFill, Img, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  meshGradientStyle,
  noiseOverlayStyle,
  glowOrbStyle,
  glassCard,
  depthShadow,
  gradientText,
  spacing,
  easings,
} from "./shared";

export default function TestimonialScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const layout = (content.layout as string) || "centered";

  const ringProgress = interpolate(frame, [8, 40], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.decel,
  });

  const mediaUrl = content.mediaUrl as string | undefined;

  if (layout === "split" && mediaUrl) {
    return (
      <AbsoluteFill style={{
        background: theme.colors.background,
        display: "flex",
      }}>
        <div style={meshGradientStyle(theme)} />
        <div style={noiseOverlayStyle()} />
        <div style={glowOrbStyle(frame, theme.colors.primary, 400, "20%", "50%", 0)} />

        <div style={{
          display: "flex",
          height: "100%",
          padding: `${spacing.scenePadding}px ${spacing.scenePaddingX}px`,
          gap: 64,
          position: "relative",
        }}>
          {/* Media side */}
          <div style={{
            flex: "0 0 38%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...fadeInUp(frame, 6, 35),
          }}>
            <div style={{
              width: "90%",
              maxHeight: "85%",
              borderRadius: spacing.borderRadius.lg,
              overflow: "hidden",
              boxShadow: content.mediaShadow !== false ? depthShadow(theme) : "none",
              aspectRatio: content.mediaWidth && content.mediaHeight
                ? `${content.mediaWidth}/${content.mediaHeight}`
                : "1/1",
            }}>
              <Img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: content.mediaWidth && content.mediaHeight ? "cover" : "contain" }} />
            </div>
          </div>

          {/* Quote side */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            <div style={{
              fontSize: 80,
              fontWeight: 800,
              lineHeight: 0.6,
              marginBottom: 16,
              ...gradientText(theme.colors.primary, theme.colors.accent),
              opacity: 0.15,
            }}>
              &ldquo;
            </div>
            <div style={{
              ...fadeInBlur(frame, 10),
              fontSize: 36,
              fontWeight: 500,
              color: theme.colors.text,
              lineHeight: 1.45,
              letterSpacing: "-0.01em",
            }}>
              &ldquo;{content.quote || "This product changed the way we work."}&rdquo;
            </div>
            <div style={{
              ...fadeInUp(frame, 28),
              marginTop: 36,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `${theme.colors.primary}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: theme.colors.primary,
              }}>
                {(content.author || "A")[0]}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textMuted }}>
                {content.author || "Happy Customer"}
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (layout === "cards") {
    return (
      <AbsoluteFill style={{
        background: theme.colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.scenePadding,
      }}>
        <div style={meshGradientStyle(theme)} />
        <div style={noiseOverlayStyle()} />
        <div style={glowOrbStyle(frame, theme.colors.primary, 400, "15%", "30%", 0)} />

        <div style={{
          position: "relative",
          ...fadeInUp(frame, 6, 35),
          maxWidth: 740,
          width: "100%",
          padding: "52px 60px",
          ...glassCard(theme, spacing.borderRadius.xl),
          boxShadow: depthShadow(theme),
          borderLeft: `4px solid ${theme.colors.primary}`,
        }}>
          <div style={{
            position: "absolute",
            top: 28,
            right: 40,
            fontSize: 80,
            fontWeight: 800,
            lineHeight: 0.8,
            ...gradientText(theme.colors.primary, theme.colors.accent),
            opacity: 0.15,
          }}>
            &ldquo;
          </div>
          <div style={{
            ...fadeInBlur(frame, 10),
            fontSize: 30,
            fontWeight: 500,
            color: theme.colors.text,
            lineHeight: 1.55,
            letterSpacing: "-0.01em",
            position: "relative",
          }}>
            &ldquo;{content.quote || "This product changed the way we work."}&rdquo;
          </div>
          <div style={{
            ...fadeInUp(frame, 28),
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}>
            <div style={{ position: "relative", width: 44, height: 44 }}>
              <svg
                width={44}
                height={44}
                viewBox="0 0 44 44"
                style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
              >
                <circle
                  cx={22}
                  cy={22}
                  r={20}
                  fill="none"
                  stroke={`${theme.colors.primary}20`}
                  strokeWidth={2}
                />
                <circle
                  cx={22}
                  cy={22}
                  r={20}
                  fill="none"
                  stroke={theme.colors.primary}
                  strokeWidth={2}
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 * (1 - ringProgress)}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: "absolute",
                inset: 4,
                borderRadius: "50%",
                background: `${theme.colors.primary}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: theme.colors.primary,
              }}>
                {(content.author || "A")[0]}
              </div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textMuted }}>
              {content.author || "Happy Customer"}
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
      padding: 100,
    }}>
      <div style={meshGradientStyle(theme)} />
      <div style={noiseOverlayStyle()} />
      <div style={glowOrbStyle(frame, theme.colors.primary, 500, "50%", "40%", 0)} />

      <div style={{ position: "relative", ...fadeInBlur(frame, 5), textAlign: "center" }}>
        <div style={{
          fontSize: 100,
          fontWeight: 800,
          lineHeight: 0.6,
          marginBottom: 16,
          ...gradientText(theme.colors.primary, theme.colors.accent),
          opacity: 0.2,
        }}>
          &ldquo;
        </div>
        <div style={{
          fontSize: 42,
          fontWeight: 500,
          color: theme.colors.text,
          maxWidth: 860,
          lineHeight: 1.45,
          letterSpacing: "-0.015em",
        }}>
          {content.quote || "This product changed the way we work. Absolutely incredible."}
        </div>
      </div>
      <div style={{
        position: "relative",
        ...fadeInUp(frame, 28),
        marginTop: 40,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <div style={{ position: "relative", width: 40, height: 40 }}>
          <svg
            width={40}
            height={40}
            viewBox="0 0 40 40"
            style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
          >
            <circle cx={20} cy={20} r={18} fill="none" stroke={`${theme.colors.primary}20`} strokeWidth={2} />
            <circle
              cx={20}
              cy={20}
              r={18}
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth={2}
              strokeDasharray={113}
              strokeDashoffset={113 * (1 - ringProgress)}
              strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            background: `${theme.colors.primary}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: theme.colors.primary,
          }}>
            {(content.author || "A")[0]}
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textMuted }}>
          {content.author || "Happy Customer"}
        </div>
      </div>
    </AbsoluteFill>
  );
}
