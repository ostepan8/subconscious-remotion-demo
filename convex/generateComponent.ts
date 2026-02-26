import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { validateComponentCode } from "./validateComponent";
import { SUBCONSCIOUS_CODING_ENGINE } from "./constants";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function errorJson(msg: string, detail?: string) {
  return json(
    { success: false, error: msg, detail },
    400,
  );
}

function parseBody(body: Record<string, unknown>) {
  if (
    body.parameters &&
    typeof body.parameters === "object"
  ) {
    return body.parameters as Record<string, unknown>;
  }
  return body;
}

// ---------------------------------------------------------------------------
// API reference that tells the model what's available in the sandbox
// ---------------------------------------------------------------------------

const COMPONENT_API_REF = `## AVAILABLE API — use ONLY these. Everything else is UNDEFINED.

### React (in scope)
useState, useEffect, useRef, useMemo, useCallback, React.createElement, Fragment, memo

### Remotion (in scope)
useCurrentFrame(), useVideoConfig(), interpolate(value, inputRange, outputRange, options?), spring({ frame, fps, config? }), Easing, AbsoluteFill, Sequence, Img, staticFile
- Video is 1920×1080 at 30fps. Your component MUST fill the entire frame.

### Animation helpers (in scope — delays are FRAME integers, fps=30)
fadeInBlur(frame, delay, dur?), fadeInUp(frame, delay, distance?, dur?), scaleIn(frame, delay, dur?), slideFromLeft(frame, delay, distance?, dur?), slideFromRight(frame, delay, distance?, dur?), glowPulse(frame, delay, color), revealLine(frame, delay, dur?), counterSpinUp(frame, delay, target, dur?), floatY(frame, amplitude?, speed?, phase?), breathe(frame, speed?, amount?, phase?)
- staggerEntrance(frame, index, baseDelay, spacing?) — auto-picks a different animation per index
- counterSpinUp returns a RAW FLOAT — you MUST format it: Math.round(counterSpinUp(frame, delay, 4300)) or counterSpinUp(frame, delay, 99.9).toFixed(1)
- typewriterReveal(frame, delay, totalChars, dur?) — ⚠️ RETURNS AN OBJECT { visibleChars: number, showCursor: boolean }, NOT a string!
  CORRECT: const tw = typewriterReveal(frame, 10, myText.length); then render myText.slice(0, tw.visibleChars)
  WRONG: rendering typewriterReveal(...) directly — it's an object, React will crash!

### Background helpers — RETURN CSSProperties OBJECTS, use with spread syntax
- animatedMeshBg(frame, theme) → style object with animated radial gradients. Use: React.createElement('div', { style: animatedMeshBg(frame, theme) })
- meshGradientStyle(theme) → static gradient overlay style object
- gridPatternStyle(theme) → subtle grid pattern style object
- noiseOverlayStyle() → noise texture style object
- glowOrbStyle(frame, color, size, x, y, delay?) → floating glow orb style object
- scanLineStyle(frame, delay, color, dur?) → animated scan line style object
- glowBorderStyle(frame, color, delay?) → animated border glow style object
ALL of these return { position:'absolute', inset:0, ... } — render as separate div layers BEHIND your content.

### Surface helpers (in scope)
- glassSurface(theme) → { background, backdropFilter, border } for frosted glass
- glassCard(theme, radius?) → glassSurface + borderRadius
- depthShadow() → returns a STRING, use as boxShadow: depthShadow()
- gradientText(from, to) → style object for gradient text (spread onto a span/div)
- themedHeadlineStyle(theme) → gradient text matching theme
- themedButtonStyle(theme) → styled button
- accentColor(theme, index?) → returns a color string
- isThemeDark(theme) → boolean

### Typography & layout (in scope)
- getTypography(theme) → { heroTitle, sectionTitle, cardTitle, body, bodyLg, caption, stat, label } — each is a style object with fontSize, fontWeight etc. Spread them: { ...typoResult.heroTitle }
- typo → raw typography presets object (same keys). Use: typo.heroTitle, typo.stat, etc.
- spacing → { scenePadding:80, scenePaddingX:100, sectionGap:56, cardGap:24, cardPadding:32, borderRadius: { sm:10, md:16, lg:24, xl:32 } }

### Images (in scope)
- Img — Remotion image component. Usage: React.createElement(Img, { src: url, style: { width: 400, height: 300, objectFit: 'cover', borderRadius: 16 } })
- content.images — array of { name, url, width, height } from the project media library (may be empty)
- Always set explicit width and height on images. Use objectFit:'cover' or 'contain'.
- For product screenshots: wrap in a glassCard div with padding, shadow, and rounded corners.
- For logos/icons: render smaller (100-200px) with objectFit:'contain'.
- Animate image entrance with scaleIn or fadeInBlur for polish.`;

// ---------------------------------------------------------------------------
// System prompt — kept short and direct
// ---------------------------------------------------------------------------

const SUBAGENT_SYSTEM_PROMPT = `You are a Remotion scene builder creating production-quality video scenes at 1920×1080.

## Rules
1. Signature: \`function GeneratedComponent({ content, theme })\`
2. Root element MUST be AbsoluteFill — your scene fills the ENTIRE 1920×1080 frame
3. NO imports, NO exports — everything listed below is already in scope
4. Inline styles only (no CSS classes, no CSS modules)
5. Use useCurrentFrame() for frame-based animation. fps is 30.
6. Use React.createElement() for all elements (no JSX)
7. depthShadow() returns a string — use as \`boxShadow: depthShadow()\`, never spread it
8. Background helpers return STYLE OBJECTS — render them as separate \`<div>\` layers, don't assign to \`background:\`

## Visual Quality Checklist
- Fill the FULL frame. Use padding (80-100px) to give content breathing room, not tiny centered cards.
- Layer backgrounds: animatedMeshBg → gridPatternStyle → content. Each is its own div.
- Use staggered animations: fadeInBlur/fadeInUp with increasing delays (e.g. 5, 15, 25, 35)
- Use glassSurface/glassCard for panels, depthShadow() for depth
- Use gradientText or themedHeadlineStyle for headlines
- Large, readable typography: heroTitle for main text, sectionTitle for section headers
- Animate numbers with counterSpinUp — ALWAYS wrap with Math.round() or .toFixed(). Example: Math.round(counterSpinUp(frame, 10, 4300)) displays "4300", not "4299.588692657". For percentages use .toFixed(1). Never show raw floats.
- Format large numbers with toLocaleString() after rounding for commas (e.g. "12,000+")
- Animate text with typewriterReveal — ⚠️ READ CAREFULLY:
  typewriterReveal(frame, delay, totalChars) returns an OBJECT { visibleChars, showCursor }, NOT a string.
  CORRECT usage:
    const title = 'Hello World';
    const tw = typewriterReveal(frame, 10, title.length);
    React.createElement('span', null, title.slice(0, tw.visibleChars))
  WRONG (will crash): React.createElement('span', null, typewriterReveal(frame, 10, 11))
  WRONG (will crash): const text = typewriterReveal(frame, 10, 'Hello'.length);  then rendering {text}

## Architecture Pattern
\`\`\`
AbsoluteFill (root — fills 1920×1080)
  ├── div style={animatedMeshBg(frame, theme)}    // animated bg layer
  ├── div style={gridPatternStyle(theme)}          // grid overlay
  └── div style={{ position:'relative', zIndex:1, width:'100%', height:'100%', display:'flex', padding:80 }}
        └── YOUR CONTENT HERE (cards, stats, text, etc.)
\`\`\`

${COMPONENT_API_REF}

## Workflow
1. Call write_code with your COMPLETE component (one call, full code)
2. Call finalize_component to validate
3. If finalize_component returns success=false, you MUST fix it:
   - Read the error message carefully
   - Call edit_code to fix the specific issue (find the broken code, replace with correct code)
   - Call finalize_component again
   - Repeat until success=true or you've tried 3 times
4. If you CANNOT complete the task (impossible request, exhausted retries, or unclear instructions), call report_error with a clear explanation so the user is notified immediately

## CRITICAL: typewriterReveal Example (MUST follow this pattern)
\`\`\`
const title = 'Resumes Tailored';
const tw = typewriterReveal(frame, 15, title.length);
// Render the SLICED STRING, not the tw object:
React.createElement('h1', { style: headingStyle }, title.slice(0, tw.visibleChars))
// Optional blinking cursor:
tw.showCursor ? React.createElement('span', { style: cursorStyle }, '|') : null
\`\`\`
NEVER do: React.createElement('span', null, typewriterReveal(frame, 15, 18))  ← CRASHES (object as child)`;

// ---------------------------------------------------------------------------
// Build tools — just write_code, edit_code, finalize_component
// ---------------------------------------------------------------------------

function buildSubagentTools(
  convexSiteUrl: string,
  sceneId: string,
) {
  const s = (path: string) =>
    `${convexSiteUrl}/tools/${path}`;
  return [
    {
      type: "function",
      name: "write_code",
      description:
        "Write your COMPLETE component code. This REPLACES the entire buffer.",
      url: s("write-code"),
      method: "POST",
      timeout: 15,
      parameters: {
        type: "object",
        properties: {
          sceneId: {
            type: "string",
            description: "Scene ID",
          },
          code: {
            type: "string",
            description:
              "Complete component code.",
          },
        },
        required: ["code"],
        additionalProperties: false,
      },
      defaults: { sceneId },
    },
    {
      type: "function",
      name: "edit_code",
      description:
        "Find-and-replace in the code buffer. Use to fix validation errors.",
      url: s("edit-code"),
      method: "POST",
      timeout: 15,
      parameters: {
        type: "object",
        properties: {
          sceneId: {
            type: "string",
            description: "Scene ID",
          },
          oldString: {
            type: "string",
            description: "Exact text to find.",
          },
          newString: {
            type: "string",
            description: "Replacement text.",
          },
        },
        required: ["oldString", "newString"],
        additionalProperties: false,
      },
      defaults: { sceneId },
    },
    {
      type: "function",
      name: "finalize_component",
      description:
        "Validate and save. Returns errors if any — use edit_code to fix.",
      url: s("finalize-component"),
      method: "POST",
      timeout: 15,
      parameters: {
        type: "object",
        properties: {
          sceneId: {
            type: "string",
            description: "Scene ID",
          },
        },
        required: [] as string[],
        additionalProperties: false,
      },
      defaults: { sceneId },
    },
    {
      type: "function",
      name: "report_error",
      description:
        "Call this when you CANNOT complete the task. Provide a clear error message. This notifies the user immediately instead of leaving them waiting.",
      url: s("report-error"),
      method: "POST",
      timeout: 10,
      parameters: {
        type: "object",
        properties: {
          sceneId: {
            type: "string",
            description: "Scene ID",
          },
          errorMessage: {
            type: "string",
            description:
              "A clear explanation of why the task cannot be completed",
          },
        },
        required: ["errorMessage"],
        additionalProperties: false,
      },
      defaults: { sceneId },
    },
  ];
}

// ---------------------------------------------------------------------------
// Main handler: spawns a Subconscious subagent for component generation
// ---------------------------------------------------------------------------

export const generateComponentHttp = httpAction(
  async (ctx, request) => {
    try {
      const body = await request.json();
      const params = parseBody(body);
      const projectId =
        params.projectId as Id<"projects">;
      const sceneId = params.sceneId as Id<"scenes">;
      const intent = params.intent
        ? String(params.intent)
        : "";
      const componentName = String(
        params.componentName || "GeneratedComponent",
      );

      if (!sceneId)
        return errorJson("sceneId is required");

      const scene = await ctx.runQuery(
        api.scenes.getScene,
        { sceneId },
      );
      if (!scene) return errorJson("Scene not found");

      const existingContent =
        (scene.content as Record<string, unknown>) || {};

      // Pre-fetch image media for the project
      type ImageEntry = {
        name: string;
        url: string;
        width: number;
        height: number;
      };
      let images: ImageEntry[] = [];
      if (projectId) {
        try {
          const mediaItems = await ctx.runQuery(
            api.media.getMediaByType,
            { projectId, type: "image" },
          );
          images = mediaItems
            .filter(
              (m: { url?: string | null }) => !!m.url,
            )
            .map(
              (m: {
                name: string;
                url?: string | null;
                width?: number;
                height?: number;
              }) => ({
                name: m.name,
                url: m.url!,
                width: m.width || 0,
                height: m.height || 0,
              }),
            );
        } catch {
          // media fetch is best-effort
        }
      }

      await ctx.runMutation(api.scenes.updateScene, {
        sceneId,
        content: {
          ...existingContent,
          generationStatus: "generating",
          codeBuffer: "",
          intent,
          images,
        },
      });

      let projectDesignContext = "";
      if (projectId) {
        const project = await ctx.runQuery(
          api.projects.getProjectById,
          { projectId },
        );
        if (project) {
          const dc = project.designContext as
            | Record<string, unknown>
            | undefined;
          if (dc) {
            projectDesignContext = `\n## Project Design Reference (for visual inspiration ONLY)
\`\`\`json
${JSON.stringify(dc, null, 2)}
\`\`\`
IMPORTANT: These colors are for REFERENCE. Use them as hardcoded hex strings in your code.
Do NOT access theme.brandColors — it does NOT exist. The theme object only has:
  theme.colors.{background, surface, primary, secondary, text, textMuted, accent}
  theme.fonts.{heading, body}
  theme.borderRadius
Use the brand colors above as literal hex values, e.g.: const accentOrange = '#FF5C28';
`;
          }
        }
      }

      // Build image catalog for the prompt
      let imageCatalog = "";
      if (images.length > 0) {
        const rows = images
          .map(
            (img, i) =>
              `| ${i} | ${img.name} | ${img.width}x${img.height} |`,
          )
          .join("\n");
        imageCatalog = `
## Available Images (access via content.images)
| # | Name | Size |
|---|------|------|
${rows}

Use: React.createElement(Img, { src: content.images[0].url, style: { width: 400, objectFit: 'cover' } })
Pick images that match the intent. Set explicit width/height. Wrap product screenshots in a glassCard.
`;
      }

      const fullPrompt = `${SUBAGENT_SYSTEM_PROMPT}
${projectDesignContext}${imageCatalog}
## Task
**Component**: ${componentName}
**Intent**: ${intent}

Write the complete component in a single write_code call, then call finalize_component.`;

      const apiKey =
        process.env.SUBCONSCIOUS_API_KEY;
      const convexSiteUrl =
        process.env.CONVEX_SITE_URL!;

      if (!apiKey || !convexSiteUrl) {
        return errorJson(
          "SUBCONSCIOUS_API_KEY or CONVEX_SITE_URL not configured",
        );
      }

      const tools = buildSubagentTools(
        convexSiteUrl,
        sceneId,
      );

      const runResponse = await fetch(
        "https://api.subconscious.dev/v1/runs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            engine: SUBCONSCIOUS_CODING_ENGINE,
            input: {
              instructions: fullPrompt,
              tools,
            },
          }),
        },
      );

      if (!runResponse.ok) {
        const errText = await runResponse.text();
        console.error(
          "Subconscious API error:",
          errText,
        );
        await ctx.runMutation(api.scenes.updateScene, {
          sceneId,
          content: {
            ...existingContent,
            generationStatus: "error",
            generationError: `Subagent spawn failed: HTTP ${runResponse.status}`,
          },
        });
        return errorJson(
          "Failed to spawn subagent",
          errText.slice(0, 500),
        );
      }

      const runData = (await runResponse.json()) as {
        runId?: string;
      };

      return json({
        success: true,
        message:
          "Subagent spawned. Scene updates in real-time.",
        runId: runData.runId,
      });
    } catch (e) {
      return errorJson(
        "generate_component failed",
        String(e),
      );
    }
  },
);

// ---------------------------------------------------------------------------
// Edit an existing generated scene's code via Subconscious
// ---------------------------------------------------------------------------

const EDIT_PROMPT_PREFIX = `You are a precise React/Remotion component code editor.
You receive the current component source code and a user instruction, then return the COMPLETE modified code.

${COMPONENT_API_REF}

## Output format
1. Return the FULL modified component code inside a single \`\`\`tsx code fence.
2. No partial patches — always the complete function from start to finish.
3. After the code fence, write a 1-sentence explanation of what you changed.

## Rules
- Only use functions from the AVAILABLE API above
- NO imports, NO exports — everything is already in scope
- depthShadow() returns a string — use as boxShadow: depthShadow(), don't spread it
- getTypography(theme) returns the style objects directly
- counterSpinUp() returns a raw float — ALWAYS wrap: Math.round(counterSpinUp(...)) or .toFixed(1). Never display unformatted floats.
- Use React.createElement() for all elements (no JSX)
- Use integer frame numbers for animation delays`;

function extractCodeFromFence(text: string): {
  code: string | null;
  explanation: string;
} {
  const codeMatch = text.match(
    /```(?:tsx|typescript|jsx|javascript)?\s*\n([\s\S]*?)```/,
  );
  const code = codeMatch ? codeMatch[1].trim() : null;
  const explanationMatch = text.match(
    /```[\s\S]*?```\s*\n*([\s\S]*)/,
  );
  const explanation = explanationMatch
    ? explanationMatch[1].trim()
    : "Changes applied.";
  return { code, explanation };
}

export const editGeneratedSceneHttp = httpAction(
  async (ctx, request) => {
    try {
      const body = await request.json();
      const params = parseBody(body);
      const sceneId = params.sceneId as Id<"scenes">;
      const instruction = String(
        params.instruction || "",
      );
      const projectId =
        params.projectId as Id<"projects"> | undefined;

      if (!sceneId)
        return errorJson("sceneId is required");
      if (!instruction.trim())
        return errorJson("instruction is required");

      const scene = await ctx.runQuery(
        api.scenes.getScene,
        { sceneId },
      );
      if (!scene)
        return errorJson("Scene not found");

      const content =
        (scene.content as Record<string, unknown>) ||
        {};
      const currentCode = String(
        content.generatedCode || "",
      );
      if (!currentCode)
        return errorJson(
          "Scene has no generated code to edit",
        );

      let designContext = "";
      if (projectId) {
        try {
          const project = await ctx.runQuery(
            api.projects.getProjectById,
            { projectId },
          );
          if (project?.designContext) {
            designContext = `\n## Project Design Reference (for visual inspiration ONLY)
\`\`\`json
${JSON.stringify(project.designContext, null, 2)}
\`\`\`
IMPORTANT: These colors are for REFERENCE. Use them as hardcoded hex strings.
Do NOT access theme.brandColors — it does NOT exist. The theme only has:
  theme.colors.{background, surface, primary, secondary, text, textMuted, accent}
Use brand colors as literal hex values, e.g.: const accentOrange = '#FF5C28';
`;
          }
        } catch {
          /* best-effort */
        }
      }

      const apiKey =
        process.env.SUBCONSCIOUS_API_KEY;
      if (!apiKey)
        return errorJson(
          "SUBCONSCIOUS_API_KEY not configured",
        );

      const MAX_RETRIES = 1;
      let lastError: string | null = null;
      let finalCode: string | null = null;
      let finalExplanation = "Changes applied.";
      let codeToEdit = currentCode;

      for (
        let attempt = 0;
        attempt <= MAX_RETRIES;
        attempt++
      ) {
        const isRetry = attempt > 0;

        let prompt: string;
        if (isRetry && lastError) {
          prompt = `${EDIT_PROMPT_PREFIX}
${designContext}
## Current Component Code
\`\`\`tsx
${codeToEdit}
\`\`\`

## COMPILATION FAILED — FIX REQUIRED (attempt ${attempt + 1})
The previous code failed validation:
\`\`\`
${lastError}
\`\`\`

Fix the error and return the COMPLETE fixed code in a \`\`\`tsx fence.`;
        } else {
          prompt = `${EDIT_PROMPT_PREFIX}
${designContext}
## Current Component Code
\`\`\`tsx
${currentCode}
\`\`\`

## Instruction
${instruction}`;
        }

        const runRes = await fetch(
          "https://api.subconscious.dev/v1/runs",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              engine: SUBCONSCIOUS_CODING_ENGINE,
              input: { instructions: prompt },
              options: { awaitCompletion: true },
            }),
          },
        );

        if (!runRes.ok) {
          const errText = await runRes.text();
          return errorJson(
            "Subconscious API error",
            errText.slice(0, 500),
          );
        }

        const runData = (await runRes.json()) as {
          result?: { answer?: unknown };
        };
        const answer = runData.result?.answer;
        if (!answer)
          return errorJson(
            "No response from AI editor",
          );

        const answerText =
          typeof answer === "string"
            ? answer
            : JSON.stringify(answer);
        const { code, explanation } =
          extractCodeFromFence(answerText);

        if (!code) {
          return errorJson(
            "AI did not return code in a ```tsx fence",
          );
        }

        const validation =
          validateComponentCode(code);

        if (validation.valid) {
          finalCode = validation.fixedCode;
          finalExplanation = explanation;
          break;
        } else {
          lastError =
            validation.error ||
            "Unknown validation error";
          codeToEdit = code;

          if (attempt === MAX_RETRIES) {
            finalCode = validation.fixedCode;
            finalExplanation = `${explanation}\n⚠️ Warning: ${lastError}`;
            break;
          }
        }
      }

      if (!finalCode)
        return errorJson("Failed to produce valid code");

      await ctx.runMutation(
        api.scenes.updateScene,
        {
          sceneId,
          content: {
            ...content,
            generatedCode: finalCode,
            generationStatus: "ready",
          },
        },
      );

      return json({
        success: true,
        explanation: finalExplanation,
        validated: !lastError,
        validationWarning: lastError || undefined,
        codeLength: finalCode.length,
      });
    } catch (e) {
      return errorJson(
        "edit_generated_scene failed",
        String(e),
      );
    }
  },
);

// ---------------------------------------------------------------------------
// Custom component generation & saving
// ---------------------------------------------------------------------------

export const generateCustomComponentHttp = httpAction(
  async (ctx, request) => {
    try {
      const body = await request.json();
      const params = parseBody(body);
      const projectId =
        params.projectId as Id<"projects">;
      const name = String(params.name || "Component");
      const description = String(
        params.description || "",
      );

      if (!projectId)
        return errorJson("projectId is required");

      const componentId = await ctx.runMutation(
        api.customComponents.create,
        { projectId, name, description },
      );

      return json({ success: true, componentId });
    } catch (e) {
      return errorJson(
        "generate_custom_component failed",
        String(e),
      );
    }
  },
);

export const saveCustomComponentHttp = httpAction(
  async (ctx, request) => {
    try {
      const body = await request.json();
      const params = parseBody(body);
      const componentId =
        params.componentId as Id<"customComponents">;
      const code = String(params.code || "");
      const error = params.error
        ? String(params.error)
        : undefined;

      if (!componentId)
        return errorJson("componentId is required");

      if (error) {
        await ctx.runMutation(
          api.customComponents.setError,
          { componentId, error },
        );
        return json({ success: true, status: "error" });
      }

      if (!code)
        return errorJson("code or error is required");

      const validation = validateComponentCode(code);
      if (!validation.valid) {
        await ctx.runMutation(
          api.customComponents.setError,
          {
            componentId,
            error: `Validation failed: ${validation.error}`,
          },
        );
        return json({
          success: false,
          error: validation.error,
          undefinedRefs: validation.undefinedRefs,
          message:
            "Your code did not compile. Fix the error and call save_custom_component again.",
        });
      }

      await ctx.runMutation(
        api.customComponents.saveCode,
        {
          componentId,
          code: validation.fixedCode,
        },
      );

      const result: Record<string, unknown> = {
        success: true,
        status: "ready",
      };
      if (
        validation.warnings &&
        validation.warnings.length > 0
      ) {
        result.warnings = validation.warnings;
      }
      return json(result);
    } catch (e) {
      return errorJson(
        "save_custom_component failed",
        String(e),
      );
    }
  },
);
