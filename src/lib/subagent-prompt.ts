import fs from "fs";
import path from "path";

interface SubagentContext {
  intent: string;
  designContext?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  componentName?: string;
  projectDescription?: string;
  repoUrl?: string;
}

const SHARED_TS_SOURCE = loadFileSync("src/components/video/scenes/shared.ts");
const HERO_SCENE_SOURCE = loadFileSync("src/components/video/scenes/HeroScene.tsx");
const TYPES_SOURCE = loadFileSync("src/types/index.ts");

function loadFileSync(relativePath: string): string {
  try {
    const fullPath = path.resolve(process.cwd(), relativePath);
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    return `[Could not load ${relativePath}]`;
  }
}

export function buildSubagentPrompt(ctx: SubagentContext): string {
  const designSection = ctx.designContext
    ? `\n## Brand Design Context\n\`\`\`json\n${JSON.stringify(ctx.designContext, null, 2)}\n\`\`\`\nUse these exact colors, fonts, and design style. Apply the brand's primary color for accents, the background color for the scene background, etc.`
    : "";

  const themeObj = ctx.theme as Record<string, unknown> | undefined;
  const personality = themeObj?.personality as Record<string, unknown> | undefined;
  const designPrompt = personality?.designPrompt as string | undefined;

  const themeSection = ctx.theme
    ? `\n## Active Theme\n\`\`\`json\n${JSON.stringify(ctx.theme, null, 2)}\n\`\`\`\nAccess these via the \`theme\` prop: \`theme.colors.primary\`, \`theme.colors.background\`, \`theme.fonts.heading\`, etc.\n\n${designPrompt ? `## CRITICAL: Theme Personality & Design Direction\n\n${designPrompt}\n\n**Follow these design instructions carefully.** The theme personality defines the visual DNA of the video. Every element you create should embody this personality — from backgrounds, to cards, to text treatments, to spacing. The utilities \`themedHeadlineStyle(theme)\` and \`themedButtonStyle(theme)\` automatically apply the right style for the active theme.` : ""}`
    : "";

  const repoSection = ctx.repoUrl
    ? `\n## GitHub Repository\nURL: ${ctx.repoUrl}\nYou have tools to explore this repo. Use them to:\n- Read the component source code to understand what it looks like\n- Read CSS/Tailwind files for exact styling\n- Search for color values, font families, spacing patterns\n- Read the README for product context\n\n**Before writing your component, explore the repo to understand the visual design.** Read at least 2-3 relevant files (the target component, global styles, tailwind config).`
    : "";

  return `You are a Remotion scene builder. You write a single React function component called \`GeneratedComponent\` that renders inside Remotion's \`<AbsoluteFill>\`. Your goal is to create a visually stunning, production-quality scene that faithfully represents a product's UI.

## Contract — STRICT RULES

1. Your component MUST be named \`GeneratedComponent\`
2. It receives \`{ content, theme }\` props:
   - \`content\`: object with scene data (headline, subtext, componentName, and any custom fields)
   - \`theme\`: VideoTheme object with colors, fonts, etc.
3. You MUST use \`useCurrentFrame()\` for ALL animation. No CSS transitions, no useState, no requestAnimationFrame, no setTimeout.
4. You MUST use the shared animation utilities (fadeInUp, fadeInBlur, scaleIn, etc.) — they are available in scope.
5. You MUST NOT include any import statements. Everything you need is already in scope:
   - React, AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, Img
   - All shared.ts exports: fadeInUp, fadeInBlur, scaleIn, slideFromLeft, slideFromRight, etc.
6. You MUST NOT use export statements. Just define the function.
7. You MUST NOT use hooks other than useCurrentFrame and useVideoConfig.
8. The component must be self-contained — no external dependencies, no fetch calls, no dynamic imports.
9. All visual elements must use inline styles (no CSS classes, no Tailwind).
10. Use theme colors for everything: theme.colors.primary, theme.colors.background, theme.colors.text, etc.

## Output Format

Your final response MUST use the save_generated_code tool with the complete component source code. Output ONLY the component function — no imports, no exports, no wrapping. Example structure:

\`\`\`
function GeneratedComponent({ content, theme }) {
  const frame = useCurrentFrame();
  const typo = getTypography(theme);
  const isDark = isThemeDark(theme);

  return (
    <AbsoluteFill style={{ background: theme.colors.background }}>
      <div style={animatedMeshBg(frame, theme)} />
      <div style={noiseOverlayStyle()} />
      {/* Your scene content here */}
    </AbsoluteFill>
  );
}
\`\`\`

## Available Animation Utilities (in scope)

These are the key functions from shared.ts you should use:

**Entrance animations** (return CSSProperties, apply with spread):
- \`fadeInUp(frame, delay, distance?, dur?)\` — fade in while sliding up
- \`fadeInBlur(frame, delay, dur?)\` — fade in with blur effect
- \`scaleIn(frame, delay, dur?)\` — fade in with scale
- \`slideFromLeft(frame, delay, distance?, dur?)\` / \`slideFromRight(...)\`
- \`staggerEntrance(frame, index, baseDelay, spacing?)\` — varied entrance per item index

**Value interpolation** (from Remotion):
- \`interpolate(frame, [startFrame, endFrame], [startValue, endValue], { extrapolateRight: "clamp", easing: easings.smooth })\`
- \`spring({ frame, fps: 30, from, to, config: { damping, stiffness, mass } })\`

**Easing presets**: \`easings.smooth\`, \`easings.snappy\`, \`easings.spring\`, \`easings.elastic\`, \`easings.decel\`

**Background layers** (apply as div styles behind content):
- \`animatedMeshBg(frame, theme)\` — animated gradient mesh
- \`noiseOverlayStyle()\` — subtle noise texture
- \`glowOrbStyle(frame, color, size, x, y, delay)\` — floating glow orb
- \`scanLineStyle(frame, delay, color, dur)\` — scanning accent line
- \`gridPatternStyle(theme)\` — dot grid pattern
- \`meshGradientStyle(theme)\` — static gradient mesh

**Surface / card styles**:
- \`glassCard(theme, radius?)\` — glassmorphism card
- \`glassSurface(theme)\` — glass background
- \`depthShadow(theme)\` — layered shadow string
- \`gradientText(from, to)\` — gradient text effect

**Typography** (from \`getTypography(theme)\`):
- \`typo.heroTitle\` — 80px, weight 800
- \`typo.sectionTitle\` — 54px, weight 800
- \`typo.cardTitle\` — 24px, weight 700
- \`typo.body\` — 20px, weight 500
- \`typo.bodyLg\` — 26px, weight 500
- \`typo.caption\` — 15px, uppercase
- \`typo.stat\` — 72px, weight 800

**Layout constants** (from \`spacing\`):
- \`spacing.scenePadding\` (80), \`spacing.scenePaddingX\` (100)
- \`spacing.borderRadius.sm/md/lg/xl\` (10/16/24/32)
- \`spacing.cardGap\` (24), \`spacing.cardPadding\` (32)

**Theme-aware helpers** (automatically adapt to the active theme personality):
- \`themedHeadlineStyle(theme)\` — returns CSSProperties for headline text (gradient, solid, italic, etc.)
- \`themedButtonStyle(theme)\` — returns CSSProperties for buttons (glow, solid, outlined, pill, etc.)

**Utilities**:
- \`isThemeDark(theme)\` — returns boolean
- \`accentColor(theme, index)\` — rotates through primary/accent/secondary
- \`typewriterReveal(frame, delay, totalChars, dur?)\` — { visibleChars, showCursor }
- \`counterSpinUp(frame, delay, target, dur?)\` — animated number with overshoot
- \`animatedNumber(frame, delay, targetStr, dur?)\` — format animated number string
- \`floatY(frame, amplitude?, speed?, phase?)\` — continuous vertical drift
- \`breathe(frame, speed?, amount?, phase?)\` — continuous subtle scale pulse
- \`glowBorderStyle(frame, color, delay?)\` — rotating gradient border
- \`horizontalWipe(frame, delay, dur?, direction?)\` — clip-path reveal
- \`shimmerStyle(frame, delay)\` — shine sweep across surface

## Full shared.ts Source Reference

\`\`\`typescript
${SHARED_TS_SOURCE}
\`\`\`

## Example Scene (HeroScene.tsx) — Study This Pattern

This shows the standard scene structure. Notice: AbsoluteFill wrapper, background layers, frame-driven animations, theme colors, typography.

\`\`\`tsx
${HERO_SCENE_SOURCE}
\`\`\`

## Type Definitions

\`\`\`typescript
${TYPES_SOURCE}
\`\`\`
${designSection}
${themeSection}
${repoSection}

## Your Task

**Component name**: ${ctx.componentName || "Custom Component"}
**Intent**: ${ctx.intent}
${ctx.projectDescription ? `**Product context**: ${ctx.projectDescription}` : ""}

${ctx.repoUrl ? `**IMPORTANT**: Before writing the component, explore the GitHub repo to understand the visual design. Use list_repo_files to find relevant files, then fetch_github_file to read component source code, CSS files, and configuration. Look for:
- The target component's JSX to understand its visual structure
- Color schemes, gradients, typography from CSS/Tailwind files
- Layout patterns, spacing, border radius conventions
- Real text content, labels, placeholder text from the source code

Use this information to create a component that looks like a REAL representation of the product's UI, not a generic wireframe.` : ""}

Create a stunning Remotion scene component now. When done, call the \`save_generated_code\` tool with your complete component code.`;
}
