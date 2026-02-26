#!/usr/bin/env node

/**
 * Generate ElevenLabs voiceovers for the demo video.
 * Uses request stitching for consistent prosody across scenes.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const API_KEY = "35d8d94f71bd806c26290ae749cbe7f0d513656d9def3ad0b23357f448324ab6";
const VOICE_ID = "eKZDxUKJmffuxwZ07Y4C";
const MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_DIR = path.join(ROOT, "public/audio/demo");

const scenes = [
  {
    id: "hero",
    text: "Describe your product. Get a video. Subconscious turns your idea into a polished, multi-scene promotional video — with animations, themes, and AI voiceover — in under two minutes.",
    durationFrames: 180,
  },
  {
    id: "dashboard",
    text: "Your dashboard is your command center. See all your video projects at a glance, track their status, and spin up a new one with a single click.",
    durationFrames: 180,
  },
  {
    id: "editor",
    text: "The editor gives you total control. A live video preview updates in real time as our AI agent builds your scenes. Manage media, reorder your timeline, and chat with the agent — all in one place.",
    durationFrames: 210,
  },
  {
    id: "chat",
    text: "Just tell the agent what you want. Type a message — and watch it create custom scenes, apply your branding, and generate voiceover scripts on the fly.",
    durationFrames: 210,
  },
  {
    id: "theme-picker",
    text: "Choose from five stunning visual themes. Each one sets a complete design system — colors, fonts, animations, and personality — so your video looks professional from the start.",
    durationFrames: 210,
  },
  {
    id: "voiceover",
    text: "Add a professional voiceover in seconds. The AI writes your script, you pick a voice, and ElevenLabs generates broadcast-quality narration for every scene.",
    durationFrames: 210,
  },
  {
    id: "stats",
    text: "Five curated themes. Over twenty-five scene types. From idea to finished video in under two minutes. Built for speed, designed for quality.",
    durationFrames: 180,
  },
  {
    id: "cta",
    text: "Ready to create your video? It takes less than a minute to get started. Try Subconscious — free.",
    durationFrames: 180,
  },
];

async function generateScene(scene, previousIds) {
  console.log(`\n🎙️  Generating: ${scene.id}...`);

  const body = {
    text: scene.text,
    model_id: MODEL_ID,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.4,
      use_speaker_boost: true,
    },
  };

  // Request stitching: include previous request IDs for consistent prosody
  if (previousIds.length > 0) {
    body.previous_request_ids = previousIds.slice(-3); // last 3 for context
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs API error (${res.status}): ${errText}`);
  }

  // Get request ID for stitching
  const requestId = res.headers.get("request-id");

  const outputPath = path.join(OUTPUT_DIR, `demo-${scene.id}.mp3`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);

  const sizeKb = Math.round(buffer.length / 1024);
  console.log(`   ✅ Saved: ${outputPath} (${sizeKb} KB)`);

  return requestId;
}

async function getAudioDuration(filePath) {
  try {
    const { execSync } = await import("child_process");
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8" },
    ).trim();
    return parseFloat(result);
  } catch {
    return null;
  }
}

async function main() {
  console.log("🎬 Generating demo voiceovers with ElevenLabs");
  console.log(`   Voice: ${VOICE_ID}`);
  console.log(`   Model: ${MODEL_ID}`);
  console.log(`   Scenes: ${scenes.length}`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const previousIds = [];
  const info = { scenes: [] };

  for (const scene of scenes) {
    const requestId = await generateScene(scene, previousIds);
    if (requestId) previousIds.push(requestId);

    const filePath = path.join(OUTPUT_DIR, `demo-${scene.id}.mp3`);
    const actualDuration = await getAudioDuration(filePath);

    info.scenes.push({
      id: scene.id,
      text: scene.text,
      expectedDuration: scene.durationFrames / 30,
      actualDuration,
      file: `demo-${scene.id}.mp3`,
    });
  }

  // Write info.json
  const infoPath = path.join(OUTPUT_DIR, "demo-info.json");
  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
  console.log(`\n📋 Info saved: ${infoPath}`);

  // Summary
  console.log("\n📊 Summary:");
  for (const s of info.scenes) {
    const expected = s.expectedDuration.toFixed(1);
    const actual = s.actualDuration ? s.actualDuration.toFixed(1) : "?";
    const status = s.actualDuration
      ? Math.abs(s.actualDuration - s.expectedDuration) < 1.5
        ? "✅"
        : "⚠️"
      : "❓";
    console.log(`   ${status} ${s.id}: ${actual}s (expected ${expected}s)`);
  }

  console.log("\n✨ Done! Voiceovers generated for all scenes.");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
