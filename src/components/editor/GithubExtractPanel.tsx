"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface GithubExtractPanelProps {
  projectId: Id<"projects">;
  initialUrl?: string;
  initialExtract?: Record<string, unknown> | null;
}

export default function GithubExtractPanel({
  projectId,
  initialUrl,
  initialExtract,
}: GithubExtractPanelProps) {
  const [url, setUrl] = useState(initialUrl || "");
  const [extracting, setExtracting] = useState(false);
  const [status, setStatus] = useState("");
  const [extract, setExtract] = useState<Record<string, unknown> | null>(
    initialExtract || null
  );

  const media = useQuery(api.media.getMedia, { projectId });
  const saveMedia = useMutation(api.media.saveMedia);

  const runExtract = useCallback(async () => {
    if (!url.trim() || !url.includes("github.com")) return;
    setExtracting(true);
    setStatus("Starting extraction...");
    setExtract(null);

    try {
      const res = await fetch("/api/github/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: url.trim(), projectId }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "status" || event.type === "progress") {
              setStatus(event.message);
            } else if (event.type === "done") {
              setExtract(event.extract);
              setStatus("");
            } else if (event.type === "error") {
              setStatus(`Error: ${event.message}`);
            }
          } catch {
            // skip parse errors
          }
        }
      }
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setExtracting(false);
    }
  }, [url, projectId]);

  async function importImageAsMedia(imageUrl: string, name: string) {
    try {
      const res = await fetch("/api/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl, projectId, name }),
      });
      if (!res.ok) throw new Error("Upload failed");
    } catch {
      // fall through — importing remote URLs as media requires a proxy
      // For now, just note the URL is available in the extract
    }
  }

  const logoUrl = extract?.logoUrl as string | undefined;
  const ogImage = extract?.ogImage as string | undefined;
  const screenshotUrls = (extract?.screenshotUrls as string[]) || [];
  const features = (extract?.features as string[]) || [];
  const colors = extract?.colors as Record<string, string> | undefined;
  const liveUrl = extract?.liveUrl as string | undefined;
  const techStack = (extract?.techStack as string[]) || [];
  const additionalAssets = (extract?.additionalAssets as string[]) || [];
  const allImages = [
    ...(logoUrl ? [{ url: logoUrl, label: "Logo" }] : []),
    ...(ogImage ? [{ url: ogImage, label: "OG Image" }] : []),
    ...screenshotUrls.map((u, i) => ({ url: u, label: `Screenshot ${i + 1}` })),
    ...additionalAssets
      .filter((u) => /\.(png|jpg|jpeg|gif|svg|webp)/i.test(u))
      .map((u, i) => ({ url: u, label: `Asset ${i + 1}` })),
  ];

  return (
    <div className="flex flex-col h-full">
      <div
        className="px-3 py-2 border-b flex items-center gap-2"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white"
          style={{ background: "#333" }}
        >
          GH
        </div>
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          GitHub Extract
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* URL input */}
        <div>
          <div className="flex gap-1.5">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              disabled={extracting}
              className="flex-1 px-2 py-1.5 rounded-lg border text-xs outline-none disabled:opacity-50"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <button
              onClick={runExtract}
              disabled={extracting || !url.trim()}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
              style={{ background: "var(--brand-teal)" }}
            >
              {extracting ? "..." : "Extract"}
            </button>
          </div>
          {status && (
            <div
              className="text-[10px] mt-1.5 flex items-center gap-1.5"
              style={{ color: status.startsWith("Error") ? "#ef4444" : "var(--brand-teal)" }}
            >
              {extracting && (
                <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {status}
            </div>
          )}
        </div>

        {/* Results */}
        {extract && (
          <>
            {/* Product info */}
            {(extract.name || extract.tagline) && (
              <Section title="Product">
                {extract.name ? (
                  <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                    {String(extract.name)}
                  </p>
                ) : null}
                {extract.tagline ? (
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                    {String(extract.tagline)}
                  </p>
                ) : null}
                {extract.description ? (
                  <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
                    {String(extract.description).slice(0, 200)}
                  </p>
                ) : null}
              </Section>
            )}

            {/* Images found */}
            {allImages.length > 0 && (
              <Section title={`Images (${allImages.length})`}>
                <div className="grid grid-cols-2 gap-1.5">
                  {allImages.map((img, i) => (
                    <div
                      key={i}
                      className="rounded-lg border overflow-hidden group relative"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        className="w-full aspect-video object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div
                        className="px-1.5 py-1 flex items-center justify-between"
                        style={{ background: "var(--surface)" }}
                      >
                        <span
                          className="text-[9px] truncate"
                          style={{ color: "var(--foreground)" }}
                        >
                          {img.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Features */}
            {features.length > 0 && (
              <Section title={`Features (${features.length})`}>
                <ul className="space-y-0.5">
                  {features.map((f, i) => (
                    <li
                      key={i}
                      className="text-[11px] flex items-start gap-1"
                      style={{ color: "var(--foreground)" }}
                    >
                      <span style={{ color: "var(--brand-teal)" }}>•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Colors */}
            {colors && Object.keys(colors).length > 0 && (
              <Section title="Colors">
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(colors).map(([name, hex]) => (
                    <div key={name} className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{
                          background: hex,
                          borderColor: "var(--border-subtle)",
                        }}
                      />
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                        {name}: {hex}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Tech stack */}
            {techStack.length > 0 && (
              <Section title="Tech Stack">
                <div className="flex gap-1 flex-wrap">
                  {techStack.map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded border"
                      style={{
                        borderColor: "var(--border-subtle)",
                        color: "var(--foreground)",
                        background: "var(--background)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Live URL */}
            {liveUrl && (
              <Section title="Live Site">
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] underline"
                  style={{ color: "var(--brand-teal)" }}
                >
                  {liveUrl}
                </a>
              </Section>
            )}

            {/* Tip */}
            <div
              className="rounded-lg p-2 text-[10px]"
              style={{
                background: "rgba(255,92,40,0.06)",
                border: "1px solid rgba(255,92,40,0.12)",
                color: "var(--brand-orange)",
              }}
            >
              The AI agent now has this info. Ask it to "use the GitHub data" to
              build scenes from the extracted features, images, and branding.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg p-2"
      style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
    >
      <div
        className="text-[9px] font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: "var(--muted)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
