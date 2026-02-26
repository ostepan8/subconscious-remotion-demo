#!/usr/bin/env node

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const entryPoint = path.join(ROOT, "remotion/index.ts");
const publicDir = path.join(ROOT, "public");
const outputPath = path.join(process.env.HOME, "Desktop/subconscious-demo.mp4");

async function main() {
  console.log("📦 Bundling Remotion project...");

  const bundled = await bundle({
    entryPoint,
    publicDir,
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...(config.resolve?.alias ?? {}),
          "@": path.resolve(ROOT, "src"),
        },
      },
    }),
  });

  console.log("🎬 Getting composition...");
  const composition = await selectComposition({
    serveUrl: bundled,
    id: "DemoVideo",
  });

  console.log(`   Composition: ${composition.id}`);
  console.log(`   Duration: ${composition.durationInFrames} frames (${Math.round(composition.durationInFrames / composition.fps)}s)`);
  console.log(`   Resolution: ${composition.width}x${composition.height} @ ${composition.fps}fps`);
  console.log(`\n🎥 Rendering to ${outputPath}...`);

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputPath,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      process.stdout.write(`\r   Rendering: ${pct}%`);
    },
  });

  console.log(`\n\n✅ Video exported to: ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
