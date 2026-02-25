import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customComponents")
      .withIndex("by_project", (q) =>
        q.eq("projectId", args.projectId),
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customComponents", {
      projectId: args.projectId,
      name: args.name,
      description: args.description,
      code: "",
      status: "generating",
      createdAt: Date.now(),
    });
  },
});

export const saveCode = mutation({
  args: {
    componentId: v.id("customComponents"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.componentId, {
      code: args.code,
      status: "ready",
    });
  },
});

export const setError = mutation({
  args: {
    componentId: v.id("customComponents"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.componentId, {
      status: "error",
      error: args.error,
    });
  },
});

export const remove = mutation({
  args: { componentId: v.id("customComponents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.componentId);
  },
});
