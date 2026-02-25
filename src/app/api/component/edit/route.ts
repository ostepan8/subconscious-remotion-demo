import { Subconscious } from "subconscious";
import { NextRequest } from "next/server";
import { COMPONENT_API_REFERENCE } from "@/lib/component-api-reference";
import { validateComponent } from "@/lib/validate-component";
const SUBCONSCIOUS_CODING_ENGINE = "tim-gpt";

const COMPONENT_EDITOR_PROMPT = `You are a precise React/Remotion component code editor.
You receive the current component source code and a user instruction, then return the COMPLETE modified code.

${COMPONENT_API_REFERENCE}

## Output format
1. Return the FULL modified component code inside a single \`\`\`tsx code fence.
2. No partial patches — always the complete function from start to finish.
3. After the code fence, write a 1-sentence explanation of what you changed.
4. If the user asks something unclear, make your best creative interpretation.

## Example of correct output:
\`\`\`tsx
function GeneratedComponent({ content, theme }) {
  const frame = useCurrentFrame();
  const typo = getTypography(theme);

  return (
    <AbsoluteFill style={{ background: theme.colors.background }}>
      <div style={{ ...fadeInUp(frame, 0), padding: spacing.scenePadding }}>
        <h1 style={{ ...typo.heroTitle, color: theme.colors.text }}>
          {content.headline}
        </h1>
      </div>
    </AbsoluteFill>
  );
}
\`\`\`
Made the heading use the hero title typography.`;

/**
 * Validates by compiling TSX → JS with sucrase (same transform the
 * preview iframe does with Babel) then checking the compiled JS.
 */
function validateCodeLocally(code: string) {
  return validateComponent(code);
}

function extractCodeFromAnswer(answer: string): {
  code: string | null;
  explanation: string;
} {
  const codeMatch = answer.match(
    /```(?:tsx|typescript|jsx|javascript)?\s*\n([\s\S]*?)```/,
  );
  const code = codeMatch ? codeMatch[1].trim() : null;
  const explanationMatch = answer.match(
    /```[\s\S]*?```\s*\n*([\s\S]*)/,
  );
  const explanation = explanationMatch
    ? explanationMatch[1].trim()
    : "Changes applied.";
  return { code, explanation };
}

function parseAnswerFromStream(fullContent: string): string {
  try {
    const parsed = JSON.parse(fullContent);
    return typeof parsed.answer === "string"
      ? parsed.answer
      : JSON.stringify(parsed.answer);
  } catch {
    const answerMatch = fullContent.match(
      /"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/,
    );
    if (answerMatch) {
      return answerMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }
    return fullContent;
  }
}

const MAX_VALIDATION_RETRIES = 2;

export async function POST(req: NextRequest) {
  const { code, instruction, history } = (await req.json()) as {
    code: string;
    instruction: string;
    history?: { role: string; content: string }[];
  };

  const subconsciousApiKey = process.env.SUBCONSCIOUS_API_KEY;
  if (!subconsciousApiKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUBCONSCIOUS_API_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const conversationHistory = (history || [])
    .slice(-10)
    .map(
      (m) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
    )
    .join("\n\n");

  const encoder = new TextEncoder();
  const client = new Subconscious({ apiKey: subconsciousApiKey });

  const readable = new ReadableStream({
    async start(controller) {
      const emit = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        let currentCode = code;
        let lastError: string | null = null;
        let finalCode: string | null = null;
        let finalExplanation = "Changes applied.";

        for (
          let attempt = 0;
          attempt <= MAX_VALIDATION_RETRIES;
          attempt++
        ) {
          const isRetry = attempt > 0;

          let prompt: string;
          if (isRetry && lastError) {
            prompt = `${COMPONENT_EDITOR_PROMPT}

## Current Component Code
\`\`\`tsx
${currentCode}
\`\`\`

## COMPILATION FAILED — FIX REQUIRED (attempt ${attempt + 1}/${MAX_VALIDATION_RETRIES + 1})
The previous code you generated failed validation with this error:
\`\`\`
${lastError}
\`\`\`

Fix the error. Remember:
- Only use functions from the AVAILABLE API above
- Do NOT invent new functions
- depthShadow() returns a string, don't spread it
- getTypography(theme) returns the object directly, don't destructure
- Use integer frame numbers for delays, not floats

Return the COMPLETE fixed code in a \`\`\`tsx fence.`;
          } else {
            prompt = `${COMPONENT_EDITOR_PROMPT}

## Current Component Code
\`\`\`tsx
${code}
\`\`\`

${conversationHistory ? `## Conversation History\n${conversationHistory}\n` : ""}
## User Instruction
${instruction}`;
          }

          if (isRetry) {
            emit({
              type: "status",
              message: `Validation failed, auto-fixing (attempt ${attempt + 1})...`,
            });
          }

          const stream = client.stream({
            engine: SUBCONSCIOUS_CODING_ENGINE,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            input: { instructions: prompt, tools: [] as any },
          });

          let fullContent = "";
          let answer = "";

          for await (const event of stream) {
            if (event.type === "delta") {
              fullContent += event.content;
              if (!isRetry) {
                emit({ type: "delta", content: event.content });
              }
            } else if (event.type === "done") {
              answer = parseAnswerFromStream(fullContent);
            } else if (event.type === "error") {
              emit({
                type: "error",
                message: event.message || "Unknown error",
              });
              controller.enqueue(
                encoder.encode("data: [DONE]\n\n"),
              );
              controller.close();
              return;
            }
          }

          if (!answer) {
            emit({ type: "error", message: "No response from AI" });
            controller.enqueue(
              encoder.encode("data: [DONE]\n\n"),
            );
            controller.close();
            return;
          }

          const { code: extractedCode, explanation } =
            extractCodeFromAnswer(answer);

          if (!extractedCode) {
            emit({
              type: "error",
              message: "AI did not return code in a ```tsx fence.",
            });
            controller.enqueue(
              encoder.encode("data: [DONE]\n\n"),
            );
            controller.close();
            return;
          }

          const validation = validateCodeLocally(extractedCode);

          if (validation.valid) {
            finalCode = validation.fixedCode;
            finalExplanation = explanation;
            break;
          } else {
            lastError = validation.error || "Unknown validation error";
            currentCode = extractedCode;

            if (attempt === MAX_VALIDATION_RETRIES) {
              finalCode = validation.fixedCode;
              finalExplanation =
                `${explanation}\n\n⚠️ Warning: code may have issues — ${lastError}`;
              break;
            }
          }
        }

        emit({
          type: "done",
          code: finalCode,
          explanation: finalExplanation,
          validated: !lastError,
          validationError: lastError || undefined,
        });
        controller.enqueue(
          encoder.encode("data: [DONE]\n\n"),
        );
        controller.close();
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: msg })}\n\n`,
          ),
        );
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
