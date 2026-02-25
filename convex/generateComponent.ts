import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { validateComponentCode } from "./validateComponent";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function errorJson(msg: string, detail?: string) {
  return json(
    { success: false, error: msg, detail },
    400,
  );
}

function parseBody(body: Record<string, unknown>) {
  if (
    body.parameters &&
    typeof body.parameters === "object"
  ) {
    return body.parameters as Record<string, unknown>;
  }
  return body;
}

export const generateComponentHttp = httpAction(
  async (ctx, request) => {
    try {
      const body = await request.json();
      const params = parseBody(body);
      const sceneId = params.sceneId as Id<"scenes">;
      const intent = params.intent
        ? String(params.intent)
        : "";

      if (!sceneId)
        return errorJson("sceneId is required");

      const scene = await ctx.runQuery(
        api.scenes.getScene,
        { sceneId },
      );
      if (!scene) return errorJson("Scene not found");

      const existingContent =
        (scene.content as Record<string, unknown>) || {};

      await ctx.runMutation(api.scenes.updateScene, {
        sceneId,
        content: {
          ...existingContent,
          generationStatus: "generating",
          intent,
        },
      });

      return json({
        success: true,
        message:
          "Generation started. Use save_generated_code to save the result.",
      });
    } catch (e) {
      return errorJson(
        "generate_component failed",
        String(e),
      );
    }
  },
);

export const generateCustomComponentHttp = httpAction(
  async (ctx, request) => {
    try {
      const body = await request.json();
      const params = parseBody(body);
      const projectId =
        params.projectId as Id<"projects">;
      const name = String(params.name || "Component");
      const description = String(
        params.description || "",
      );

      if (!projectId)
        return errorJson("projectId is required");

      const componentId = await ctx.runMutation(
        api.customComponents.create,
        { projectId, name, description },
      );

      return json({ success: true, componentId });
    } catch (e) {
      return errorJson(
        "generate_custom_component failed",
        String(e),
      );
    }
  },
);

export const saveCustomComponentHttp = httpAction(
  async (ctx, request) => {
    try {
      const body = await request.json();
      const params = parseBody(body);
      const componentId =
        params.componentId as Id<"customComponents">;
      const code = String(params.code || "");
      const error = params.error
        ? String(params.error)
        : undefined;

      if (!componentId)
        return errorJson("componentId is required");

      if (error) {
        await ctx.runMutation(
          api.customComponents.setError,
          { componentId, error },
        );
        return json({ success: true, status: "error" });
      }

      if (!code)
        return errorJson("code or error is required");

      const validation = validateComponentCode(code);
      if (!validation.valid) {
        return json({
          success: false,
          error: validation.error,
          message:
            "Your code did not compile. Fix the error and call save_custom_component again.",
        });
      }

      await ctx.runMutation(
        api.customComponents.saveCode,
        {
          componentId,
          code: validation.fixedCode,
        },
      );

      return json({ success: true, status: "ready" });
    } catch (e) {
      return errorJson(
        "save_custom_component failed",
        String(e),
      );
    }
  },
);
