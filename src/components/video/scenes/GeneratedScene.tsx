import React, { useMemo } from "react";
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

  const GeneratedComp = useMemo(() => {
    if (!code) return null;
    try {
      const scope = {
        React,
        AbsoluteFill,
        useCurrentFrame,
        interpolate,
        spring,
        useVideoConfig,
        Img,
        Sequence,
        ...shared,
      };

      const argNames = Object.keys(scope);
      const argValues = Object.values(scope);

      const wrapped = `
        ${code}
        return typeof GeneratedComponent !== 'undefined'
          ? GeneratedComponent
          : null;
      `;
      const factory = new Function(...argNames, wrapped);
      return factory(...argValues);
    } catch (err) {
      console.error("[GeneratedScene] compile error:", err);
      return null;
    }
  }, [code]);

  if (!GeneratedComp) {
    return (
      <AbsoluteFill
        style={{
          background: theme.colors.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.fonts.body,
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: theme.colors.textMuted,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>
            ⚠️
          </div>
          <div style={{ fontSize: 18 }}>
            {content.generationStatus === "generating"
              ? "Generating..."
              : content.generationError || "No generated code available"}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  try {
    return (
      <AbsoluteFill>
        <GeneratedComp
          content={JSON.stringify(content)}
          theme={JSON.stringify(theme)}
        />
      </AbsoluteFill>
    );
  } catch (err) {
    return (
      <AbsoluteFill
        style={{
          background: theme.colors.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.fonts.body,
          color: "#ef4444",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            Runtime Error
          </div>
          <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>
            {err instanceof Error ? err.message : "Unknown error"}
          </div>
        </div>
      </AbsoluteFill>
    );
  }
}
