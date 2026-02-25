import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  const { script, voiceId, sceneId, projectId } = (await req.json()) as {
    script: string;
    voiceId: string;
    sceneId: string;
    projectId: string;
  };

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!elevenLabsKey) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 }
    );
  }

  if (!convexUrl) {
    return NextResponse.json(
      { error: "Convex URL not configured" },
      { status: 500 }
    );
  }

  const convex = new ConvexHttpClient(convexUrl);

  try {
    // Find the voiceover record
    const voiceover = await convex.query(api.voiceovers.getVoiceoverForScene, {
      sceneId: sceneId as Id<"scenes">,
    });

    if (voiceover) {
      await convex.mutation(api.voiceovers.updateVoiceoverStatus, {
        voiceoverId: voiceover._id,
        status: "generating",
      });
    }

    // Call ElevenLabs TTS
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsKey,
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      throw new Error(`ElevenLabs API error: ${ttsResponse.status} ${errorText}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    // Upload to Convex storage
    const uploadUrl = await convex.mutation(api.voiceovers.generateUploadUrl);
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "audio/mpeg" },
      body: audioBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload audio to storage");
    }

    const { storageId } = (await uploadResponse.json()) as {
      storageId: Id<"_storage">;
    };

    // Update voiceover record
    if (voiceover) {
      await convex.mutation(api.voiceovers.updateVoiceoverAudio, {
        voiceoverId: voiceover._id,
        audioStorageId: storageId,
      });
    }

    return NextResponse.json({ success: true, storageId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    // Mark as error if record exists
    try {
      const voiceover = await convex.query(
        api.voiceovers.getVoiceoverForScene,
        { sceneId: sceneId as Id<"scenes"> }
      );
      if (voiceover) {
        await convex.mutation(api.voiceovers.updateVoiceoverStatus, {
          voiceoverId: voiceover._id,
          status: "error",
        });
      }
    } catch {
      // Ignore
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
