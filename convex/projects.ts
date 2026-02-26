import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getProjectById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

export const getProject = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_external_id", (q) =>
        q.eq("externalId", args.externalId),
      )
      .first();
  },
});

export const getMyProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const createProject = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    theme: v.string(),
    githubUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const externalId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      theme: args.theme,
      status: "active",
      externalId,
      userId,
      githubUrl: args.githubUrl,
    });
    return { externalId, projectId };
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || (project.userId && project.userId !== userId)) {
      throw new Error("Project not found");
    }
    const scenes = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) =>
        q.eq("projectId", args.projectId),
      )
      .collect();
    for (const scene of scenes) {
      await ctx.db.delete(scene._id);
    }

    const media = await ctx.db
      .query("media")
      .withIndex("by_project", (q) =>
        q.eq("projectId", args.projectId),
      )
      .collect();
    for (const m of media) {
      await ctx.db.delete(m._id);
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_project", (q) =>
        q.eq("projectId", args.projectId),
      )
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    const components = await ctx.db
      .query("customComponents")
      .withIndex("by_project", (q) =>
        q.eq("projectId", args.projectId),
      )
      .collect();
    for (const comp of components) {
      await ctx.db.delete(comp._id);
    }

    await ctx.db.delete(args.projectId);
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    theme: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(
        ([, val]) => val !== undefined,
      ),
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(projectId, filtered);
    }
  },
});

export const updateReadmeContent = mutation({
  args: {
    projectId: v.id("projects"),
    readmeContent: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      readmeContent: args.readmeContent,
    });
  },
});

export const saveDesignContext = mutation({
  args: {
    projectId: v.id("projects"),
    designContext: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      designContext: args.designContext,
    });
  },
});

export const saveGithubExtract = mutation({
  args: {
    projectId: v.id("projects"),
    githubUrl: v.string(),
    extract: v.any(),
    readmeContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      githubUrl: args.githubUrl,
      githubExtract: args.extract,
    };
    if (args.readmeContent !== undefined) {
      updates.readmeContent = args.readmeContent;
    }
    await ctx.db.patch(args.projectId, updates);
  },
});
