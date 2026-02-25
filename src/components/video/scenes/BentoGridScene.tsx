import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  fadeInBlur,
  scaleIn,
  meshGradientStyle,
  noiseOverlayStyle,
  glassCard,
  depthShadow,
  accentColor,
  shimmerStyle,
  spacing,
  getTypography,
} from "./shared";

export default function BentoGridScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);

  const cells = content.cells || [
    { title: "Lightning Fast", description: "Sub-second response times", size: "lg" as const },
    { title: "Secure", description: "End-to-end encryption", size: "sm" as const },
    { title: "Scalable", description: "Handles millions of requests", size: "sm" as const },
    { title: "Analytics", description: "Real-time insights dashboard", size: "md" as const },
    { title: "Integrations", description: "Connect with 200+ tools", size: "md" as const },
  ];

  const gridAreas = cells.map((c) => {
    const sz = c.size || "sm";
    if (sz === "lg") return { gridColumn: "span 2", gridRow: "span 2" };
    if (sz === "md") return { gridColumn: "span 2", gridRow: "span 1" };
    return { gridColumn: "span 1", gridRow: "span 1" };
  });

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

      <div style={{
        position: "relative",
        ...fadeInBlur(frame, 4),
        ...typography.sectionTitle,
        color: theme.colors.text,
        textAlign: "center",
        marginBottom: spacing.sectionGap,
      }}>
        {content.headline || "Everything You Need"}
      </div>

      <div style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 18,
        width: "100%",
        maxWidth: 960,
        maxHeight: 480,
      }}>
        {cells.map((cell, i) => {
          const delay = 14 + i * 8;
          const color = accentColor(theme, i);
          const isLarge = cell.size === "lg";
          const cellMedia = (cell as Record<string, unknown>).mediaUrl as string | undefined;

          return (
            <div key={i} style={{
              ...gridAreas[i],
              ...scaleIn(frame, delay, 20),
              ...glassCard(theme, spacing.borderRadius.lg),
              boxShadow: depthShadow(theme),
              padding: cellMedia ? 0 : (isLarge ? 36 : 24),
              display: "flex",
              flexDirection: "column",
              justifyContent: isLarge ? "flex-end" : "flex-start",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={shimmerStyle(frame, delay + 10)} />

              {cellMedia ? (
                <>
                  <Img src={cellMedia} style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }} />
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
                  }} />
                  <div style={{
                    position: "relative",
                    marginTop: "auto",
                    padding: isLarge ? 28 : 18,
                  }}>
                    <div style={{
                      ...typography.cardTitle,
                      fontSize: isLarge ? 24 : 17,
                      color: "#ffffff",
                      marginBottom: 4,
                      textShadow: "0 1px 8px rgba(0,0,0,0.4)",
                    }}>
                      {cell.title}
                    </div>
                    {cell.description && (
                      <div style={{
                        fontSize: isLarge ? 15 : 12,
                        color: "rgba(255,255,255,0.8)",
                        lineHeight: 1.5,
                      }}>
                        {cell.description}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    position: "absolute",
                    top: isLarge ? 30 : 20,
                    right: isLarge ? 30 : 20,
                    width: isLarge ? 80 : 40,
                    height: isLarge ? 80 : 40,
                    borderRadius: isLarge ? 20 : 12,
                    background: `${color}08`,
                    border: `1px solid ${color}15`,
                  }} />

                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 10px ${color}40`,
                    marginBottom: isLarge ? 16 : 12,
                  }} />
                  <div style={{
                    ...typography.cardTitle,
                    fontSize: isLarge ? 24 : 17,
                    color: theme.colors.text,
                    marginBottom: 6,
                  }}>
                    {cell.title}
                  </div>
                  <div style={{
                    fontSize: isLarge ? 16 : 13,
                    color: theme.colors.textMuted,
                    lineHeight: 1.55,
                  }}>
                    {cell.description}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
