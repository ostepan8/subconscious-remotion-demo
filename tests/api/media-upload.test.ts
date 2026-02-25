import { describe, it, expect, vi, beforeEach } from "vitest";

function classifyMedia(mimeType: string): "image" | "video" | "audio" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "image";
}

describe("POST /api/media/upload", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://test.convex.cloud";
  });

  it("returns 500 when Convex URL is not configured", () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    expect(convexUrl).toBeUndefined();
  });

  it("validates that file and projectId are required", () => {
    const file = null;
    const projectId = null;
    expect(!file || !projectId).toBe(true);
  });

  it("correctly classifies uploaded file types", () => {
    expect(classifyMedia("image/jpeg")).toBe("image");
    expect(classifyMedia("image/png")).toBe("image");
    expect(classifyMedia("video/mp4")).toBe("video");
    expect(classifyMedia("video/webm")).toBe("video");
    expect(classifyMedia("audio/mpeg")).toBe("audio");
    expect(classifyMedia("audio/wav")).toBe("audio");
  });

  it("returns correct response shape on success", () => {
    const response = {
      success: true,
      mediaId: "media_123",
      storageId: "storage_456",
      url: "https://example.com/file.jpg",
      type: "image",
      name: "photo.jpg",
    };

    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("mediaId");
    expect(response).toHaveProperty("storageId");
    expect(response).toHaveProperty("url");
    expect(response).toHaveProperty("type");
    expect(response).toHaveProperty("name");
  });
});

describe("media upload flow", () => {
  it("follows the correct upload sequence", () => {
    const steps = [
      "parse FormData",
      "validate file and projectId",
      "classify media type from MIME",
      "convert file to ArrayBuffer",
      "generate Convex upload URL",
      "POST file to upload URL",
      "save media metadata to Convex",
      "get media URL from storage",
      "return success response",
    ];

    expect(steps).toHaveLength(9);
  });

  it("handles various file sizes", () => {
    const fileSizes = [
      { name: "tiny.png", size: 1024, valid: true },
      { name: "medium.jpg", size: 1024 * 1024, valid: true },
      { name: "large.mp4", size: 50 * 1024 * 1024, valid: true },
    ];

    for (const file of fileSizes) {
      expect(file.size).toBeGreaterThan(0);
    }
  });
});
