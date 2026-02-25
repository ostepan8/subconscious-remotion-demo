import { httpAction } from "./_generated/server";

const REMOTION_KNOWLEDGE: Record<string, string> = {
  animations: `All animations MUST be driven by the \`useCurrentFrame()\` hook.
Write animations in seconds and multiply them by the \`fps\` value from \`useVideoConfig()\`.

\`\`\`tsx
import { useCurrentFrame } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ opacity }}>Hello World!</div>
  );
};
\`\`\`

CSS transitions or animations are FORBIDDEN - they will not render correctly.
Tailwind animation class names are FORBIDDEN - they will not render correctly.`,

  timing: `A simple linear interpolation is done using the \`interpolate\` function.

\`\`\`ts
import {interpolate} from 'remotion';
const opacity = interpolate(frame, [0, 100], [0, 1]);
\`\`\`

By default, the values are not clamped. Here is how they can be clamped:

\`\`\`ts
const opacity = interpolate(frame, [0, 100], [0, 1], {
  extrapolateRight: 'clamp',
  extrapolateLeft: 'clamp',
});
\`\`\`

## Spring animations

Spring animations have a more natural motion. They go from 0 to 1 over time.

\`\`\`ts
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
const frame = useCurrentFrame();
const {fps} = useVideoConfig();
const scale = spring({ frame, fps });
\`\`\`

### Physical properties

Default config: \`mass: 1, damping: 10, stiffness: 100\` (has some bounce).

Common configurations:
\`\`\`tsx
const smooth = {damping: 200}; // Smooth, no bounce (subtle reveals)
const snappy = {damping: 20, stiffness: 200}; // Snappy, minimal bounce (UI elements)
const bouncy = {damping: 8}; // Bouncy entrance (playful animations)
const heavy = {damping: 15, stiffness: 80, mass: 2}; // Heavy, slow, small bounce
\`\`\`

### Delay

\`\`\`tsx
const entrance = spring({ frame, fps, delay: 20 });
\`\`\`

### Duration

\`\`\`tsx
const s = spring({ frame, fps, durationInFrames: 40 });
\`\`\`

### Combining spring() with interpolate()

\`\`\`tsx
const springProgress = spring({ frame, fps });
const rotation = interpolate(springProgress, [0, 1], [0, 360]);
<div style={{rotate: rotation + 'deg'}} />;
\`\`\`

### In/out animations

\`\`\`tsx
const frame = useCurrentFrame();
const {fps, durationInFrames} = useVideoConfig();
const inAnimation = spring({ frame, fps });
const outAnimation = spring({ frame, fps, durationInFrames: 1 * fps, delay: durationInFrames - 1 * fps });
const scale = inAnimation - outAnimation;
\`\`\`

## Easing

\`\`\`ts
import {interpolate, Easing} from 'remotion';
const value = interpolate(frame, [0, 100], [0, 1], {
  easing: Easing.inOut(Easing.quad),
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
\`\`\`

Convexities: \`Easing.in\`, \`Easing.out\`, \`Easing.inOut\`
Curves: \`Easing.quad\`, \`Easing.sin\`, \`Easing.exp\`, \`Easing.circle\`
Bezier: \`Easing.bezier(0.8, 0.22, 0.96, 0.65)\``,

  transitions: `## TransitionSeries

\`<TransitionSeries>\` arranges scenes with transitions (crossfade, slide, wipe) or overlays (e.g. light leaks).

\`\`\`bash
npx remotion add @remotion/transitions
\`\`\`

\`\`\`tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
\`\`\`

Available transitions: \`fade\`, \`slide\`, \`wipe\`, \`flip\`, \`clockWipe\`

Slide directions: \`"from-left"\`, \`"from-right"\`, \`"from-top"\`, \`"from-bottom"\`

Timing: \`linearTiming({ durationInFrames: 20 })\` or \`springTiming({ config: { damping: 200 } })\`

Transitions shorten the timeline (overlapping scenes). Overlays do not.`,

  "text-animations": `## Text Animations

Based on \`useCurrentFrame()\`, reduce the string character by character to create a typewriter effect.

### Typewriter Effect
Always use string slicing for typewriter effects. Never use per-character opacity.

### Word Highlighting
Animate a highlight wipe over a word using spring-driven width.`,

  sequencing: `Use \`<Sequence>\` to delay when an element appears in the timeline.

\`\`\`tsx
import { Sequence } from "remotion";
const {fps} = useVideoConfig();

<Sequence from={1 * fps} durationInFrames={2 * fps} premountFor={1 * fps}>
  <Title />
</Sequence>
<Sequence from={2 * fps} durationInFrames={2 * fps} premountFor={1 * fps}>
  <Subtitle />
</Sequence>
\`\`\`

Always premount any \`<Sequence>\`! Use \`layout="none"\` to prevent absolute fill wrapping.

## Series

\`\`\`tsx
import {Series} from 'remotion';
<Series>
  <Series.Sequence durationInFrames={45}><Intro /></Series.Sequence>
  <Series.Sequence durationInFrames={60}><MainContent /></Series.Sequence>
  <Series.Sequence durationInFrames={30}><Outro /></Series.Sequence>
</Series>
\`\`\`

Inside a Sequence, \`useCurrentFrame()\` returns the local frame (starting from 0).`,

  charts: `# Charts in Remotion

Create charts using React/SVG/D3.js. Disable all third-party animations - drive everything from \`useCurrentFrame()\`.

## Bar Chart
\`\`\`tsx
const bars = data.map((item, i) => {
  const height = spring({ frame, fps, delay: i * 5, config: { damping: 200 } });
  return <div style={{ height: height * item.value }} />;
});
\`\`\`

## Pie Chart
Animate segments using stroke-dashoffset with \`interpolate()\`.

## Line Chart / Path Animation
Use \`@remotion/paths\` with \`evolvePath()\`:
\`\`\`tsx
import { evolvePath } from "@remotion/paths";
const { strokeDasharray, strokeDashoffset } = evolvePath(progress, path);
\`\`\``,

  fonts: `# Fonts in Remotion

## Google Fonts
\`\`\`bash
npx remotion add @remotion/google-fonts
\`\`\`
\`\`\`tsx
import { loadFont } from "@remotion/google-fonts/Lobster";
const { fontFamily } = loadFont();
<div style={{ fontFamily }}>Hello World</div>
\`\`\`

## Local Fonts
\`\`\`bash
npx remotion add @remotion/fonts
\`\`\`
\`\`\`tsx
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
await loadFont({ family: "MyFont", url: staticFile("MyFont-Regular.woff2") });
\`\`\``,

  "light-leaks": `## Light Leaks

WebGL-based light leak effect from \`@remotion/light-leaks\`. Reveals during first half, retracts during second half.

\`\`\`bash
npx remotion add @remotion/light-leaks
\`\`\`
\`\`\`tsx
import { TransitionSeries } from "@remotion/transitions";
import { LightLeak } from "@remotion/light-leaks";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}><SceneA /></TransitionSeries.Sequence>
  <TransitionSeries.Overlay durationInFrames={30}><LightLeak /></TransitionSeries.Overlay>
  <TransitionSeries.Sequence durationInFrames={60}><SceneB /></TransitionSeries.Sequence>
</TransitionSeries>
\`\`\`

Props: \`seed\` (pattern shape), \`hueShift\` (0-360, default yellow-orange).`,

  audio: `# Audio in Remotion

\`\`\`bash
npx remotion add @remotion/media
\`\`\`
\`\`\`tsx
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
<Audio src={staticFile("audio.mp3")} />
\`\`\`

Trimming: \`trimBefore={2 * fps}\` and \`trimAfter={10 * fps}\`
Volume: \`volume={0.5}\` or \`volume={(f) => interpolate(f, [0, fps], [0, 1], { extrapolateRight: "clamp" })}\`
Speed: \`playbackRate={2}\`
Loop: \`loop\`
Pitch: \`toneFrequency={1.5}\` (render only)
Mute: \`muted\`
Delay: wrap in \`<Sequence from={1 * fps}>\``,

  images: `# Images in Remotion

Always use the \`<Img>\` component from \`remotion\`. Do NOT use native \`<img>\`, Next.js \`<Image>\`, or CSS \`background-image\`.

\`\`\`tsx
import { Img, staticFile } from "remotion";
<Img src={staticFile("photo.png")} />
\`\`\`

Remote URLs: \`<Img src="https://example.com/image.png" />\`

Use \`style\` for sizing: \`{ width: 500, height: 300, objectFit: "cover" }\`

Get dimensions: \`const { width, height } = await getImageDimensions(staticFile("photo.png"));\``,

  videos: `# Videos in Remotion

\`\`\`bash
npx remotion add @remotion/media
\`\`\`
\`\`\`tsx
import { Video } from "@remotion/media";
import { staticFile } from "remotion";
<Video src={staticFile("video.mp4")} />
\`\`\`

Trimming: \`trimBefore={2 * fps}\`, \`trimAfter={10 * fps}\`
Volume: \`volume={0.5}\` or dynamic callback
Speed: \`playbackRate={2}\`
Loop: \`loop\`
Mute: \`muted\`
Pitch: \`toneFrequency={1.5}\` (render only)
Delay: wrap in \`<Sequence from={1 * fps}>\``,

  "audio-visualization": `# Audio Visualization

\`\`\`bash
npx remotion add @remotion/media-utils
\`\`\`

Use \`useWindowedAudioData()\` + \`visualizeAudio()\` for spectrum bars:
\`\`\`tsx
const { audioData, dataOffsetInSeconds } = useWindowedAudioData({ src, frame, fps, windowInSeconds: 30 });
const frequencies = visualizeAudio({ fps, frame, audioData, numberOfSamples: 256, optimizeFor: "speed", dataOffsetInSeconds });
\`\`\`

For waveforms: \`visualizeAudioWaveform()\` + \`createSmoothSvgPath()\`
For bass-reactive: slice low frequencies and average them.`,

  compositions: `A \`<Composition>\` defines the component, width, height, fps and duration of a renderable video.

\`\`\`tsx
import {Composition} from 'remotion';
<Composition id="MyComposition" component={MyComposition} durationInFrames={100} fps={30} width={1080} height={1080} />
\`\`\`

Use \`defaultProps\` for initial values. Use \`<Folder>\` to organize. Use \`<Still>\` for single-frame images.
Use \`calculateMetadata\` for dynamic dimensions/duration based on data.`,

  assets: `# Importing Assets

Place assets in \`public/\` folder. Use \`staticFile()\` to reference them:

\`\`\`tsx
import {Img, staticFile} from 'remotion';
<Img src={staticFile('logo.png')} />
\`\`\`

Works with \`<Img>\`, \`<Video>\`, \`<Audio>\`, and font loading.
Remote URLs can be used directly without \`staticFile()\`.`,
};

const REACTBITS_KNOWLEDGE: Record<string, string> = {
  "text-animations": `# ReactBits Text Animation Components

Import from '@appletosolutions/reactbits'.

## SplitText
Character-by-character reveal animation. Great for headlines.
\`\`\`tsx
import { SplitText } from '@appletosolutions/reactbits';
<SplitText text="Your Headline" className="text-4xl font-bold" delay={50} />
\`\`\`

## BlurText
Smooth blur-to-focus transition for text reveals.
\`\`\`tsx
import { BlurText } from '@appletosolutions/reactbits';
<BlurText text="Focus into view" delay={80} />
\`\`\`

## GradientText
Animated gradient coloring on text.
\`\`\`tsx
import { GradientText } from '@appletosolutions/reactbits';
<GradientText colors={["#ff6b6b", "#4ecdc4", "#45b7d1"]} animationSpeed={3}>
  Gradient Heading
</GradientText>
\`\`\`

## ShinyText
Metallic shine sweep effect.
\`\`\`tsx
import { ShinyText } from '@appletosolutions/reactbits';
<ShinyText text="Premium Feature" speed={3} />
\`\`\`

## CountUp
Animated number counter. Great for stats scenes.
\`\`\`tsx
import { CountUp } from '@appletosolutions/reactbits';
<CountUp from={0} to={10000} duration={2} separator="," />
\`\`\`

## GlitchText / DecryptedText / ScrambleText
Various text reveal effects.`,

  backgrounds: `# ReactBits Background Components

## Aurora - Northern lights WebGL shader effect
\`\`\`tsx
import { Aurora } from '@appletosolutions/reactbits';
<Aurora colorStops={["#3A29FF", "#FF94B4", "#FFE0A3"]} amplitude={1.2} speed={0.5} />
\`\`\`

## Particles - WebGL particle system
\`\`\`tsx
import { Particles } from '@appletosolutions/reactbits';
<Particles particleCount={200} particleColors={["#ffffff"]} speed={0.3} />
\`\`\`

## Silk / Lightning / Hyperspeed
Flowing fabric, electric bolts, and star field effects.`,

  effects: `# ReactBits Interactive & Visual Effect Components

## StarBorder - Animated glowing star/particle border
\`\`\`tsx
import { StarBorder } from '@appletosolutions/reactbits';
<StarBorder color="#ffd700" speed="3s"><div className="p-6">Content</div></StarBorder>
\`\`\`

## Bounce / FadeContent / AnimatedContent / GlareHover / Magnet
Various entrance animations and interactive effects.`,

  layout: `# ReactBits Layout Components

## AnimatedList - Staggered list item entrance animations
## Carousel - Smooth auto-playing carousel
## Stack - Card stack with swipe/dismiss
## Dock - macOS-style dock with magnetic scaling`,

  overview: `# ReactBits Overview

ReactBits (@appletosolutions/reactbits) provides 80+ production-ready animation components for React.

Categories: Text Animations (20+), Interactive Effects (15+), Background Effects (20+), Layout Components (15+), 3D Components (10+).

All components are tree-shakeable named exports:
\`\`\`tsx
import { SplitText, StarBorder, Aurora } from '@appletosolutions/reactbits';
\`\`\`

Important: Components using CSS transitions won't work in Remotion server rendering. Use frame-driven animations for video.`,
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const getKnowledge = httpAction(async (_ctx, request) => {
  try {
    const body = await request.json();
    const params =
      body.parameters && typeof body.parameters === "object"
        ? (body.parameters as Record<string, unknown>)
        : (body as Record<string, unknown>);

    const category = String(params.category || "remotion");
    const topic = String(params.topic || "");

    if (!topic) {
      return json({
        error: "Missing 'topic' parameter",
        available_remotion_topics: Object.keys(REMOTION_KNOWLEDGE),
        available_reactbits_topics: Object.keys(REACTBITS_KNOWLEDGE),
      });
    }

    if (category === "reactbits") {
      const content = REACTBITS_KNOWLEDGE[topic];
      if (!content) {
        return json({
          error: `Unknown reactbits topic: ${topic}`,
          available_topics: Object.keys(REACTBITS_KNOWLEDGE),
        });
      }
      return json({ category: "reactbits", topic, content });
    }

    const content = REMOTION_KNOWLEDGE[topic];
    if (!content) {
      return json({
        error: `Unknown remotion topic: ${topic}`,
        available_topics: Object.keys(REMOTION_KNOWLEDGE),
      });
    }

    return json({ category: "remotion", topic, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: `Failed to load knowledge: ${message}` }, 500);
  }
});
