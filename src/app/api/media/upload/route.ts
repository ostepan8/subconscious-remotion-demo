import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import imageSize from "image-size";

const COMPONENT_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js"];

function isComponentFile(filename: string): boolean {
  return COMPONENT_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext));
}

function classifyMedia(
  mimeType: string,
  filename: string,
): "image" | "video" | "audio" | "component" {
  if (isComponentFile(filename)) return "component";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "image";
}

function extractComponentName(source: string, filename: string): string {
  const patterns = [
    /export\s+default\s+function\s+(\w+)/,
    /export\s+default\s+class\s+(\w+)/,
    /export\s+(?:const|let)\s+(\w+)\s*[=:]/,
    /function\s+(\w+)\s*\(/,
    /const\s+(\w+)\s*[:=]\s*(?:\([^)]*\)|)\s*(?:=>|React)/,
  ];
  for (const re of patterns) {
    const m = source.match(re);
    if (m) return m[1];
  }
  const base = filename.replace(/\.[^.]+$/, "");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function extractSourcePreview(source: string, maxLines = 12): string {
  return source
    .split("\n")
    .filter((l) => l.trim() !== "")
    .slice(0, maxLines)
    .join("\n");
}

function getImageDimensions(
  buffer: ArrayBuffer,
  mimeType: string,
): { width?: number; height?: number } {
  if (!mimeType.startsWith("image/") || mimeType === "image/svg+xml") {
    return {};
  }
  try {
    const result = imageSize(Buffer.from(buffer));
    if (result.width && result.height) {
      return { width: result.width, height: result.height };
    }
  } catch {
    // Non-fatal
  }
  return {};
}

export async function POST(req: NextRequest) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
  }

  const convex = new ConvexHttpClient(convexUrl);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "Missing file or projectId" },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    const mediaType = classifyMedia(mimeType, file.name);
    const buffer = await file.arrayBuffer();

    const dims = getImageDimensions(buffer, mimeType);

    let componentName: string | undefined;
    let sourcePreview: string | undefined;

    if (mediaType === "component") {
      const source = new TextDecoder().decode(buffer);
      componentName = extractComponentName(source, file.name);
      sourcePreview = extractSourcePreview(source);
    }

    const uploadUrl = await convex.mutation(api.media.generateUploadUrl);

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": mimeType || "text/plain" },
      body: buffer,
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload to Convex storage");
    }

    const { storageId } = (await uploadRes.json()) as { storageId: Id<"_storage"> };

    const mediaId = await convex.mutation(api.media.saveMedia, {
      projectId: projectId as Id<"projects">,
      name: file.name,
      type: mediaType,
      storageId,
      mimeType: mimeType || "text/plain",
      size: file.size,
      ...(dims.width && dims.height
        ? { width: dims.width, height: dims.height }
        : {}),
      ...(componentName ? { componentName } : {}),
      ...(sourcePreview ? { sourcePreview } : {}),
    });

    const url = await convex.query(api.media.getMediaUrl, { storageId });

    let autoPlaceResult = null;
    if (mediaType === "image" || mediaType === "video") {
      try {
        autoPlaceResult = await convex.mutation(
          api.autoPlaceMedia.autoPlaceMedia,
          {
            projectId: projectId as Id<"projects">,
            mediaId,
          },
        );
      } catch {
        // Auto-placement is best-effort; don't fail the upload
      }
    }

    return NextResponse.json({
      success: true,
      mediaId,
      storageId,
      url,
      type: mediaType,
      name: file.name,
      ...(componentName ? { componentName } : {}),
      ...(autoPlaceResult ? { autoPlaced: autoPlaceResult } : {}),
    });
  } catch (error) {
    console.error("[media/upload] Error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
