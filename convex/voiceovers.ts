import { query, mutation, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getVoiceovers = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("voiceovers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getVoiceoverForScene = query({
  args: { sceneId: v.id("scenes") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("voiceovers")
      .withIndex("by_scene", (q) => q.eq("sceneId", args.sceneId))
      .unique();
  },
});

export const createVoiceover = mutation({
  args: {
    projectId: v.id("projects"),
    sceneId: v.optional(v.id("scenes")),
    script: v.string(),
    voiceId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.sceneId) {
      const existing = await ctx.db
        .query("voiceovers")
        .withIndex("by_scene", (q) => q.eq("sceneId", args.sceneId))
        .unique();
      if (existing) {
        if (existing.audioStorageId) {
          await ctx.storage.delete(existing.audioStorageId);
        }
        await ctx.db.delete(existing._id);
      }
    }

    return ctx.db.insert("voiceovers", {
      ...args,
      status: "pending",
    });
  },
});

export const updateVoiceoverAudio = mutation({
  args: {
    voiceoverId: v.id("voiceovers"),
    audioStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.voiceoverId, {
      audioStorageId: args.audioStorageId,
      status: "ready",
    });
  },
});

export const updateVoiceoverStatus = mutation({
  args: {
    voiceoverId: v.id("voiceovers"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.voiceoverId, { status: args.status });
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return ctx.storage.generateUploadUrl();
  },
});

export const getAudioUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return ctx.storage.getUrl(args.storageId);
  },
});

export const getVoiceoversWithUrls = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const voiceovers = await ctx.db
      .query("voiceovers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const results = [];
    for (const vo of voiceovers) {
      let audioUrl: string | null = null;
      if (vo.status === "ready" && vo.audioStorageId) {
        audioUrl = await ctx.storage.getUrl(vo.audioStorageId);
      }
      results.push({ ...vo, audioUrl });
    }
    return results;
  },
});

export const createAndScheduleVoiceover = mutation({
  args: {
    projectId: v.id("projects"),
    sceneId: v.id("scenes"),
    script: v.string(),
    voiceId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("voiceovers")
      .withIndex("by_scene", (q) => q.eq("sceneId", args.sceneId))
      .unique();
    if (existing) {
      if (existing.audioStorageId) {
        await ctx.storage.delete(existing.audioStorageId);
      }
      await ctx.db.delete(existing._id);
    }

    const voiceoverId = await ctx.db.insert("voiceovers", {
      projectId: args.projectId,
      sceneId: args.sceneId,
      script: args.script,
      voiceId: args.voiceId,
      status: "pending",
    });

    await ctx.scheduler.runAfter(
      0,
      internal.voiceovers.generateVoiceoverAudio,
      {
        voiceoverId,
        script: args.script,
        voiceId: args.voiceId,
      },
    );

    return voiceoverId;
  },
});

export const generateVoiceoverAudio = internalAction({
  args: {
    voiceoverId: v.id("voiceovers"),
    script: v.string(),
    voiceId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.voiceovers.internalUpdateStatus, {
      voiceoverId: args.voiceoverId,
      status: "generating",
    });

    try {
      const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
      if (!elevenLabsKey) {
        throw new Error("ELEVENLABS_API_KEY not set in Convex environment variables");
      }

      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${args.voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": elevenLabsKey,
          },
          body: JSON.stringify({
            text: args.script,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        },
      );

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        throw new Error(
          `ElevenLabs API error: ${ttsResponse.status} ${errorText}`,
        );
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const storageId = await ctx.storage.store(blob);

      await ctx.runMutation(internal.voiceovers.internalUpdateAudio, {
        voiceoverId: args.voiceoverId,
        audioStorageId: storageId,
      });
    } catch (error) {
      console.error("Voiceover generation failed:", error);
      await ctx.runMutation(internal.voiceovers.internalUpdateStatus, {
        voiceoverId: args.voiceoverId,
        status: "error",
      });
    }
  },
});

export const internalUpdateStatus = internalMutation({
  args: {
    voiceoverId: v.id("voiceovers"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.voiceoverId, { status: args.status });
  },
});

export const internalUpdateAudio = internalMutation({
  args: {
    voiceoverId: v.id("voiceovers"),
    audioStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.voiceoverId, {
      audioStorageId: args.audioStorageId,
      status: "ready",
    });
  },
});
