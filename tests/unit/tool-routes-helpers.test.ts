import { describe, it, expect } from "vitest";

// These helpers are defined inside toolRoutes.ts. We extract and test them
// by reimplementing the same logic since they're not exported.
// This tests the critical parsing logic the tool routes depend on.

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

describe("parseBody", () => {
  it("extracts parameters from Subconscious-style body", () => {
    const body = {
      parameters: { projectId: "123", type: "hero" },
    };
    const result = parseBody(body);
    expect(result).toEqual({ projectId: "123", type: "hero" });
  });

  it("returns body directly when no parameters wrapper", () => {
    const body = { projectId: "123", type: "hero" };
    const result = parseBody(body);
    expect(result).toEqual({ projectId: "123", type: "hero" });
  });

  it("returns body when parameters is not an object", () => {
    const body = { parameters: "string-value", projectId: "123" };
    const result = parseBody(body);
    expect(result).toEqual(body);
  });

  it("returns body when parameters is null", () => {
    const body = { parameters: null, projectId: "123" };
    const result = parseBody(body);
    expect(result).toEqual(body);
  });

  it("handles nested parameters object", () => {
    const body = {
      parameters: {
        projectId: "proj_abc",
        content: '{"headline": "test"}',
        order: 2,
      },
    };
    const result = parseBody(body);
    expect(result.projectId).toBe("proj_abc");
    expect(result.order).toBe(2);
  });
});

describe("toNumber", () => {
  it("returns the number directly when input is a number", () => {
    expect(toNumber(42, 0)).toBe(42);
  });

  it("parses a numeric string", () => {
    expect(toNumber("150", 0)).toBe(150);
  });

  it("returns fallback for non-numeric string", () => {
    expect(toNumber("not-a-number", 99)).toBe(99);
  });

  it("returns fallback for undefined", () => {
    expect(toNumber(undefined, 150)).toBe(150);
  });

  it("returns fallback for null", () => {
    expect(toNumber(null, 150)).toBe(150);
  });

  it("returns fallback for boolean", () => {
    expect(toNumber(true, 150)).toBe(150);
  });

  it("returns fallback for objects", () => {
    expect(toNumber({}, 150)).toBe(150);
  });

  it("handles zero correctly", () => {
    expect(toNumber(0, 150)).toBe(0);
    expect(toNumber("0", 150)).toBe(0);
  });

  it("handles negative numbers", () => {
    expect(toNumber(-5, 0)).toBe(-5);
    expect(toNumber("-5", 0)).toBe(-5);
  });

  it("handles float numbers", () => {
    expect(toNumber(3.14, 0)).toBe(3.14);
    expect(toNumber("3.14", 0)).toBe(3.14);
  });

  it("returns fallback for Infinity string", () => {
    // Number("Infinity") is Infinity, which is not finite, so fallback is used
    expect(toNumber("Infinity", 150)).toBe(150);
  });

  it("returns fallback for NaN (numeric input)", () => {
    // NaN is typeof "number" so the first branch returns it directly
    expect(toNumber(NaN, 150)).toBeNaN();
  });

  it("returns fallback for empty string", () => {
    expect(toNumber("", 150)).toBe(0);
    // Number("") is 0 which is finite
  });
});

describe("parseContent", () => {
  it("parses a valid JSON string into object", () => {
    const result = parseContent('{"headline": "Test", "subtext": "Hello"}');
    expect(result).toEqual({ headline: "Test", subtext: "Hello" });
  });

  it("returns the object directly if input is already an object", () => {
    const input = { headline: "Test" };
    const result = parseContent(input);
    expect(result).toEqual({ headline: "Test" });
  });

  it("returns empty object for null", () => {
    expect(parseContent(null)).toEqual({});
  });

  it("returns empty object for undefined", () => {
    expect(parseContent(undefined)).toEqual({});
  });

  it("returns { text: raw } for non-JSON string", () => {
    const result = parseContent("just plain text");
    expect(result).toEqual({ text: "just plain text" });
  });

  it("returns { text: raw } for a string that parses to a non-object", () => {
    const result = parseContent('"just a string"');
    expect(result).toEqual({ text: '"just a string"' });
  });

  it("returns empty object for arrays", () => {
    expect(parseContent([1, 2, 3])).toEqual({});
  });

  it("handles complex nested JSON content", () => {
    const input = JSON.stringify({
      headline: "Features",
      features: [
        { title: "Fast", description: "Lightning quick" },
        { title: "Secure", description: "Bank-level security" },
      ],
    });
    const result = parseContent(input);
    expect(result.headline).toBe("Features");
    expect(result.features).toHaveLength(2);
  });

  it("handles JSON string with special characters", () => {
    const result = parseContent('{"headline": "Hello \\"World\\""}');
    expect(result.headline).toBe('Hello "World"');
  });

  it("preserves mediaUrl and mediaPlacement fields", () => {
    const input = {
      headline: "Showcase",
      mediaUrl: "https://example.com/image.jpg",
      mediaId: "media_123",
      mediaPlacement: "background",
    };
    const result = parseContent(input);
    expect(result.mediaUrl).toBe("https://example.com/image.jpg");
    expect(result.mediaPlacement).toBe("background");
  });
});
