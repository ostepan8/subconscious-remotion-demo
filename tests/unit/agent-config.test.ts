import { describe, it, expect } from "vitest";
import {
  extractThoughts,
  buildTools,
  SYSTEM_PROMPT,
} from "@/lib/agent-config";

describe("extractThoughts", () => {
  it("extracts a single thought from JSON content", () => {
    const content = '{"thought": "I should create a hero scene first"}';
    const thoughts = extractThoughts(content);
    expect(thoughts).toEqual(["I should create a hero scene first"]);
  });

  it("extracts multiple thoughts", () => {
    const content =
      '{"thought": "Analyzing the product description"} some text {"thought": "Creating hero scene with headline"}';
    const thoughts = extractThoughts(content);
    expect(thoughts).toHaveLength(2);
    expect(thoughts[0]).toBe("Analyzing the product description");
    expect(thoughts[1]).toBe("Creating hero scene with headline");
  });

  it("returns empty array when no thoughts found", () => {
    const content = '{"answer": "Here is your video"}';
    expect(extractThoughts(content)).toEqual([]);
  });

  it("filters out thoughts shorter than 10 characters", () => {
    const content = '{"thought": "short"} {"thought": "This is long enough to pass the filter"}';
    const thoughts = extractThoughts(content);
    expect(thoughts).toHaveLength(1);
    expect(thoughts[0]).toBe("This is long enough to pass the filter");
  });

  it("handles escaped newlines in thoughts", () => {
    const content = `{"thought": "Creating scene with cool animation effects for demo"}`;
    const thoughts = extractThoughts(content);
    expect(thoughts).toHaveLength(1);
    expect(thoughts[0]).toContain("Creating scene");
  });

  it("handles newline escapes by replacing them with spaces", () => {
    const content = '{"thought": "Creating a scene\\nwith multiple lines of content"}';
    const thoughts = extractThoughts(content);
    expect(thoughts[0]).toContain("scene with multiple");
  });

  it("handles empty string content", () => {
    expect(extractThoughts("")).toEqual([]);
  });

  it("handles malformed JSON gracefully", () => {
    const content = '{"thought": "valid thought here"} {broken json';
    const thoughts = extractThoughts(content);
    expect(thoughts).toHaveLength(1);
  });

  it("trims whitespace from extracted thoughts", () => {
    const content = '{"thought": "  padded thought with spaces  "}';
    const thoughts = extractThoughts(content);
    expect(thoughts[0]).toBe("padded thought with spaces");
  });
});

describe("buildTools", () => {
  const convexSiteUrl = "https://example.convex.site";
  const projectId = "project_123";
  const toolSecret = "test-secret";

  let tools: ReturnType<typeof buildTools>;

  beforeEach(() => {
    tools = buildTools(convexSiteUrl, projectId, toolSecret);
  });

  it("returns 11 tools (1 platform + 10 function)", () => {
    expect(tools).toHaveLength(11);
  });

  it("includes fast_search as a platform tool", () => {
    const fastSearch = tools.find((t) => "id" in t && t.id === "fast_search");
    expect(fastSearch).toBeDefined();
    expect(fastSearch!.type).toBe("platform");
  });

  it("includes all required function tools", () => {
    const toolNames = tools
      .filter((t) => t.type === "function")
      .map((t) => (t as { name: string }).name);

    expect(toolNames).toContain("get_project");
    expect(toolNames).toContain("list_scenes");
    expect(toolNames).toContain("add_scene");
    expect(toolNames).toContain("update_scene");
    expect(toolNames).toContain("remove_scene");
    expect(toolNames).toContain("reorder_scenes");
    expect(toolNames).toContain("update_project");
    expect(toolNames).toContain("generate_voiceover_script");
    expect(toolNames).toContain("list_media");
    expect(toolNames).toContain("set_scene_media");
  });

  it("constructs correct URLs with secret", () => {
    const addScene = tools.find(
      (t) => t.type === "function" && (t as { name: string }).name === "add_scene"
    ) as { url: string };

    expect(addScene.url).toBe(
      `${convexSiteUrl}/tools/add-scene?secret=${toolSecret}`
    );
  });

  it("sets projectId as default for all function tools", () => {
    const functionTools = tools.filter((t) => t.type === "function") as {
      defaults: Record<string, string>;
    }[];

    for (const tool of functionTools) {
      expect(tool.defaults.projectId).toBe(projectId);
    }
  });

  it("add_scene requires order, type, title, content, durationInFrames, transition", () => {
    const addScene = tools.find(
      (t) => t.type === "function" && (t as { name: string }).name === "add_scene"
    ) as { parameters: { required: string[] } };

    expect(addScene.parameters.required).toEqual([
      "order",
      "type",
      "title",
      "content",
      "durationInFrames",
      "transition",
    ]);
  });

  it("update_scene requires only sceneId", () => {
    const updateScene = tools.find(
      (t) => t.type === "function" && (t as { name: string }).name === "update_scene"
    ) as { parameters: { required: string[] } };

    expect(updateScene.parameters.required).toEqual(["sceneId"]);
  });

  it("remove_scene requires only sceneId", () => {
    const removeScene = tools.find(
      (t) => t.type === "function" && (t as { name: string }).name === "remove_scene"
    ) as { parameters: { required: string[] } };

    expect(removeScene.parameters.required).toEqual(["sceneId"]);
  });

  it("set_scene_media requires sceneId, mediaId, and mediaUrl", () => {
    const setMedia = tools.find(
      (t) => t.type === "function" && (t as { name: string }).name === "set_scene_media"
    ) as { parameters: { required: string[] } };

    expect(setMedia.parameters.required).toEqual([
      "sceneId",
      "mediaId",
      "mediaUrl",
    ]);
  });

  it("all function tools use POST method", () => {
    const functionTools = tools.filter((t) => t.type === "function") as {
      method: string;
    }[];

    for (const tool of functionTools) {
      expect(tool.method).toBe("POST");
    }
  });

  it("all function tools have 15 second timeout", () => {
    const functionTools = tools.filter((t) => t.type === "function") as {
      timeout: number;
    }[];

    for (const tool of functionTools) {
      expect(tool.timeout).toBe(15);
    }
  });
});

describe("SYSTEM_PROMPT", () => {
  it("is defined and non-empty", () => {
    expect(SYSTEM_PROMPT).toBeDefined();
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("contains all scene type descriptions", () => {
    const sceneTypes = [
      "hero",
      "features",
      "stats",
      "testimonial",
      "logo-cloud",
      "how-it-works",
      "comparison",
      "pricing",
      "faq",
      "cta",
      "image-showcase",
      "video-clip",
      "custom",
    ];
    for (const type of sceneTypes) {
      expect(SYSTEM_PROMPT).toContain(`**${type}**`);
    }
  });

  it("contains all tool names", () => {
    const toolNames = [
      "get_project",
      "list_scenes",
      "add_scene",
      "update_scene",
      "remove_scene",
      "reorder_scenes",
      "update_project",
      "generate_voiceover_script",
      "list_media",
      "set_scene_media",
    ];
    for (const name of toolNames) {
      expect(SYSTEM_PROMPT).toContain(name);
    }
  });

  it("contains scene timing information", () => {
    expect(SYSTEM_PROMPT).toContain("150 frames");
    expect(SYSTEM_PROMPT).toContain("210 frames");
    expect(SYSTEM_PROMPT).toContain("300 frames");
  });

  it("instructs agent to always use tools", () => {
    expect(SYSTEM_PROMPT).toContain("ALWAYS call tools");
  });
});
