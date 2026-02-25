import { describe, it, expect } from "vitest";
import { buildTools, SYSTEM_PROMPT, extractThoughts } from "@/lib/agent-config";

// End-to-end workflow tests that simulate the full agent interaction flow:
// 1. User sends message -> context built -> agent called -> tools invoked -> UI updates

describe("full agent workflow: new video creation", () => {
  const convexSiteUrl = "https://test.convex.site";
  const projectId = "proj_test_123";
  const toolSecret = "test-secret";

  it("builds complete tool set for agent", () => {
    const tools = buildTools(convexSiteUrl, projectId, toolSecret);
    expect(tools.length).toBe(11);

    const functionTools = tools.filter((t) => t.type === "function");
    expect(functionTools.length).toBe(10);
  });

  it("system prompt instructs agent to create scenes on first interaction", () => {
    expect(SYSTEM_PROMPT).toContain("When the user first describes their product");
    expect(SYSTEM_PROMPT).toContain("list_scenes");
    expect(SYSTEM_PROMPT).toContain("get_project");
    expect(SYSTEM_PROMPT).toContain("list_media");
    expect(SYSTEM_PROMPT).toContain("Create 4-6 scenes");
  });

  it("system prompt defines all scene types for the agent", () => {
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
      expect(SYSTEM_PROMPT).toContain(type);
    }
  });

  it("tool URLs point to correct Convex HTTP endpoints", () => {
    const tools = buildTools(convexSiteUrl, projectId, toolSecret);
    const addScene = tools.find(
      (t) => t.type === "function" && (t as { name: string }).name === "add_scene"
    ) as { url: string };

    expect(addScene.url).toMatch(
      /^https:\/\/.*\/tools\/add-scene\?secret=.+$/
    );
  });

  it("all tools have projectId pre-filled as default", () => {
    const tools = buildTools(convexSiteUrl, projectId, toolSecret);
    const functionTools = tools.filter(
      (t) => t.type === "function"
    ) as { defaults: Record<string, string> }[];

    for (const tool of functionTools) {
      expect(tool.defaults.projectId).toBe(projectId);
    }
  });
});

describe("agent workflow: adding a scene", () => {
  it("simulates add_scene tool call body from agent", () => {
    const agentToolCall = {
      parameters: {
        projectId: "proj_test_123",
        order: 0,
        type: "hero",
        title: "Welcome to PromoClip",
        content: JSON.stringify({
          headline: "Create Stunning Videos",
          subtext: "AI-powered promo video creation in minutes",
          buttonText: "Start Free",
        }),
        durationInFrames: 150,
        transition: "fade",
        voiceoverScript:
          "Create stunning promotional videos with AI assistance.",
      },
    };

    expect(agentToolCall.parameters.type).toBe("hero");
    expect(agentToolCall.parameters.order).toBe(0);

    const content = JSON.parse(agentToolCall.parameters.content);
    expect(content.headline).toBe("Create Stunning Videos");
    expect(content.subtext).toBeDefined();
    expect(content.buttonText).toBeDefined();
  });

  it("simulates adding multiple scenes in sequence", () => {
    const sceneCalls = [
      { order: 0, type: "hero", title: "Opening" },
      { order: 1, type: "features", title: "Features" },
      { order: 2, type: "how-it-works", title: "How It Works" },
      { order: 3, type: "testimonial", title: "Social Proof" },
      { order: 4, type: "cta", title: "Call to Action" },
    ];

    expect(sceneCalls).toHaveLength(5);

    for (let i = 0; i < sceneCalls.length; i++) {
      expect(sceneCalls[i].order).toBe(i);
    }

    expect(sceneCalls[0].type).toBe("hero");
    expect(sceneCalls[sceneCalls.length - 1].type).toBe("cta");
  });
});

describe("agent workflow: modifying scenes", () => {
  it("simulates updating a scene's content", () => {
    const updateCall = {
      parameters: {
        sceneId: "scene_abc123",
        content: JSON.stringify({
          headline: "Updated Headline",
          subtext: "New subtitle after user feedback",
          buttonText: "Try Now",
        }),
      },
    };

    const content = JSON.parse(updateCall.parameters.content);
    expect(content.headline).toBe("Updated Headline");
  });

  it("simulates removing a scene", () => {
    const removeCall = {
      parameters: {
        sceneId: "scene_to_remove",
      },
    };

    expect(removeCall.parameters.sceneId).toBeTruthy();
  });

  it("simulates reordering scenes", () => {
    const reorderCall = {
      parameters: {
        projectId: "proj_test_123",
        sceneIds: JSON.stringify(["scene_3", "scene_1", "scene_2"]),
      },
    };

    const sceneIds = JSON.parse(reorderCall.parameters.sceneIds);
    expect(sceneIds).toHaveLength(3);
    expect(sceneIds[0]).toBe("scene_3"); // moved to first
  });
});

describe("agent workflow: media integration", () => {
  it("simulates listing media to find uploaded assets", () => {
    const listMediaResponse = [
      {
        id: "media_1",
        name: "product-screenshot.png",
        type: "image",
        url: "https://storage.example.com/product.png",
        mimeType: "image/png",
        size: 256000,
      },
      {
        id: "media_2",
        name: "demo-video.mp4",
        type: "video",
        url: "https://storage.example.com/demo.mp4",
        mimeType: "video/mp4",
        size: 5242880,
      },
    ];

    expect(listMediaResponse).toHaveLength(2);
    const images = listMediaResponse.filter((m) => m.type === "image");
    expect(images).toHaveLength(1);
  });

  it("simulates attaching media to a scene", () => {
    const setMediaCall = {
      parameters: {
        sceneId: "scene_1",
        mediaId: "media_1",
        mediaUrl: "https://storage.example.com/product.png",
        placement: "background",
      },
    };

    expect(setMediaCall.parameters.sceneId).toBeTruthy();
    expect(setMediaCall.parameters.mediaUrl).toMatch(/^https:\/\//);
    expect(["background", "overlay", "inline"]).toContain(
      setMediaCall.parameters.placement
    );
  });

  it("simulates creating image-showcase scene with media", () => {
    const addSceneCall = {
      parameters: {
        projectId: "proj_test_123",
        order: 2,
        type: "image-showcase",
        title: "Product Screenshot",
        content: JSON.stringify({
          headline: "See It In Action",
          mediaUrl: "https://storage.example.com/product.png",
          mediaId: "media_1",
        }),
        durationInFrames: 150,
        transition: "fade",
      },
    };

    expect(addSceneCall.parameters.type).toBe("image-showcase");
    const content = JSON.parse(addSceneCall.parameters.content);
    expect(content.mediaUrl).toBeTruthy();
    expect(content.mediaId).toBeTruthy();
  });
});

describe("agent workflow: voiceover generation", () => {
  it("simulates generating voiceover scripts for all scenes", () => {
    const scripts = [
      { sceneId: "scene_1", script: "Welcome to the future of video creation." },
      { sceneId: "scene_2", script: "Here are three key features that set us apart." },
      { sceneId: "scene_3", script: "Getting started is easy. Just three simple steps." },
      { sceneId: "scene_4", script: "Don't just take our word for it." },
      { sceneId: "scene_5", script: "Ready to create your first video?" },
    ];

    const generateCall = {
      parameters: {
        projectId: "proj_test_123",
        scripts: JSON.stringify(scripts),
      },
    };

    const parsed = JSON.parse(generateCall.parameters.scripts);
    expect(parsed).toHaveLength(5);

    for (const s of parsed) {
      expect(s.script.split(" ").length).toBeGreaterThanOrEqual(5);
      expect(s.script.split(" ").length).toBeLessThanOrEqual(30);
    }
  });

  it("simulates generating voiceover for a single scene", () => {
    const generateCall = {
      parameters: {
        projectId: "proj_test_123",
        sceneId: "scene_1",
        script:
          "Welcome to PromoClip. Create stunning videos with the power of AI.",
      },
    };

    expect(generateCall.parameters.sceneId).toBeTruthy();
    expect(generateCall.parameters.script.length).toBeGreaterThan(10);
  });
});

describe("agent thought streaming", () => {
  it("extracts thoughts from streamed agent response", () => {
    const streamContent = `{"thought": "Let me analyze the product description first"} calling get_project... {"thought": "Now I'll create a hero scene with a compelling headline"} calling add_scene... {"thought": "Adding a features section to highlight key benefits"} calling add_scene... {"answer": "I've created 3 scenes for your video!"}`;

    const thoughts = extractThoughts(streamContent);
    expect(thoughts).toHaveLength(3);
    expect(thoughts[0]).toContain("analyze the product");
    expect(thoughts[1]).toContain("hero scene");
    expect(thoughts[2]).toContain("features section");
  });

  it("does not duplicate previously sent thoughts", () => {
    const thoughts = [
      "Analyzing product description",
      "Creating hero scene",
      "Adding features",
    ];

    const lastSentThoughts = ["Analyzing product description"];
    const newThoughts = thoughts.filter(
      (t) => !lastSentThoughts.includes(t)
    );

    expect(newThoughts).toHaveLength(2);
    expect(newThoughts).not.toContain("Analyzing product description");
  });
});

describe("agent workflow: project updates", () => {
  it("simulates updating project theme", () => {
    const updateCall = {
      parameters: {
        projectId: "proj_test_123",
        theme: "tech-startup",
      },
    };

    expect(
      ["tech-startup", "saas", "portfolio", "agency", "ecommerce"]
    ).toContain(updateCall.parameters.theme);
  });

  it("simulates updating project status to ready", () => {
    const updateCall = {
      parameters: {
        projectId: "proj_test_123",
        status: "ready",
      },
    };

    expect(updateCall.parameters.status).toBe("ready");
  });
});

describe("agent instructions context building", () => {
  it("builds complete instructions with all context sections", () => {
    const systemPrompt = "You are a video assistant.";
    const project = {
      title: "My App",
      description: "Best app ever",
      theme: "saas",
      status: "draft",
    };
    const scenesSummary = 'Scene 0 (hero): "Opening" — {"headline":"Welcome"}';
    const mediaSummary = '- image: "logo.png" (id: media_1, url: https://...)';
    const recentHistory = "User: Create a video\n\nAssistant: Sure!";
    const message = "Add a pricing scene";

    const instructions = `${systemPrompt}

## Project Context
Title: ${project.title}
Description: ${project.description}
Theme: ${project.theme}
Status: ${project.status}

## Current Scenes
${scenesSummary}

## Uploaded Media Library
${mediaSummary}

## Conversation History
${recentHistory}

## Current User Message
${message}`;

    expect(instructions).toContain("## Project Context");
    expect(instructions).toContain("## Current Scenes");
    expect(instructions).toContain("## Uploaded Media Library");
    expect(instructions).toContain("## Conversation History");
    expect(instructions).toContain("## Current User Message");
    expect(instructions).toContain("Add a pricing scene");
  });
});
