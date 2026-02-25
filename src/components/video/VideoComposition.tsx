import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
} from "remotion";
import type { VideoTheme, SceneType, SceneContent } from "@/types";

import HeroScene from "./scenes/HeroScene";
import FeaturesScene from "./scenes/FeaturesScene";
import TestimonialScene from "./scenes/TestimonialScene";
import StatsScene from "./scenes/StatsScene";
import HowItWorksScene from "./scenes/HowItWorksScene";
import CTAScene from "./scenes/CTAScene";
import PricingScene from "./scenes/PricingScene";
import ComponentShowcaseScene from "./scenes/ComponentShowcaseScene";
import CustomScene from "./scenes/CustomScene";
import ProductShowcaseScene from "./scenes/ProductShowcaseScene";
import ImageShowcaseScene from "./scenes/ImageShowcaseScene";
import VideoClipScene from "./scenes/VideoClipScene";
import TimelineScene from "./scenes/TimelineScene";
import TeamScene from "./scenes/TeamScene";
import SocialProofScene from "./scenes/SocialProofScene";
import BentoGridScene from "./scenes/BentoGridScene";
import GradientTextScene from "./scenes/GradientTextScene";
import BeforeAfterScene from "./scenes/BeforeAfterScene";
import CountdownScene from "./scenes/CountdownScene";
import LogoCloudScene from "./scenes/LogoCloudScene";
import ComparisonScene from "./scenes/ComparisonScene";
import FAQScene from "./scenes/FAQScene";
import GeneratedScene from "./scenes/GeneratedScene";

export const TRANSITION_DURATION_FRAMES = 15;

export interface SceneData {
  id?: string;
  type: SceneType;
  title: string;
  content: SceneContent;
  durationInFrames: number;
  transition: string;
  voiceoverScript?: string;
  track?: number;
}

const SCENE_COMPONENTS: Record<
  string,
  React.ComponentType<{ content: SceneContent; theme: VideoTheme }>
> = {
  hero: HeroScene,
  features: FeaturesScene,
  testimonial: TestimonialScene,
  stats: StatsScene,
  "how-it-works": HowItWorksScene,
  cta: CTAScene,
  pricing: PricingScene,
  "component-showcase": ComponentShowcaseScene,
  custom: CustomScene,
  "product-showcase": ProductShowcaseScene,
  "image-showcase": ImageShowcaseScene,
  "video-clip": VideoClipScene,
  timeline: TimelineScene,
  team: TeamScene,
  "social-proof": SocialProofScene,
  "bento-grid": BentoGridScene,
  "gradient-text": GradientTextScene,
  "before-after": BeforeAfterScene,
  countdown: CountdownScene,
  "logo-cloud": LogoCloudScene,
  comparison: ComparisonScene,
  faq: FAQScene,
  generated: GeneratedScene,
};

interface VideoCompositionProps {
  scenes: SceneData[];
  theme: VideoTheme;
}

function TransitionOverlay({
  progress,
  type,
}: {
  progress: number;
  type: string;
}) {
  if (type === "none" || progress <= 0 || progress >= 1) return null;

  if (type === "slide") {
    return (
      <AbsoluteFill
        style={{
          background: "black",
          opacity: interpolate(progress, [0, 0.5, 1], [0, 0.4, 0]),
        }}
      />
    );
  }

  return null;
}

export default function VideoComposition({
  scenes,
  theme,
}: VideoCompositionProps) {
  const frame = useCurrentFrame();

  if (scenes.length === 0) {
    return (
      <AbsoluteFill
        style={{
          background: theme.colors.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: theme.colors.textMuted,
            fontSize: 32,
            fontFamily: theme.fonts.body,
          }}
        >
          No scenes
        </div>
      </AbsoluteFill>
    );
  }

  let currentOffset = 0;
  const sequenceEntries: {
    scene: SceneData;
    from: number;
    duration: number;
  }[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const overlap =
      i > 0 && scenes[i - 1].transition !== "none"
        ? TRANSITION_DURATION_FRAMES
        : 0;
    const from = currentOffset - overlap;
    sequenceEntries.push({
      scene,
      from: Math.max(0, from),
      duration: scene.durationInFrames,
    });
    currentOffset += scene.durationInFrames - overlap;
  }

  return (
    <AbsoluteFill style={{ background: theme.colors.background }}>
      {sequenceEntries.map(({ scene, from, duration }, idx) => {
        const SceneComp =
          SCENE_COMPONENTS[scene.type] || CustomScene;

        const transitionType =
          idx < scenes.length - 1 ? scene.transition : "none";
        const localFrame = frame - from;
        const fadeIn =
          idx > 0
            ? interpolate(
                localFrame,
                [0, TRANSITION_DURATION_FRAMES],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )
            : 1;

        return (
          <Sequence
            key={`scene-${idx}`}
            from={from}
            durationInFrames={duration}
          >
            <AbsoluteFill style={{ opacity: fadeIn }}>
              <SceneComp content={scene.content} theme={theme} />
            </AbsoluteFill>
            <TransitionOverlay
              progress={interpolate(
                localFrame,
                [
                  duration - TRANSITION_DURATION_FRAMES,
                  duration,
                ],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              )}
              type={transitionType}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
