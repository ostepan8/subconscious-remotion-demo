/**
 * Test script for the deterministic component scanner.
 *
 * Usage:
 *   npx tsx scripts/test-scan-components.ts [githubUrl]
 *
 * Defaults to https://github.com/ostepan8/resume-tailoring-agent
 * Tests against any public GitHub repo without needing Convex/server running.
 */

const GITHUB_HEADERS = {
  "User-Agent": "VideoCreator/1.0",
  Accept: "application/vnd.github.v3+json",
};

const SKIP_DIRS =
  /^(node_modules|\.git|\.next|\.cache|dist|build|\.turbo|\.vercel|coverage|__tests__|__mocks__|\.storybook|\.husky)\//;
const COMPONENT_EXTS = /\.(tsx|jsx)$/i;
const STYLE_FILES = /\.(css|scss|sass)$/i;
const DESIGN_FILES =
  /^(tailwind\.config\.(ts|js|mjs|cjs)|postcss\.config\.(ts|js|mjs|cjs)|globals\.css|app\/globals\.css|styles\/globals\.css|src\/styles\/globals\.css|src\/app\/globals\.css)$/i;
const DESIGN_NAME_HINTS =
  /(theme|design|token|palette|colors|variables)\.(ts|js|css|json)$/i;
const TEST_PATTERNS = /\.(test|spec|stories|story)\.(tsx|jsx|ts|js)$/i;
const CONFIG_PATTERNS =
  /(next\.config|vite\.config|webpack\.config|tsconfig|eslint|prettier)/i;

const SKIP_FILENAMES = new Set([
  "layout.tsx", "layout.jsx",
  "loading.tsx", "loading.jsx",
  "error.tsx", "error.jsx",
  "not-found.tsx", "not-found.jsx",
  "middleware.tsx", "middleware.jsx",
  "providers.tsx", "providers.jsx",
  "provider.tsx", "provider.jsx",
  "context.tsx", "context.jsx",
]);

const SKIP_FILENAME_SUFFIXES = ["-context", "-provider", "-providers", ".context", ".provider", ".providers", "-hook", "-hooks", ".hook", ".hooks"];

const UTILITY_NAMES =
  /^(use[A-Z]|with[A-Z]|create[A-Z]|get[A-Z]|format|parse|validate|util|helper|hook|lib|api|service|store|slice|reducer|action|type|interface|constant|config|env|setup|init)/;

const HIGH_VALUE_NAMES =
  /^(hero|feature|pricing|testimonial|review|cta|calltoaction|call-to-action|card|banner|navbar|nav|header|footer|sidebar|section|landing|showcase|comparison|faq|stat|counter|team|about|contact|auth|login|signup|sign-up|sign-in|onboarding|dashboard|step|wizard|modal|dialog|toast|alert|badge|avatar|profile|chart|grid|gallery|carousel|slider|accordion|tab|toggle|switch|dropdown|menu|search|filter|sort|pagination|table|list|form|input|button|checkout|payment|subscription|upload|editor|preview|player|video|image|icon|logo|animation|particle|background|gradient|glass|blur|skeleton|placeholder|loading|spinner|progress|empty|error|success|notification|popover|tooltip|dock|stack|marquee|split|bento|timeline|before-after|countdown|social|rating|price)/i;

const VISUAL_DIR_PATTERNS = [
  /^(src\/)?(components|ui|sections|blocks|features|layouts|views)\//i,
  /^(src\/)?app\/.*\/components\//i,
  /^(src\/)?app\/.*components\//i,
];

const APP_PAGE_PATTERN = /^(src\/)?app\/(.*\/)?page\.(tsx|jsx)$/i;

function scoreComponentFile(path: string): number {
  const filename = path.split("/").pop() || "";
  const nameNoExt = filename.replace(/\.(tsx|jsx)$/i, "");
  let score = 0;

  if (SKIP_FILENAMES.has(filename.toLowerCase())) return -1;
  if (TEST_PATTERNS.test(filename)) return -1;
  if (CONFIG_PATTERNS.test(filename)) return -1;
  if (UTILITY_NAMES.test(nameNoExt)) return -1;
  const nameNoExtLower = nameNoExt.toLowerCase();
  if (SKIP_FILENAME_SUFFIXES.some((s) => nameNoExtLower.endsWith(s))) return -1;
  if (/\bapi\b/i.test(path) && !/(component|ui|section)/i.test(path)) return -1;

  if (VISUAL_DIR_PATTERNS.some((p) => p.test(path))) score += 5;
  if (HIGH_VALUE_NAMES.test(nameNoExt)) score += 8;
  if (/^[A-Z]/.test(nameNoExt)) score += 2;
  if (APP_PAGE_PATTERN.test(path)) score += 3;

  const depth = path.split("/").length;
  if (depth > 6) score -= 2;
  if (/^(index|main|app|root)\.tsx$/i.test(filename)) score -= 3;

  return Math.max(score, 0);
}

function isReactComponent(source: string): boolean {
  if (source.length < 20) return false;
  const hasJSX =
    /<[A-Z][a-zA-Z]*[\s/>]|<\/[A-Z]|<div|<span|<p |<h[1-6]|<button|<input|<form|<section|<main|<nav|<header|<footer|<ul|<ol|<a /i.test(
      source,
    );
  const hasReturn =
    /return\s*\(/.test(source) || /return\s*</.test(source) || /=>\s*\(?\s*</.test(source);
  const hasExport = /export\s+(default\s+)?(function|const|class)\s/m.test(source);

  return hasJSX && (hasReturn || hasExport);
}

function extractComponentName(source: string, filename: string): string {
  const patterns = [
    /export\s+default\s+function\s+(\w+)/,
    /export\s+default\s+class\s+(\w+)/,
    /export\s+(?:const|let)\s+(\w+)\s*[=:]/,
    /function\s+(\w+)\s*\(/,
    /const\s+(\w+)\s*[:=]\s*(?:\([^)]*\)|)\s*(?:=>|React)/,
  ];
  for (const re of patterns) {
    const m = source.match(re);
    if (m) {
      return m[1]
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
    }
  }
  const base = filename.replace(/\.[^.]+$/, "");
  return base.charAt(0).toUpperCase() + base.slice(1).replace(/([a-z])([A-Z])/g, "$1 $2");
}

function extractDesignFromCSS(css: string): {
  colors: Record<string, string>;
  fonts: string[];
  variables: Record<string, string>;
} {
  const colors: Record<string, string> = {};
  const fonts: string[] = [];
  const variables: Record<string, string> = {};

  for (const m of css.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;]+)/g)) {
    const name = m[1].trim();
    const value = m[2].trim();
    variables[`--${name}`] = value;

    if (
      /color|bg|background|foreground|primary|secondary|accent|muted|border|surface/i.test(name)
    ) {
      if (/^#[0-9a-fA-F]{3,8}$/.test(value) || /^(rgb|hsl)/i.test(value)) {
        colors[name] = value;
      }
    }
  }

  for (const m of css.matchAll(/font-family\s*:\s*([^;]+)/g)) {
    const families = m[1].split(",").map((f) => f.trim().replace(/["']/g, ""));
    for (const f of families) {
      if (
        f &&
        !f.startsWith("-") &&
        !/system-ui|sans-serif|serif|monospace|inherit|var\(/.test(f)
      ) {
        if (!fonts.includes(f)) fonts.push(f);
      }
    }
  }

  return { colors, fonts, variables };
}

// ---------------------------------------------------------------------------
// GitHub API
// ---------------------------------------------------------------------------

async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<{ type: string; path: string }[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: GITHUB_HEADERS },
  );
  if (!res.ok) {
    console.error(`  Failed to fetch tree: ${res.status} ${res.statusText}`);
    return [];
  }
  const data = (await res.json()) as { tree?: { type: string; path: string }[] };
  return data.tree || [];
}

async function fetchDefaultBranch(owner: string, repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: GITHUB_HEADERS,
  });
  if (!res.ok) return "main";
  const data = (await res.json()) as { default_branch?: string };
  return data.default_branch || "main";
}

async function fetchFileContent(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "VideoCreator/1.0" } });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

async function runTest(githubUrl: string) {
  console.log(`\n${ANSI.bold}${ANSI.cyan}=== Component Scanner Test ===${ANSI.reset}`);
  console.log(`${ANSI.dim}Repository: ${githubUrl}${ANSI.reset}\n`);

  const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/\?#]+)/);
  if (!urlMatch) {
    console.error(`${ANSI.red}Error: Could not parse GitHub URL${ANSI.reset}`);
    process.exit(1);
  }

  const [, owner, rawRepo] = urlMatch;
  const repo = rawRepo.replace(/\.git$/, "");

  // --- Step 1: Fetch branch & tree ---
  console.log(`${ANSI.dim}Fetching branch and tree...${ANSI.reset}`);
  const branch = await fetchDefaultBranch(owner, repo);
  const tree = await fetchRepoTree(owner, repo, branch);

  console.log(`  Branch: ${branch}`);
  console.log(`  Total files in tree: ${tree.filter((t) => t.type === "blob").length}\n`);

  if (tree.length === 0) {
    console.error(`${ANSI.red}Error: Empty tree${ANSI.reset}`);
    process.exit(1);
  }

  // --- Step 2: Classify files ---
  const componentCandidates: { path: string; score: number }[] = [];
  const designFilePaths: string[] = [];
  const styleFilePaths: string[] = [];
  const allTsx: string[] = [];
  const skippedFiles: { path: string; reason: string }[] = [];

  for (const item of tree) {
    if (item.type !== "blob") continue;
    if (SKIP_DIRS.test(item.path)) continue;

    if (DESIGN_FILES.test(item.path) || DESIGN_NAME_HINTS.test(item.path)) {
      designFilePaths.push(item.path);
    }

    if (STYLE_FILES.test(item.path)) {
      styleFilePaths.push(item.path);
    }

    if (!COMPONENT_EXTS.test(item.path)) continue;
    if (TEST_PATTERNS.test(item.path)) continue;
    if (CONFIG_PATTERNS.test(item.path)) continue;

    allTsx.push(item.path);

    const score = scoreComponentFile(item.path);
    if (score >= 0) {
      componentCandidates.push({ path: item.path, score });
    } else {
      const filename = item.path.split("/").pop() || "";
      const nameNoExt = filename.replace(/\.(tsx|jsx)$/i, "");
      const nameNoExtLower = nameNoExt.toLowerCase();
      let reason = "unknown";
      if (SKIP_FILENAMES.has(filename.toLowerCase())) reason = "skip-filename";
      else if (UTILITY_NAMES.test(nameNoExt)) reason = "utility-name";
      else if (SKIP_FILENAME_SUFFIXES.some((s) => nameNoExtLower.endsWith(s))) reason = "suffix-skip";
      else if (/\bapi\b/i.test(item.path) && !/(component|ui|section)/i.test(item.path)) reason = "api-directory";
      skippedFiles.push({ path: item.path, reason });
    }
  }

  componentCandidates.sort((a, b) => b.score - a.score);

  console.log(`${ANSI.bold}File Classification:${ANSI.reset}`);
  console.log(`  All .tsx/.jsx files:   ${allTsx.length}`);
  console.log(`  Component candidates:  ${componentCandidates.length}`);
  console.log(`  Skipped by rules:      ${skippedFiles.length}`);
  console.log(`  Design files:          ${designFilePaths.length}`);
  console.log(`  Style files:           ${styleFilePaths.length}\n`);

  // --- Step 3: Show design files ---
  if (designFilePaths.length > 0) {
    console.log(`${ANSI.bold}${ANSI.magenta}Design Files Found:${ANSI.reset}`);
    for (const f of designFilePaths) {
      console.log(`  ${ANSI.magenta}+${ANSI.reset} ${f}`);
    }
    console.log();
  }

  if (styleFilePaths.length > 0) {
    console.log(`${ANSI.bold}${ANSI.magenta}Style Files Found:${ANSI.reset}`);
    for (const f of styleFilePaths) {
      console.log(`  ${ANSI.magenta}+${ANSI.reset} ${f}`);
    }
    console.log();
  }

  // --- Step 4: Show skipped files ---
  if (skippedFiles.length > 0) {
    console.log(`${ANSI.bold}${ANSI.yellow}Skipped Files:${ANSI.reset}`);
    for (const { path, reason } of skippedFiles) {
      console.log(`  ${ANSI.yellow}x${ANSI.reset} ${path} ${ANSI.dim}(${reason})${ANSI.reset}`);
    }
    console.log();
  }

  // --- Step 5: Show scored candidates ---
  console.log(`${ANSI.bold}${ANSI.cyan}Component Candidates (sorted by score):${ANSI.reset}`);
  for (const c of componentCandidates) {
    const scoreColor = c.score >= 10 ? ANSI.green : c.score >= 5 ? ANSI.cyan : ANSI.dim;
    console.log(`  ${scoreColor}[${String(c.score).padStart(2)}]${ANSI.reset} ${c.path}`);
  }
  console.log();

  // --- Step 6: Fetch and validate top candidates ---
  const maxToFetch = Math.min(componentCandidates.length, 40);
  const topCandidates = componentCandidates.slice(0, maxToFetch);

  console.log(
    `${ANSI.bold}Fetching top ${topCandidates.length} files for validation...${ANSI.reset}\n`,
  );

  let validated = 0;
  let rejected = 0;
  const validComponents: { path: string; name: string; lines: number; score: number }[] = [];
  const rejectedComponents: { path: string; reason: string }[] = [];

  for (const c of topCandidates) {
    const source = await fetchFileContent(owner, repo, branch, c.path);
    if (!source) {
      rejectedComponents.push({ path: c.path, reason: "fetch-failed" });
      rejected++;
      continue;
    }

    if (source.length < 50) {
      rejectedComponents.push({ path: c.path, reason: `too-small (${source.length} bytes)` });
      rejected++;
      continue;
    }

    if (source.length > 50000) {
      rejectedComponents.push({ path: c.path, reason: `too-large (${source.length} bytes)` });
      rejected++;
      continue;
    }

    if (!isReactComponent(source)) {
      rejectedComponents.push({ path: c.path, reason: "not-react-component" });
      rejected++;
      continue;
    }

    const filename = c.path.split("/").pop() || c.path;
    const name = extractComponentName(source, filename);
    const lines = source.split("\n").length;
    validComponents.push({ path: c.path, name, lines, score: c.score });
    validated++;
  }

  console.log(`${ANSI.bold}${ANSI.green}Valid Components (would be saved):${ANSI.reset}`);
  for (const vc of validComponents) {
    console.log(
      `  ${ANSI.green}+${ANSI.reset} ${vc.name} ${ANSI.dim}(${vc.path}, ${vc.lines} lines, score: ${vc.score})${ANSI.reset}`,
    );
  }
  console.log();

  if (rejectedComponents.length > 0) {
    console.log(`${ANSI.bold}${ANSI.red}Rejected after fetch:${ANSI.reset}`);
    for (const rc of rejectedComponents) {
      console.log(`  ${ANSI.red}x${ANSI.reset} ${rc.path} ${ANSI.dim}(${rc.reason})${ANSI.reset}`);
    }
    console.log();
  }

  // --- Step 7: Design extraction test ---
  console.log(`${ANSI.bold}${ANSI.magenta}Design Extraction:${ANSI.reset}`);

  const allDesignContent: string[] = [];
  for (const dp of [...designFilePaths, ...styleFilePaths.slice(0, 5)]) {
    const content = await fetchFileContent(owner, repo, branch, dp);
    if (content) {
      allDesignContent.push(content);
      const { colors, fonts, variables } = extractDesignFromCSS(content);
      if (Object.keys(colors).length > 0 || fonts.length > 0 || Object.keys(variables).length > 0) {
        console.log(`  ${ANSI.magenta}File: ${dp}${ANSI.reset}`);
        if (Object.keys(colors).length > 0) {
          console.log(`    Colors: ${JSON.stringify(colors, null, 2).replace(/\n/g, "\n    ")}`);
        }
        if (fonts.length > 0) {
          console.log(`    Fonts: ${fonts.join(", ")}`);
        }
        if (Object.keys(variables).length > 0) {
          console.log(`    CSS Variables: ${Object.keys(variables).length} found`);
        }
      }
    }
  }
  console.log();

  // --- Summary ---
  console.log(`${ANSI.bold}=== SUMMARY ===${ANSI.reset}`);
  console.log(`  Total .tsx/.jsx found:        ${allTsx.length}`);
  console.log(`  Scored as candidates:         ${componentCandidates.length}`);
  console.log(`  Fetched and validated:        ${validated}`);
  console.log(`  Rejected after validation:    ${rejected}`);
  console.log(`  Design/style files:           ${designFilePaths.length + styleFilePaths.length}`);
  console.log();

  // --- Assertions ---
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string) {
    if (condition) {
      console.log(`  ${ANSI.green}PASS${ANSI.reset} ${label}`);
      passed++;
    } else {
      console.log(`  ${ANSI.red}FAIL${ANSI.reset} ${label}`);
      failed++;
    }
  }

  console.log(`${ANSI.bold}Assertions:${ANSI.reset}`);
  assert(tree.length > 0, "Repository tree is non-empty");
  assert(allTsx.length > 0, "Found at least one .tsx/.jsx file");
  assert(componentCandidates.length > 0, "Found at least one component candidate");
  assert(validated > 0, "At least one component validated successfully");
  assert(validated >= 3, "Found at least 3 valid components");
  assert(
    validComponents.some((v) => v.score >= 5),
    "At least one component scored >= 5 (high relevance)",
  );

  // Check that we're not skipping everything
  const skipRate = skippedFiles.length / allTsx.length;
  assert(skipRate < 0.8, `Skip rate (${(skipRate * 100).toFixed(0)}%) is below 80%`);

  // Check the validation rate
  const validRate = validated / topCandidates.length;
  assert(validRate > 0.2, `Validation rate (${(validRate * 100).toFixed(0)}%) is above 20%`);

  console.log(
    `\n${ANSI.bold}Result: ${passed}/${passed + failed} assertions passed${ANSI.reset}`,
  );

  if (failed > 0) {
    console.log(
      `\n${ANSI.red}${ANSI.bold}Some assertions failed. Review the output above.${ANSI.reset}`,
    );
    process.exit(1);
  } else {
    console.log(
      `\n${ANSI.green}${ANSI.bold}All assertions passed!${ANSI.reset}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

const url = process.argv[2] || "https://github.com/ostepan8/resume-tailoring-agent";
runTest(url).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
