import React, { useMemo, useRef } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  Sequence,
} from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import * as shared from "./shared";

export default function GeneratedScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const videoConfig = useVideoConfig();
  const code = content.generatedCode;

  const frameRef = useRef(frame);
  const configRef = useRef(videoConfig);
  frameRef.current = frame;
  configRef.current = videoConfig;

  const GeneratedComp = useMemo(() => {
    if (!code) return null;
    try {
      const scope: Record<string, unknown> = {
        React,
        AbsoluteFill,
        interpolate,
        spring,
        Img,
        Sequence,
        ...shared,
        useCurrentFrame: () => frameRef.current,
        useVideoConfig: () => configRef.current,
      };

      const argNames = Object.keys(scope);
      const argValues = Object.values(scope);

      const wrapped = `
        ${code}
        if (typeof GeneratedComponent === 'undefined') return null;
        return GeneratedComponent;
      `;
      const factory = new Function(...argNames, wrapped);
      return factory(...argValues);
    } catch (err) {
      console.error("[GeneratedScene] compile error:", err);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!GeneratedComp) {
    return (
      <AbsoluteFill
        style={{
          background: theme?.colors?.background ?? "#0f0f14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme?.fonts?.body ?? "system-ui",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: theme?.colors?.textMuted ?? "#999",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>
            ⚠️
          </div>
          <div style={{ fontSize: 18 }}>
            {content.generationStatus === "generating"
              ? "Generating..."
              : content.generationError ||
                "No generated code available"}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  try {
    const result = GeneratedComp({ content, theme });
    return <AbsoluteFill>{result}</AbsoluteFill>;
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : String(err);
    return (
      <AbsoluteFill
        style={{
          background: theme?.colors?.background ?? "#0f0f14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui",
          color: "#ef4444",
          padding: 40,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 600 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Component Error
          </div>
          <div
            style={{
              fontSize: 14,
              opacity: 0.8,
              fontFamily: "monospace",
              background: "rgba(239,68,68,0.1)",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid rgba(239,68,68,0.2)",
              wordBreak: "break-word",
            }}
          >
            {msg}
          </div>
        </div>
      </AbsoluteFill>
    );
  }
}
