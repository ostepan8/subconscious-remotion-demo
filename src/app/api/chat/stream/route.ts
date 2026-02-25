import { ConvexHttpClient } from "convex/browser";
import { Subconscious } from "subconscious";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  SUBCONSCIOUS_ENGINE,
  SYSTEM_PROMPT,
  buildTools,
  extractThoughts,
} from "@/lib/agent-config";

export async function POST(request: Request) {
  const subconsciousApiKey = process.env.SUBCONSCIOUS_API_KEY;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convexSiteUrl =
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
    convexUrl?.replace(".cloud", ".site");
  const toolSecret = process.env.TOOL_ENDPOINT_SECRET || "";
  const saveSecret = process.env.SAVE_MESSAGE_SECRET || "";

  if (!subconsciousApiKey || !convexUrl || !convexSiteUrl) {
    return new Response(
      JSON.stringify({ error: "Missing server configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = await request.json();
  const { projectId, message } = body as {
    projectId: string;
    message: string;
  };

  if (!projectId || !message) {
    return new Response(
      JSON.stringify({ error: "Missing projectId or message" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const convex = new ConvexHttpClient(convexUrl);
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
        const project = await convex.query(api.projects.getProject, {
          externalId: projectId,
        });
        if (!project) {
          emit({ type: "error", message: "Project not found" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        const internalId = project._id as Id<"projects">;

        await convex.mutation(api.chat.saveMessage, {
          projectId: internalId,
          role: "user",
          content: message,
          secret: saveSecret,
        });

        const [scenes, chatMessages, mediaItems] = await Promise.all([
          convex.query(api.scenes.getScenes, { projectId: internalId }),
          convex.query(api.chat.getMessages, { projectId: internalId }),
          convex.query(api.media.getMedia, { projectId: internalId }),
        ]);

        const scenesSummary =
          scenes.length > 0
            ? scenes
                .map(
                  (s: { order: number; type: string; title: string; content: unknown; voiceoverScript?: string }, i: number) =>
                    `Scene ${i} (${s.type}): "${s.title}" — ${JSON.stringify(s.content).slice(0, 200)}${s.voiceoverScript ? ` [VO: "${s.voiceoverScript}"]` : ""}`,
                )
                .join("\n")
            : "No scenes yet.";

        const mediaSummary =
          mediaItems.length > 0
            ? mediaItems
                .map(
                  (m: { _id: string; name: string; type: string; url?: string | null }) =>
                    `- ${m.type}: "${m.name}" (id: ${m._id}${m.url ? `, url: ${m.url}` : ""})`,
                )
                .join("\n")
            : "No media uploaded yet.";

        const recentHistory = (chatMessages || [])
          .slice(-20)
          .map(
            (m: { role: string; content: string }) =>
              `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
          )
          .join("\n\n");

        const instructions = `${SYSTEM_PROMPT}

## Project Context
Title: ${project.title}
Description: ${project.description}
Theme: ${project.theme}
Status: ${project.status}

## Current Scenes
${scenesSummary}

## Uploaded Media Library
${mediaSummary}

## Conversation History
${recentHistory}

## Current User Message
${message}`;

        const tools = buildTools(convexSiteUrl, internalId, toolSecret);

        const stream = client.stream({
          engine: SUBCONSCIOUS_ENGINE,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input: { instructions, tools: tools as any },
        });

        let fullContent = "";
        const seenThoughts = new Set<string>();

        for await (const event of stream) {
          if (event.type === "delta") {
            fullContent += event.content;

            const thoughts = extractThoughts(fullContent);
            for (const thought of thoughts) {
              if (!seenThoughts.has(thought)) {
                seenThoughts.add(thought);
                emit({ type: "thought", thought });
              }
            }
          } else if (event.type === "done") {
            let answer: string;
            try {
              const parsed = JSON.parse(fullContent);
              answer =
                typeof parsed.answer === "string"
                  ? parsed.answer
                  : JSON.stringify(parsed.answer);
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
                answer =
                  "I've made changes to your video. Check the preview to see the updates!";
              }
            }

            emit({ type: "answer", answer });

            try {
              await convex.mutation(api.chat.saveMessage, {
                projectId: internalId,
                role: "assistant",
                content: answer,
                secret: saveSecret,
              });
            } catch {
              // best-effort save
            }
          } else if (event.type === "error") {
            emit({
              type: "error",
              message:
                (event as { message?: string }).message || "Agent error",
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
