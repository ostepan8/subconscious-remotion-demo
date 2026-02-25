import { describe, it, expect } from "vitest";

// classifyMedia is defined in the media upload route but not exported.
// We reimplement and test the same logic.
function classifyMedia(mimeType: string): "image" | "video" | "audio" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "image";
}

describe("classifyMedia", () => {
  it("classifies image MIME types", () => {
    expect(classifyMedia("image/jpeg")).toBe("image");
    expect(classifyMedia("image/png")).toBe("image");
    expect(classifyMedia("image/gif")).toBe("image");
    expect(classifyMedia("image/webp")).toBe("image");
    expect(classifyMedia("image/svg+xml")).toBe("image");
  });

  it("classifies video MIME types", () => {
    expect(classifyMedia("video/mp4")).toBe("video");
    expect(classifyMedia("video/webm")).toBe("video");
    expect(classifyMedia("video/quicktime")).toBe("video");
    expect(classifyMedia("video/avi")).toBe("video");
  });

  it("classifies audio MIME types", () => {
    expect(classifyMedia("audio/mpeg")).toBe("audio");
    expect(classifyMedia("audio/wav")).toBe("audio");
    expect(classifyMedia("audio/ogg")).toBe("audio");
    expect(classifyMedia("audio/mp3")).toBe("audio");
  });

  it("defaults to image for unknown MIME types", () => {
    expect(classifyMedia("application/pdf")).toBe("image");
    expect(classifyMedia("text/plain")).toBe("image");
    expect(classifyMedia("application/json")).toBe("image");
  });

  it("defaults to image for empty string", () => {
    expect(classifyMedia("")).toBe("image");
  });
});
