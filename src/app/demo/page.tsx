"use client";

import { Player } from "@remotion/player";
import VideoComposition from "@/components/video/VideoComposition";
import { TRANSITION_DURATION_FRAMES } from "@/components/video/VideoComposition";
import type { SceneData } from "@/components/video/VideoComposition";
import type { VideoTheme } from "@/types";

// ── Subconscious brand theme ────────────────────────────────────────────────
// Uses the real brand colors: orange #ff5c28, teal #3ed0c3, green #b5e800
// "energetic" vibe triggers diagonal patterns, gradient text, bouncy animations

const brandTheme: VideoTheme = {
  id: "subconscious-brand",
  name: "Subconscious",
  description: "Official Subconscious brand — orange, teal, lime on black",
  preview: "linear-gradient(135deg, #101820 0%, #ff5c2822 50%, #3ed0c322 100%)",
  colors: {
    background: "#101820",
    surface: "#1a2430",
    primary: "#ff5c28",
    secondary: "#3ed0c3",
    text: "#f0f3ef",
    textMuted: "#8a9a9e",
    accent: "#b5e800",
    glow: "#ff5c28",
  },
  fonts: { heading: "Inter", body: "Inter" },
  transitions: { default: "fade" },
  borderRadius: 16,
  personality: {
    vibe: "energetic",
    mood: "Bold, high-energy, builder-focused",
    designPrompt:
      "Vibrant orange primary, teal secondary, lime accents on dark backgrounds.",
  },
};

// ── Demo scenes using actual website content ────────────────────────────────

const demoScenes: SceneData[] = [
  // 1. Hero — bold opening with Subconscious branding (10.6s audio)
  {
    id: "demo-hero",
    type: "hero",
    title: "Hero",
    content: {
      headline: "Describe your product.\nGet a video.",
      subtext:
        "Enter your product, pick a theme, and a Subconscious AI agent builds a multi-scene video with animations, scripts, and voiceover.",
      buttonText: "Start Building",
      layout: "split",
      mediaUrl: "/brand/Subconscious_Logo_Graphic.svg",
      mediaShadow: false,
    },
    durationInFrames: 318,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-hero.mp3",
  },

  // 2. Dashboard — shows the project management UI (7.2s audio)
  {
    id: "demo-dashboard",
    type: "demo-dashboard",
    title: "Your Dashboard",
    content: {},
    durationInFrames: 216,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-dashboard.mp3",
  },

  // 3. Editor — real screenshot with animated callout labels (11.7s audio)
  {
    id: "demo-editor",
    type: "demo-editor",
    title: "The Editor",
    content: {},
    durationInFrames: 352,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-editor.mp3",
  },

  // 4. Chat — AI agent interaction close-up (7.8s audio)
  {
    id: "demo-chat",
    type: "demo-chat",
    title: "AI Chat Agent",
    content: {},
    durationInFrames: 236,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-chat.mp3",
  },

  // 5. Theme Picker — showcasing the 5 visual themes (9.2s audio)
  {
    id: "demo-theme-picker",
    type: "demo-theme-picker",
    title: "Pick a Theme",
    content: {},
    durationInFrames: 277,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-theme-picker.mp3",
  },

  // 6. Voiceover — AI voiceover generation workflow (8.2s audio)
  {
    id: "demo-voiceover",
    type: "demo-voiceover",
    title: "AI Voiceover",
    content: {},
    durationInFrames: 246,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-voiceover.mp3",
  },

  // 7. Stats — platform capabilities (8.6s audio)
  {
    id: "demo-stats",
    type: "stats",
    title: "By the numbers",
    content: {
      headline: "Built for speed",
      stats: [
        { value: "5", label: "Visual Themes" },
        { value: "25+", label: "Scene Types" },
        { value: "<2 min", label: "Idea to Video" },
      ],
    },
    durationInFrames: 259,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-stats.mp3",
  },

  // 8. CTA — closing call to action (5.4s audio)
  {
    id: "demo-cta",
    type: "cta",
    title: "CTA",
    content: {
      headline: "Ready to create your video?",
      subtext:
        "It takes less than a minute to set up. Start building now.",
      buttonText: "Start Building — Free",
    },
    durationInFrames: 180,
    transition: "none",
    voiceoverAudioUrl: "/audio/demo/demo-cta.mp3",
  },
];

// ── Duration calculation (matches VideoPreview logic) ────────────────────────

function getTotalDuration(scenes: SceneData[]): number {
  const transitionCount = scenes.filter(
    (s, i) => i < scenes.length - 1 && s.transition !== "none",
  ).length;
  const rawDuration = scenes.reduce(
    (sum, s) => sum + (s.durationInFrames || 0),
    0,
  );
  return Math.max(
    rawDuration - transitionCount * TRANSITION_DURATION_FRAMES,
    1,
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const totalDuration = getTotalDuration(demoScenes);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#101820",
        padding: 40,
        gap: 32,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/Subconscious_Logo_Graphic.svg"
          alt="Subconscious"
          width={32}
          height={32}
        />
        <h1
          style={{
            color: "#f0f3ef",
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          Subconscious Video Creator
        </h1>
      </div>

      <div style={{ width: "100%", maxWidth: 1200 }}>
        <Player
          component={VideoComposition}
          inputProps={{ scenes: demoScenes, theme: brandTheme }}
          durationInFrames={totalDuration}
          compositionWidth={1920}
          compositionHeight={1080}
          fps={30}
          style={{
            width: "100%",
            aspectRatio: "16/9",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow:
              "0 0 60px rgba(255,92,40,0.12), 0 4px 32px rgba(0,0,0,0.5)",
          }}
          controls
          autoPlay
          loop
          acknowledgeRemotionLicense
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          color: "#8a9a9e",
          fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <span>
          {Math.round(totalDuration / 30)}s &middot; {demoScenes.length}{" "}
          scenes &middot; 1920&times;1080 &middot; 30fps
        </span>
        <span style={{ color: "#2a3a4a" }}>|</span>
        <span style={{ fontSize: 12 }}>
          Built with Subconscious + Remotion + Convex
        </span>
      </div>
    </div>
  );
}
