/**
 * Test generate_component against the LOCAL tim-large server (http://localhost:8080).
 * Uses streaming SSE since GPT 4.1 engine is async/streaming only.
 *
 * Usage: npx tsx scripts/test-local-tl.ts
 */

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
const dotenv = require("dotenv");
const path = require("path");

const root = path.resolve(__dirname, "..");
dotenv.config({ path: path.resolve(root, ".env.local") });

const TL_URL = "http://localhost:8080/v1/chat/completions";
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;
const TOOL_SECRET = process.env.TOOL_ENDPOINT_SECRET || "dev-secret";
const PROJECT_ID = "k17ddh3h4e1gpextve74f2cty981sj1f";
const SCENE_ID = "test-local-scene";

function toolUrl(toolPath: string): string {
  return `${CONVEX_SITE_URL}/tools/${toolPath}?secret=${TOOL_SECRET}`;
}

const SYSTEM_PROMPT = `You are a Remotion scene builder. You write a single React function component called \`GeneratedComponent\` that renders inside Remotion's \`<AbsoluteFill>\`. Your goal is to create a visually stunning, production-quality scene that faithfully represents a product's UI.

## Contract — STRICT RULES

1. Your component MUST be named \`GeneratedComponent\`
2. It receives \`{ content, theme }\` props
3. You MUST use \`useCurrentFrame()\` for ALL animation. No CSS transitions, no useState.
4. You MUST use shared animation utilities — they are available in scope.
5. You MUST NOT include any import or export statements. Everything is in scope.
6. You MUST NOT use hooks other than useCurrentFrame and useVideoConfig.
7. The component must be self-contained — no external dependencies, no fetch calls.
8. All visual elements must use inline styles (no CSS classes, no Tailwind).
9. Use the brand colors from the design context for UI mockup elements. Use theme.colors for the scene background/container.

## Output Format

Your final response MUST use the save_generated_code tool with the complete component code. Example:

\`\`\`
function GeneratedComponent({ content, theme }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: theme.colors.background }}>
      {/* Your scene content here */}
    </AbsoluteFill>
  );
}
\`\`\`

## Available in Scope

React, AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, Img

**Entrance animations**: fadeInUp(frame, delay), fadeInBlur(frame, delay), scaleIn(frame, delay), slideFromLeft(frame, delay), slideFromRight(frame, delay), staggerEntrance(frame, index, baseDelay)

**Interpolation**: interpolate(frame, [start,end], [from,to], {extrapolateRight:"clamp"}), spring({frame, fps:30, from, to, config:{damping,stiffness}})

**Backgrounds**: animatedMeshBg(frame, theme), glowOrbStyle(frame, color, size, x, y, delay), gridPatternStyle(theme), noiseOverlayStyle()

**Cards**: glassCard(theme), glassSurface(theme), depthShadow(theme), gradientText(from, to)

**Typography**: getTypography(theme) returns {heroTitle, sectionTitle, cardTitle, body, bodyLg, caption, stat}

**Utilities**: animatedNumber(frame, delay, targetStr), typewriterReveal(frame, delay, totalChars), floatY(frame), breathe(frame), glowPulse(frame, delay, color), shimmerStyle(frame, delay), glowBorderStyle(frame, color)

## Brand Design Context
\`\`\`json
{"brandColors":{"color-primary-orange":"#FF5C28","color-secondary-teal":"#3ED0C3","color-accent-green":"#B5E800","color-primary-black":"#101820","color-background-cream":"#F0F3EF"},"designStyle":"dark-neon","fonts":{"heading":"Manrope","body":"Manrope"}}
\`\`\`

## GitHub Repository
URL: https://github.com/ostepan8/resume-tailoring-agent
You have tools to explore this repo. **BEFORE writing your component, explore the repo.** Read at least 2-3 relevant files.

## Your Task

**Component name**: DashboardView
**Intent**: Show the resume tailoring app's dashboard. Dark sidebar on the left with nav items (Overview active in orange #FF5C28). Main content: 'Your Profile Overview' header, 4 stat cards in 2x2 grid. Dark bg #101820, surface #1a2430, text #F0F3EF.

Create a stunning Remotion scene now. When done, call save_generated_code with your complete component code.`;

const TOOLS = [
  {
    type: "function",
    name: "list_repo_files",
    description: "List all files in the GitHub repo. Call this FIRST.",
    url: toolUrl("list-repo-files"),
    method: "POST",
    timeout: 20,
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The project ID" },
        directory: { type: "string", description: "Filter by directory" },
        extension: { type: "string", description: "Filter by extension" },
      },
      required: ["pattern"],
      additionalProperties: false,
    },
    defaults: { projectId: PROJECT_ID },
  },
  {
    type: "function",
    name: "fetch_github_file",
    description: "Read a file from the repo.",
    url: toolUrl("fetch-github-file"),
    method: "POST",
    timeout: 20,
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The project ID" },
        path: { type: "string", description: "File path in repo" },
      },
      required: ["path"],
      additionalProperties: false,
    },
    defaults: { projectId: PROJECT_ID },
  },
  {
    type: "function",
    name: "search_repo_files",
    description: "Search the repo for a text pattern.",
    url: toolUrl("search-repo-files"),
    method: "POST",
    timeout: 30,
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The project ID" },
        pattern: { type: "string", description: "Text or regex to search for" },
        fileExtensions: { type: "string", description: "Comma-separated extensions" },
      },
      required: [] as string[],
      additionalProperties: false,
    },
    defaults: { projectId: PROJECT_ID },
  },
  {
    type: "function",
    name: "save_generated_code",
    description: "Save the generated component code. Call this as your LAST action.",
    url: toolUrl("save-generated-code"),
    method: "POST",
    timeout: 15,
    parameters: {
      type: "object",
      properties: {
        sceneId: { type: "string", description: "The scene ID" },
        generatedCode: { type: "string", description: "Complete GeneratedComponent function code (TSX)." },
        error: { type: "string", description: "Error message if generation failed" },
      },
      required: ["sceneId"],
      additionalProperties: false,
    },
    defaults: { sceneId: SCENE_ID },
  },
];

async function main() {
  console.log("🚀 Local TL Test (streaming)\n");
  console.log(`   TL: ${TL_URL}`);
  console.log(`   Convex: ${CONVEX_SITE_URL}\n`);

  const body = {
    model: "tim-gpt",
    messages: [{ role: "user", content: SYSTEM_PROMPT }],
    tools: TOOLS,
    stream: true,
  };

  console.log("   Sending streaming request...\n");
  const t0 = Date.now();

  let response: Response;
  try {
    response = await fetch(TL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    console.error(`❌ Connection failed: ${e.message}`);
    console.error("Is the TL server running? (pnpm tl:up)");
    process.exit(1);
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error(`❌ HTTP ${response.status}: ${errText.slice(0, 500)}`);
    process.exit(1);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    console.error("❌ No readable stream");
    process.exit(1);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let chunkCount = 0;
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("event: ping")) continue;
      if (line === ":" || line === "") continue;
      if (!line.startsWith("data: ")) continue;

      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        const elapsed = Math.round((Date.now() - t0) / 1000);
        console.log(`\n⏹️  Stream DONE (${elapsed}s, ${chunkCount} chunks)`);
        console.log(`\n📦 Full content (${fullContent.length} chars):`);
        console.log(fullContent.slice(0, 2000));

        if (fullContent.includes("GeneratedComponent")) {
          console.log("\n✅ Got GeneratedComponent!");
        }
        if (fullContent.includes("save_generated_code")) {
          console.log("✅ save_generated_code was called!");
        }
        process.exit(0);
      }

      if (data === "{}") continue;

      try {
        const parsed = JSON.parse(data);

        if (parsed.error) {
          console.log(`\n❌ Error: ${JSON.stringify(parsed.error).slice(0, 300)}`);
          process.exit(1);
        }

        const delta = parsed.choices?.[0]?.delta;
        const finishReason = parsed.choices?.[0]?.finish_reason;

        if (delta?.content) {
          chunkCount++;
          fullContent += delta.content;

          // Log reasoning steps as they come
          if (delta.content.includes('"action_type"') || delta.content.includes('"title"')) {
            try {
              const action = JSON.parse(delta.content);
              const type = action.action_type || "?";
              const title = action.title || "";
              const elapsed = Math.round((Date.now() - t0) / 1000);

              if (type === "reasoning_step") {
                console.log(`   [${elapsed}s] 🧠 ${title}: ${(action.thought || "").slice(0, 120)}`);
              } else if (type === "tool_call") {
                console.log(`   [${elapsed}s] 🔧 TOOL CALL: ${action.tool_name}(${JSON.stringify(action.parameters || {}).slice(0, 100)})`);
              } else if (type === "receive_tool_response") {
                const res = (action.result || "").slice(0, 100);
                console.log(`   [${elapsed}s] 📥 Tool response: ${res}`);
              } else if (type === "complete") {
                console.log(`   [${elapsed}s] ✅ Complete!`);
                if (action.answer) {
                  console.log(`   Answer (${action.answer.length} chars): ${action.answer.slice(0, 200)}`);
                }
              } else {
                console.log(`   [${elapsed}s] 📦 ${type}: ${title}`);
              }
            } catch {
              // Not JSON, just content
              if (chunkCount % 20 === 0) {
                const elapsed = Math.round((Date.now() - t0) / 1000);
                console.log(`   [${elapsed}s] ... ${chunkCount} chunks, ${fullContent.length} chars`);
              }
            }
          } else if (chunkCount % 20 === 0) {
            const elapsed = Math.round((Date.now() - t0) / 1000);
            console.log(`   [${elapsed}s] ... ${chunkCount} chunks, ${fullContent.length} chars`);
          }
        }

        if (finishReason) {
          const elapsed = Math.round((Date.now() - t0) / 1000);
          console.log(`\n   [${elapsed}s] finish_reason=${finishReason}`);
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  console.log("\n❌ Stream ended without [DONE]");
  process.exit(1);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
