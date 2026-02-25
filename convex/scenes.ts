import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getScenes = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
      .then((scenes) => scenes.sort((a, b) => a.order - b.order));
  },
});

export const getScene = query({
  args: { sceneId: v.id("scenes") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.sceneId);
  },
});

export const addScene = mutation({
  args: {
    projectId: v.id("projects"),
    order: v.number(),
    type: v.string(),
    title: v.string(),
    content: v.any(),
    durationInFrames: v.number(),
    transition: v.string(),
    voiceoverScript: v.optional(v.string()),
    track: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Shift scenes at or after the insertion point
    for (const scene of existing) {
      if (scene.order >= args.order) {
        await ctx.db.patch(scene._id, { order: scene.order + 1 });
      }
    }

    return ctx.db.insert("scenes", args);
  },
});

export const updateScene = mutation({
  args: {
    sceneId: v.id("scenes"),
    type: v.optional(v.string()),
    title: v.optional(v.string()),
    content: v.optional(v.any()),
    durationInFrames: v.optional(v.number()),
    transition: v.optional(v.string()),
    voiceoverScript: v.optional(v.string()),
    track: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { sceneId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(sceneId, filtered);
    }
  },
});

export const removeScene = mutation({
  args: { sceneId: v.id("scenes") },
  handler: async (ctx, args) => {
    const scene = await ctx.db.get(args.sceneId);
    if (!scene) throw new Error("Scene not found");

    await ctx.db.delete(args.sceneId);

    // Reorder remaining scenes
    const remaining = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", scene.projectId))
      .collect();
    const sorted = remaining.sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].order !== i) {
        await ctx.db.patch(sorted[i]._id, { order: i });
      }
    }
  },
});

export const duplicateScene = mutation({
  args: { sceneId: v.id("scenes") },
  handler: async (ctx, args) => {
    const scene = await ctx.db.get(args.sceneId);
    if (!scene) throw new Error("Scene not found");

    const existing = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", scene.projectId))
      .collect();

    for (const s of existing) {
      if (s.order > scene.order) {
        await ctx.db.patch(s._id, { order: s.order + 1 });
      }
    }

    return ctx.db.insert("scenes", {
      projectId: scene.projectId,
      order: scene.order + 1,
      type: scene.type,
      title: `${scene.title} (copy)`,
      content: scene.content,
      durationInFrames: scene.durationInFrames,
      transition: scene.transition,
      voiceoverScript: scene.voiceoverScript,
    });
  },
});

export const splitScene = mutation({
  args: {
    sceneId: v.id("scenes"),
    splitAtFrame: v.number(),
  },
  handler: async (ctx, args) => {
    const scene = await ctx.db.get(args.sceneId);
    if (!scene) throw new Error("Scene not found");
    if (args.splitAtFrame <= 0 || args.splitAtFrame >= scene.durationInFrames) {
      throw new Error("Split point must be within scene duration");
    }

    const existing = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", scene.projectId))
      .collect();

    for (const s of existing) {
      if (s.order > scene.order) {
        await ctx.db.patch(s._id, { order: s.order + 1 });
      }
    }

    await ctx.db.patch(args.sceneId, {
      durationInFrames: args.splitAtFrame,
    });

    return ctx.db.insert("scenes", {
      projectId: scene.projectId,
      order: scene.order + 1,
      type: scene.type,
      title: `${scene.title} (pt 2)`,
      content: scene.content,
      durationInFrames: scene.durationInFrames - args.splitAtFrame,
      transition: scene.transition,
      voiceoverScript: scene.voiceoverScript,
    });
  },
});

export const removeScenes = mutation({
  args: { sceneIds: v.array(v.id("scenes")) },
  handler: async (ctx, args) => {
    if (args.sceneIds.length === 0) return;
    const first = await ctx.db.get(args.sceneIds[0]);
    if (!first) return;
    const projectId = first.projectId;

    for (const id of args.sceneIds) {
      const scene = await ctx.db.get(id);
      if (scene) await ctx.db.delete(id);
    }

    const remaining = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const sorted = remaining.sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].order !== i) {
        await ctx.db.patch(sorted[i]._id, { order: i });
      }
    }
  },
});

export const restoreScenes = mutation({
  args: {
    projectId: v.id("projects"),
    scenes: v.array(
      v.object({
        order: v.number(),
        type: v.string(),
        title: v.string(),
        content: v.any(),
        durationInFrames: v.number(),
        transition: v.string(),
        voiceoverScript: v.optional(v.string()),
        track: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const scene of existing) {
      await ctx.db.delete(scene._id);
    }
    for (const scene of args.scenes) {
      await ctx.db.insert("scenes", {
        projectId: args.projectId,
        ...scene,
      });
    }
  },
});

export const moveSceneToTrack = mutation({
  args: {
    sceneId: v.id("scenes"),
    toTrack: v.number(),
    insertAtIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const scene = await ctx.db.get(args.sceneId);
    if (!scene) throw new Error("Scene not found");

    const fromTrack = scene.track ?? 0;
    const projectId = scene.projectId;

    const allScenes = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    await ctx.db.patch(args.sceneId, { track: args.toTrack });

    const srcTrackScenes = allScenes
      .filter((s) => (s.track ?? 0) === fromTrack && s._id !== args.sceneId)
      .sort((a, b) => a.order - b.order);
    for (let i = 0; i < srcTrackScenes.length; i++) {
      if (srcTrackScenes[i].order !== i) {
        await ctx.db.patch(srcTrackScenes[i]._id, { order: i });
      }
    }

    const destTrackScenes = allScenes
      .filter(
        (s) => (s.track ?? 0) === args.toTrack && s._id !== args.sceneId,
      )
      .sort((a, b) => a.order - b.order);
    const insertAt = Math.min(args.insertAtIndex, destTrackScenes.length);
    for (let i = 0; i < destTrackScenes.length; i++) {
      const newOrder = i < insertAt ? i : i + 1;
      if (destTrackScenes[i].order !== newOrder) {
        await ctx.db.patch(destTrackScenes[i]._id, { order: newOrder });
      }
    }
    await ctx.db.patch(args.sceneId, { order: insertAt });
  },
});

export const reorderScenes = mutation({
  args: {
    projectId: v.id("projects"),
    sceneIds: v.array(v.id("scenes")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.sceneIds.length; i++) {
      await ctx.db.patch(args.sceneIds[i], { order: i });
    }
  },
});
