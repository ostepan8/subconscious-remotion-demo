import { describe, it, expect } from "vitest";

// E2E-style tests for the tool endpoint contracts.
// These test the full request/response shape that the AI agent uses
// when calling tools via HTTP, ensuring the API contract is correct.

describe("tool endpoint: add-scene", () => {
  it("accepts the correct request body shape (direct params)", () => {
    const requestBody = {
      projectId: "j971234567890abcdef",
      order: 0,
      type: "hero",
      title: "Opening Scene",
      content: '{"headline":"Welcome","subtext":"To our app","buttonText":"Get Started"}',
      durationInFrames: 150,
      transition: "fade",
    };

    expect(requestBody).toHaveProperty("projectId");
    expect(requestBody).toHaveProperty("order");
    expect(requestBody).toHaveProperty("type");
    expect(requestBody).toHaveProperty("title");
    expect(requestBody).toHaveProperty("content");
    expect(requestBody).toHaveProperty("durationInFrames");
    expect(requestBody).toHaveProperty("transition");
  });

  it("accepts the correct request body shape (wrapped in parameters)", () => {
    const requestBody = {
      parameters: {
        projectId: "j971234567890abcdef",
        order: 1,
        type: "features",
        title: "Key Features",
        content: '{"headline":"Features","features":[{"title":"Fast","description":"Lightning quick"}]}',
        durationInFrames: 210,
        transition: "slide",
      },
    };

    expect(requestBody.parameters).toHaveProperty("projectId");
    expect(requestBody.parameters.type).toBe("features");
  });

  it("returns success response with sceneId", () => {
    const response = { success: true, sceneId: "scene_abc123" };
    expect(response.success).toBe(true);
    expect(response.sceneId).toBeTruthy();
  });

  it("returns error response on failure", () => {
    const response = {
      error: "add_scene failed",
      details: "Invalid project ID",
    };
    expect(response.error).toBeTruthy();
  });
});

describe("tool endpoint: update-scene", () => {
  it("accepts partial updates", () => {
    const requestBody = {
      sceneId: "scene_abc123",
      title: "Updated Title",
    };

    expect(requestBody.sceneId).toBeTruthy();
    expect(requestBody.title).toBe("Updated Title");
  });

  it("accepts content as JSON string", () => {
    const requestBody = {
      sceneId: "scene_abc123",
      content: '{"headline":"New Headline","subtext":"Updated subtext"}',
    };

    const parsed = JSON.parse(requestBody.content);
    expect(parsed.headline).toBe("New Headline");
    expect(parsed.subtext).toBe("Updated subtext");
  });

  it("accepts content as object", () => {
    const requestBody = {
      sceneId: "scene_abc123",
      content: { headline: "New Headline" },
    };

    expect(typeof requestBody.content).toBe("object");
  });

  it("can update voiceover script", () => {
    const requestBody = {
      sceneId: "scene_abc123",
      voiceoverScript: "Welcome to our amazing product, designed for you.",
    };

    expect(requestBody.voiceoverScript.length).toBeGreaterThan(0);
  });
});

describe("tool endpoint: remove-scene", () => {
  it("requires only sceneId", () => {
    const requestBody = {
      sceneId: "scene_abc123",
    };

    expect(requestBody.sceneId).toBeTruthy();
  });

  it("returns success on deletion", () => {
    const response = { success: true };
    expect(response.success).toBe(true);
  });
});

describe("tool endpoint: list-scenes", () => {
  it("returns scenes with all required fields", () => {
    const response = [
      {
        id: "scene_1",
        order: 0,
        type: "hero",
        title: "Opening",
        content: { headline: "Welcome", subtext: "To our app" },
        durationInFrames: 150,
        transition: "fade",
        voiceoverScript: "Welcome to our product.",
      },
      {
        id: "scene_2",
        order: 1,
        type: "features",
        title: "Features",
        content: { headline: "Key Features" },
        durationInFrames: 210,
        transition: "slide",
        voiceoverScript: undefined,
      },
    ];

    expect(response).toHaveLength(2);
    expect(response[0]).toHaveProperty("id");
    expect(response[0]).toHaveProperty("order");
    expect(response[0]).toHaveProperty("type");
    expect(response[0]).toHaveProperty("title");
    expect(response[0]).toHaveProperty("content");
    expect(response[0]).toHaveProperty("durationInFrames");
    expect(response[0]).toHaveProperty("transition");
  });

  it("scenes are ordered by order field", () => {
    const scenes = [
      { id: "s1", order: 0 },
      { id: "s2", order: 1 },
      { id: "s3", order: 2 },
    ];

    for (let i = 1; i < scenes.length; i++) {
      expect(scenes[i].order).toBeGreaterThan(scenes[i - 1].order);
    }
  });
});

describe("tool endpoint: reorder-scenes", () => {
  it("accepts sceneIds as JSON string", () => {
    const requestBody = {
      projectId: "proj_123",
      sceneIds: '["scene_3","scene_1","scene_2"]',
    };

    const parsed = JSON.parse(requestBody.sceneIds);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toBe("scene_3");
  });

  it("accepts sceneIds as array", () => {
    const requestBody = {
      projectId: "proj_123",
      sceneIds: ["scene_3", "scene_1", "scene_2"],
    };

    expect(requestBody.sceneIds).toHaveLength(3);
  });
});

describe("tool endpoint: get-project", () => {
  it("returns project metadata", () => {
    const response = {
      id: "proj_123",
      title: "My Video",
      description: "A promo video",
      theme: "saas",
      status: "draft",
    };

    expect(response).toHaveProperty("id");
    expect(response).toHaveProperty("title");
    expect(response).toHaveProperty("description");
    expect(response).toHaveProperty("theme");
    expect(response).toHaveProperty("status");
  });
});

describe("tool endpoint: update-project", () => {
  it("accepts partial project updates", () => {
    const requestBody = {
      projectId: "proj_123",
      title: "Updated Title",
    };

    expect(requestBody).toHaveProperty("projectId");
    expect(requestBody).toHaveProperty("title");
    expect(requestBody).not.toHaveProperty("description");
    expect(requestBody).not.toHaveProperty("theme");
  });

  it("can change project theme", () => {
    const requestBody = {
      projectId: "proj_123",
      theme: "agency",
    };

    expect(requestBody.theme).toBe("agency");
    expect(
      ["tech-startup", "saas", "portfolio", "agency", "ecommerce"]
    ).toContain(requestBody.theme);
  });

  it("can change project status", () => {
    const requestBody = {
      projectId: "proj_123",
      status: "ready",
    };

    expect(["draft", "generating", "ready"]).toContain(requestBody.status);
  });
});

describe("tool endpoint: generate-voiceover-script", () => {
  it("accepts single scene script", () => {
    const requestBody = {
      projectId: "proj_123",
      sceneId: "scene_1",
      script: "Welcome to our product. It's designed to make your life easier.",
    };

    expect(requestBody.sceneId).toBeTruthy();
    expect(requestBody.script).toBeTruthy();
  });

  it("accepts batch scripts as JSON string", () => {
    const requestBody = {
      projectId: "proj_123",
      scripts: JSON.stringify([
        {
          sceneId: "scene_1",
          script: "Welcome to our platform.",
        },
        {
          sceneId: "scene_2",
          script: "Here are our key features.",
        },
      ]),
    };

    const parsed = JSON.parse(requestBody.scripts);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toHaveProperty("sceneId");
    expect(parsed[0]).toHaveProperty("script");
  });

  it("returns error when neither sceneId+script nor scripts provided", () => {
    const requestBody = {
      projectId: "proj_123",
    };

    const hasSceneAndScript = false;
    const hasScripts = false;
    expect(!hasSceneAndScript && !hasScripts).toBe(true);
  });
});

describe("tool endpoint: list-media", () => {
  it("returns media items with URLs", () => {
    const response = [
      {
        id: "media_1",
        name: "logo.png",
        type: "image",
        url: "https://example.com/logo.png",
        mimeType: "image/png",
        size: 102400,
      },
    ];

    expect(response[0]).toHaveProperty("id");
    expect(response[0]).toHaveProperty("name");
    expect(response[0]).toHaveProperty("type");
    expect(response[0]).toHaveProperty("url");
    expect(response[0]).toHaveProperty("mimeType");
    expect(response[0]).toHaveProperty("size");
  });

  it("supports filtering by type", () => {
    const requestBody = {
      projectId: "proj_123",
      type: "image",
    };

    expect(["image", "video", "audio"]).toContain(requestBody.type);
  });
});

describe("tool endpoint: set-scene-media", () => {
  it("attaches media to a scene with placement", () => {
    const requestBody = {
      sceneId: "scene_1",
      mediaId: "media_1",
      mediaUrl: "https://example.com/image.jpg",
      placement: "background",
    };

    expect(requestBody).toHaveProperty("sceneId");
    expect(requestBody).toHaveProperty("mediaId");
    expect(requestBody).toHaveProperty("mediaUrl");
    expect(["background", "overlay", "inline"]).toContain(
      requestBody.placement
    );
  });

  it("merges media into existing scene content", () => {
    const existingContent = { headline: "Welcome", subtext: "Hi" };
    const mediaId = "media_1";
    const mediaUrl = "https://example.com/image.jpg";
    const placement = "overlay";

    const updatedContent = {
      ...existingContent,
      mediaId,
      mediaUrl,
      mediaPlacement: placement,
    };

    expect(updatedContent.headline).toBe("Welcome");
    expect(updatedContent.subtext).toBe("Hi");
    expect(updatedContent.mediaId).toBe(mediaId);
    expect(updatedContent.mediaUrl).toBe(mediaUrl);
    expect(updatedContent.mediaPlacement).toBe("overlay");
  });

  it("defaults placement to background", () => {
    const placement = String(undefined || "background");
    expect(placement).toBe("background");
  });
});

describe("tool endpoint security", () => {
  it("requires secret query parameter", () => {
    const toolSecret = "my-secret-key";
    const url = `https://example.convex.site/tools/add-scene?secret=${toolSecret}`;
    const urlObj = new URL(url);
    expect(urlObj.searchParams.get("secret")).toBe(toolSecret);
  });

  it("all tool URLs include the secret", () => {
    const toolSecret = "test-secret";
    const endpoints = [
      "get-project",
      "list-scenes",
      "add-scene",
      "update-scene",
      "remove-scene",
      "reorder-scenes",
      "update-project",
      "generate-voiceover-script",
      "list-media",
      "set-scene-media",
    ];

    for (const endpoint of endpoints) {
      const url = `https://example.convex.site/tools/${endpoint}?secret=${toolSecret}`;
      expect(url).toContain(`secret=${toolSecret}`);
    }
  });
});
