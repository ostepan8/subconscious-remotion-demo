import { Subconscious } from "subconscious";
import { NextRequest } from "next/server";
import { COMPONENT_API_REFERENCE } from "@/lib/component-api-reference";

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

  const instructions = `${COMPONENT_EDITOR_PROMPT}

## Current Component Code
\`\`\`tsx
${code}
\`\`\`

${conversationHistory ? `## Conversation History\n${conversationHistory}\n` : ""}
## User Instruction
${instruction}`;

  const client = new Subconscious({ apiKey: subconsciousApiKey });
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.stream({
          engine: "tim",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input: { instructions, tools: [] as any },
        });

        let fullContent = "";

        for await (const event of stream) {
          if (event.type === "delta") {
            fullContent += event.content;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "delta", content: event.content })}\n\n`,
              ),
            );
          } else if (event.type === "done") {
            let answer = "";
            try {
              const final = JSON.parse(fullContent);
              answer =
                typeof final.answer === "string"
                  ? final.answer
                  : JSON.stringify(final.answer);
            } catch {
              const answerMatch = fullContent.match(
                /"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/,
              );
              if (answerMatch) {
                answer = answerMatch[1]
                  .replace(/\\n/g, "\n")
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, "\\");
              } else {
                answer = fullContent;
              }
            }

            const codeMatch = answer.match(
              /```(?:tsx|typescript|jsx|javascript)?\s*\n([\s\S]*?)```/,
            );
            const newCode = codeMatch
              ? codeMatch[1].trim()
              : null;

            const explanationMatch = answer.match(
              /```[\s\S]*?```\s*\n*([\s\S]*)/,
            );
            const explanation = explanationMatch
              ? explanationMatch[1].trim()
              : "Changes applied.";

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "done",
                  code: newCode,
                  explanation,
                  rawAnswer: answer,
                })}\n\n`,
              ),
            );
            controller.enqueue(
              encoder.encode("data: [DONE]\n\n"),
            );
            controller.close();
          } else if (event.type === "error") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  message:
                    event.message || "Unknown error",
                })}\n\n`,
              ),
            );
            controller.close();
          }
        }
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
