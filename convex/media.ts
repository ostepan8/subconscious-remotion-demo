import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMedia = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("media")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return Promise.all(
      items.map(async (item) => ({
        ...item,
        url: await ctx.storage.getUrl(item.storageId),
      }))
    );
  },
});

export const getMediaByType = query({
  args: { projectId: v.id("projects"), type: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("media")
      .withIndex("by_project_type", (q) =>
        q.eq("projectId", args.projectId).eq("type", args.type)
      )
      .collect();

    return Promise.all(
      items.map(async (item) => ({
        ...item,
        url: await ctx.storage.getUrl(item.storageId),
      }))
    );
  },
});

export const getMediaItem = query({
  args: { mediaId: v.id("media") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.mediaId);
    if (!item) return null;
    return {
      ...item,
      url: await ctx.storage.getUrl(item.storageId),
    };
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return ctx.storage.generateUploadUrl();
  },
});

export const saveMedia = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    type: v.string(),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    size: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    componentName: v.optional(v.string()),
    sourcePreview: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("media", {
      ...args,
      uploadedAt: Date.now(),
    });
  },
});

export const deleteMedia = mutation({
  args: { mediaId: v.id("media") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.mediaId);
    if (!item) return;
    await ctx.storage.delete(item.storageId);
    await ctx.db.delete(args.mediaId);
  },
});

export const getMediaUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return ctx.storage.getUrl(args.storageId);
  },
});
