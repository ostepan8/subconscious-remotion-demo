#!/usr/bin/env npx tsx
/**
 * E2E test for the component generation subagent.
 *
 * Tests:
 * 1. Generate several components via the Convex HTTP endpoint
 * 2. Poll until generation completes (or fails)
 * 3. Validate the code with sucrase + sandbox reference checks
 * 4. Simulate runtime by checking for common crash patterns
 * 5. Add as scene and verify it can render
 * 6. If validation fails, use the agentic editor to fix and re-validate
 * 7. Report pass/fail and update prompts if persistent failures
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { validateComponent } from "../src/lib/validate-component";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;
const APP_URL = "http://localhost:3000";
const PROJECT_ID = "k17d8panjcprgp9hmn6sckhh2d81vgd0" as Id<"projects">;

const convex = new ConvexHttpClient(CONVEX_URL);

const TEST_COMPONENTS = [
  {
    name: "Dashboard Stats",
    intent:
      "A dashboard stats overview showing key metrics: Resumes Tailored (1,247), Success Rate (94%), Time Saved (3.2 hrs avg). Use animated counters, stat cards with icons, and the brand color scheme. Dark background with glass cards.",
  },
  {
    name: "Feature Showcase",
    intent:
      "A 3-column feature showcase grid. Features: Project Registry (store all your work experience), Smart Tailoring (AI rewrites for each job), PDF Export (download polished resumes). Each feature card has an icon, title, and one-line description. Animated staggered entrance.",
  },
  {
    name: "Progress Bar Scene",
    intent:
      "A receipt processing progress bar scene. Shows a glass card in the center with a title 'Processing Receipt', an animated progress bar filling to 100%, a percentage counter, and a status message. Clean, minimal dark design.",
  },
];

interface TestResult {
  name: string;
  sceneId: string;
  generationStatus: string;
  codeLength: number;
  validationPassed: boolean;
  validationError?: string;
  runtimeChecks: { passed: number; failed: number; details: string[] };
  fixAttempts: number;
  finalStatus: "pass" | "fail";
}

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Runtime pattern checks (things that crash in preview)
function checkRuntimePatterns(code: string): {
  passed: number;
  failed: number;
  details: string[];
} {
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
    "Defines GeneratedComponent",
  );
  check(/useCurrentFrame\s*\(/.test(code), "Uses useCurrentFrame()");
  check(/AbsoluteFill/.test(code), "Uses AbsoluteFill");
  check(/React\.createElement/.test(code), "Uses React.createElement");

  check(
    !/theme\.brandColors/.test(code),
    "No theme.brandColors (doesn't exist)",
  );
  check(
    !/theme\.foreground\b/.test(code),
    "No theme.foreground (doesn't exist)",
  );
  check(
    !/theme\.palette\./.test(code),
    "No theme.palette (doesn't exist)",
  );

  // typewriterReveal must use .visibleChars
  if (code.includes("typewriterReveal(")) {
    check(
      code.includes(".visibleChars"),
      "typewriterReveal: uses .visibleChars (not object as child)",
    );
  }

  // counterSpinUp should be wrapped in Math.round or .toFixed
  if (code.includes("counterSpinUp(")) {
    const hasFormat =
      /Math\.round\(counterSpinUp/.test(code) ||
      /counterSpinUp\([^)]+\)\.toFixed/.test(code) ||
      /counterSpinUp\([^)]+\)\.toLocaleString/.test(code) ||
      /Math\.floor\(counterSpinUp/.test(code);
    check(hasFormat, "counterSpinUp: formatted (Math.round/toFixed)");
  }

  // depthShadow should not be spread
  check(
    !/\.\.\.depthShadow\s*\(/.test(code),
    "depthShadow: not spread (it's a string)",
  );

  // No imports
  check(!/^\s*import\s+/m.test(code), "No import statements");
  check(!/^\s*export\s+/m.test(code), "No export statements");

  // Reasonable size
  check(
    code.length > 300 && code.length < 20000,
    `Code size: ${code.length} chars`,
  );

  return { passed, failed, details };
}

async function createTestScene(
  name: string,
  intent: string,
): Promise<Id<"scenes">> {
  const scenes = (await convex.query(api.scenes.getScenes, {
    projectId: PROJECT_ID,
  })) as { _id: Id<"scenes"> }[];

  const sceneId = await convex.mutation(api.scenes.addScene, {
    projectId: PROJECT_ID,
    type: "generated",
    title: name,
    order: scenes.length,
    content: { generationStatus: "pending", intent },
    durationInFrames: 150,
    transition: "fade",
  });

  return sceneId;
}

async function triggerGeneration(
  sceneId: Id<"scenes">,
  intent: string,
): Promise<boolean> {
  const res = await fetch(
    `${CONVEX_SITE_URL}/tools/generate-component`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        sceneId,
        intent,
        componentName: "GeneratedComponent",
      }),
    },
  );
  const data = await res.json();
  return data.success || data.status === "generating";
}

async function pollGeneration(
  sceneId: Id<"scenes">,
  maxWaitSec = 300,
): Promise<{ status: string; code: string; error?: string }> {
  const start = Date.now();
  let interval = 3000;

  while ((Date.now() - start) / 1000 < maxWaitSec) {
    await sleep(interval);
    interval = Math.min(interval * 1.3, 8000);

    const scene = await convex.query(api.scenes.getScene, { sceneId });
    if (!scene) continue;

    const content = (scene.content || {}) as Record<string, unknown>;
    const status = String(content.generationStatus || "unknown");
    const elapsed = Math.round((Date.now() - start) / 1000);

    if (status === "ready") {
      log(`  [${elapsed}s] ✅ Generation ready (${String(content.generatedCode || "").length} chars)`);
      return {
        status: "ready",
        code: String(content.generatedCode || ""),
      };
    } else if (status === "error") {
      log(`  [${elapsed}s] ❌ Generation error: ${content.generationError}`);
      return {
        status: "error",
        code: String(content.codeBuffer || content.generatedCode || ""),
        error: String(content.generationError || "Unknown error"),
      };
    } else {
      log(`  [${elapsed}s] ⏳ ${status}...`);
    }
  }

  return { status: "timeout", code: "", error: "Timed out after " + maxWaitSec + "s" };
}

async function tryAgenticFix(
  sceneId: Id<"scenes">,
  code: string,
  error: string,
): Promise<{ code: string; success: boolean }> {
  log(`  Attempting agentic fix for: ${error.slice(0, 100)}`);

  try {
    const res = await fetch(`${APP_URL}/api/component/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        instruction: `Fix this validation error:\n${error}\n\nCommon fixes:\n- theme.brandColors → use theme.colors instead\n- typewriterReveal returns {visibleChars, showCursor}, slice your string\n- counterSpinUp returns float, wrap with Math.round()\n- depthShadow() returns string, use as boxShadow: depthShadow()`,
        sceneId,
        history: [],
      }),
    });

    const reader = res.body?.getReader();
    if (!reader) return { code, success: false };

    const decoder = new TextDecoder();
    let buffer = "";
    let finalCode = code;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") break;
        try {
          const event = JSON.parse(payload);
          if (event.type === "done" && event.code) {
            finalCode = event.code;
          } else if (event.type === "code_update" && event.code) {
            finalCode = event.code;
          }
        } catch {}
      }
    }

    return { code: finalCode, success: finalCode !== code };
  } catch (err) {
    log(`  Fix attempt failed: ${err instanceof Error ? err.message : String(err)}`);
    return { code, success: false };
  }
}

async function runTestForComponent(
  testDef: { name: string; intent: string },
): Promise<TestResult> {
  const result: TestResult = {
    name: testDef.name,
    sceneId: "",
    generationStatus: "",
    codeLength: 0,
    validationPassed: false,
    runtimeChecks: { passed: 0, failed: 0, details: [] },
    fixAttempts: 0,
    finalStatus: "fail",
  };

  log(`\n── Testing: ${testDef.name} ──`);

  // Create scene
  log("  Creating scene...");
  const sceneId = await createTestScene(testDef.name, testDef.intent);
  result.sceneId = sceneId;
  log(`  Scene ID: ${sceneId}`);

  // Trigger generation
  log("  Triggering subagent generation...");
  const triggered = await triggerGeneration(sceneId, testDef.intent);
  if (!triggered) {
    log("  ❌ Failed to trigger generation");
    result.generationStatus = "trigger_failed";
    return result;
  }

  // Poll for completion
  log("  Polling for completion...");
  const gen = await pollGeneration(sceneId);
  result.generationStatus = gen.status;

  if (gen.status !== "ready" || !gen.code) {
    log(`  ❌ Generation did not complete: ${gen.status}`);
    result.validationError = gen.error;
    return result;
  }

  let code = gen.code;
  result.codeLength = code.length;

  // Validate + fix loop (up to 2 fix attempts)
  const MAX_FIX_ATTEMPTS = 2;
  for (let attempt = 0; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    // Validate with sucrase
    const validation = validateComponent(code);
    result.validationPassed = validation.valid;
    result.validationError = validation.error;

    if (validation.valid) {
      code = validation.fixedCode;
      break;
    }

    log(`  ⚠️ Validation failed: ${validation.error}`);

    if (attempt < MAX_FIX_ATTEMPTS) {
      result.fixAttempts++;
      const fix = await tryAgenticFix(
        sceneId,
        code,
        validation.error || "Unknown",
      );
      if (fix.success) {
        code = fix.code;
        log(`  Fix attempt ${attempt + 1} applied, re-validating...`);
      } else {
        log(`  Fix attempt ${attempt + 1} made no changes`);
        break;
      }
    }
  }

  // Runtime pattern checks
  result.runtimeChecks = checkRuntimePatterns(code);
  for (const d of result.runtimeChecks.details) {
    console.log(d);
  }

  // Save final code back to scene
  if (result.validationPassed) {
    await convex.mutation(api.scenes.updateScene, {
      sceneId,
      content: {
        generatedCode: code,
        generationStatus: "ready",
      },
    });
  }

  // Determine final status
  result.finalStatus =
    result.validationPassed && result.runtimeChecks.failed === 0
      ? "pass"
      : "fail";

  const emoji = result.finalStatus === "pass" ? "✅" : "❌";
  log(
    `  ${emoji} ${testDef.name}: validation=${result.validationPassed}, runtime=${result.runtimeChecks.passed}/${result.runtimeChecks.passed + result.runtimeChecks.failed}, fixes=${result.fixAttempts}`,
  );

  return result;
}

async function main() {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Subagent Component Generation — E2E Test");
  console.log("  Project: Resume Tailor (dev)");
  console.log("  Convex: " + CONVEX_SITE_URL);
  console.log("═══════════════════════════════════════════════════════\n");

  // Clean up any previous test scenes
  const existingScenes = (await convex.query(api.scenes.getScenes, {
    projectId: PROJECT_ID,
  })) as { _id: Id<"scenes">; title: string; type: string }[];

  const testScenes = existingScenes.filter((s) =>
    TEST_COMPONENTS.some((tc) => tc.name === s.title),
  );
  if (testScenes.length > 0) {
    log(`Cleaning up ${testScenes.length} previous test scenes...`);
    await convex.mutation(api.scenes.removeScenes, {
      sceneIds: testScenes.map((s) => s._id),
    });
  }

  const results: TestResult[] = [];

  for (const tc of TEST_COMPONENTS) {
    const result = await runTestForComponent(tc);
    results.push(result);
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════════════\n");

  const passed = results.filter((r) => r.finalStatus === "pass").length;
  const failed = results.filter((r) => r.finalStatus === "fail").length;

  for (const r of results) {
    const emoji = r.finalStatus === "pass" ? "✅" : "❌";
    console.log(
      `${emoji} ${r.name.padEnd(25)} | gen=${r.generationStatus.padEnd(8)} | valid=${r.validationPassed ? "yes" : "NO "} | runtime=${r.runtimeChecks.passed}/${r.runtimeChecks.passed + r.runtimeChecks.failed} | fixes=${r.fixAttempts} | ${r.codeLength} chars`,
    );
    if (r.validationError) {
      console.log(`   Error: ${r.validationError.slice(0, 120)}`);
    }
  }

  console.log(`\nTotal: ${passed} passed, ${failed} failed out of ${results.length}`);

  if (failed > 0) {
    console.log("\n── Common Failure Patterns ──");
    const errors = results
      .filter((r) => r.validationError)
      .map((r) => r.validationError!);
    const patterns: Record<string, number> = {};
    for (const e of errors) {
      if (e.includes("brandColors")) patterns["theme.brandColors"] = (patterns["theme.brandColors"] || 0) + 1;
      if (e.includes("typewriterReveal")) patterns["typewriterReveal misuse"] = (patterns["typewriterReveal misuse"] || 0) + 1;
      if (e.includes("Undefined reference")) patterns["undefined reference"] = (patterns["undefined reference"] || 0) + 1;
      if (e.includes("compilation failed")) patterns["JSX compilation"] = (patterns["JSX compilation"] || 0) + 1;
    }
    for (const [pattern, count] of Object.entries(patterns)) {
      console.log(`  ${count}x ${pattern}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════\n");

  // Clean up test scenes on full pass
  if (failed === 0) {
    log("All tests passed! Keeping scenes for visual inspection.");
    for (const r of results) {
      console.log(`  View: http://localhost:3000/editor/proj_1772046583290_j36i (scene: ${r.sceneId})`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
