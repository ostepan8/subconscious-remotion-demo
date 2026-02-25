import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMessages = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("chatMessages")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const saveMessage = mutation({
  args: {
    projectId: v.id("projects"),
    role: v.string(),
    content: v.string(),
    secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("chatMessages", {
      projectId: args.projectId,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
    });
  },
});
