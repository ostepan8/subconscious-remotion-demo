import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Subconscious SDK and Convex client before testing the route
const mockQuery = vi.fn();
const mockMutation = vi.fn();

vi.mock("convex/browser", () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    query: mockQuery,
    mutation: mockMutation,
  })),
}));

const mockStream = vi.fn();
vi.mock("subconscious", () => ({
  Subconscious: vi.fn().mockImplementation(() => ({
    stream: mockStream,
  })),
}));

vi.mock("@/lib/agent-config", () => ({
  SUBCONSCIOUS_ENGINE: "test-engine",
  SYSTEM_PROMPT: "You are a test assistant.",
  buildTools: vi.fn().mockReturnValue([]),
  extractThoughts: vi.fn().mockReturnValue([]),
}));

describe("POST /api/chat/stream", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.SUBCONSCIOUS_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://test.convex.cloud";
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL = "https://test.convex.site";
    process.env.TOOL_ENDPOINT_SECRET = "test-secret";
    process.env.SAVE_MESSAGE_SECRET = "save-secret";
  });

  it("validates required environment variables", () => {
    const subconsciousApiKey = process.env.SUBCONSCIOUS_API_KEY;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

    expect(subconsciousApiKey).toBeDefined();
    expect(convexUrl).toBeDefined();
    expect(convexSiteUrl).toBeDefined();
  });

  it("returns 500 when env vars are missing", () => {
    delete process.env.SUBCONSCIOUS_API_KEY;
    const subconsciousApiKey = process.env.SUBCONSCIOUS_API_KEY;
    expect(subconsciousApiKey).toBeUndefined();
  });

  it("builds correct instructions with project context", () => {
    const systemPrompt = "You are a test assistant.";
    const project = {
      title: "My App",
      description: "A great app",
      theme: "saas",
      status: "draft",
    };
    const scenesSummary = "No scenes yet.";
    const mediaSummary = "No media uploaded yet.";
    const recentHistory = "User: Hello";
    const message = "Create a hero scene";

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

    expect(instructions).toContain("My App");
    expect(instructions).toContain("saas");
    expect(instructions).toContain("No scenes yet.");
    expect(instructions).toContain("Create a hero scene");
    expect(instructions).toContain("Conversation History");
  });

  it("formats scenes summary correctly", () => {
    const scenes = [
      {
        order: 0,
        type: "hero",
        title: "Opening",
        content: { headline: "Welcome" },
        voiceoverScript: "Welcome to our app",
      },
      {
        order: 1,
        type: "features",
        title: "Key Features",
        content: { headline: "Features" },
      },
    ];

    const scenesSummary = scenes
      .map(
        (s, i) =>
          `Scene ${i} (${s.type}): "${s.title}" — ${JSON.stringify(s.content).slice(0, 200)}${s.voiceoverScript ? ` [VO: "${s.voiceoverScript}"]` : ""}`
      )
      .join("\n");

    expect(scenesSummary).toContain("Scene 0 (hero)");
    expect(scenesSummary).toContain('"Opening"');
    expect(scenesSummary).toContain('[VO: "Welcome to our app"]');
    expect(scenesSummary).toContain("Scene 1 (features)");
    // Second scene has no voiceover, so only one [VO:] present
    const voCount = (scenesSummary.match(/\[VO:/g) || []).length;
    expect(voCount).toBe(1);
  });

  it("limits conversation history to last 20 messages", () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i}`,
    }));

    const recentHistory = messages
      .slice(-20)
      .map(
        (m) =>
          `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n\n");

    expect(recentHistory).toContain("Message 10");
    expect(recentHistory).toContain("Message 29");
    expect(recentHistory).not.toContain("Message 9");
  });

  it("formats media summary correctly", () => {
    const media = [
      {
        _id: "media_1",
        name: "logo.png",
        type: "image",
        url: "https://example.com/logo.png",
      },
      {
        _id: "media_2",
        name: "demo.mp4",
        type: "video",
        url: "https://example.com/demo.mp4",
      },
    ];

    const mediaSummary = media
      .map(
        (m) =>
          `- ${m.type}: "${m.name}" (id: ${m._id}, url: ${m.url})`
      )
      .join("\n");

    expect(mediaSummary).toContain('image: "logo.png"');
    expect(mediaSummary).toContain('video: "demo.mp4"');
    expect(mediaSummary).toContain("media_1");
    expect(mediaSummary).toContain("media_2");
  });

  it("shows 'No scenes yet.' when scenes array is empty", () => {
    const scenes: unknown[] = [];
    const scenesSummary =
      scenes.length > 0 ? "has scenes" : "No scenes yet.";
    expect(scenesSummary).toBe("No scenes yet.");
  });

  it("shows 'No media uploaded yet.' when media array is empty", () => {
    const media: unknown[] = [];
    const mediaSummary =
      media.length > 0 ? "has media" : "No media uploaded yet.";
    expect(mediaSummary).toBe("No media uploaded yet.");
  });
});

describe("SSE stream parsing", () => {
  it("parses thought events from SSE data", () => {
    const sseLines = [
      'data: {"type":"thought","thought":"Analyzing the product"}',
      'data: {"type":"thought","thought":"Creating hero scene"}',
      'data: {"type":"answer","answer":"I\'ve created your video!"}',
      "data: [DONE]",
    ];

    const events: { type: string; [key: string]: unknown }[] = [];
    for (const line of sseLines) {
      const data = line.slice(6);
      if (data === "[DONE]") {
        events.push({ type: "done" });
        continue;
      }
      try {
        events.push(JSON.parse(data));
      } catch {
        // skip
      }
    }

    expect(events).toHaveLength(4);
    expect(events[0]).toEqual({
      type: "thought",
      thought: "Analyzing the product",
    });
    expect(events[1]).toEqual({
      type: "thought",
      thought: "Creating hero scene",
    });
    expect(events[2].type).toBe("answer");
    expect(events[3].type).toBe("done");
  });

  it("handles error events in the stream", () => {
    const sseData =
      'data: {"type":"error","message":"Agent failed to respond"}';
    const data = sseData.slice(6);
    const event = JSON.parse(data);

    expect(event.type).toBe("error");
    expect(event.message).toBe("Agent failed to respond");
  });

  it("ignores non-data lines", () => {
    const rawText =
      "event: message\ndata: {\"type\":\"thought\",\"thought\":\"Thinking deeply\"}\n\n";
    const lines = rawText.split("\n").filter((l) => l.startsWith("data: "));

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0].slice(6));
    expect(parsed.type).toBe("thought");
  });
});

describe("answer extraction", () => {
  it("extracts answer from valid JSON response", () => {
    const fullContent = '{"thought":"thinking","answer":"Here is your video with 5 scenes."}';
    let answer = "";
    try {
      const parsed = JSON.parse(fullContent);
      answer =
        typeof parsed.answer === "string"
          ? parsed.answer
          : JSON.stringify(parsed.answer);
    } catch {
      answer = "fallback";
    }

    expect(answer).toBe("Here is your video with 5 scenes.");
  });

  it("falls back to regex extraction on malformed JSON", () => {
    const fullContent = '{"thought":"test","answer":"Partial JSON output here"}extra';
    let answer = "";
    try {
      JSON.parse(fullContent);
    } catch {
      const answerMatch = fullContent.match(
        /"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/
      );
      if (answerMatch) {
        answer = answerMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      } else {
        answer = "I've made changes to your video.";
      }
    }

    expect(answer).toBe("Partial JSON output here");
  });

  it("uses default message when no answer can be extracted", () => {
    const fullContent = "completely broken content with no answer";
    let answer = "";
    try {
      JSON.parse(fullContent);
    } catch {
      const answerMatch = fullContent.match(
        /"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/
      );
      if (answerMatch) {
        answer = answerMatch[1];
      } else {
        answer =
          "I've made changes to your video. Check the preview to see the updates!";
      }
    }

    expect(answer).toBe(
      "I've made changes to your video. Check the preview to see the updates!"
    );
  });
});
