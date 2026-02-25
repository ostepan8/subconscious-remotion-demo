import { ConvexHttpClient } from "convex/browser";
import { Subconscious } from "subconscious";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { NextRequest, NextResponse } from "next/server";
import imageSize from "image-size";
import { SUBCONSCIOUS_ENGINE } from "@/lib/agent-config";

const GITHUB_HEADERS = {
  "User-Agent": "VideoCreator/1.0",
  Accept: "application/vnd.github.v3+json",
};

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
};

const IMAGE_EXTS = /\.(png|jpg|jpeg|gif|webp|avif|ico|svg)$/i;
const SKIP_DIRS =
  /^(node_modules|\.git|\.next|\.cache|dist|build|\.turbo|\.vercel|coverage)\//;
const MAX_REPO_IMAGES = 30;

const BADGE_DOMAINS = [
  "shields.io",
  "img.shields.io",
  "badgen.net",
  "badge.fury.io",
  "codecov.io",
  "coveralls.io",
  "travis-ci.org",
  "circleci.com",
];

function isBadgeUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return BADGE_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

function imagePathPriority(path: string): number {
  if (/^public\//i.test(path)) return 0;
  if (/^(assets|images|static|img)\//i.test(path)) return 1;
  if (/^(docs|screenshots)\//i.test(path)) return 2;
  if (!path.includes("/")) return 3;
  if (/^src\//i.test(path)) return 5;
  return 4;
}

function resolveGithubUrl(
  url: string,
  owner: string,
  repo: string,
  branch: string
): string {
  if (url.startsWith("http")) return url;
  let clean = url;
  if (clean.startsWith("./")) clean = clean.slice(2);
  if (clean.startsWith("/")) clean = clean.slice(1);
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${clean}`;
}

// --- GitHub API fetchers ---

interface RepoMeta {
  name: string;
  description: string;
  homepage: string;
  topics: string[];
  stargazers_count: number;
  language: string;
  default_branch: string;
}

async function fetchRepoMeta(
  owner: string,
  repo: string
): Promise<RepoMeta | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: GITHUB_HEADERS }
    );
    if (!res.ok) return null;
    const d = (await res.json()) as Record<string, unknown>;
    return {
      name: (d.name as string) || repo,
      description: (d.description as string) || "",
      homepage: (d.homepage as string) || "",
      topics: (d.topics as string[]) || [],
      stargazers_count: (d.stargazers_count as number) || 0,
      language: (d.language as string) || "",
      default_branch: (d.default_branch as string) || "main",
    };
  } catch {
    return null;
  }
}

async function fetchReadme(
  owner: string,
  repo: string
): Promise<string> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers: GITHUB_HEADERS }
    );
    if (!res.ok) return "";
    const data = (await res.json()) as { content?: string };
    if (!data.content) return "";
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

async function summarizeReadme(
  rawReadme: string,
  repoName: string,
  repoDescription: string,
): Promise<string> {
  const apiKey = process.env.SUBCONSCIOUS_API_KEY;
  if (!apiKey || !rawReadme.trim()) return rawReadme.slice(0, 2000);

  try {
    const client = new Subconscious({ apiKey });
    const prompt = `You are analyzing a GitHub repository's README to extract a concise product summary for a video production tool. The summary will be used by an AI agent to create marketing videos.

Repository: ${repoName}
${repoDescription ? `Description: ${repoDescription}` : ""}

README content:
\`\`\`
${rawReadme.slice(0, 6000)}
\`\`\`

Write a focused product summary (200-400 words) covering ONLY these:
1. **What it is** — One sentence describing the product/tool
2. **Who it's for** — Target audience
3. **Key Features** — 3-6 most important features (bullet points)
4. **Value Proposition** — Why someone would use this
5. **Tech Stack** — Key technologies (one line)

Rules:
- Skip installation instructions, setup steps, prerequisites, CLI commands
- Skip badges, contribution guidelines, license info
- Skip ASCII art diagrams and code examples
- Be concise and marketing-oriented
- Write in third person ("This app..." not "You can...")
- If the README is sparse, infer what you can from the structure`;

    const run = await client.run({
      engine: SUBCONSCIOUS_ENGINE,
      input: { instructions: prompt },
      options: { awaitCompletion: true },
    });

    const answer = run.result?.answer;
    if (!answer) return rawReadme.slice(0, 2000);

    return typeof answer === "string" ? answer : JSON.stringify(answer);
  } catch (e) {
    console.error("README summarization failed, using truncated raw:", e);
    return rawReadme.slice(0, 2000);
  }
}

async function discoverRepoImages(
  owner: string,
  repo: string,
  branch: string
): Promise<{ url: string; name: string }[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers: GITHUB_HEADERS }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      tree?: { type: string; path: string }[];
    };

    const results: { url: string; name: string; path: string }[] = [];

    for (const item of data.tree || []) {
      if (item.type !== "blob" || !IMAGE_EXTS.test(item.path)) continue;
      if (SKIP_DIRS.test(item.path)) continue;

      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;
      const fileName = item.path.split("/").pop() || item.path;
      results.push({ url: rawUrl, name: fileName, path: item.path });
    }

    results.sort(
      (a, b) => imagePathPriority(a.path) - imagePathPriority(b.path)
    );

    return results
      .slice(0, MAX_REPO_IMAGES)
      .map(({ url, name }) => ({ url, name }));
  } catch {
    return [];
  }
}

async function fetchOgImage(siteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(siteUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VideoCreator/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
      ) ||
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
      );
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// --- README parser ---

function parseReadme(
  readme: string,
  owner: string,
  repo: string,
  branch: string
) {
  const features: string[] = [];
  const colors: Record<string, string> = {};
  const techStack: string[] = [];
  const imageUrls: { url: string; name: string }[] = [];
  let liveUrl = "";
  let description = "";

  // ---- Images from markdown ----
  for (const m of readme.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    const alt = m[1] || "Image";
    const url = resolveGithubUrl(m[2].trim(), owner, repo, branch);
    if (url.startsWith("http") && !isBadgeUrl(url)) {
      imageUrls.push({ url, name: alt });
    }
  }
  for (const m of readme.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
    const url = resolveGithubUrl(m[1].trim(), owner, repo, branch);
    if (url.startsWith("http") && !isBadgeUrl(url)) {
      imageUrls.push({ url, name: "Image" });
    }
  }

  // ---- Section-based parsing ----
  const sections = readme.split(/^#{1,3}\s+/m);

  for (const section of sections) {
    const heading = section.split("\n")[0].toLowerCase();

    const bullets = [...section.matchAll(/^[-*]\s+\*{0,2}(.+)/gm)].map(
      (b) => b[1].replace(/\*\*/g, "").trim()
    );

    if (
      heading.includes("feature") ||
      heading.includes("how it works") ||
      heading.includes("capabilit") ||
      heading.includes("what it does") ||
      heading.includes("highlights")
    ) {
      for (const text of bullets) {
        if (text.length > 3) features.push(text);
      }
    }

    if (
      heading.includes("tech stack") ||
      heading.includes("built with") ||
      heading.includes("technolog") ||
      heading.includes("stack")
    ) {
      for (const text of bullets) {
        if (text.length > 1) techStack.push(text);
      }
    }
  }

  // ---- Colors (hex codes) ----
  const colorPatterns = [
    /\|\s*(\w[\w\s]*?)\s*\|\s*(#[0-9A-Fa-f]{6})\s*\|/g,
    /"(\w+)"\s*:\s*"(#[0-9A-Fa-f]{6})"/g,
    /["'](\w+)["']\s*[:=]\s*["'](#[0-9A-Fa-f]{6})["']/g,
  ];
  for (const pat of colorPatterns) {
    for (const m of readme.matchAll(pat)) {
      colors[m[1].trim().toLowerCase()] = m[2];
    }
  }

  // ---- Live URL ----
  const urlPatterns = [
    /https?:\/\/[\w.-]+\.vercel\.app\b[^\s)]*/,
    /https?:\/\/[\w.-]+\.netlify\.app\b[^\s)]*/,
    /https?:\/\/[\w.-]+\.pages\.dev\b[^\s)]*/,
    /https?:\/\/[\w.-]+\.herokuapp\.com\b[^\s)]*/,
    /https?:\/\/[\w.-]+\.fly\.dev\b[^\s)]*/,
    /https?:\/\/[\w.-]+\.railway\.app\b[^\s)]*/,
  ];
  for (const pat of urlPatterns) {
    const match = readme.match(pat);
    if (match) {
      liveUrl = match[0];
      break;
    }
  }

  // ---- Description (first paragraph after first heading) ----
  const lines = readme.split("\n");
  let pastHeading = false;
  for (const line of lines) {
    if (line.startsWith("#")) {
      pastHeading = true;
      continue;
    }
    if (!pastHeading) continue;
    const t = line.trim();
    if (!t) {
      if (description) break;
      continue;
    }
    if (/^[-*|`#]/.test(t) || /^```/.test(t)) {
      if (description) break;
      continue;
    }
    description += (description ? " " : "") + t;
  }

  return { features, colors, techStack, imageUrls, liveUrl, description };
}

// --- Image importer ---

async function importImage(
  imgUrl: string,
  name: string,
  projectId: string,
  convex: ConvexHttpClient
): Promise<boolean> {
  try {
    const res = await fetch(imgUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VideoCreator/1.0)",
      },
      redirect: "follow",
    });
    if (!res.ok) return false;

    let contentType = res.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      const ext = imgUrl.split(".").pop()?.split("?")[0]?.toLowerCase();
      if (ext && EXT_TO_MIME[ext]) {
        contentType = EXT_TO_MIME[ext];
      } else {
        return false;
      }
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024) return false;
    if (buffer.byteLength < 100) return false;

    let width: number | undefined;
    let height: number | undefined;
    if (contentType.startsWith("image/") && contentType !== "image/svg+xml") {
      try {
        const dims = imageSize(Buffer.from(buffer));
        if (dims.width && dims.height) {
          width = dims.width;
          height = dims.height;
        }
      } catch {
        // Non-fatal
      }
    }

    const uploadUrl = await convex.mutation(api.media.generateUploadUrl);
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: buffer,
    });

    if (!uploadRes.ok) return false;

    const { storageId } = (await uploadRes.json()) as {
      storageId: Id<"_storage">;
    };

    await convex.mutation(api.media.saveMedia, {
      projectId: projectId as Id<"projects">,
      name,
      type: "image",
      storageId,
      mimeType: contentType,
      size: buffer.byteLength,
      ...(width && height ? { width, height } : {}),
    });

    return true;
  } catch {
    return false;
  }
}

// --- Route handler ---

export async function POST(req: NextRequest) {
  const { githubUrl, projectId } = (await req.json()) as {
    githubUrl: string;
    projectId: string;
  };

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return NextResponse.json(
      { error: "Convex not configured" },
      { status: 500 }
    );
  }

  if (!githubUrl || !githubUrl.includes("github.com")) {
    return NextResponse.json(
      { error: "Please provide a valid GitHub URL" },
      { status: 400 }
    );
  }

  const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/\?#]+)/);
  if (!urlMatch) {
    return NextResponse.json(
      { error: "Could not parse GitHub URL" },
      { status: 400 }
    );
  }

  const [, owner, rawRepo] = urlMatch;
  const repo = rawRepo.replace(/\.git$/, "");

  const convex = new ConvexHttpClient(convexUrl);
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        send({ type: "status", message: "Fetching repository info..." });

        // Step 1: Fetch repo metadata + README in parallel
        const [meta, readme] = await Promise.all([
          fetchRepoMeta(owner, repo),
          fetchReadme(owner, repo),
        ]);

        if (!meta) {
          send({ type: "error", message: "Could not access repository" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        send({ type: "progress", message: "Parsing README..." });

        const parsed = parseReadme(
          readme,
          owner,
          repo,
          meta.default_branch
        );

        const siteUrl = meta.homepage || parsed.liveUrl;

        send({
          type: "progress",
          message: "Scanning files, summarizing README & checking live site...",
        });

        const [repoImages, readmeSummary, ogImage] = await Promise.all([
          discoverRepoImages(owner, repo, meta.default_branch),
          summarizeReadme(
            readme,
            meta.name || repo,
            meta.description || "",
          ),
          siteUrl
            ? fetchOgImage(
                siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`
              )
            : Promise.resolve(null),
        ]);

        // Step 5: Build the extract
        const extract: Record<string, unknown> = {
          name: meta.name,
          tagline: meta.description,
          description: parsed.description || meta.description,
          features: parsed.features,
          colors: parsed.colors,
          techStack:
            parsed.techStack.length > 0
              ? parsed.techStack
              : [meta.language].filter(Boolean),
          liveUrl: siteUrl || "",
          ogImage: ogImage || "",
          topics: meta.topics,
          targetAudience: "",
          keyMetrics: [`${meta.stargazers_count} stars on GitHub`],
        };

        // Step 6: Save extract to project
        send({ type: "progress", message: "Saving project data..." });

        try {
          await convex.mutation(api.projects.saveGithubExtract, {
            projectId: projectId as Id<"projects">,
            githubUrl,
            extract,
            readmeContent: readmeSummary || undefined,
          });
        } catch (e) {
          console.error("Failed to save extract:", e);
        }

        // Step 7: Collect all images to import (deduplicated)
        const allImages = new Map<string, string>();

        for (const img of repoImages) {
          allImages.set(img.url, img.name);
        }
        for (const img of parsed.imageUrls) {
          if (!allImages.has(img.url)) {
            allImages.set(img.url, img.name);
          }
        }
        if (ogImage && !allImages.has(ogImage)) {
          allImages.set(ogImage, "OG Image");
        }

        const imageList = Array.from(allImages.entries()).map(
          ([url, name]) => ({ url, name })
        );

        // Step 8: Import all images (batched in parallel)
        if (imageList.length > 0) {
          send({
            type: "importing_assets",
            message: `Importing ${imageList.length} assets...`,
          });

          let imported = 0;
          const IMPORT_BATCH = 5;

          for (let i = 0; i < imageList.length; i += IMPORT_BATCH) {
            const batch = imageList.slice(i, i + IMPORT_BATCH);
            const results = await Promise.all(
              batch.map((img) =>
                importImage(img.url, img.name, projectId, convex)
              )
            );

            for (let j = 0; j < results.length; j++) {
              if (results[j]) {
                imported++;
                send({
                  type: "asset_imported",
                  name: batch[j].name,
                  imported,
                  total: imageList.length,
                });
              }
            }
          }

          send({
            type: "status",
            message: `Imported ${imported} assets`,
          });
        }

        send({ type: "done", extract });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: msg })}\n\n`
          )
        );
        try {
          controller.close();
        } catch {
          /* already closed */
        }
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
