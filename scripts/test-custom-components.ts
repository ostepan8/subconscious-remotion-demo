#!/usr/bin/env npx tsx
/**
 * E2E test for custom component generation.
 *
 * Flow tested:
 * 1. List detected repo components from media table
 * 2. Trigger custom component generation via HTTP endpoint
 * 3. Poll Convex until generation completes
 * 4. Verify generated code uses brand colors, fonts, correct patterns
 * 5. Compile generated TSX with compileComponent (same as client)
 * 6. Add generated component as a Remotion scene via Convex mutation
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const CONVEX_SITE_URL = "https://warmhearted-herring-995.convex.site";
const PROJECT_ID = "k17ddh3h4e1gpextve74f2cty981sj1f" as Id<"projects">;

const convex = new ConvexHttpClient(CONVEX_URL);

const BRAND_COLORS = ["#FF5C28", "#101820", "#F0F3EF", "#3ED0C3", "#B5E800"];
const BRAND_FONT = "Manrope";

interface TestResult {
  name: string;
  componentId: string;
  status: string;
  codeLength: number;
  qualityPassed: number;
  qualityFailed: number;
  compiled: boolean;
  addedAsScene: boolean;
  details: string[];
}

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Step 1 ──────────────────────────────────────────────────────────────

async function listDetectedComponents(): Promise<
  Array<{ name: string; componentName: string }>
> {
  log("Step 1: Listing detected repo components...");

  const res = await fetch(`${CONVEX_SITE_URL}/tools/list-media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: PROJECT_ID }),
  });
  const data = await res.json();
  const media = Array.isArray(data)
    ? data
    : data.media || data.result?.media || [];
  const comps = media.filter((m: { type: string }) => m.type === "component");

  log(`  Found ${comps.length} detected components`);
  for (const c of comps.slice(0, 6))
    console.log(`    - ${c.componentName || c.name}`);
  if (comps.length > 6) console.log(`    ... and ${comps.length - 6} more`);
  console.log();

  return comps.map(
    (c: { name: string; componentName?: string }) => ({
      name: c.name,
      componentName: c.componentName || c.name.replace(/\.[^.]+$/, ""),
    }),
  );
}

// ── Step 2 ──────────────────────────────────────────────────────────────

async function triggerGeneration(
  name: string,
  description: string,
): Promise<string> {
  const res = await fetch(
    `${CONVEX_SITE_URL}/tools/generate-custom-component`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: PROJECT_ID, name, description }),
    },
  );
  const data = await res.json();
  if (!data.success) throw new Error(`Trigger failed: ${JSON.stringify(data)}`);
  return data.componentId;
}

// ── Step 3 ──────────────────────────────────────────────────────────────

interface CustomComp {
  _id: Id<"customComponents">;
  name: string;
  code: string;
  status: string;
  error?: string;
}

async function pollCompletion(
  componentId: string,
  maxWaitSec = 180,
): Promise<CustomComp | null> {
  const start = Date.now();
  let interval = 5000;

  while ((Date.now() - start) / 1000 < maxWaitSec) {
    await sleep(interval);
    interval = Math.min(interval * 1.2, 10000);

    const all = (await convex.query(api.customComponents.list, {
      projectId: PROJECT_ID,
    })) as CustomComp[];
    const comp = all.find((c) => c._id === componentId);
    const elapsed = Math.round((Date.now() - start) / 1000);

    if (!comp) {
      log(`  [${elapsed}s] Not found yet...`);
      continue;
    }

    if (comp.status === "ready") {
      log(`  [${elapsed}s] ✅ "${comp.name}" — ready (${comp.code.length} chars)`);
      return comp;
    } else if (comp.status === "error") {
      log(`  [${elapsed}s] ❌ "${comp.name}" — error: ${comp.error}`);
      return comp;
    } else {
      log(`  [${elapsed}s] ⏳ "${comp.name}" — ${comp.status}`);
    }
  }

  log(`  Timed out after ${maxWaitSec}s`);
  return null;
}

// ── Step 4 ──────────────────────────────────────────────────────────────

function verifyCodeQuality(
  name: string,
  code: string,
): { passed: number; failed: number; details: string[] } {
  let passed = 0;
  let failed = 0;
  const details: string[] = [];

  const check = (ok: boolean, label: string) => {
    if (ok) {
      passed++;
      details.push(`  ✅ ${label}`);
    } else {
      failed++;
      details.push(`  ❌ ${label}`);
    }
  };

  check(
    /function\s+GeneratedComponent\s*\(/.test(code),
    "Defines GeneratedComponent function",
  );

  check(
    /useCurrentFrame\s*\(/.test(code),
    "Uses useCurrentFrame() for animation",
  );

  const foundColors = BRAND_COLORS.filter((c) => code.includes(c));
  check(
    foundColors.length >= 2,
    `Brand colors: ${foundColors.length}/${BRAND_COLORS.length} (${foundColors.join(", ") || "none"})`,
  );

  check(code.includes(BRAND_FONT), `Uses brand font: ${BRAND_FONT}`);

  const hasImport = /^\s*import\s+/m.test(code);
  const hasExport = /^\s*export\s+/m.test(code);
  check(!hasImport && !hasExport, "No import/export statements");

  check(
    code.length > 500 && code.length < 15000,
    `Code length: ${code.length} chars`,
  );

  const lines = code.split("\n");
  check(lines.length > 10, `Multi-line code: ${lines.length} lines`);

  const lastLine = lines[lines.length - 1].trim();
  check(
    lastLine === "}" || lastLine === "",
    `Clean ending: last line is "${lastLine}"`,
  );

  return { passed, failed, details };
}

// ── Step 5 ──────────────────────────────────────────────────────────────

function verifyCompilation(code: string): boolean {
  // Dynamic require to avoid import issues in non-browser context
  // compileComponent uses sucrase which is Node-compatible
  try {
    const { compileComponent } = require("../src/lib/compile-component");
    const Component = compileComponent(code);
    return typeof Component === "function";
  } catch {
    return false;
  }
}

// ── Step 6 ──────────────────────────────────────────────────────────────

async function addAsScene(name: string, code: string): Promise<string | null> {
  try {
    const scenes = await convex.query(api.scenes.getScenes, {
      projectId: PROJECT_ID,
    });

    const sceneId = await convex.mutation(api.scenes.addScene, {
      projectId: PROJECT_ID,
      type: "generated",
      title: name,
      order: (scenes as unknown[]).length,
      content: {
        generatedCode: code,
        generationStatus: "ready",
        componentName: name,
      },
      durationInFrames: 150,
      transition: "fade",
    });

    return sceneId as string;
  } catch (err) {
    log(`  Add-as-scene error: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function removeScene(sceneId: string) {
  try {
    await convex.mutation(api.scenes.removeScenes, {
      sceneIds: [sceneId as Id<"scenes">],
    });
  } catch {}
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Custom Component Generation — E2E Test");
  console.log("  Repo: github.com/ostepan8/resume-tailoring-agent");
  console.log("═══════════════════════════════════════════════════════\n");

  // Step 1
  const detected = await listDetectedComponents();
  if (detected.length === 0) {
    console.log("❌ No detected components. Aborting.");
    process.exit(1);
  }

  // Clean up previous test runs
  const existing = (await convex.query(api.customComponents.list, {
    projectId: PROJECT_ID,
  })) as CustomComp[];
  if (existing.length > 0) {
    log(`Cleaning up ${existing.length} existing custom components...`);
    for (const c of existing) {
      await convex.mutation(api.customComponents.remove, {
        componentId: c._id,
      });
    }
  }
  console.log();

  // Test targets
  const targets = [
    {
      name: "Navbar",
      description:
        'Recreate the "Navbar" component. Show a horizontal navigation bar at the top ' +
        "with the Resume Tailor logo on the left, navigation links in the center " +
        "(Dashboard, Tailor, Resume), and a user avatar on the right. " +
        "Use EXACT brand colors: dark background #101820, orange accent #FF5C28, " +
        "cream text #F0F3EF, teal #3ED0C3. Font: Manrope. " +
        'Read "Navbar.tsx" and "Navbar.module.css" from the repo for reference.',
    },
    {
      name: "Dashboard Sidebar",
      description:
        'Recreate the "UnifiedSidebar" component. Show a vertical sidebar with navigation ' +
        "items: Overview, Profile, Resumes, Experience, Education, Projects, Skills, " +
        "Awards, Saved Jobs. Each item has an icon and label. Active item highlighted " +
        "with orange #FF5C28. Dark background #101820, cream text #F0F3EF. " +
        "Font: Manrope. Read UnifiedSidebar.tsx from the repo.",
    },
  ];

  // Step 2: Trigger
  log("Step 2: Triggering generation...\n");
  const results: TestResult[] = [];

  for (const t of targets) {
    log(`  Triggering "${t.name}"...`);
    const componentId = await triggerGeneration(t.name, t.description);
    log(`  → ID: ${componentId}`);
    results.push({
      name: t.name,
      componentId,
      status: "generating",
      codeLength: 0,
      qualityPassed: 0,
      qualityFailed: 0,
      compiled: false,
      addedAsScene: false,
      details: [],
    });
  }
  console.log();

  // Step 3: Poll
  log("Step 3: Polling for completion...\n");
  for (const r of results) {
    const comp = await pollCompletion(r.componentId);
    if (comp) {
      r.status = comp.status;
      r.codeLength = comp.code?.length || 0;
    } else {
      r.status = "timeout";
    }
    console.log();
  }

  // Step 4: Quality
  log("Step 4: Verifying code quality...\n");
  const readyComps = (await convex.query(api.customComponents.list, {
    projectId: PROJECT_ID,
  })) as CustomComp[];

  for (const r of results) {
    if (r.status !== "ready") {
      r.details.push(`  ❌ Not ready (${r.status})`);
      r.qualityFailed++;
      continue;
    }
    const comp = readyComps.find((c) => c._id === r.componentId);
    if (!comp) continue;
    const q = verifyCodeQuality(r.name, comp.code);
    r.qualityPassed = q.passed;
    r.qualityFailed = q.failed;
    r.details = q.details;
    for (const d of q.details) console.log(d);
    console.log();
  }

  // Step 5: Compile
  log("Step 5: Verifying compilation...\n");
  for (const r of results) {
    if (r.status !== "ready") continue;
    const comp = readyComps.find((c) => c._id === r.componentId);
    if (!comp) continue;
    r.compiled = verifyCompilation(comp.code);
    console.log(
      r.compiled
        ? `  ✅ "${r.name}" compiles successfully`
        : `  ❌ "${r.name}" compilation failed`,
    );
  }
  console.log();

  // Step 6: Add as scene
  log("Step 6: Testing add-as-scene...\n");
  for (const r of results) {
    if (!r.compiled) continue;
    const comp = readyComps.find((c) => c._id === r.componentId);
    if (!comp) continue;

    const sceneId = await addAsScene(r.name, comp.code);
    if (sceneId) {
      r.addedAsScene = true;
      console.log(`  ✅ "${r.name}" added as scene: ${sceneId}`);
      await removeScene(sceneId);
      console.log(`  ✅ Cleaned up test scene`);
    } else {
      console.log(`  ❌ "${r.name}" failed to add as scene`);
    }
  }
  console.log();

  // Summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("  TEST SUMMARY");
  console.log("═══════════════════════════════════════════════════════\n");

  let totalPass = 0;
  let totalFail = 0;

  for (const r of results) {
    const icon = r.status === "ready" && r.compiled ? "✅" : "❌";
    console.log(`  ${icon} ${r.name}`);
    console.log(`     Status:    ${r.status} (${r.codeLength} chars)`);
    console.log(`     Quality:   ${r.qualityPassed} passed, ${r.qualityFailed} failed`);
    console.log(`     Compiles:  ${r.compiled ? "yes" : "no"}`);
    console.log(`     Add Scene: ${r.addedAsScene ? "yes" : "no"}`);
    console.log();

    totalPass += r.qualityPassed + (r.compiled ? 1 : 0) + (r.addedAsScene ? 1 : 0);
    totalFail +=
      r.qualityFailed +
      (r.status === "ready" && !r.compiled ? 1 : 0) +
      (r.compiled && !r.addedAsScene ? 1 : 0);
  }

  const allGood = results.every(
    (r) => r.status === "ready" && r.compiled && r.addedAsScene,
  );

  console.log(`  TOTAL: ${totalPass} passed, ${totalFail} failed`);
  console.log(
    allGood
      ? "\n  🎉 All tests passed!"
      : "\n  ⚠ Some tests failed. Review output above.",
  );

  // Cleanup generated components
  for (const r of results) {
    try {
      await convex.mutation(api.customComponents.remove, {
        componentId: r.componentId as Id<"customComponents">,
      });
    } catch {}
  }

  process.exit(allGood ? 0 : 1);
}

main().catch((err) => {
  console.error("Test crashed:", err);
  process.exit(1);
});
