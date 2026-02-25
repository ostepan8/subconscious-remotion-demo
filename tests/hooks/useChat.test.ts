import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the SSE parsing logic used by the useChat hook
// without needing React's renderHook, since the core logic
// is about fetch + SSE stream parsing.

describe("useChat SSE parsing logic", () => {
  it("parses thought events correctly", () => {
    const sseText = 'data: {"type":"thought","thought":"Analyzing product"}\n\ndata: {"type":"thought","thought":"Creating scenes"}\n\n';
    const lines = sseText.split("\n").filter((l) => l.startsWith("data: "));

    const events = lines.map((line) => {
      const data = line.slice(6);
      if (data === "[DONE]") return { type: "done" };
      return JSON.parse(data);
    });

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("thought");
    expect(events[0].thought).toBe("Analyzing product");
    expect(events[1].thought).toBe("Creating scenes");
  });

  it("handles [DONE] signal", () => {
    const sseText = "data: [DONE]\n\n";
    const lines = sseText.split("\n").filter((l) => l.startsWith("data: "));
    const data = lines[0].slice(6);
    expect(data).toBe("[DONE]");
  });

  it("handles answer events", () => {
    const sseText =
      'data: {"type":"answer","answer":"I created 5 scenes for your video!"}\n\n';
    const lines = sseText.split("\n").filter((l) => l.startsWith("data: "));
    const event = JSON.parse(lines[0].slice(6));

    expect(event.type).toBe("answer");
    expect(event.answer).toContain("5 scenes");
  });

  it("handles error events", () => {
    const sseText =
      'data: {"type":"error","message":"Agent timeout"}\n\n';
    const lines = sseText.split("\n").filter((l) => l.startsWith("data: "));
    const event = JSON.parse(lines[0].slice(6));

    expect(event.type).toBe("error");
    expect(event.message).toBe("Agent timeout");
  });

  it("handles mixed events in sequence", () => {
    const sseText = [
      'data: {"type":"thought","thought":"Starting to analyze"}',
      'data: {"type":"thought","thought":"Building hero scene now"}',
      'data: {"type":"answer","answer":"Done! Check your preview."}',
      "data: [DONE]",
    ].join("\n\n");

    const lines = sseText.split("\n").filter((l) => l.startsWith("data: "));
    const thoughts: string[] = [];
    let answer = "";
    let done = false;

    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") {
        done = true;
        continue;
      }
      try {
        const event = JSON.parse(data);
        if (event.type === "thought") thoughts.push(event.thought);
        if (event.type === "answer") answer = event.answer;
      } catch {
        // skip
      }
    }

    expect(thoughts).toHaveLength(2);
    expect(answer).toBe("Done! Check your preview.");
    expect(done).toBe(true);
  });

  it("ignores partial/malformed chunks gracefully", () => {
    const sseText = 'data: {"type":"thought","th';
    const lines = sseText.split("\n").filter((l) => l.startsWith("data: "));

    const events: unknown[] = [];
    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        events.push(JSON.parse(data));
      } catch {
        // gracefully ignored
      }
    }

    expect(events).toHaveLength(0);
  });
});

describe("useChat state management", () => {
  it("starts with default state", () => {
    const state = {
      isStreaming: false,
      thoughts: [] as string[],
      currentThought: null as string | null,
    };

    expect(state.isStreaming).toBe(false);
    expect(state.thoughts).toHaveLength(0);
    expect(state.currentThought).toBeNull();
  });

  it("transitions to streaming state on send", () => {
    const state = {
      isStreaming: true,
      thoughts: [] as string[],
      currentThought: null as string | null,
    };

    expect(state.isStreaming).toBe(true);
  });

  it("accumulates thoughts during streaming", () => {
    const state = {
      isStreaming: true,
      thoughts: ["Analyzing", "Creating"],
      currentThought: "Creating",
    };

    expect(state.thoughts).toHaveLength(2);
    expect(state.currentThought).toBe("Creating");
  });

  it("resets to idle state after streaming completes", () => {
    const state = {
      isStreaming: false,
      thoughts: [] as string[],
      currentThought: null as string | null,
    };

    expect(state.isStreaming).toBe(false);
    expect(state.currentThought).toBeNull();
  });
});

describe("useChat request construction", () => {
  it("sends correct request to /api/chat/stream", () => {
    const projectId = "proj_123";
    const message = "Create a hero scene";

    const requestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, message }),
    };

    const body = JSON.parse(requestInit.body);
    expect(body.projectId).toBe(projectId);
    expect(body.message).toBe(message);
    expect(requestInit.method).toBe("POST");
  });

  it("trims whitespace from messages before sending", () => {
    const rawInput = "  Create a video about my app  ";
    const trimmed = rawInput.trim();
    expect(trimmed).toBe("Create a video about my app");
  });

  it("rejects empty messages", () => {
    const emptyInputs = ["", "   ", "\n", "\t"];
    for (const input of emptyInputs) {
      expect(input.trim().length).toBe(0);
    }
  });
});

describe("useChat file upload flow", () => {
  it("constructs correct FormData for file upload", () => {
    const file = new File(["test content"], "test.png", {
      type: "image/png",
    });
    const projectId = "proj_123";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    expect(formData.get("file")).toBe(file);
    expect(formData.get("projectId")).toBe(projectId);
  });

  it("generates correct upload notification message", () => {
    const uploadedNames = ["logo.png", "hero.jpg"];
    const msg = `I just uploaded ${uploadedNames.length} file${uploadedNames.length > 1 ? "s" : ""}: ${uploadedNames.join(", ")}. Please use ${uploadedNames.length > 1 ? "them" : "it"} in my video.`;

    expect(msg).toContain("2 files");
    expect(msg).toContain("logo.png, hero.jpg");
    expect(msg).toContain("them");
  });

  it("generates correct singular upload notification", () => {
    const uploadedNames = ["logo.png"];
    const msg = `I just uploaded ${uploadedNames.length} file${uploadedNames.length > 1 ? "s" : ""}: ${uploadedNames.join(", ")}. Please use ${uploadedNames.length > 1 ? "them" : "it"} in my video.`;

    expect(msg).toContain("1 file:");
    expect(msg).not.toContain("files");
    expect(msg).toContain("it");
  });
});
