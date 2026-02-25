import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  projects: defineTable({
    title: v.string(),
    description: v.string(),
    theme: v.string(),
    status: v.string(),
    externalId: v.string(),
    userId: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    githubExtract: v.optional(v.any()),
    designContext: v.optional(v.any()),
    readmeContent: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    brandCandidateFiles: v.optional(v.array(v.string())),
  }).index("by_external_id", ["externalId"])
    .index("by_user", ["userId"]),

  scenes: defineTable({
    projectId: v.id("projects"),
    order: v.number(),
    type: v.string(),
    title: v.string(),
    content: v.any(),
    durationInFrames: v.number(),
    transition: v.string(),
    voiceoverScript: v.optional(v.string()),
    track: v.optional(v.number()),
  }).index("by_project", ["projectId"]),

  media: defineTable({
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
    uploadedAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_project_type", ["projectId", "type"]),

  voiceovers: defineTable({
    projectId: v.id("projects"),
    sceneId: v.optional(v.id("scenes")),
    script: v.string(),
    voiceId: v.string(),
    status: v.string(),
    audioStorageId: v.optional(v.id("_storage")),
  }).index("by_project", ["projectId"])
    .index("by_scene", ["sceneId"]),

  chatMessages: defineTable({
    projectId: v.id("projects"),
    role: v.string(),
    content: v.string(),
    timestamp: v.number(),
  }).index("by_project", ["projectId"]),

  customComponents: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    description: v.string(),
    code: v.string(),
    status: v.string(),
    createdAt: v.number(),
    error: v.optional(v.string()),
  }).index("by_project", ["projectId"]),
});
