import React from "react";
import { AbsoluteFill, OffthreadVideo, Audio, useCurrentFrame, interpolate } from "remotion";
import type { SceneContent } from "@/types";
import { easings } from "./shared";

export type MediaPlacement =
  | "background"
  | "overlay"
  | "overlay-tl"
  | "overlay-tr"
  | "overlay-bl"
  | "overlay-br"
  | "inline"
  | "left"
  | "right"
  | "fill";

function MediaElement({
  src,
  isVideo,
  fit = "cover",
  style,
}: {
  src: string;
  isVideo: boolean;
  fit?: "cover" | "contain" | "fill";
  style?: React.CSSProperties;
}) {
  const [imgError, setImgError] = React.useState(false);

  const baseStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: fit,
    display: "block",
    ...style,
  };

  if (isVideo) {
    return <OffthreadVideo src={src} style={baseStyle} />;
  }

  if (imgError) {
    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.3)",
          color: "rgba(255,255,255,0.4)",
          fontSize: 14,
        }}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={src}
      style={baseStyle}
      onError={() => setImgError(true)}
    />
  );
}

function DeviceFrame({
  children,
  variant,
  theme,
}: {
  children: React.ReactNode;
  variant: "browser" | "phone";
  theme?: string;
}) {
  const isDark = theme !== "light";

  if (variant === "phone") {
    return (
      <div style={{
        borderRadius: 28,
        overflow: "hidden",
        background: isDark ? "#1a1a2e" : "#e5e5ea",
        padding: 4,
        boxShadow: isDark
          ? "0 16px 56px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)"
          : "0 16px 56px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
        height: "100%",
      }}>
        <div style={{
          width: "100%",
          height: "100%",
          borderRadius: 24,
          overflow: "hidden",
          position: "relative",
        }}>
          {children}
        </div>
      </div>
    );
  }

  const dotColors = ["#ff5f57", "#ffbd2e", "#28c840"];
  return (
    <div style={{
      borderRadius: 14,
      overflow: "hidden",
      background: isDark ? "#1e1e2e" : "#f1f1f5",
      boxShadow: isDark
        ? "0 12px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25)"
        : "0 12px 48px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.06)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
      height: "100%",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{
        padding: "9px 15px",
        display: "flex",
        alignItems: "center",
        gap: 7,
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        flexShrink: 0,
      }}>
        {dotColors.map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.85 }} />
        ))}
      </div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  );
}

export default function MediaOverlay({ content }: { content: SceneContent }) {
  const frame = useCurrentFrame();
  const mediaUrl = content.mediaUrl as string | undefined;
  const placement = ((content.mediaPlacement as string) || "background") as MediaPlacement;
  const mimeHint = (content.mimeType as string) || "";
  const mediaWidth = content.mediaWidth as number | undefined;
  const mediaHeight = content.mediaHeight as number | undefined;
  const mediaScale = (content.mediaScale as number | undefined) ?? undefined;
  const mediaFrame = (content.mediaFrame as string | undefined) || "none";
  const shadow = content.mediaShadow !== false;

  const hasDimensions = !!(mediaWidth && mediaHeight);
  const defaultFit = ((content.mediaFit as string) || (hasDimensions ? "cover" : "contain")) as "cover" | "contain" | "fill";

  if (!mediaUrl) return null;

  const isVideo = !!(mediaUrl.match(/\.(mp4|webm|mov)$/i) || mimeHint.startsWith("video/"));
  const isAudio = !!(mediaUrl.match(/\.(mp3|wav|ogg|aac)$/i) || mimeHint.startsWith("audio/"));

  if (isAudio) {
    return <Audio src={mediaUrl} />;
  }

  const isPortrait = hasDimensions && mediaHeight > mediaWidth;
  const isSmall = hasDimensions && (mediaWidth < 400 || mediaHeight < 400);
  const aspectRatio = hasDimensions
    ? `${mediaWidth}/${mediaHeight}`
    : "16/9";

  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });

  const scale = interpolate(frame, [0, 24], [0.92, 1], {
    extrapolateRight: "clamp",
    easing: easings.snappy,
  });

  const userScale = mediaScale ?? 1;

  const wrapInFrame = (el: React.ReactNode) => {
    if (mediaFrame === "browser") return <DeviceFrame variant="browser">{el}</DeviceFrame>;
    if (mediaFrame === "phone") return <DeviceFrame variant="phone">{el}</DeviceFrame>;
    return el;
  };

  // --- BACKGROUND ---
  if (placement === "background") {
    return (
      <AbsoluteFill style={{ opacity, zIndex: 0 }}>
        <div style={{
          width: "100%",
          height: "100%",
          transform: `scale(${userScale})`,
          transformOrigin: "center center",
        }}>
          <MediaElement src={mediaUrl} isVideo={isVideo} fit="cover" />
        </div>
        <AbsoluteFill style={{
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(1px)",
        }} />
      </AbsoluteFill>
    );
  }

  // --- FILL (no overlay, full bleed) ---
  if (placement === "fill") {
    return (
      <AbsoluteFill style={{ opacity, zIndex: 0 }}>
        <div style={{
          width: "100%",
          height: "100%",
          transform: `scale(${userScale})`,
          transformOrigin: "center center",
        }}>
          <MediaElement src={mediaUrl} isVideo={isVideo} fit="cover" />
        </div>
      </AbsoluteFill>
    );
  }

  // --- LEFT / RIGHT split ---
  if (placement === "left" || placement === "right") {
    const isLeft = placement === "left";

    return (
      <AbsoluteFill style={{
        display: "flex",
        flexDirection: isLeft ? "row" : "row-reverse",
        zIndex: 0,
        pointerEvents: "none",
      }}>
        <div style={{
          width: "45%",
          height: "100%",
          opacity,
          transform: `scale(${scale * userScale})`,
          overflow: "hidden",
          padding: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: "100%",
            maxHeight: "95%",
            borderRadius: mediaFrame === "none" ? 20 : 0,
            overflow: "hidden",
            boxShadow: shadow ? "0 12px 48px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2)" : "none",
            aspectRatio: !isVideo ? aspectRatio : undefined,
            height: "auto",
          }}>
            {wrapInFrame(
              <MediaElement src={mediaUrl} isVideo={isVideo} fit={isVideo ? "cover" : defaultFit} />
            )}
          </div>
        </div>
        <div style={{ flex: 1 }} />
      </AbsoluteFill>
    );
  }

  // --- OVERLAY variants ---
  if (placement.startsWith("overlay")) {
    const overlayMaxW = isPortrait ? "32%" : isSmall ? "35%" : "48%";
    const overlayMaxH = isPortrait ? "65%" : isSmall ? "45%" : "55%";

    const posMap: Record<string, React.CSSProperties> = {
      "overlay": { alignItems: "flex-end", justifyContent: "flex-end" },
      "overlay-br": { alignItems: "flex-end", justifyContent: "flex-end" },
      "overlay-bl": { alignItems: "flex-end", justifyContent: "flex-start" },
      "overlay-tr": { alignItems: "flex-start", justifyContent: "flex-end" },
      "overlay-tl": { alignItems: "flex-start", justifyContent: "flex-start" },
    };

    const posStyle = posMap[placement] || posMap["overlay"];

    return (
      <AbsoluteFill style={{
        display: "flex",
        ...posStyle,
        padding: 44,
        zIndex: 5,
        pointerEvents: "none",
      }}>
        <div style={{
          opacity,
          transform: `scale(${scale * userScale})`,
          transformOrigin: "bottom right",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: shadow ? "0 12px 48px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)" : "none",
          maxWidth: overlayMaxW,
          maxHeight: overlayMaxH,
          aspectRatio,
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {wrapInFrame(
            <MediaElement src={mediaUrl} isVideo={isVideo} fit={defaultFit} />
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // --- INLINE (centered) ---
  const inlineMaxW = isPortrait ? "40%" : isSmall ? "50%" : "72%";
  const inlineMaxH = isPortrait ? "80%" : isSmall ? "55%" : "70%";

  return (
    <AbsoluteFill style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
      pointerEvents: "none",
    }}>
      <div style={{
        opacity,
        transform: `scale(${scale * userScale})`,
        transformOrigin: "center center",
        borderRadius: mediaFrame === "none" ? 20 : 0,
        overflow: "hidden",
        maxWidth: inlineMaxW,
        maxHeight: inlineMaxH,
        aspectRatio,
        boxShadow: shadow ? "0 12px 48px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)" : "none",
      }}>
        {wrapInFrame(
          <MediaElement src={mediaUrl} isVideo={isVideo} fit={isVideo ? "contain" : defaultFit} />
        )}
      </div>
    </AbsoluteFill>
  );
}
