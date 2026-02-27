import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { ConvexHttpClient } from "convex/browser";
import path from "path";
import os from "os";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { getTheme } from "@/components/video/themes";

export const maxDuration = 300;

export async function POST(request: Request) {
  const { projectId } = (await request.json()) as { projectId: string };
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return new Response(JSON.stringify({ error: "Missing CONVEX_URL" }), {
      status: 500,
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        emit({ type: "status", message: "Fetching project data..." });

        const convex = new ConvexHttpClient(convexUrl);
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
        const [scenes, voiceovers] = await Promise.all([
          convex.query(api.scenes.getScenes, { projectId: internalId }),
          convex.query(api.voiceovers.getVoiceoversWithUrls, {
            projectId: internalId,
          }),
        ]);

        if (!scenes?.length) {
          emit({ type: "error", message: "No scenes to render" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        const voiceoverMap = new Map<string, string>();
        if (voiceovers) {
          for (const vo of voiceovers) {
            if (
              vo.sceneId &&
              vo.audioUrl &&
              vo.status === "ready"
            ) {
              voiceoverMap.set(
                vo.sceneId as string,
                vo.audioUrl as string,
              );
            }
          }
        }

        const sceneData = scenes.map(
          (s: {
            _id: string;
            type: string;
            title: string;
            content: unknown;
            durationInFrames: number;
            transition: string;
          }) => ({
            id: s._id,
            type: s.type,
            title: s.title,
            content: s.content || {},
            durationInFrames: s.durationInFrames,
            transition: s.transition,
            voiceoverAudioUrl: voiceoverMap.get(s._id) || undefined,
          }),
        );

        const theme = getTheme(project.theme as string);

        emit({ type: "status", message: "Bundling project..." });

        const rootDir = process.cwd();
        const entryPoint = path.resolve(rootDir, "remotion/index.ts");
        const publicDir = path.resolve(rootDir, "public");

        const bundled = await bundle({
          entryPoint,
          publicDir,
          webpackOverride: (config) => ({
            ...config,
            resolve: {
              ...config.resolve,
              alias: {
                ...(config.resolve?.alias ?? {}),
                "@": path.resolve(rootDir, "src"),
              },
            },
          }),
        });

        emit({ type: "status", message: "Preparing composition..." });

        const inputProps = { scenes: sceneData, theme };
        const composition = await selectComposition({
          serveUrl: bundled,
          id: "DemoVideo",
          inputProps,
        });

        const downloadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const outputPath = path.join(
          os.tmpdir(),
          `remotion-render-${downloadId}.mp4`,
        );

        emit({ type: "status", message: "Rendering video..." });

        await renderMedia({
          composition,
          serveUrl: bundled,
          codec: "h264",
          outputLocation: outputPath,
          inputProps,
          onProgress: ({ progress }) => {
            emit({
              type: "progress",
              percent: Math.round(progress * 100),
            });
          },
        });

        const safeTitle = (project.title as string || "video")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .slice(0, 60);

        emit({
          type: "done",
          downloadId,
          filename: `${safeTitle}.mp4`,
        });
      } catch (err) {
        emit({
          type: "error",
          message: err instanceof Error ? err.message : "Render failed",
        });
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
