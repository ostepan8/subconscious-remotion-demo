import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { NextRequest, NextResponse } from "next/server";

const GITHUB_HEADERS = {
  "User-Agent": "VideoCreator/1.0",
  Accept: "application/vnd.github.v3+json",
};

const SKIP_DIRS = new RegExp(
  "^(node_modules|\\.git|\\.next|\\.cache|dist|build" +
  "|\\.turbo|\\.vercel|coverage|__tests__|__mocks__" +
  "|\\.storybook|\\.husky)/",
);

const COMPONENT_EXTS = /\.(tsx|jsx)$/i;
const STYLE_FILES =
  /\.(css|scss|sass)$/i;
const DESIGN_FILES = new RegExp(
  "^(tailwind\\.config\\.(ts|js|mjs|cjs)" +
  "|postcss\\.config\\.(ts|js|mjs|cjs)" +
  "|globals\\.css|app/globals\\.css" +
  "|styles/globals\\.css|src/styles/globals\\.css" +
  "|src/app/globals\\.css)$",
  "i",
);
const DESIGN_NAME_HINTS =
  /(theme|design|token|palette|colors|variables)\.(ts|js|css|json)$/i;

const BRAND_FILE_HINTS =
  /(brand|color|colour|style|ui|foundation|primitives|semantic)\.(ts|js|css|scss|json)$/i;

const TEST_PATTERNS = /\.(test|spec|stories|story)\.(tsx|jsx|ts|js)$/i;
const CONFIG_PATTERNS = /(next\.config|vite\.config|webpack\.config|tsconfig|eslint|prettier)/i;

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

const SKIP_FILENAME_SUFFIXES = [
  "-context", "-provider", "-providers",
  ".context", ".provider", ".providers",
  "-hook", "-hooks", ".hook", ".hooks",
];

const UTILITY_NAMES = new RegExp(
  "^(use[A-Z]|with[A-Z]|create[A-Z]|get[A-Z]" +
  "|format|parse|validate|util|helper|hook" +
  "|lib|api|service|store|slice|reducer|action" +
  "|type|interface|constant|config|env|setup|init)",
);

const HIGH_VALUE_NAMES = new RegExp(
  "^(hero|feature|pricing|testimonial|review|cta" +
  "|calltoaction|call-to-action|card|banner|navbar" +
  "|nav|header|footer|sidebar|section|landing" +
  "|showcase|comparison|faq|stat|counter|team" +
  "|about|contact|auth|login|signup|sign-up" +
  "|sign-in|onboarding|dashboard|step|wizard" +
  "|modal|dialog|toast|alert|badge|avatar" +
  "|profile|chart|grid|gallery|carousel|slider" +
  "|accordion|tab|toggle|switch|dropdown|menu" +
  "|search|filter|sort|pagination|table|list" +
  "|form|input|button|checkout|payment" +
  "|subscription|upload|editor|preview|player" +
  "|video|image|icon|logo|animation|particle" +
  "|background|gradient|glass|blur|skeleton" +
  "|placeholder|loading|spinner|progress|empty" +
  "|error|success|notification|popover|tooltip" +
  "|dock|stack|marquee|split|bento|timeline" +
  "|before-after|countdown|social|rating|price)",
  "i",
);

const VISUAL_DIR_PATTERNS = [
  /^(src\/)?(components|ui|sections|blocks|features|layouts|views)\//i,
  /^(src\/)?app\/.*\/components\//i,
  /^(src\/)?app\/.*components\//i,
];

const APP_PAGE_PATTERN = /^(src\/)?app\/(.*\/)?page\.(tsx|jsx)$/i;

// ---------------------------------------------------------------------------
// Scoring: higher = more likely to be a useful visual component
// ---------------------------------------------------------------------------

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

  // Skip files in api/ directories (not visual)
  if (/\bapi\b/i.test(path) && !/(component|ui|section)/i.test(path)) return -1;

  // Bonus for visual directory
  if (VISUAL_DIR_PATTERNS.some((p) => p.test(path))) score += 5;

  // Bonus for high-value component names
  if (HIGH_VALUE_NAMES.test(nameNoExt)) score += 8;

  // Bonus for PascalCase (typical React component naming)
  if (/^[A-Z]/.test(nameNoExt)) score += 2;

  // Bonus for "page" files in app directory (these are the actual pages)
  if (APP_PAGE_PATTERN.test(path)) score += 3;

  // Penalty for deeply nested paths (likely internal)
  const depth = path.split("/").length;
  if (depth > 6) score -= 2;

  // Penalty for generic names
  if (/^(index|main|app|root)\.tsx$/i.test(filename)) score -= 3;

  return Math.max(score, 0);
}

// ---------------------------------------------------------------------------
// Source code validation: check if file exports a React component
// ---------------------------------------------------------------------------

function isReactComponent(source: string): boolean {
  if (source.length < 20) return false;

  const jsxPattern = new RegExp(
    "<[A-Z][a-zA-Z]*[\\s/>]|</[A-Z]" +
    "|<div|<span|<p |<h[1-6]|<button|<input" +
    "|<form|<section|<main|<nav|<header" +
    "|<footer|<ul|<ol|<a ",
    "i",
  );
  const hasJSX = jsxPattern.test(source);
  const hasReturn =
    /return\s*\(/.test(source) ||
    /return\s*</.test(source) ||
    /=>\s*\(?\s*</.test(source);
  const hasExport =
    /export\s+(default\s+)?(function|const|class)\s/m.test(source);

  return hasJSX && (hasReturn || hasExport);
}

// ---------------------------------------------------------------------------
// Design file parsing
// ---------------------------------------------------------------------------

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

    const isColorProp =
      /color|bg|background|foreground|primary|secondary|accent|muted|border|surface/i
        .test(name);
    if (isColorProp) {
      if (/^#[0-9a-fA-F]{3,8}$/.test(value) || /^(rgb|hsl)/i.test(value)) {
        colors[name] = value;
      }
    }
  }

  for (const m of css.matchAll(/font-family\s*:\s*([^;]+)/g)) {
    const families = m[1]
      .split(",")
      .map((f) => f.trim().replace(/["']/g, ""));
    for (const f of families) {
      const skip =
        /system-ui|sans-serif|serif|monospace|inherit|var\(/
          .test(f);
      if (f && !f.startsWith("-") && !skip) {
        if (!fonts.includes(f)) fonts.push(f);
      }
    }
  }

  const fontImportRe =
    /@import\s+url\(['"]?[^)]*fonts\.googleapis\.com\/css2?\?family=([^&'")\s]+)/g;
  for (const m of css.matchAll(fontImportRe)) {
    const fontName = decodeURIComponent(m[1]).replace(/\+/g, " ").split(":")[0];
    if (fontName && !fonts.includes(fontName)) fonts.push(fontName);
  }

  return { colors, fonts, variables };
}

function extractDesignFromTailwind(source: string): {
  colors: Record<string, string>;
  borderRadius?: string;
  fonts: string[];
} {
  const colors: Record<string, string> = {};
  const fonts: string[] = [];

  for (const m of source.matchAll(/["']([a-zA-Z]+)["']\s*:\s*["'](#[0-9a-fA-F]{3,8})["']/g)) {
    colors[m[1]] = m[2];
  }

  for (const m of source.matchAll(/["']?fontFamily["']?\s*:\s*\{([^}]+)\}/g)) {
    for (const fm of m[1].matchAll(/["']([^"']+)["']/g)) {
      const f = fm[1];
      if (!f.startsWith("-") && !/system-ui|sans-serif|serif|monospace|inherit/.test(f)) {
        if (!fonts.includes(f)) fonts.push(f);
      }
    }
  }

  return { colors, fonts };
}

function classifyDesignStyle(colors: Record<string, string>, source: string): string {
  const allValues = Object.values(colors).join(" ") + " " + source;
  const isDark = /dark|#0[0-9a-f]{5}|#1[0-9a-f]{5}|rgb\(\s*[0-3]\d/i.test(allValues);
  const hasGradients = /gradient|linear-gradient|radial-gradient/i.test(source);
  const hasGlass = /glass|backdrop|blur/i.test(source);
  const hasNeon = /neon|glow|shadow.*color/i.test(source);

  if (isDark && hasNeon) return "dark-neon";
  if (isDark && hasGlass) return "glassmorphism";
  if (isDark && hasGradients) return "bold-gradient";
  if (isDark) return "dark-modern";
  if (hasGlass) return "glassmorphism";
  if (hasGradients) return "bold-gradient";
  return "minimal-modern";
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
  if (!res.ok) return [];
  const data = (await res.json()) as { tree?: { type: string; path: string }[] };
  return data.tree || [];
}

async function fetchDefaultBranch(owner: string, repo: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: GITHUB_HEADERS },
  );
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
// Component name extraction
// ---------------------------------------------------------------------------

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

function extractSourcePreview(source: string, maxLines = 12): string {
  return source
    .split("\n")
    .filter((l) => l.trim() !== "")
    .slice(0, maxLines)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Save component to Convex
// ---------------------------------------------------------------------------

async function saveComponent(
  convex: ConvexHttpClient,
  projectId: string,
  fileName: string,
  componentName: string,
  sourceCode: string,
): Promise<boolean> {
  try {
    const blob = new Blob([sourceCode], { type: "text/plain" });
    const uploadUrl = await convex.mutation(api.media.generateUploadUrl);
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: blob,
    });
    if (!uploadRes.ok) return false;

    const { storageId } = (await uploadRes.json()) as { storageId: Id<"_storage"> };

    const ext = fileName.match(/\.(\w+)$/)?.[1] || "tsx";
    const mimeMap: Record<string, string> = {
      jsx: "text/jsx", ts: "text/typescript", css: "text/css",
    };
    const mimeType = mimeMap[ext] || "text/tsx";

    await convex.mutation(api.media.saveMedia, {
      projectId: projectId as Id<"projects">,
      name: fileName,
      type: "component",
      storageId,
      mimeType,
      size: sourceCode.length,
      componentName,
      sourcePreview: extractSourcePreview(sourceCode),
    });

    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main route handler
// ---------------------------------------------------------------------------

const MAX_COMPONENTS = 20;
const MAX_CONCURRENT_FETCHES = 5;

export async function POST(req: NextRequest) {
  const { githubUrl, projectId } = (await req.json()) as {
    githubUrl: string;
    projectId: string;
  };

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
  }

  if (!githubUrl || !githubUrl.includes("github.com")) {
    return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
  }

  const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/\?#]+)/);
  if (!urlMatch) {
    return NextResponse.json({ error: "Could not parse GitHub URL" }, { status: 400 });
  }

  const [, owner, rawRepo] = urlMatch;
  const repo = rawRepo.replace(/\.git$/, "");
  const convex = new ConvexHttpClient(convexUrl);
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* stream closed */ }
      }

      try {
        send({ type: "status", message: "Scanning repository structure..." });

        const branch = await fetchDefaultBranch(owner, repo);
        const tree = await fetchRepoTree(owner, repo, branch);

        if (tree.length === 0) {
          send({ type: "error", message: "Could not access repository tree" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // --- Classify all files ---
        const componentCandidates: { path: string; score: number }[] = [];
        const designFilePaths: string[] = [];
        const styleFilePaths: string[] = [];
        const brandCandidateSet = new Set<string>();

        for (const item of tree) {
          if (item.type !== "blob") continue;
          if (SKIP_DIRS.test(item.path)) continue;

          const isDesignFile = DESIGN_FILES.test(item.path) || DESIGN_NAME_HINTS.test(item.path);
          const isBrandHint = BRAND_FILE_HINTS.test(item.path);
          const isStyleFile = STYLE_FILES.test(item.path);

          if (isDesignFile) {
            designFilePaths.push(item.path);
            brandCandidateSet.add(item.path);
          }

          if (isBrandHint) {
            brandCandidateSet.add(item.path);
          }

          if (isStyleFile) {
            styleFilePaths.push(item.path);
            brandCandidateSet.add(item.path);
          }

          if (!COMPONENT_EXTS.test(item.path)) continue;
          if (TEST_PATTERNS.test(item.path)) continue;
          if (CONFIG_PATTERNS.test(item.path)) continue;

          const score = scoreComponentFile(item.path);
          if (score >= 0) {
            componentCandidates.push({ path: item.path, score });
          }
        }

        componentCandidates.sort((a, b) => b.score - a.score);

        // Rank brand candidates: design files first, then brand hints, then style files
        const rankedBrandFiles = Array.from(brandCandidateSet).sort((a, b) => {
          const scoreFile = (p: string) => {
            let s = 0;
            if (DESIGN_FILES.test(p)) s += 10;
            if (DESIGN_NAME_HINTS.test(p)) s += 8;
            if (BRAND_FILE_HINTS.test(p)) s += 5;
            if (/tailwind/i.test(p)) s += 7;
            if (/globals?\.(css|scss)/i.test(p)) s += 6;
            if (p.split("/").length <= 3) s += 2;
            return s;
          };
          return scoreFile(b) - scoreFile(a);
        }).slice(0, 20);

        const msg =
          `Found ${componentCandidates.length} component candidates, ` +
          `${designFilePaths.length} design files, ` +
          `${rankedBrandFiles.length} brand candidates. Analyzing...`;
        send({ type: "progress", message: msg });

        // --- Design extraction (fetch all design files in parallel) ---
        send({ type: "progress", message: "Extracting design context..." });

        const allColors: Record<string, string> = {};
        const allFonts: string[] = [];
        const allVariables: Record<string, string> = {};
        let allDesignSource = "";

        const designPaths = [...designFilePaths, ...styleFilePaths.slice(0, 5)];
        const designResults = await Promise.all(
          designPaths.map(async (dp) => ({
            path: dp,
            content: await fetchFileContent(owner, repo, branch, dp),
          }))
        );

        for (const { path: dp, content } of designResults) {
          if (!content) continue;
          allDesignSource += content + "\n";

          if (/\.css$/i.test(dp)) {
            const { colors, fonts, variables } = extractDesignFromCSS(content);
            Object.assign(allColors, colors);
            Object.assign(allVariables, variables);
            for (const f of fonts) {
              if (!allFonts.includes(f)) allFonts.push(f);
            }
          }

          if (/tailwind/i.test(dp) || /\.(ts|js|json)$/i.test(dp)) {
            const { colors, fonts } = extractDesignFromTailwind(content);
            Object.assign(allColors, colors);
            for (const f of fonts) {
              if (!allFonts.includes(f)) allFonts.push(f);
            }
          }
        }

        const designStyle = classifyDesignStyle(allColors, allDesignSource);

        const colorCount = Object.keys(allColors).length;
        const fontCount = allFonts.length;
        const designNotes =
          `Detected ${colorCount} color tokens and ` +
          `${fontCount} font families. Style: ${designStyle}.`;
        const fontInfo = fontCount > 0
          ? { heading: allFonts[0], body: allFonts[1] || allFonts[0] }
          : undefined;
        const cssVars = Object.keys(allVariables).length > 0
          ? allVariables
          : undefined;

        try {
          await convex.mutation(api.projects.saveDesignContext, {
            projectId: projectId as Id<"projects">,
            designContext: {
              brandColors: allColors,
              fonts: fontInfo,
              designStyle,
              designNotes,
              cssVariables: cssVars,
            },
            brandCandidateFiles: rankedBrandFiles.length > 0
              ? rankedBrandFiles
              : undefined,
          });
          send({
            type: "design_extracted",
            message: `Extracted design context and ${rankedBrandFiles.length} brand candidate files`,
          });
        } catch {
          send({
            type: "progress",
            message: "Could not save design context (continuing)",
          });
        }

        // --- Component fetching and saving ---
        const topCandidates = componentCandidates.slice(0, MAX_COMPONENTS * 2);
        let savedCount = 0;

        // Fetch in batches to avoid overwhelming GitHub API
        for (let i = 0; i < topCandidates.length && savedCount < MAX_COMPONENTS; i += MAX_CONCURRENT_FETCHES) {
          const batch = topCandidates.slice(i, i + MAX_CONCURRENT_FETCHES);
          const results = await Promise.all(
            batch.map(async (c) => {
              const source = await fetchFileContent(owner, repo, branch, c.path);
              return { path: c.path, source, score: c.score };
            }),
          );

          for (const { path, source, score } of results) {
            if (savedCount >= MAX_COMPONENTS) break;
            if (!source) continue;
            if (!isReactComponent(source)) continue;
            if (source.length < 50 || source.length > 50000) continue;

            const filename = path.split("/").pop() || path;
            const componentName = extractComponentName(source, filename);

            send({
              type: "component_found",
              count: savedCount + 1,
              message: `Saving: ${componentName} (${filename})`,
              path,
              score,
            });

            const ok = await saveComponent(convex, projectId, filename, componentName, source);
            if (ok) savedCount++;
          }
        }

        send({
          type: "scan_complete",
          componentCount: savedCount,
          hasDesign: Object.keys(allColors).length > 0,
          message: `Scan complete: ${savedCount} components + design context`,
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        send({ type: "error", message: msg });
        try {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch { /* already closed */ }
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
