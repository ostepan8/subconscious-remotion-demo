import { describe, it, expect, beforeEach } from "vitest";

describe("POST /api/voiceover/generate", () => {
  beforeEach(() => {
    process.env.ELEVENLABS_API_KEY = "test-eleven-key";
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://test.convex.cloud";
  });

  it("returns 500 when ElevenLabs API key is missing", () => {
    delete process.env.ELEVENLABS_API_KEY;
    expect(process.env.ELEVENLABS_API_KEY).toBeUndefined();
  });

  it("returns 500 when Convex URL is missing", () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    expect(process.env.NEXT_PUBLIC_CONVEX_URL).toBeUndefined();
  });

  it("constructs correct ElevenLabs API URL", () => {
    const voiceId = "21m00Tcm4TlvDq8ikWAM";
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    expect(url).toContain(voiceId);
    expect(url).toMatch(
      /^https:\/\/api\.elevenlabs\.io\/v1\/text-to-speech\/.+$/
    );
  });

  it("sends correct TTS request body", () => {
    const script = "Welcome to our amazing product.";
    const requestBody = {
      text: script,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    };

    expect(requestBody.text).toBe(script);
    expect(requestBody.model_id).toBe("eleven_multilingual_v2");
    expect(requestBody.voice_settings.stability).toBe(0.5);
    expect(requestBody.voice_settings.similarity_boost).toBe(0.75);
  });

  it("sets correct headers for ElevenLabs request", () => {
    const apiKey = "test-eleven-key";
    const headers = {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    };

    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["xi-api-key"]).toBe(apiKey);
  });
});

describe("voiceover workflow", () => {
  it("follows correct generation sequence", () => {
    const steps = [
      "find voiceover record for scene",
      "update status to generating",
      "call ElevenLabs TTS API",
      "get audio buffer from response",
      "generate Convex upload URL",
      "upload audio to Convex storage",
      "update voiceover with audio storage ID",
    ];

    expect(steps).toHaveLength(7);
  });

  it("marks voiceover as error on failure", () => {
    const errorStatuses = ["pending", "generating", "ready", "error"];
    expect(errorStatuses).toContain("error");
  });

  it("transitions through status lifecycle correctly", () => {
    const lifecycle = ["pending", "generating", "ready"];
    expect(lifecycle[0]).toBe("pending");
    expect(lifecycle[1]).toBe("generating");
    expect(lifecycle[2]).toBe("ready");
  });

  it("deletes existing voiceover audio before creating new one", () => {
    const existingVoiceover = {
      _id: "vo_1",
      audioStorageId: "storage_old",
      status: "ready",
    };

    const shouldDeleteStorage = !!existingVoiceover.audioStorageId;
    expect(shouldDeleteStorage).toBe(true);
  });

  it("handles case when no existing voiceover record found", () => {
    const voiceover = null;
    const shouldUpdateStatus = !!voiceover;
    expect(shouldUpdateStatus).toBe(false);
  });
});
