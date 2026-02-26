import { Subconscious } from "subconscious";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest } from "next/server";
import { COMPONENT_API_REFERENCE } from "@/lib/component-api-reference";
import { validateComponent } from "@/lib/validate-component";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

const SUBCONSCIOUS_CODING_ENGINE = "tim-gpt-heavy";

const AGENTIC_EDITOR_PROMPT = `You are a precise React/Remotion code editor that makes TARGETED edits.
You modify components by reading the current code, then making focused find-and-replace edits.

${COMPONENT_API_REFERENCE}

## Workflow
1. Call read_code to see the current component source
2. Plan your changes — identify EXACTLY what needs to change
3. Call edit_code for each change — use EXACT text from read_code as old_text
4. Call finalize to validate your changes compile
5. If finalize reports errors, call read_code again, then edit_code to fix, then finalize again
6. If you CANNOT complete the request (e.g. the instruction is unclear, the task is impossible, or you've exhausted retries), call report_error with a clear explanation so the user is notified immediately

## Rules
- Make the SMALLEST changes needed. Do NOT rewrite the entire file.
- old_text in edit_code must be an EXACT substring of the current code (copy from read_code output)
- If you need to add new code, use edit_code: set old_text to the line BEFORE where you want to insert, and new_text to that line + your new code
- If you need to remove code, set new_text to empty string
- counterSpinUp() returns a raw float — always wrap: Math.round(counterSpinUp(...))
- depthShadow() returns a string — use as boxShadow: depthShadow(), never spread
- Use React.createElement() for all elements (no JSX)
- Use integer frame numbers for animation delays

## Example
If the code has:
  color: '#ff0000'
And the user says "make it blue", call:
  edit_code({ old_text: "color: '#ff0000'", new_text: "color: '#0088ff'" })
Then call finalize to validate.`;

function buildEditorTools(
  convexSiteUrl: string,
  sceneId: string,
  toolSecret: string,
) {
  const s = `?secret=${toolSecret}`;
  return [
    {
      type: "function" as const,
      name: "read_code",
      description:
        "Read the current component code. Returns the full source with line numbers. Always call this first to see what you're working with.",
      url: `${convexSiteUrl}/tools/read-buffer${s}`,
      method: "POST" as const,
      timeout: 10,
      parameters: {
        type: "object" as const,
        properties: {
          sceneId: { type: "string" as const, description: "Scene ID" },
          startLine: {
            type: "integer" as const,
            description: "Start line (0-indexed, default 0)",
          },
          numLines: {
            type: "integer" as const,
            description: "Number of lines to read (default 999 = all)",
          },
        },
        required: [] as string[],
        additionalProperties: false,
      },
      defaults: { sceneId, startLine: 0, numLines: 999 },
    },
    {
      type: "function" as const,
      name: "edit_code",
      description:
        "Find and replace text in the code. old_text must be an EXACT substring of the current code. Returns success/failure and updated line count.",
      url: `${convexSiteUrl}/tools/edit-code${s}`,
      method: "POST" as const,
      timeout: 10,
      parameters: {
        type: "object" as const,
        properties: {
          sceneId: { type: "string" as const, description: "Scene ID" },
          oldString: {
            type: "string" as const,
            description: "Exact text to find in the current code",
          },
          newString: {
            type: "string" as const,
            description: "Replacement text",
          },
        },
        required: ["oldString", "newString"],
        additionalProperties: false,
      },
      defaults: { sceneId },
    },
    {
      type: "function" as const,
      name: "write_code",
      description:
        "Replace the ENTIRE code buffer. Only use this if asked to rewrite the whole component, or if the code is very small. Prefer edit_code for targeted changes.",
      url: `${convexSiteUrl}/tools/write-code${s}`,
      method: "POST" as const,
      timeout: 10,
      parameters: {
        type: "object" as const,
        properties: {
          sceneId: { type: "string" as const, description: "Scene ID" },
          code: {
            type: "string" as const,
            description: "Complete component code",
          },
        },
        required: ["code"],
        additionalProperties: false,
      },
      defaults: { sceneId },
    },
    {
      type: "function" as const,
      name: "finalize",
      description:
        "Validate the current code. Returns success or compilation errors. Call this after making all edits to check they compile. If errors are returned, fix them with edit_code and call finalize again.",
      url: `${convexSiteUrl}/tools/finalize-component${s}`,
      method: "POST" as const,
      timeout: 10,
      parameters: {
        type: "object" as const,
        properties: {
          sceneId: { type: "string" as const, description: "Scene ID" },
        },
        required: [] as string[],
        additionalProperties: false,
      },
      defaults: { sceneId },
    },
    {
      type: "function" as const,
      name: "report_error",
      description:
        "Call this when you CANNOT complete the user's request. Provide a clear error message explaining why. This immediately notifies the user instead of leaving them waiting.",
      url: `${convexSiteUrl}/tools/report-error${s}`,
      method: "POST" as const,
      timeout: 10,
      parameters: {
        type: "object" as const,
        properties: {
          sceneId: { type: "string" as const, description: "Scene ID" },
          errorMessage: {
            type: "string" as const,
            description:
              "A clear, user-facing explanation of why the task cannot be completed",
          },
        },
        required: ["errorMessage"],
        additionalProperties: false,
      },
      defaults: { sceneId },
    },
  ];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const { code, instruction, history, sceneId } = (await req.json()) as {
    code: string;
    instruction: string;
    history?: { role: string; content: string }[];
    sceneId?: string;
  };

  const subconsciousApiKey = process.env.SUBCONSCIOUS_API_KEY;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convexSiteUrl =
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
    convexUrl?.replace(".cloud", ".site");
  const toolSecret = process.env.TOOL_ENDPOINT_SECRET || "";

  if (!subconsciousApiKey || !convexUrl || !convexSiteUrl) {
    return new Response(
      JSON.stringify({ error: "Missing server configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!sceneId) {
    return fallbackNonAgentic(code, instruction, history, subconsciousApiKey);
  }

  const convex = new ConvexHttpClient(convexUrl);
  const client = new Subconscious({ apiKey: subconsciousApiKey });
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const emit = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const scene = await convex.query(api.scenes.getScene, {
          sceneId: sceneId as Id<"scenes">,
        });
        if (!scene) {
          emit({ type: "error", message: "Scene not found" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        const existingContent =
          (scene.content as Record<string, unknown>) || {};
        await convex.mutation(api.scenes.updateScene, {
          sceneId: sceneId as Id<"scenes">,
          content: {
            ...existingContent,
            codeBuffer: code,
            generationStatus: "editing",
          },
        });

        emit({
          type: "tool_call",
          tool: "init",
          message: "Initializing editor agent...",
        });

        const conversationHistory = (history || [])
          .slice(-6)
          .map(
            (m) =>
              `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
          )
          .join("\n\n");

        const prompt = `${AGENTIC_EDITOR_PROMPT}

${conversationHistory ? `## Conversation History\n${conversationHistory}\n` : ""}
## User Instruction
${instruction}

Start by calling read_code, then make your edits, then finalize.`;

        const tools = buildEditorTools(
          convexSiteUrl,
          sceneId,
          toolSecret,
        );

        const run = await client.run({
          engine: SUBCONSCIOUS_CODING_ENGINE,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input: { instructions: prompt, tools: tools as any },
        });

        const runId = run.runId;
        if (!runId) {
          emit({ type: "error", message: "Failed to start agent run" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        emit({ type: "tool_call", tool: "agent", message: "Agent is working..." });

        let lastBuffer = code;
        let editCount = 0;
        const maxPolls = 120;

        for (let i = 0; i < maxPolls; i++) {
          await sleep(1500);

          try {
            const currentScene = await convex.query(api.scenes.getScene, {
              sceneId: sceneId as Id<"scenes">,
            });
            const currentContent =
              (currentScene?.content as Record<string, unknown>) || {};
            const currentBuffer =
              typeof currentContent.codeBuffer === "string"
                ? currentContent.codeBuffer
                : "";

            if (currentBuffer && currentBuffer !== lastBuffer) {
              editCount++;
              const oldSnippet = summarizeDiff(lastBuffer, currentBuffer);
              emit({
                type: "tool_call",
                tool: "edit_code",
                message: `Edit #${editCount}: ${oldSnippet}`,
              });
              emit({ type: "code_update", code: currentBuffer });
              lastBuffer = currentBuffer;
            }

            if (
              currentContent.generationStatus === "ready" &&
              currentContent.generatedCode
            ) {
              const finalCode = String(currentContent.generatedCode);
              emit({
                type: "done",
                code: finalCode,
                explanation: `Applied ${editCount} edit${editCount !== 1 ? "s" : ""} successfully.`,
                validated: true,
              });
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            if (currentContent.generationStatus === "error") {
              const errMsg =
                typeof currentContent.generationError === "string"
                  ? currentContent.generationError
                  : "The agent encountered an error and could not complete the request.";
              emit({
                type: "error",
                message: errMsg,
              });
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
          } catch {
            // Convex poll failed, continue
          }

          try {
            const status = await client.get(runId);
            if (
              status.status === "succeeded" ||
              status.status === "failed" ||
              status.status === "canceled" ||
              status.status === "timed_out"
            ) {
              const finalScene = await convex.query(api.scenes.getScene, {
                sceneId: sceneId as Id<"scenes">,
              });
              const finalContent =
                (finalScene?.content as Record<string, unknown>) || {};
              const finalBuffer =
                typeof finalContent.generatedCode === "string"
                  ? finalContent.generatedCode
                  : typeof finalContent.codeBuffer === "string"
                    ? finalContent.codeBuffer
                    : lastBuffer;

              if (finalBuffer !== lastBuffer) {
                emit({ type: "code_update", code: finalBuffer });
              }

              if (status.status === "succeeded") {
                const validation = validateComponent(finalBuffer);
                emit({
                  type: "validation",
                  valid: validation.valid,
                  error: validation.error || undefined,
                });

                emit({
                  type: "done",
                  code: validation.fixedCode || finalBuffer,
                  explanation:
                    status.result?.answer ||
                    `Applied ${editCount} edit${editCount !== 1 ? "s" : ""}.`,
                  validated: validation.valid,
                  validationError: validation.error || undefined,
                });
              } else {
                emit({
                  type: "done",
                  code: finalBuffer,
                  explanation: `Agent ${status.status}. ${editCount} edit${editCount !== 1 ? "s" : ""} were applied.`,
                  validated: false,
                  validationError: `Run ${status.status}`,
                });
              }

              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
          } catch {
            // Status poll failed, continue
          }
        }

        emit({
          type: "done",
          code: lastBuffer,
          explanation: "Agent timed out. Partial edits may have been applied.",
          validated: false,
          validationError: "Timed out after 3 minutes",
        });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Unknown error";
        emit({ type: "error", message: msg });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function summarizeDiff(oldCode: string, newCode: string): string {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");

  if (oldLines.length !== newLines.length) {
    const delta = newLines.length - oldLines.length;
    return delta > 0
      ? `Added ${delta} line${delta !== 1 ? "s" : ""}`
      : `Removed ${Math.abs(delta)} line${Math.abs(delta) !== 1 ? "s" : ""}`;
  }

  let changedCount = 0;
  for (let i = 0; i < oldLines.length; i++) {
    if (oldLines[i] !== newLines[i]) changedCount++;
  }
  return `Modified ${changedCount} line${changedCount !== 1 ? "s" : ""}`;
}

/**
 * Fallback for custom components without a sceneId — uses the old
 * full-regeneration approach so they still work.
 */
function fallbackNonAgentic(
  code: string,
  instruction: string,
  history: { role: string; content: string }[] | undefined,
  apiKey: string,
) {
  const FALLBACK_PROMPT = `You are a precise React/Remotion component code editor.
You receive the current component source code and a user instruction, then return the COMPLETE modified code.

${COMPONENT_API_REFERENCE}

## Output format
1. Return the FULL modified component code inside a single \`\`\`tsx code fence.
2. No partial patches — always the complete function from start to finish.
3. After the code fence, write a 1-sentence explanation of what you changed.`;

  const conversationHistory = (history || [])
    .slice(-10)
    .map(
      (m) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
    )
    .join("\n\n");

  const prompt = `${FALLBACK_PROMPT}

## Current Component Code
\`\`\`tsx
${code}
\`\`\`

${conversationHistory ? `## Conversation History\n${conversationHistory}\n` : ""}
## User Instruction
${instruction}`;

  const encoder = new TextEncoder();
  const client = new Subconscious({ apiKey });

  const readable = new ReadableStream({
    async start(controller) {
      const emit = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const stream = client.stream({
          engine: SUBCONSCIOUS_CODING_ENGINE,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input: { instructions: prompt, tools: [] as any },
        });

        let fullContent = "";

        for await (const event of stream) {
          if (event.type === "delta") {
            fullContent += event.content;
            emit({ type: "delta", content: event.content });
          } else if (event.type === "done") {
            const answer = parseAnswer(fullContent);
            const { code: extracted, explanation } =
              extractCode(answer);

            if (extracted) {
              const validation = validateComponent(extracted);
              emit({
                type: "done",
                code: validation.fixedCode || extracted,
                explanation,
                validated: validation.valid,
                validationError: validation.error || undefined,
              });
            } else {
              emit({ type: "error", message: "AI did not return code in a ```tsx fence." });
            }
          } else if (event.type === "error") {
            emit({
              type: "error",
              message: (event as { message?: string }).message || "Unknown error",
            });
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Unknown error";
        emit({ type: "error", message: msg });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function parseAnswer(fullContent: string): string {
  try {
    const parsed = JSON.parse(fullContent);
    return typeof parsed.answer === "string"
      ? parsed.answer
      : JSON.stringify(parsed.answer);
  } catch {
    const m = fullContent.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (m) {
      return m[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }
    return fullContent;
  }
}

function extractCode(answer: string): {
  code: string | null;
  explanation: string;
} {
  const m = answer.match(
    /```(?:tsx|typescript|jsx|javascript)?\s*\n([\s\S]*?)```/,
  );
  const code = m ? m[1].trim() : null;
  const em = answer.match(/```[\s\S]*?```\s*\n*([\s\S]*)/);
  const explanation = em ? em[1].trim() : "Changes applied.";
  return { code, explanation };
}
