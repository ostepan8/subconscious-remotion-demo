import { mutation } from "./_generated/server";
import { v } from "convex/values";

interface SceneRecord {
  _id: string;
  order: number;
  type: string;
  title: string;
  content: Record<string, unknown>;
  durationInFrames: number;
  transition: string;
}

const SCENE_PRIORITY: Record<string, number> = {
  "hero": 10,
  "product-showcase": 9,
  "component-showcase": 9,
  "image-showcase": 8,
  "video-clip": 8,
  "features": 7,
  "how-it-works": 6,
  "testimonial": 5,
  "stats": 4,
  "before-after": 3,
  "bento-grid": 3,
  "cta": 2,
  "custom": 1,
};

const LAYOUT_FOR_TYPE: Record<string, string> = {
  "hero": "split",
  "features": "split",
  "how-it-works": "split",
  "testimonial": "split",
  "stats": "split",
};

const VIDEO_ONLY_TYPES = new Set(["video-clip"]);
const IMAGE_ONLY_TYPES = new Set(["image-showcase"]);
const DEDICATED_MEDIA_TYPES = new Set(["image-showcase", "video-clip", "product-showcase"]);

function sceneHasMedia(content: Record<string, unknown>): boolean {
  return !!(content.mediaUrl || content.mediaId);
}

function pickBestScene(
  scenes: SceneRecord[],
  mediaType: "image" | "video",
  width: number | undefined,
  height: number | undefined,
): { scene: SceneRecord; layout?: string; placement?: string } | null {
  const isPortrait = width && height && height > width;
  const isLandscape = width && height && width > height;
  const isLarge = width && height && width >= 1200;
  const isSmall = width && height && (width < 400 || height < 400);

  const candidates = scenes
    .filter((s) => {
      if (sceneHasMedia(s.content)) return false;
      if (mediaType === "video" && IMAGE_ONLY_TYPES.has(s.type)) return false;
      if (mediaType === "image" && VIDEO_ONLY_TYPES.has(s.type)) return false;
      return true;
    })
    .map((s) => ({
      scene: s,
      priority: SCENE_PRIORITY[s.type] ?? 0,
    }))
    .sort((a, b) => b.priority - a.priority);

  if (candidates.length === 0) return null;

  const best = candidates[0].scene;

  if (mediaType === "video") {
    if (best.type === "video-clip") {
      return { scene: best };
    }
    return { scene: best, layout: LAYOUT_FOR_TYPE[best.type], placement: undefined };
  }

  if (DEDICATED_MEDIA_TYPES.has(best.type)) {
    const frame = best.type === "product-showcase" ? "browser" : undefined;
    return { scene: best, layout: undefined, placement: undefined, ...( frame ? {} : {}) };
  }

  if (best.type === "hero") {
    return { scene: best, layout: "split" };
  }

  if (LAYOUT_FOR_TYPE[best.type]) {
    return { scene: best, layout: LAYOUT_FOR_TYPE[best.type] };
  }

  if (isLarge && isLandscape) {
    return { scene: best, placement: "background" };
  }

  if (isSmall) {
    return { scene: best, placement: "inline" };
  }

  if (isPortrait) {
    return { scene: best, placement: "right" };
  }

  return { scene: best, placement: "left" };
}

export const autoPlaceMedia = mutation({
  args: {
    projectId: v.id("projects"),
    mediaId: v.id("media"),
  },
  handler: async (ctx, args) => {
    const mediaItem = await ctx.db.get(args.mediaId);
    if (!mediaItem) return { placed: false, reason: "Media not found" };

    if (mediaItem.type !== "image" && mediaItem.type !== "video" && mediaItem.type !== "component") {
      return { placed: false, reason: "Only images, videos, and components are auto-placed" };
    }

    const url = await ctx.storage.getUrl(mediaItem.storageId);
    if (!url) return { placed: false, reason: "Could not resolve media URL" };

    const allScenes = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const sorted = allScenes.sort((a, b) => a.order - b.order);

    const scenes: SceneRecord[] = sorted.map((s) => ({
      _id: s._id,
      order: s.order,
      type: s.type,
      title: s.title,
      content: (s.content as Record<string, unknown>) || {},
      durationInFrames: s.durationInFrames,
      transition: s.transition,
    }));

    if (scenes.length === 0) {
      return { placed: false, reason: "No scenes exist yet" };
    }

    if (mediaItem.type === "component") {
      const componentScenes = scenes.filter(
        (s) => s.type === "component-showcase" && !sceneHasMedia(s.content)
      );
      const targetScene = componentScenes[0] || scenes.find(
        (s) => s.type === "custom" && !sceneHasMedia(s.content)
      );
      if (!targetScene) {
        return { placed: false, reason: "No component-showcase or custom scene available" };
      }
      const rec = mediaItem as Record<string, unknown>;
      const componentName = (rec.componentName as string) || mediaItem.name.replace(/\.[^.]+$/, "");
      let sourceCode = (rec.sourcePreview as string) || "";
      try {
        const srcResp = await fetch(url);
        if (srcResp.ok) sourceCode = await srcResp.text();
      } catch { /* keep preview */ }

      const updatedContent: Record<string, unknown> = {
        ...targetScene.content,
        mediaUrl: url,
        mediaId: args.mediaId,
        componentName,
        sourceCode,
      };

      await ctx.db.patch(targetScene._id as any, { content: updatedContent });

      return {
        placed: true,
        sceneId: targetScene._id,
        sceneTitle: targetScene.title,
        sceneType: targetScene.type,
        layout: null,
        placement: null,
      };
    }

    const result = pickBestScene(
      scenes,
      mediaItem.type as "image" | "video",
      mediaItem.width ?? undefined,
      mediaItem.height ?? undefined,
    );

    if (!result) {
      return { placed: false, reason: "All scenes already have media" };
    }

    const { scene, layout, placement } = result;

    const updatedContent: Record<string, unknown> = {
      ...scene.content,
      mediaUrl: url,
      mediaId: args.mediaId,
    };

    if (mediaItem.width) updatedContent.mediaWidth = mediaItem.width;
    if (mediaItem.height) updatedContent.mediaHeight = mediaItem.height;
    if (mediaItem.mimeType) updatedContent.mimeType = mediaItem.mimeType;
    if (layout) updatedContent.layout = layout;
    if (placement) updatedContent.mediaPlacement = placement;

    if (scene.type === "product-showcase") {
      updatedContent.mediaFrame = updatedContent.mediaFrame || "browser";
    }

    await ctx.db.patch(scene._id as any, { content: updatedContent });

    return {
      placed: true,
      sceneId: scene._id,
      sceneTitle: scene.title,
      sceneType: scene.type,
      layout: layout || null,
      placement: placement || null,
    };
  },
});
