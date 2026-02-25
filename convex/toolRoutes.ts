import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { validateComponentCode } from "./validateComponent";

function parseBody(body: Record<string, unknown>) {
  if (body.parameters && typeof body.parameters === "object") {
    return body.parameters as Record<string, unknown>;
  }
  return body;
}

function toNumber(val: unknown, fallback: number): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function parseContent(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
      return { text: raw };
    } catch {
      return { text: raw };
    }
  }
  return {};
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorJson(message: string, details?: string) {
  return json({ error: message, details }, 200);
}

export const getProject = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;

    const project = await ctx.runQuery(api.projects.getProjectById, {
      projectId,
    });
    if (!project) return errorJson("Project not found");

    return json({
      id: project._id,
      title: project.title,
      description: project.description,
      theme: project.theme,
      status: project.status,
    });
  } catch (e) {
    return errorJson("get_project failed", String(e));
  }
});

export const listScenes = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;

    const scenes = await ctx.runQuery(api.scenes.getScenes, { projectId });
    return json(
      scenes.map((s) => ({
        id: s._id,
        order: s.order,
        type: s.type,
        title: s.title,
        content: s.content,
        durationInFrames: s.durationInFrames,
        transition: s.transition,
        voiceoverScript: s.voiceoverScript,
      }))
    );
  } catch (e) {
    return errorJson("list_scenes failed", String(e));
  }
});

export const addScene = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;

    const content = parseContent(params.content) as Record<string, unknown>;

    if (content.mediaId && (!content.mediaWidth || !content.mediaHeight)) {
      try {
        const mediaItem = await ctx.runQuery(api.media.getMediaItem, {
          mediaId: String(content.mediaId) as Id<"media">,
        });
        if (mediaItem) {
          if (mediaItem.width && !content.mediaWidth) content.mediaWidth = mediaItem.width;
          if (mediaItem.height && !content.mediaHeight) content.mediaHeight = mediaItem.height;
          if (mediaItem.mimeType && !content.mimeType) content.mimeType = mediaItem.mimeType;
          if (!content.mediaUrl && mediaItem.storageId) {
            const resolvedUrl = await ctx.storage.getUrl(mediaItem.storageId);
            if (resolvedUrl) content.mediaUrl = resolvedUrl;
          }
        }
      } catch {
        // best-effort dimension resolution
      }
    }

    const sceneId = await ctx.runMutation(api.scenes.addScene, {
      projectId,
      order: toNumber(params.order, 0),
      type: String(params.type ?? "custom"),
      title: String(params.title ?? "New Scene"),
      content,
      durationInFrames: toNumber(params.durationInFrames, 150),
      transition: String(params.transition ?? "fade"),
      voiceoverScript: params.voiceoverScript
        ? String(params.voiceoverScript)
        : undefined,
    });

    return json({ success: true, sceneId });
  } catch (e) {
    return errorJson("add_scene failed", String(e));
  }
});

export const updateScene = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const sceneId = params.sceneId as Id<"scenes">;

    const updates: Record<string, unknown> = { sceneId };
    if (params.type != null) updates.type = String(params.type);
    if (params.title != null) updates.title = String(params.title);
    if (params.content != null) {
      const content = parseContent(params.content) as Record<string, unknown>;
      if (content.mediaId && (!content.mediaWidth || !content.mediaHeight)) {
        try {
          const mediaItem = await ctx.runQuery(api.media.getMediaItem, {
            mediaId: String(content.mediaId) as Id<"media">,
          });
          if (mediaItem) {
            if (mediaItem.width && !content.mediaWidth) content.mediaWidth = mediaItem.width;
            if (mediaItem.height && !content.mediaHeight) content.mediaHeight = mediaItem.height;
            if (mediaItem.mimeType && !content.mimeType) content.mimeType = mediaItem.mimeType;
            if (!content.mediaUrl && mediaItem.storageId) {
              const resolvedUrl = await ctx.storage.getUrl(mediaItem.storageId);
              if (resolvedUrl) content.mediaUrl = resolvedUrl;
            }
          }
        } catch {
          // best-effort dimension resolution
        }
      }
      updates.content = content;
    }
    if (params.durationInFrames != null)
      updates.durationInFrames = toNumber(params.durationInFrames, 150);
    if (params.transition != null) updates.transition = String(params.transition);
    if (params.voiceoverScript != null)
      updates.voiceoverScript = String(params.voiceoverScript);

    await ctx.runMutation(api.scenes.updateScene, updates as {
      sceneId: Id<"scenes">;
      type?: string;
      title?: string;
      content?: unknown;
      durationInFrames?: number;
      transition?: string;
      voiceoverScript?: string;
    });

    return json({ success: true });
  } catch (e) {
    return errorJson("update_scene failed", String(e));
  }
});

export const removeScene = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const sceneId = params.sceneId as Id<"scenes">;

    await ctx.runMutation(api.scenes.removeScene, { sceneId });
    return json({ success: true });
  } catch (e) {
    return errorJson("remove_scene failed", String(e));
  }
});

export const reorderScenes = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;

    let sceneIds = params.sceneIds;
    if (typeof sceneIds === "string") {
      sceneIds = JSON.parse(sceneIds);
    }

    await ctx.runMutation(api.scenes.reorderScenes, {
      projectId,
      sceneIds: sceneIds as Id<"scenes">[],
    });

    return json({ success: true });
  } catch (e) {
    return errorJson("reorder_scenes failed", String(e));
  }
});

export const updateProjectTool = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;

    await ctx.runMutation(api.projects.updateProject, {
      projectId,
      title: params.title != null ? String(params.title) : undefined,
      description: params.description != null ? String(params.description) : undefined,
      theme: params.theme != null ? String(params.theme) : undefined,
      status: params.status != null ? String(params.status) : undefined,
    });

    return json({ success: true });
  } catch (e) {
    return errorJson("update_project failed", String(e));
  }
});

export const generateVoiceoverScript = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const sceneId = params.sceneId as Id<"scenes"> | undefined;

    if (sceneId && params.script) {
      await ctx.runMutation(api.scenes.updateScene, {
        sceneId,
        voiceoverScript: String(params.script),
      });
      return json({ success: true, message: "Voiceover script saved to scene" });
    }

    if (params.scripts && typeof params.scripts === "string") {
      const scripts = JSON.parse(params.scripts) as {
        sceneId: string;
        script: string;
      }[];
      for (const s of scripts) {
        await ctx.runMutation(api.scenes.updateScene, {
          sceneId: s.sceneId as Id<"scenes">,
          voiceoverScript: s.script,
        });
      }
      return json({
        success: true,
        message: `Updated scripts for ${scripts.length} scenes`,
      });
    }

    return errorJson("Provide sceneId+script or scripts array");
  } catch (e) {
    return errorJson("generate_voiceover_script failed", String(e));
  }
});

export const listMedia = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;
    const type = params.type as string | undefined;

    const items = type
      ? await ctx.runQuery(api.media.getMediaByType, { projectId, type })
      : await ctx.runQuery(api.media.getMedia, { projectId });

    return json(
      items.map((m) => {
        const rec = m as Record<string, unknown>;
        const w = rec.width as number | undefined;
        const h = rec.height as number | undefined;
        let orientation: string | undefined;
        let aspectRatio: string | undefined;
        if (w && h) {
          orientation = w > h ? "landscape" : w < h ? "portrait" : "square";
          aspectRatio = `${w}:${h}`;
        }
        const base: Record<string, unknown> = {
          id: m._id,
          name: m.name,
          type: m.type,
          url: m.url,
          mimeType: m.mimeType,
          size: m.size,
          width: w ?? null,
          height: h ?? null,
          orientation: orientation ?? null,
          aspectRatio: aspectRatio ?? null,
        };
        if (m.type === "component") {
          base.componentName = rec.componentName ?? m.name.replace(/\.[^.]+$/, "");
        }
        return base;
      })
    );
  } catch (e) {
    return errorJson("list_media failed", String(e));
  }
});

export const fetchGithubFile = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const path = String(params.path);

    let owner = params.owner ? String(params.owner) : "";
    let repo = params.repo ? String(params.repo) : "";
    let branch = params.branch ? String(params.branch) : "main";

    if (!owner && params.projectId) {
      const project = await ctx.runQuery(api.projects.getProjectById, {
        projectId: params.projectId as Id<"projects">,
      });
      if (project?.githubUrl) {
        const m = project.githubUrl.match(/github\.com\/([^/]+)\/([^/\?#]+)/);
        if (m) {
          owner = m[1];
          repo = m[2].replace(/\.git$/, "");
        }
      }
    }

    if (!owner || !repo) {
      return errorJson("Could not determine repo. Provide owner/repo or projectId.");
    }

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "VideoCreator/1.0" },
    });

    if (!res.ok) {
      return errorJson(`Could not fetch file: ${path}`, `HTTP ${res.status}`);
    }

    const content = await res.text();
    return json({ content, path });
  } catch (e) {
    return errorJson("fetch_github_file failed", String(e));
  }
});

export const saveComponent = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;
    const fileName = String(params.fileName || "Component.tsx");
    const componentName = String(params.componentName || fileName.replace(/\.[^.]+$/, ""));
    const sourceCode = String(params.sourceCode || "");

    if (!sourceCode) {
      return errorJson("sourceCode is required");
    }

    const blob = new Blob([sourceCode], { type: "text/plain" });
    const storageId = await ctx.storage.store(blob);

    const lines = sourceCode.split("\n");
    const sourcePreview = lines.slice(0, 12).join("\n");

    const ext = fileName.match(/\.(\w+)$/)?.[1] || "tsx";
    const mimeType = ext === "jsx" ? "text/jsx" : ext === "ts" ? "text/typescript" : ext === "css" ? "text/css" : "text/tsx";

    const mediaId = await ctx.runMutation(api.media.saveMedia, {
      projectId,
      name: fileName,
      type: "component",
      storageId,
      mimeType,
      size: sourceCode.length,
      componentName,
      sourcePreview,
    });

    return json({ success: true, mediaId });
  } catch (e) {
    return errorJson("save_component failed", String(e));
  }
});

export const saveDesignContext = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;

    function tryParseJson(val: unknown): unknown {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    }

    const designContext: Record<string, unknown> = {};
    if (params.brandColors != null) designContext.brandColors = tryParseJson(params.brandColors);
    if (params.gradients != null) designContext.gradients = tryParseJson(params.gradients);
    if (params.fonts != null) designContext.fonts = tryParseJson(params.fonts);
    if (params.designStyle != null) designContext.designStyle = params.designStyle;
    if (params.designNotes != null) designContext.designNotes = params.designNotes;
    if (params.cssVariables != null) designContext.cssVariables = tryParseJson(params.cssVariables);
    if (params.tailwindTheme != null) designContext.tailwindTheme = tryParseJson(params.tailwindTheme);

    await ctx.runMutation(api.projects.saveDesignContext, {
      projectId,
      designContext,
    });

    return json({ success: true });
  } catch (e) {
    return errorJson("save_design_context failed", String(e));
  }
});

export const setSceneMedia = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const sceneId = params.sceneId as Id<"scenes">;
    const mediaId = String(params.mediaId);
    const mediaUrl = String(params.mediaUrl);
    const placement = String(params.placement || "background");

    const scene = await ctx.runQuery(api.scenes.getScene, { sceneId });
    if (!scene) return errorJson("Scene not found");

    const mediaItem = await ctx.runQuery(api.media.getMediaItem, {
      mediaId: mediaId as Id<"media">,
    });

    const existingContent =
      (scene.content as Record<string, unknown>) || {};
    const updatedContent: Record<string, unknown> = {
      ...existingContent,
      mediaId,
      mediaUrl,
      mediaPlacement: placement,
    };

    if (mediaItem) {
      if (mediaItem.width) updatedContent.mediaWidth = mediaItem.width;
      if (mediaItem.height) updatedContent.mediaHeight = mediaItem.height;
      if (mediaItem.mimeType) updatedContent.mimeType = mediaItem.mimeType;

      if (mediaItem.type === "component") {
        const rec = mediaItem as Record<string, unknown>;
        updatedContent.componentName = rec.componentName ?? mediaItem.name.replace(/\.[^.]+$/, "");
        if (rec.sourcePreview) {
          updatedContent.sourceCode = rec.sourcePreview;
        }
        const sourceUrl = await ctx.storage.getUrl(mediaItem.storageId);
        if (sourceUrl) {
          try {
            const resp = await fetch(sourceUrl);
            if (resp.ok) {
              updatedContent.sourceCode = await resp.text();
            }
          } catch {
            // keep sourcePreview as fallback
          }
        }
      }
    }

    await ctx.runMutation(api.scenes.updateScene, {
      sceneId,
      content: updatedContent,
    });

    return json({ success: true, message: `Media attached to scene as ${placement}` });
  } catch (e) {
    return errorJson("set_scene_media failed", String(e));
  }
});

export const getComponentSource = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;
    const componentName = params.componentName
      ? String(params.componentName)
      : undefined;
    const mediaId = params.mediaId
      ? (String(params.mediaId) as Id<"media">)
      : undefined;

    if (!componentName && !mediaId) {
      return errorJson("Provide componentName or mediaId");
    }

    const items = await ctx.runQuery(api.media.getMediaByType, {
      projectId,
      type: "component",
    });

    const match = items.find((m) => {
      if (mediaId && m._id === mediaId) return true;
      const rec = m as Record<string, unknown>;
      const name =
        (rec.componentName as string) ?? m.name.replace(/\.[^.]+$/, "");
      return (
        componentName &&
        name.toLowerCase() === componentName.toLowerCase()
      );
    });

    if (!match) {
      return errorJson(
        `Component not found: ${componentName ?? mediaId}`
      );
    }

    const rec = match as Record<string, unknown>;
    const name =
      (rec.componentName as string) ?? match.name.replace(/\.[^.]+$/, "");

    let sourceCode = (rec.sourcePreview as string) ?? null;
    const sourceUrl = await ctx.storage.getUrl(match.storageId);
    if (sourceUrl) {
      try {
        const resp = await fetch(sourceUrl);
        if (resp.ok) {
          sourceCode = await resp.text();
        }
      } catch {
        // keep sourcePreview as fallback
      }
    }

    return json({
      id: match._id,
      componentName: name,
      fileName: match.name,
      sourceCode,
    });
  } catch (e) {
    return errorJson("get_component_source failed", String(e));
  }
});

// ---------------------------------------------------------------------------
// Voiceover audio generation (fire-and-forget via scheduler)
// ---------------------------------------------------------------------------

const VOICE_NAME_MAP: Record<string, string> = {
  rachel: "21m00Tcm4TlvDq8ikWAM",
  bella: "EXAVITQu4vr4xnSDxMaL",
  antoni: "ErXwobaYiN019PkySvjV",
  elli: "MF3mGyEYCl7XYWbV9V6O",
  josh: "TxGEqnHWrfWFTfGW9XjX",
  george: "JBFqnCBsd6RMkjVDRZzb",
  arnold: "VR6AewLTigWG4xSOukaG",
};

function resolveVoiceId(voiceParam: string | undefined): string {
  if (!voiceParam) return VOICE_NAME_MAP.josh;
  const lower = voiceParam.toLowerCase().trim();
  if (VOICE_NAME_MAP[lower]) return VOICE_NAME_MAP[lower];
  return voiceParam;
}

export const generateVoiceover = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;
    const voiceId = resolveVoiceId(params.voiceId as string | undefined);
    const sceneId = params.sceneId as string | undefined;

    const scenes = await ctx.runQuery(api.scenes.getScenes, { projectId });

    const targetScenes = sceneId
      ? scenes.filter((s) => s._id === sceneId)
      : scenes.filter((s) => s.voiceoverScript);

    if (targetScenes.length === 0) {
      return errorJson(
        "No scenes with voiceover scripts found. Call generate_voiceover_script first to set scripts on scenes.",
      );
    }

    const results: { sceneId: string; voiceoverId: string; status: string }[] =
      [];
    for (const scene of targetScenes) {
      if (!scene.voiceoverScript) continue;
      const voiceoverId = await ctx.runMutation(
        api.voiceovers.createAndScheduleVoiceover,
        {
          projectId,
          sceneId: scene._id,
          script: scene.voiceoverScript,
          voiceId,
        },
      );
      results.push({
        sceneId: scene._id,
        voiceoverId,
        status: "scheduled",
      });
    }

    return json({
      success: true,
      message: `Voiceover generation started for ${results.length} scene(s). Audio will appear in the timeline automatically when ready.`,
      voiceovers: results,
    });
  } catch (e) {
    return errorJson("generate_voiceover failed", String(e));
  }
});

// ---------------------------------------------------------------------------
// Generated component code persistence
// ---------------------------------------------------------------------------

export const saveGeneratedCode = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const sceneId = params.sceneId as Id<"scenes">;
    const generatedCode = params.generatedCode
      ? String(params.generatedCode)
      : undefined;
    const error = params.error ? String(params.error) : undefined;

    if (!sceneId) return errorJson("sceneId is required");

    const scene = await ctx.runQuery(api.scenes.getScene, { sceneId });
    if (!scene) return errorJson("Scene not found");

    const existingContent =
      (scene.content as Record<string, unknown>) || {};

    if (error) {
      await ctx.runMutation(api.scenes.updateScene, {
        sceneId,
        content: {
          ...existingContent,
          generationStatus: "error",
          generationError: error,
        },
      });
      return json({ success: true, status: "error" });
    }

    if (!generatedCode) {
      return errorJson("generatedCode or error is required");
    }

    const validation = validateComponentCode(generatedCode);
    if (!validation.valid) {
      return json({
        success: false,
        error: validation.error,
        message:
          "Your code did not compile. Fix the error and call save_generated_code again with corrected code.",
      });
    }

    await ctx.runMutation(api.scenes.updateScene, {
      sceneId,
      content: {
        ...existingContent,
        generationStatus: "ready",
        generatedCode: validation.fixedCode,
        generationError: undefined,
      },
    });

    return json({ success: true, status: "ready" });
  } catch (e) {
    return errorJson("save_generated_code failed", String(e));
  }
});

export const updateGenerationStatus = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const sceneId = params.sceneId as Id<"scenes">;
    const status = String(params.status || "generating");

    if (!sceneId) return errorJson("sceneId is required");

    const scene = await ctx.runQuery(api.scenes.getScene, { sceneId });
    if (!scene) return errorJson("Scene not found");

    const existingContent =
      (scene.content as Record<string, unknown>) || {};

    await ctx.runMutation(api.scenes.updateScene, {
      sceneId,
      content: { ...existingContent, generationStatus: status },
    });

    return json({ success: true });
  } catch (e) {
    return errorJson("update_generation_status failed", String(e));
  }
});

// ---------------------------------------------------------------------------
// Repo exploration tools
// ---------------------------------------------------------------------------

const GITHUB_HEADERS = {
  "User-Agent": "VideoCreator/1.0",
  Accept: "application/vnd.github.v3+json",
};

const REPO_SKIP_DIRS =
  /^(node_modules|\.git|\.next|\.cache|dist|build|\.turbo|\.vercel|coverage)\//;

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([^/]+)\/([^/\?#]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

export const listRepoFiles = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;
    const directory = params.directory ? String(params.directory) : undefined;
    const extension = params.extension ? String(params.extension) : undefined;
    const maxResults = toNumber(params.maxResults, 200);

    const project = await ctx.runQuery(api.projects.getProjectById, { projectId });
    if (!project?.githubUrl) return errorJson("Project has no GitHub URL");

    const parsed = parseGithubUrl(project.githubUrl);
    if (!parsed) return errorJson("Invalid GitHub URL on project");

    const metaRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers: GITHUB_HEADERS },
    );
    const meta = metaRes.ok
      ? (await metaRes.json()) as { default_branch?: string }
      : null;
    const branch = meta?.default_branch || "main";

    const treeRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`,
      { headers: GITHUB_HEADERS },
    );
    if (!treeRes.ok) return errorJson("Could not fetch repo tree");

    const treeData = (await treeRes.json()) as {
      tree?: { type: string; path: string }[];
    };

    let files = (treeData.tree || [])
      .filter((f) => f.type === "blob" && !REPO_SKIP_DIRS.test(f.path))
      .map((f) => f.path);

    if (directory) {
      const dir = directory.replace(/\/$/, "");
      files = files.filter((f) => f.startsWith(dir + "/") || f === dir);
    }

    if (extension) {
      const ext = extension.startsWith(".") ? extension : `.${extension}`;
      files = files.filter((f) => f.endsWith(ext));
    }

    return json({ files: files.slice(0, maxResults), total: files.length });
  } catch (e) {
    return errorJson("list_repo_files failed", String(e));
  }
});

export const searchRepoFiles = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const params = parseBody(body);
    const projectId = params.projectId as Id<"projects">;
    const pattern = String(params.pattern || "");
    const fileExtensions = params.fileExtensions
      ? String(params.fileExtensions).split(",").map((e) => e.trim())
      : undefined;
    const maxFiles = toNumber(params.maxFiles, 15);

    if (!pattern) return errorJson("pattern is required");

    const project = await ctx.runQuery(api.projects.getProjectById, { projectId });
    if (!project?.githubUrl) return errorJson("Project has no GitHub URL");

    const parsed = parseGithubUrl(project.githubUrl);
    if (!parsed) return errorJson("Invalid GitHub URL on project");

    const metaRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers: GITHUB_HEADERS },
    );
    const meta = metaRes.ok
      ? (await metaRes.json()) as { default_branch?: string }
      : null;
    const branch = meta?.default_branch || "main";

    const treeRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`,
      { headers: GITHUB_HEADERS },
    );
    if (!treeRes.ok) return errorJson("Could not fetch repo tree");

    const treeData = (await treeRes.json()) as {
      tree?: { type: string; path: string }[];
    };

    let candidateFiles = (treeData.tree || [])
      .filter((f) => f.type === "blob" && !REPO_SKIP_DIRS.test(f.path))
      .map((f) => f.path);

    if (fileExtensions && fileExtensions.length > 0) {
      candidateFiles = candidateFiles.filter((f) =>
        fileExtensions.some((ext) => {
          const e = ext.startsWith(".") ? ext : `.${ext}`;
          return f.endsWith(e);
        }),
      );
    }

    candidateFiles = candidateFiles.slice(0, maxFiles * 3);

    const matches: { path: string; matches: { line: number; text: string }[] }[] = [];
    let filesSearched = 0;

    for (const filePath of candidateFiles) {
      if (filesSearched >= maxFiles) break;

      const url = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${filePath}`;
      try {
        const res = await fetch(url, { headers: { "User-Agent": "VideoCreator/1.0" } });
        if (!res.ok) continue;
        const content = await res.text();
        filesSearched++;

        if (content.length > 100000) continue;

        const lines = content.split("\n");
        const fileMatches: { line: number; text: string }[] = [];
        const re = new RegExp(pattern, "gi");

        for (let i = 0; i < lines.length; i++) {
          if (re.test(lines[i])) {
            const start = Math.max(0, i - 1);
            const end = Math.min(lines.length - 1, i + 1);
            const context = lines.slice(start, end + 1).join("\n");
            fileMatches.push({ line: i + 1, text: context });
            re.lastIndex = 0;
          }
        }

        if (fileMatches.length > 0) {
          matches.push({ path: filePath, matches: fileMatches.slice(0, 10) });
        }
      } catch {
        continue;
      }
    }

    return json({ results: matches, filesSearched });
  } catch (e) {
    return errorJson("search_repo_files failed", String(e));
  }
});
