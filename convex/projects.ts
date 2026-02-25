import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    return await ctx.db.query("projects").collect();
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
    const externalId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      theme: args.theme,
      status: "active",
      externalId,
      githubUrl: args.githubUrl,
    });
    return { externalId, projectId };
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
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
