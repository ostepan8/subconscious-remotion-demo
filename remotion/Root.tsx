import React from "react";
import { Composition } from "remotion";
import VideoComposition from "../src/components/video/VideoComposition";
import type { SceneData } from "../src/components/video/VideoComposition";
import { TRANSITION_DURATION_FRAMES } from "../src/components/video/VideoComposition";
import type { VideoTheme } from "../src/types";

const brandTheme: VideoTheme = {
  id: "subconscious-brand",
  name: "Subconscious",
  description: "Official Subconscious brand — orange, teal, lime on black",
  preview:
    "linear-gradient(135deg, #101820 0%, #ff5c2822 50%, #3ed0c322 100%)",
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

const demoScenes: SceneData[] = [
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
  {
    id: "demo-dashboard",
    type: "demo-dashboard",
    title: "Your Dashboard",
    content: {},
    durationInFrames: 216,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-dashboard.mp3",
  },
  {
    id: "demo-editor",
    type: "demo-editor",
    title: "The Editor",
    content: {},
    durationInFrames: 352,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-editor.mp3",
  },
  {
    id: "demo-chat",
    type: "demo-chat",
    title: "AI Chat Agent",
    content: {},
    durationInFrames: 236,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-chat.mp3",
  },
  {
    id: "demo-theme-picker",
    type: "demo-theme-picker",
    title: "Pick a Theme",
    content: {},
    durationInFrames: 277,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-theme-picker.mp3",
  },
  {
    id: "demo-voiceover",
    type: "demo-voiceover",
    title: "AI Voiceover",
    content: {},
    durationInFrames: 246,
    transition: "fade",
    voiceoverAudioUrl: "/audio/demo/demo-voiceover.mp3",
  },
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

const totalDuration = getTotalDuration(demoScenes);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DemoVideo"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={VideoComposition as any}
      durationInFrames={totalDuration}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        scenes: demoScenes,
        theme: brandTheme,
      }}
    />
  );
};
