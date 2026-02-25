"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import UploadModal from "./UploadModal";
import { getTheme } from "../video/themes";

interface PreviewItem {
  name: string;
  url: string;
  type: string;
  mimeType: string;
  width?: number;
  height?: number;
  sourcePreview?: string;
  componentName?: string;
}

interface MediaGalleryProps {
  projectId: Id<"projects">;
  isExtracting?: boolean;
  extractionStatus?: string;
  isScanning?: boolean;
  scanStatus?: string;
}

export default function MediaGallery({
  projectId,
  isExtracting,
  extractionStatus,
  isScanning,
  scanStatus,
}: MediaGalleryProps) {
  const media = useQuery(api.media.getMedia, { projectId });
  const project = useQuery(api.projects.getProjectById, { projectId });
  const deleteMedia = useMutation(api.media.deleteMedia);
  const [showUpload, setShowUpload] = useState(false);
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);

  const images = media?.filter((m) => m.type === "image") || [];
  const videos = media?.filter((m) => m.type === "video") || [];
  const audios = media?.filter((m) => m.type === "audio") || [];
  const components = media?.filter((m) => m.type === "component") || [];

  const proj = project as Record<string, unknown> | undefined;
  const readmeContent = proj?.readmeContent as string | undefined;
  const designContext = proj?.designContext as Record<string, unknown> | undefined;
  const hasAgentContext = !!(readmeContent || designContext);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Media
        </h3>
        <button
          onClick={() => setShowUpload(true)}
          className="text-xs px-2 py-1 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--brand-teal)" }}
        >
          + Upload
        </button>
      </div>

      {showUpload && (
        <UploadModal
          projectId={projectId}
          onClose={() => setShowUpload(false)}
        />
      )}

      {isExtracting && (
        <div
          className="px-3 py-2.5 border-b flex items-center gap-2.5"
          style={{
            borderColor: "var(--border-subtle)",
            background: "rgba(62,208,195,0.04)",
          }}
        >
          <div className="w-4 h-4 border-2 border-[var(--brand-teal)] border-t-transparent rounded-full animate-spin shrink-0" />
          <div className="min-w-0">
            <p
              className="text-[11px] font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Importing from GitHub
            </p>
            {extractionStatus && (
              <p
                className="text-[10px] truncate"
                style={{ color: "var(--brand-teal)" }}
              >
                {extractionStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {isScanning && (
        <div
          className="px-3 py-2.5 border-b flex items-center gap-2.5"
          style={{
            borderColor: "var(--border-subtle)",
            background: "rgba(255,92,40,0.04)",
          }}
        >
          <div className="w-4 h-4 border-2 border-[var(--brand-orange)] border-t-transparent rounded-full animate-spin shrink-0" />
          <div className="min-w-0">
            <p
              className="text-[11px] font-medium"
              style={{ color: "var(--foreground)" }}
            >
              AI scanning for components & design
            </p>
            {scanStatus && (
              <p
                className="text-[10px] truncate"
                style={{ color: "var(--brand-orange)" }}
              >
                {scanStatus}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {media === undefined ? (
          <div className="text-center py-6">
            <div className="w-5 h-5 mx-auto border-2 border-[var(--brand-orange)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : media.length === 0 && (isExtracting || isScanning) ? (
          <div className="p-1 space-y-3">
            {isExtracting && (
              <div className="grid grid-cols-2 gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden animate-pulse"
                    style={{ border: "1px solid var(--border-subtle)" }}
                  >
                    <div
                      className="w-full aspect-video"
                      style={{ background: "var(--surface)" }}
                    />
                    <div className="px-1.5 py-1" style={{ background: "var(--surface)" }}>
                      <div
                        className="h-2 rounded"
                        style={{
                          background: "var(--border-subtle)",
                          width: `${40 + i * 10}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isScanning && (
              <>
                <ComponentSkeletonSection />
              </>
            )}
          </div>
        ) : (
          <>
            <CustomComponentsSection
              projectId={projectId}
              repoComponents={components}
            />
            {hasAgentContext && (
              <AgentContextSection
                projectId={projectId}
                readmeContent={readmeContent}
                designContext={designContext}
              />
            )}
            {images.length > 0 && (
              <MediaSection
                title="Images"
                items={images}
                onDelete={(id) => deleteMedia({ mediaId: id })}
                onPreview={setPreviewItem}
              />
            )}
            {videos.length > 0 && (
              <MediaSection
                title="Video Clips"
                items={videos}
                onDelete={(id) => deleteMedia({ mediaId: id })}
                onPreview={setPreviewItem}
              />
            )}
            {audios.length > 0 && (
              <MediaSection
                title="Audio"
                items={audios}
                onDelete={(id) => deleteMedia({ mediaId: id })}
              />
            )}
          </>
        )}
      </div>

      {previewItem && (
        <MediaPreviewLightbox
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}

/* ---------- Media preview lightbox ---------- */

/* ---- Prop extraction from component source ---- */

const DEFAULT_CONTENT = JSON.stringify({
  headline: "Your Headline",
  subtext: "A brief description of what this does.",
  buttonText: "Get Started",
  bullets: ["First benefit", "Second benefit", "Third benefit"],
  features: [
    { title: "Feature One", description: "A great feature" },
    { title: "Feature Two", description: "Another great feature" },
    { title: "Feature Three", description: "Yet another feature" },
  ],
  steps: [
    { number: 1, title: "Step 1", description: "Do this first" },
    { number: 2, title: "Step 2", description: "Then do this" },
    { number: 3, title: "Step 3", description: "Finally, this" },
  ],
  stats: [
    { value: "10K+", label: "Users" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9★", label: "Rating" },
    { value: "150+", label: "Countries" },
  ],
  questions: [
    { question: "How does it work?", answer: "It works great." },
    { question: "Is it free?", answer: "Yes, there is a free tier." },
  ],
  items: [
    { label: "Speed", us: "Fast", them: "Slow" },
    { label: "Price", us: "$9/mo", them: "$29/mo" },
  ],
  cells: [
    { title: "Cell 1", description: "Description 1", size: "lg" },
    { title: "Cell 2", description: "Description 2", size: "sm" },
    { title: "Cell 3", description: "Description 3", size: "md" },
  ],
  milestones: [
    { year: "2023", title: "Founded", description: "Started the journey" },
    { year: "2024", title: "Launch", description: "Shipped v1.0" },
  ],
  members: [
    { name: "Alice", role: "CEO", initial: "A" },
    { name: "Bob", role: "CTO", initial: "B" },
  ],
  reviews: [
    { text: "Amazing product!", author: "Jane", stars: 5 },
    { text: "Works perfectly.", author: "John", stars: 4 },
  ],
  logos: ["Acme", "Globex", "Initech", "Umbrella"],
  before: { title: "Before", points: ["Slow", "Manual", "Error-prone"] },
  after: { title: "After", points: ["Fast", "Automated", "Reliable"] },
  quote: "This product changed everything for us.",
  author: "Jane Doe, CEO",
  price: "$19/mo",
  date: "2025-12-31",
  rating: 4.8,
  reviewCount: "2,400+",
  mediaUrl: "",
  layout: "centered",
}, null, 2);

const DEFAULT_THEME = JSON.stringify({
  id: "preview",
  name: "Preview",
  description: "",
  preview: "",
  colors: {
    background: "#0f0f17",
    surface: "#1a1a2e",
    primary: "#61dafb",
    secondary: "#a78bfa",
    text: "#e0e0e0",
    textMuted: "#8888a0",
    accent: "#f97316",
  },
  fonts: { heading: "system-ui", body: "system-ui" },
  transitions: { default: "fade" },
  borderRadius: 12,
}, null, 2);

function extractPropsFromSource(source: string): Record<string, string> {
  const props: Record<string, string> = {};

  // Try export default function first (highest priority)
  const exportDefaultMatch = source.match(
    /export\s+default\s+function\s+\w+\s*\(\s*\{([^}]+)\}/
  );
  // Then any function declaration
  const plainFuncMatch = source.match(
    /function\s+\w+\s*\(\s*\{([^}]+)\}/
  );
  // Then arrow function: const X = ({ ... }) =>
  const arrowMatch = source.match(
    /(?:const|let)\s+\w+\s*(?::\s*\w+)?\s*=\s*\(\s*\{([^}]+)\}/
  );

  const destructuredMatch = exportDefaultMatch || plainFuncMatch || arrowMatch;

  if (destructuredMatch) {
    const inner = destructuredMatch[1];
    if (!inner) return props;
    const propNames = inner
      .split(",")
      .map((p) => p.trim().split(/\s*[=:]/)[0].trim())
      .filter((p) => p && !p.startsWith("//") && !p.startsWith("/*") && /^\w+$/.test(p));
    for (const name of propNames) {
      if (name === "content") {
        props[name] = DEFAULT_CONTENT;
      } else if (name === "theme") {
        props[name] = DEFAULT_THEME;
      } else {
        props[name] = `"${name}"`;
      }
    }
    return props;
  }

  const propsArgMatch = source.match(
    /(?:export\s+default\s+)?function\s+\w+\s*\(\s*(\w+)\s*[,:)]/
  );
  if (propsArgMatch && propsArgMatch[1] !== "props") return props;
  if (propsArgMatch) {
    props["props"] = JSON.stringify({ placeholder: "value" }, null, 2);
  }

  return props;
}

/* ---- Import parser + auto-mock generator ---- */

const ALREADY_MOCKED = new Set([
  "React", "ReactDOM",
  "useState", "useEffect", "useRef", "useMemo", "useCallback",
  "useContext", "createContext", "useReducer", "useLayoutEffect",
  "forwardRef", "memo", "Children", "cloneElement", "isValidElement",
  "useCurrentFrame", "useVideoConfig", "interpolate", "spring", "Easing",
  "Sequence", "AbsoluteFill", "Img", "OffthreadVideo", "Audio", "Video",
  "staticFile", "continueRender", "delayRender",
  "useNoise2D", "useNoise3D",
  "TransitionSeries", "linearTiming", "springTiming", "fade", "slide", "wipe",
  "fadeInBlur", "fadeInUp", "scaleIn", "slideFromLeft", "slideFromRight",
  "glowPulse", "revealLine", "animatedNumber", "typewriterReveal",
  "counterSpinUp", "horizontalWipe", "parallaxLayer", "fadeOutDown",
  "animatedMeshBg", "staggerEntrance", "floatY", "scanLineStyle",
  "breathe", "glowBorderStyle", "themedHeadlineStyle", "themedButtonStyle",
  "meshGradientStyle", "gridPatternStyle", "noiseOverlayStyle",
  "glowOrbStyle", "glassSurface", "glassCard", "depthShadow",
  "gradientText", "accentColor", "shimmerStyle",
  "isThemeDark", "mergeThemeWithOverrides",
  "easings", "spacing", "typography", "typo", "getTypography",
  "MockupPlaceholder",
  "Fragment", "h",
]);

interface ParsedImport {
  name: string;
  source: string;
  isDefault: boolean;
}

function parseImports(source: string): ParsedImport[] {
  const results: ParsedImport[] = [];
  const importRe = /^import\s+(?!type\s)([\s\S]+?)\s+from\s+['"](.*?)['"]/gm;
  let m: RegExpExecArray | null;

  while ((m = importRe.exec(source))) {
    const clause = m[1].replace(/\n/g, " ");
    const src = m[2];

    // Default import: import Foo from '...'
    const defaultMatch = clause.match(/^(\w+)/);
    if (defaultMatch && !clause.startsWith("{")) {
      results.push({ name: defaultMatch[1], source: src, isDefault: true });
    }

    // Named imports: import { A, B as C } from '...'
    const namedMatch = clause.match(/\{([^}]+)\}/);
    if (namedMatch) {
      const names = namedMatch[1].split(",").map((n) => {
        const parts = n.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      }).filter((n) => n && /^\w+$/.test(n));
      for (const name of names) {
        results.push({ name, source: src, isDefault: false });
      }
    }
  }

  return results;
}

function generateAutoMock(imp: ParsedImport): string {
  const { name, source } = imp;

  if (ALREADY_MOCKED.has(name)) return "";

  // CSS modules → proxy returning key as classname
  if (source.match(/\.module\.(css|scss|less|sass)/) || name === "styles") {
    return `var ${name} = new Proxy({}, { get: (_, k) => typeof k === 'string' ? k : '' });`;
  }

  // Next.js Link → renders as <a>
  if (name === "Link" && source.includes("next")) {
    return `var Link = function(p) { return React.createElement('a', { href: p.href || '#', style: p.style, className: p.className }, p.children); };`;
  }

  // Next.js Image → renders as <img>
  if (name === "Image" && source.includes("next")) {
    return `var Image = function(p) { return React.createElement('img', { src: p.src || '', alt: p.alt || '', width: p.width, height: p.height, style: Object.assign({ maxWidth: '100%' }, p.style || {}) }); };`;
  }

  // Hooks (use*) → return safe defaults
  if (name.match(/^use[A-Z]/)) {
    return `var ${name} = function() { return { data: null, error: null, loading: false, isLoaded: true, isSignedIn: false, user: null, profile: null, signOut: function(){}, isConfigured: true }; };`;
  }

  // PascalCase → treat as component (renders children or name)
  if (name[0] === name[0].toUpperCase() && name[0] !== name[0].toLowerCase()) {
    return `var ${name} = function(p) { return React.createElement('div', { style: p?.style, className: p?.className, 'data-mock': '${name}' }, p?.children != null ? p.children : '${name}'); };`;
  }

  // camelCase function or constant
  return `var ${name} = function() { return null; };`;
}

function generateAllAutoMocks(source: string): string {
  const imports = parseImports(source);
  const mocks: string[] = [];
  const seen = new Set<string>();

  for (const imp of imports) {
    if (seen.has(imp.name) || ALREADY_MOCKED.has(imp.name)) continue;
    seen.add(imp.name);
    const mock = generateAutoMock(imp);
    if (mock) mocks.push(mock);
  }

  return mocks.join("\n");
}

/* ---- Build sandboxed iframe srcdoc ---- */

function buildComponentSrcdoc(
  source: string,
  componentName: string,
  propsJson: Record<string, string>,
): string {
  const autoMocks = generateAllAutoMocks(source);

  const cleaned = source
    .replace(/^import\s+type\s[\s\S]*?from\s+['"].*?['"]\s*;?\s*$/gm, "")
    .replace(/^import\s[\s\S]*?from\s+['"].*?['"]\s*;?\s*$/gm, "")
    .replace(/^import\s+['"].*?['"]\s*;?\s*$/gm, "")
    .replace(/^export\s+default\s+/gm, "var __default__ = ")
    .replace(/^export\s+(const|let)\s+/gm, "var ")
    .replace(/^export\s+/gm, "")
    .replace(/['"]use client['"]\s*;?/g, "")
    .replace(/['"]use server['"]\s*;?/g, "");

  const propsEntries = Object.entries(propsJson)
    .map(([k, v]) => `${JSON.stringify(k)}: ${v}`)
    .join(",\n      ");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0f0f17;
    color: #e0e0e0;
    min-height: 100vh;
  }
  #root { width: 100%; height: 100vh; position: relative; overflow: hidden; }
  .error-box {
    color: #f38ba8; font-size: 13px; padding: 16px;
    background: rgba(243,139,168,0.08);
    border: 1px solid rgba(243,139,168,0.2);
    border-radius: 8px; white-space: pre-wrap; font-family: monospace;
    margin: 24px; max-height: 80vh; overflow: auto;
  }
</style>
<script crossorigin="anonymous" src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
<script crossorigin="anonymous" src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
<script crossorigin="anonymous" src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
<script>
// ---- Global error handler — catches EVERYTHING ----
window.onerror = function(msg, src, line, col, err) {
  var el = document.getElementById('root');
  if (el) el.innerHTML = '<div class="error-box">Error: ' + String(msg) + '\\nLine: ' + line + (err && err.stack ? '\\n\\n' + err.stack : '') + '</div>';
  return true;
};
window.addEventListener('unhandledrejection', function(e) {
  var el = document.getElementById('root');
  if (el) el.innerHTML = '<div class="error-box">Unhandled promise rejection:\\n' + String(e.reason) + '</div>';
});
</script>
<script>
// ---- Universal import mocking system ----
var { createElement: h, Fragment } = React;
var {
  useState, useEffect, useRef, useMemo, useCallback,
  useContext, createContext, useReducer, useLayoutEffect,
  forwardRef, memo, Children, cloneElement, isValidElement,
} = React;

// ---- Remotion mocks ----
var __frame = 30;
var useCurrentFrame = function() { return __frame; };
var useVideoConfig = function() {
  return { fps: 30, durationInFrames: 150, width: 1920, height: 1080 };
};
var interpolate = function(input, inputRange, outputRange, options) {
  var clamped = options && (options.extrapolateRight === 'clamp' || options.extrapolateLeft === 'clamp');
  if (inputRange.length === 2) {
    var t = (input - inputRange[0]) / (inputRange[1] - inputRange[0]);
    if (clamped) t = Math.max(0, Math.min(1, t));
    return outputRange[0] + t * (outputRange[1] - outputRange[0]);
  }
  // Multi-stop interpolation
  for (var i = 0; i < inputRange.length - 1; i++) {
    if (input <= inputRange[i + 1] || i === inputRange.length - 2) {
      var t2 = (input - inputRange[i]) / (inputRange[i+1] - inputRange[i]);
      if (clamped) t2 = Math.max(0, Math.min(1, t2));
      return outputRange[i] + t2 * (outputRange[i+1] - outputRange[i]);
    }
  }
  return outputRange[outputRange.length - 1];
};
var Easing = {
  bezier: function() { return function(t) { return t; }; },
  in: function(e) { return e || function(t) { return t; }; },
  out: function(e) { return e || function(t) { return t; }; },
  inOut: function(e) { return e || function(t) { return t; }; },
  linear: function(t) { return t; },
  ease: function(t) { return t; },
  cubic: function(t) { return t; },
  quad: function(t) { return t; },
};
var spring = function() { return 1; };
var Sequence = function(p) {
  return h('div', { style: { position: 'relative', width: '100%', height: '100%' } }, p.children);
};
var AbsoluteFill = function(p) {
  var s = Object.assign({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', flexDirection: 'column' }, p.style || {});
  return h('div', { style: s }, p.children);
};
var Img = function(p) {
  var fallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#333" width="400" height="300"/><text x="200" y="150" fill="#888" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="16">Image</text></svg>');
  return h('img', { src: p.src || fallback, style: Object.assign({ maxWidth: '100%' }, p.style || {}), alt: '' });
};
var OffthreadVideo = function(p) {
  return h('div', { style: Object.assign({ background: '#222', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#888', fontSize: 14, minHeight: 120 }, p.style || {}) },
    'Video: ' + (p.src || 'no source'));
};
var Audio = function() { return null; };
var Video = OffthreadVideo;
var staticFile = function(p) { return p; };
var continueRender = function() {};
var delayRender = function() { return 0; };

// Noise mock
var useNoise2D = function() { return function() { return 0.5; }; };
var useNoise3D = function() { return function() { return 0.5; }; };

// Transitions mock
var TransitionSeries = function(p) { return h('div', null, p.children); };
TransitionSeries.Sequence = Sequence;
TransitionSeries.Transition = function() { return null; };
var linearTiming = function() { return {}; };
var springTiming = function() { return {}; };
var fade = function() { return {}; };
var slide = function() { return {}; };
var wipe = function() { return {}; };
</script>
</head>
<body>
<div id="root"></div>
<script type="text/plain" id="__src">
// ---- Type stubs ----
type VideoTheme = any;
type SceneContent = any;
type SceneType = string;
type SceneLayout = string;
type SceneStyleOverrides = any;
type CSSProperties = any;

// ---- Shared animation/style mocks (matching ./shared.ts) ----

const fadeInBlur = (frame: number, delay: number, dur = 22) => {
  const o = interpolate(frame, [delay, delay + dur], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const blur = interpolate(frame, [delay, delay + dur], [16, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const y = interpolate(frame, [delay, delay + dur], [24, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return { opacity: o, transform: \`translateY(\${y}px)\`, filter: \`blur(\${blur}px)\` };
};
const fadeInUp = (frame: number, delay: number, distance = 40, dur = 20) => {
  const o = interpolate(frame, [delay, delay + dur], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const y = interpolate(frame, [delay, delay + dur], [distance, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return { opacity: o, transform: \`translateY(\${y}px)\` };
};
const scaleIn = (frame: number, delay: number, dur = 18) => {
  const o = interpolate(frame, [delay, delay + dur], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const s = interpolate(frame, [delay, delay + dur], [0.7, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return { opacity: o, transform: \`scale(\${s})\` };
};
const slideFromLeft = (frame: number, delay: number, distance = 60, dur = 20) => {
  const o = interpolate(frame, [delay, delay + dur], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const x = interpolate(frame, [delay, delay + dur], [-distance, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return { opacity: o, transform: \`translateX(\${x}px)\` };
};
const slideFromRight = (frame: number, delay: number, distance = 60, dur = 20) => {
  const o = interpolate(frame, [delay, delay + dur], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const x = interpolate(frame, [delay, delay + dur], [distance, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return { opacity: o, transform: \`translateX(\${x}px)\` };
};
const glowPulse = (frame: number, delay: number, color: string) => {
  const o = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return { opacity: o, boxShadow: \`0 0 30px \${color}40\` };
};
const revealLine = (frame: number, delay: number, dur = 16) => {
  const w = interpolate(frame, [delay, delay + dur], [0, 100], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return { width: \`\${w}%\` };
};
const animatedNumber = (frame: number, delay: number, targetStr: string, dur = 24) => {
  const numMatch = targetStr.match?.(/([\d,.]+)/);
  if (!numMatch) return targetStr;
  const numVal = parseFloat(numMatch[1].replace(/,/g, ''));
  if (isNaN(numVal)) return targetStr;
  const current = interpolate(frame, [delay, delay + dur], [0, numVal], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const hasDecimal = numMatch[1].includes('.');
  const formatted = hasDecimal ? current.toFixed(1) : Math.round(current).toLocaleString();
  return targetStr.replace(numMatch[1], formatted);
};
const typewriterReveal = (frame: number, delay: number, totalChars: number, dur = 30) => {
  const progress = interpolate(frame, [delay, delay + dur], [0, totalChars], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return { visibleChars: Math.floor(progress), showCursor: frame >= delay };
};
const counterSpinUp = (frame: number, delay: number, target: number, dur = 28) => {
  if (frame < delay) return 0;
  if (frame >= delay + dur) return target;
  return interpolate(frame, [delay, delay + dur], [0, target], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
};
const horizontalWipe = (frame: number, delay: number, dur = 20, direction = 'left') => {
  const p = interpolate(frame, [delay, delay + dur], [0, 100], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return { clipPath: direction === 'left' ? \`inset(0 \${100-p}% 0 0)\` : \`inset(0 0 0 \${100-p}%)\` };
};
const parallaxLayer = (frame: number, speed = 0.3, direction = 'up') => {
  const offset = frame * speed;
  const transforms: Record<string,string> = { up: \`translateY(-\${offset}px)\`, down: \`translateY(\${offset}px)\`, left: \`translateX(-\${offset}px)\`, right: \`translateX(\${offset}px)\` };
  return { transform: transforms[direction] || '' };
};
const fadeOutDown = (frame: number, startFrame: number, dur = 18, distance = 40) => {
  const o = interpolate(frame, [startFrame, startFrame + dur], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const y = interpolate(frame, [startFrame, startFrame + dur], [0, distance], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return { opacity: o, transform: \`translateY(\${y}px)\` };
};

const animatedMeshBg = (frame: number, theme: any) => {
  const x1 = interpolate(frame, [0, 120], [20, 35], { extrapolateRight: 'clamp' });
  const y1 = interpolate(frame, [0, 90], [30, 45], { extrapolateRight: 'clamp' });
  const x2 = interpolate(frame, [0, 100], [80, 65], { extrapolateRight: 'clamp' });
  const y2 = interpolate(frame, [0, 110], [70, 55], { extrapolateRight: 'clamp' });
  const p = theme?.colors?.primary || '#61dafb';
  const a = theme?.colors?.accent || '#f97316';
  const s = theme?.colors?.secondary || '#a78bfa';
  return {
    position: 'absolute' as const, inset: 0,
    background: [
      \`radial-gradient(ellipse 80% 50% at \${x1}% \${y1}%, \${p}28 0%, transparent 60%)\`,
      \`radial-gradient(ellipse 60% 70% at \${x2}% \${y2}%, \${a}22 0%, transparent 55%)\`,
      \`radial-gradient(ellipse 90% 40% at 50% 0%, \${s}18 0%, transparent 50%)\`,
    ].join(', '),
  };
};
const staggerEntrance = (frame: number, index: number, baseDelay: number, spacingVal = 10) => {
  const delay = baseDelay + index * spacingVal;
  const variant = index % 4;
  if (variant === 0) return fadeInUp(frame, delay, 35, 22);
  if (variant === 1) return slideFromLeft(frame, delay, 45, 22);
  if (variant === 2) return scaleIn(frame, delay, 22);
  return slideFromRight(frame, delay, 45, 22);
};
const floatY = (frame: number, amplitude = 6, speed = 0.05, phase = 0) => {
  const y = Math.sin((frame + phase) * speed) * amplitude;
  return { transform: \`translateY(\${y}px)\` };
};
const scanLineStyle = (frame: number, delay: number, color: string, dur = 40) => {
  const pos = interpolate(frame, [delay, delay + dur], [-5, 105], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const opacity = interpolate(frame, [delay, delay + 8, delay + dur - 8, delay + dur], [0, 0.7, 0.7, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return {
    position: 'absolute' as const, left: 0, right: 0, top: \`\${pos}%\`, height: 2,
    background: \`linear-gradient(90deg, transparent 0%, \${color} 30%, \${color} 70%, transparent 100%)\`,
    boxShadow: \`0 0 20px \${color}60, 0 0 60px \${color}30\`, opacity, pointerEvents: 'none' as const, zIndex: 10,
  };
};
const breathe = (frame: number, speed = 0.04, amount = 0.008, phase = 0) => {
  const s = 1 + Math.sin((frame + phase) * speed) * amount;
  return { transform: \`scale(\${s})\` };
};
const glowBorderStyle = (frame: number, color: string, delay = 0) => {
  const angle = interpolate(frame, [delay, delay + 120], [0, 360], { extrapolateRight: 'clamp' });
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return {
    position: 'absolute' as const, inset: -1, borderRadius: 'inherit',
    background: \`conic-gradient(from \${angle}deg, transparent 0%, \${color}40 25%, transparent 50%, \${color}25 75%, transparent 100%)\`,
    opacity, pointerEvents: 'none' as const, zIndex: -1,
  };
};
const themedHeadlineStyle = (theme: any) => ({
  background: \`linear-gradient(135deg, \${theme?.colors?.text || '#fff'}, \${theme?.colors?.primary || '#61dafb'})\`,
  backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent',
});
const themedButtonStyle = (theme: any) => ({
  background: theme?.colors?.primary || '#61dafb', color: '#fff', border: 'none',
  borderRadius: 12, padding: '12px 28px', fontWeight: 700, fontSize: 16, cursor: 'pointer',
});

const meshGradientStyle = (theme: any) => ({
  position: 'absolute' as const, inset: 0,
  background: \`radial-gradient(ellipse at 20% 30%, \${theme?.colors?.primary || '#61dafb'}12 0%, transparent 60%)\`,
});
const gridPatternStyle = (theme: any) => ({
  position: 'absolute' as const, inset: 0, opacity: 0.03,
  backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
  backgroundSize: '60px 60px',
});
const noiseOverlayStyle = () => ({
  position: 'absolute' as const, inset: 0, opacity: 0.03,
});
const glowOrbStyle = (frame: number, color: string, size: number, x: string, y: string, delay = 0) => {
  const s = interpolate(frame, [delay, delay + 40], [0.6, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return {
    position: 'absolute' as const, width: size, height: size, borderRadius: '50%',
    background: \`radial-gradient(circle, \${color}20 0%, transparent 70%)\`,
    left: x, top: y, transform: \`scale(\${s})\`, pointerEvents: 'none' as const,
  };
};
const glassSurface = (theme: any) => ({
  background: (theme?.colors?.surface || '#1a1a2e') + 'cc',
  backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)',
});
const glassCard = (theme: any, radius = 20) => ({
  ...glassSurface(theme), borderRadius: radius,
});
const depthShadow = () => '0 2px 4px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.2)';
const gradientText = (from: string, to: string) => ({
  backgroundImage: \`linear-gradient(135deg, \${from}, \${to})\`,
  backgroundClip: 'text', WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent', color: 'transparent',
});
const accentColor = (theme: any, index = 0) => {
  const palette = [theme?.colors?.primary || '#61dafb', theme?.colors?.accent || '#f97316', theme?.colors?.secondary || '#a78bfa'];
  return palette[index % palette.length];
};
const shimmerStyle = () => ({ position: 'absolute' as const, inset: 0, pointerEvents: 'none' as const });
const isThemeDark = (theme: any) => {
  const bg = theme?.colors?.background || '#000';
  if (bg.length < 7) return true;
  const r = parseInt(bg.slice(1,3),16), g = parseInt(bg.slice(3,5),16), b = parseInt(bg.slice(5,7),16);
  return (r*299+g*587+b*114)/1000 < 128;
};
const mergeThemeWithOverrides = (theme: any, overrides?: any) => {
  if (!overrides) return theme;
  return { ...theme, colors: { ...theme.colors, ...(overrides.accentColor && { accent: overrides.accentColor, primary: overrides.accentColor }) } };
};

const easings = {
  smooth: (t: number) => t,
  snappy: (t: number) => t,
  spring: (t: number) => t,
  elastic: (t: number) => t,
  decel: (t: number) => t,
  bounce: (t: number) => t,
};
const spacing = {
  scenePadding: 80, scenePaddingX: 100,
  sectionGap: 56, cardGap: 24, cardPadding: 32,
  borderRadius: { sm: 10, md: 16, lg: 24, xl: 32 },
};
const typography = {
  heroTitle: { fontSize: 72, fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.035em' },
  sectionTitle: { fontSize: 46, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em' },
  cardTitle: { fontSize: 20, fontWeight: 700, lineHeight: 1.3 },
  body: { fontSize: 16, fontWeight: 500, lineHeight: 1.6 },
  bodyLg: { fontSize: 21, fontWeight: 500, lineHeight: 1.55 },
  caption: { fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' },
  stat: { fontSize: 60, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' },
  label: { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
};
const getTypography = (theme?: any) => {
  const d = theme?.fonts?.heading ? \`"\${theme.fonts.heading}", system-ui, sans-serif\` : undefined;
  const b = theme?.fonts?.body ? \`"\${theme.fonts.body}", system-ui, sans-serif\` : undefined;
  return {
    heroTitle: { ...typography.heroTitle, fontFamily: d },
    sectionTitle: { ...typography.sectionTitle, fontFamily: d },
    cardTitle: { ...typography.cardTitle, fontFamily: d },
    body: { ...typography.body, fontFamily: b },
    bodyLg: { ...typography.bodyLg, fontFamily: b },
    caption: { ...typography.caption, fontFamily: b },
    stat: { ...typography.stat, fontFamily: d },
    label: { ...typography.label, fontFamily: b },
  };
};

var typo = typography;

// Ensure theme always has all expected properties with defaults
function __safeTheme(t: any) {
  if (!t || typeof t !== 'object') t = {};
  var defaultColors = {
    background: '#0f0f17', surface: '#1a1a2e', primary: '#61dafb',
    secondary: '#a78bfa', text: '#f0f0f5', textMuted: '#888',
    accent: '#f97316', glow: '#6366f1',
  };
  var defaultFonts = { heading: 'system-ui, sans-serif', body: 'system-ui, sans-serif' };
  return {
    ...t,
    colors: { ...defaultColors, ...(t.colors || {}) },
    fonts: { ...defaultFonts, ...(t.fonts || {}) },
    borderRadius: t.borderRadius ?? 20,
    personality: t.personality ?? {},
  };
}

const MockupPlaceholder = (p: any) =>
  React.createElement('div', {
    style: { background: '#1a1a2e', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
      padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#888', minHeight: 200, fontSize: 14 },
  }, p?.children || 'Mockup');

// ---- Auto-generated mocks for unknown imports ----
${autoMocks}

// ---- Component source (imports stripped) ----
${cleaned}

<\/script>
<script>
// ---- Manual Babel transform (avoids cross-origin Script error) ----
(function() {
  var rootEl = document.getElementById('root');
  function showError(label, e) {
    var msg = label + ': ' + (e && e.message ? e.message : String(e));
    if (e && e.stack) msg += '\\n\\n' + e.stack;
    rootEl.innerHTML = '<div class="error-box">' + msg.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>';
    try { parent.postMessage({ type: 'preview-error', error: msg }, '*'); } catch(x) {}
  }

  // 1. Read the source from the hidden script element
  var srcEl = document.getElementById('__src');
  if (!srcEl) { showError('Setup', 'Source element not found'); return; }
  var code = srcEl.textContent || '';

  // 2. Transform with Babel
  var transformed;
  try {
    transformed = Babel.transform(code, {
      presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
      filename: 'component.tsx'
    });
  } catch(e) { showError('Babel transform', e); return; }

  // 3. Execute — auto-mock undefined references and retry
  var __maxRetries = 5;
  var __autoMocked = [];
  for (var __attempt = 0; __attempt < __maxRetries; __attempt++) {
    try {
      (0, eval)(transformed.code);
      break;
    } catch(e) {
      if (e instanceof ReferenceError && __attempt < __maxRetries - 1) {
        var match = e.message.match(/(\\w+) is not defined/);
        if (match) {
          var name = match[1];
          __autoMocked.push(name);
          // Auto-mock: PascalCase → component, camelCase → function returning identity/empty
          if (name[0] === name[0].toUpperCase()) {
            (0, eval)('var ' + name + ' = function(p) { return React.createElement("div", { style: p && p.style, "data-mock": "' + name + '" }, p && p.children); };');
          } else {
            (0, eval)('var ' + name + ' = function() { var args = Array.prototype.slice.call(arguments); if (typeof args[0] === "number") return { opacity: 1, transform: "none" }; return args[0] || {}; };');
          }
          continue;
        }
      }
      showError('Runtime', e);
      return;
    }
  }
  if (__autoMocked.length > 0) {
    console.warn('[Preview] Auto-mocked undefined references:', __autoMocked.join(', '));
    try { parent.postMessage({ type: 'preview-warning', autoMocked: __autoMocked }, '*'); } catch(x) {}
  }

  // 4. Resolve the component
  var __Comp = typeof __default__ !== 'undefined' ? __default__
    : typeof ${componentName} !== 'undefined' ? ${componentName}
    : null;

  // 5. Build props (apply safeTheme to ensure all colors/fonts exist)
  var __props = { ${propsEntries} };
  for (var k in __props) {
    if (__props.hasOwnProperty(k) && typeof __props[k] === 'string') {
      try { __props[k] = JSON.parse(__props[k]); } catch(e) {}
    }
  }
  if (__props.theme) { __props.theme = __safeTheme(__props.theme); }

  // 6. Error boundary class (plain JS)
  var __hasCaughtError = false;
  function ErrorBoundary() {}
  ErrorBoundary.prototype = Object.create(React.Component.prototype);
  ErrorBoundary.prototype.constructor = ErrorBoundary;
  ErrorBoundary.prototype.render = function() {
    if (this.state && this.state.error) {
      return React.createElement('div', { className: 'error-box' },
        'Component error:\\n' + this.state.error);
    }
    return this.props.children;
  };
  ErrorBoundary.getDerivedStateFromError = function(e) {
    __hasCaughtError = true;
    var errMsg = e.message || String(e);
    try { parent.postMessage({ type: 'preview-error', error: 'Component error: ' + errMsg }, '*'); } catch(x) {}
    return { error: errMsg };
  };

  // 7. Animated preview wrapper (plain JS)
  function PreviewWrapper() {
    var stateArr = React.useState(0);
    var setFrame = stateArr[1];

    React.useEffect(function() {
      var f = 0;
      var id = setInterval(function() {
        f = (f + 1) % 150;
        __frame = f;
        setFrame(f);
      }, 33);
      return function() { clearInterval(id); };
    }, []);

    React.useEffect(function() {
      if (!__hasCaughtError) {
        try { parent.postMessage({ type: 'preview-success' }, '*'); } catch(x) {}
      }
    }, []);

    if (!__Comp) {
      return React.createElement('div', { className: 'error-box' },
        'No component found to render.');
    }
    return React.createElement(ErrorBoundary, null,
      React.createElement('div', {
        style: { width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' },
      }, React.createElement(__Comp, __props))
    );
  }

  // 8. Render
  try {
    ReactDOM.createRoot(rootEl).render(React.createElement(PreviewWrapper));
  } catch(e) { showError('Render', e); }
})();
<\/script>
</body>
</html>`;
}

/* ---- Media preview lightbox ---- */

function MediaPreviewLightbox({
  item,
  onClose,
}: {
  item: PreviewItem;
  onClose: () => void;
}) {
  const isComponent = item.type === "component";
  const [tab, setTab] = useState<"source" | "preview">(
    isComponent ? "preview" : "source"
  );
  const [fullSource, setFullSource] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [propValues, setPropValues] = useState<Record<string, string>>({});
  const [propsInitialized, setPropsInitialized] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!isComponent || !item.url) return;
    setSourceLoading(true);
    fetch(item.url)
      .then((r) => r.text())
      .then((src) => {
        setFullSource(src);
        if (!propsInitialized) {
          setPropValues(extractPropsFromSource(src));
          setPropsInitialized(true);
        }
        setSourceLoading(false);
      })
      .catch(() => {
        const fallback = item.sourcePreview || null;
        setFullSource(fallback);
        if (fallback && !propsInitialized) {
          setPropValues(extractPropsFromSource(fallback));
          setPropsInitialized(true);
        }
        setSourceLoading(false);
      });
  }, [isComponent, item.url, item.sourcePreview, propsInitialized]);

  const sourceLines = (fullSource || item.sourcePreview || "").split("\n");
  const propKeys = Object.keys(propValues);
  const showPropsPanel = isComponent && tab === "preview" && propKeys.length > 0;

  const handlePropChange = (key: string, value: string) => {
    setPropValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative flex flex-col items-center gap-3 w-full max-w-[90vw] max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-colors z-10 text-sm backdrop-blur"
        >
          ✕
        </button>

        {item.type === "image" ? (
          <img
            src={item.url}
            alt={item.name}
            className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl"
            draggable={false}
          />
        ) : item.type === "video" ? (
          <video
            src={item.url}
            controls
            autoPlay
            className="max-w-[85vw] max-h-[75vh] rounded-lg shadow-2xl"
          />
        ) : isComponent ? (
          <div
            className="w-full rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: "#1e1e2e",
              height: "min(80vh, 720px)",
              maxWidth: showPropsPanel ? 1200 : 900,
            }}
          >
            {/* Tab bar */}
            <div
              className="flex items-center shrink-0"
              style={{
                background: "#181825",
                borderBottom: "1px solid #313244",
              }}
            >
              {(["preview", "source"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2.5 text-xs font-medium transition-colors relative capitalize"
                  style={{
                    color: tab === t ? "#cdd6f4" : "#6c7086",
                  }}
                >
                  {t}
                  {tab === t && (
                    <div
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ background: "#61dafb" }}
                    />
                  )}
                </button>
              ))}
              <div className="flex-1" />
              <div className="flex items-center gap-2 pr-3">
                <ReactIcon size={12} color="#61dafb" />
                <span
                  className="text-[11px] truncate max-w-[200px]"
                  style={{ color: "#6c7086", fontFamily: "monospace" }}
                >
                  {item.name}
                </span>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden relative flex">
              {tab === "source" ? (
                sourceLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-[#61dafb] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto p-4">
                    {sourceLines.map((line, i) => (
                      <div
                        key={i}
                        className="flex items-start hover:bg-white/[0.03]"
                        style={{
                          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                          fontSize: "13px",
                          lineHeight: "22px",
                        }}
                      >
                        <span
                          className="shrink-0 w-10 text-right select-none pr-4"
                          style={{ color: "#45475a" }}
                        >
                          {i + 1}
                        </span>
                        <span className="whitespace-pre">
                          {colorizeCodeLine(line)}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <>
                  {/* Preview iframe */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {sourceLoading ? (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-6 h-6 border-2 border-[#61dafb] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs" style={{ color: "#6c7086" }}>
                            Loading component...
                          </span>
                        </div>
                      </div>
                    ) : fullSource ? (
                      <iframe
                        key={JSON.stringify(propValues)}
                        srcDoc={buildComponentSrcdoc(
                          fullSource,
                          item.componentName || "App",
                          propValues,
                        )}
                        className="flex-1 w-full border-0"
                        sandbox="allow-scripts"
                        title={`Preview: ${item.componentName || item.name}`}
                        style={{ background: "#0f0f17" }}
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs" style={{ color: "#6c7086" }}>
                          No source available to render.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Props panel */}
                  {showPropsPanel && (
                    <div
                      className="w-72 shrink-0 overflow-y-auto flex flex-col"
                      style={{
                        borderLeft: "1px solid #313244",
                        background: "#181825",
                      }}
                    >
                      <div
                        className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider shrink-0"
                        style={{
                          color: "#6c7086",
                          borderBottom: "1px solid #313244",
                        }}
                      >
                        Props
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {propKeys.map((key) => {
                          const val = propValues[key];
                          const isMultiline = val.includes("\n") || val.length > 60;
                          return (
                            <div key={key}>
                              <label
                                className="block text-[10px] font-medium mb-1 px-1"
                                style={{ color: "#a6adc8" }}
                              >
                                {key}
                              </label>
                              {isMultiline ? (
                                <textarea
                                  value={val}
                                  onChange={(e) => handlePropChange(key, e.target.value)}
                                  spellCheck={false}
                                  className="w-full rounded-md px-2 py-1.5 text-[11px] resize-y"
                                  style={{
                                    background: "#1e1e2e",
                                    border: "1px solid #313244",
                                    color: "#cdd6f4",
                                    fontFamily: "monospace",
                                    minHeight: 80,
                                    maxHeight: 300,
                                    outline: "none",
                                  }}
                                />
                              ) : (
                                <input
                                  value={val}
                                  onChange={(e) => handlePropChange(key, e.target.value)}
                                  spellCheck={false}
                                  className="w-full rounded-md px-2 py-1.5 text-[11px]"
                                  style={{
                                    background: "#1e1e2e",
                                    border: "1px solid #313244",
                                    color: "#cdd6f4",
                                    fontFamily: "monospace",
                                    outline: "none",
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer info */}
        <div className="flex items-center gap-3 text-white/70 text-xs">
          <span className="font-medium text-white/90">
            {item.componentName || item.name}
          </span>
          {item.width && item.height && (
            <span className="px-1.5 py-0.5 rounded bg-white/10">
              {item.width} × {item.height}
            </span>
          )}
          {isComponent && (
            <span className="px-1.5 py-0.5 rounded bg-white/10 flex items-center gap-1">
              <ReactIcon size={10} color="#61dafb" />
              Component
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- React icon SVG ---------- */

function ReactIcon({ size = 14, color = "#61dafb" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="-11.5 -10.232 23 20.463" fill="none">
      <circle r="2.05" fill={color} />
      <g stroke={color} strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

/* ---------- Mini syntax coloring ---------- */

function colorizeCodeLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const kw = "import|export|default|from|const|let|var|function"
    + "|return|class|extends|interface|type|async|await|if|else|new";
  const keywords = new RegExp(`\\b(${kw})\\b`, "g");
  const strings = /(["'`])(?:(?!\1).)*\1/g;
  const jsxTag = /<\/?[A-Z]\w*/g;

  type Span = { start: number; end: number; color: string };
  const spans: Span[] = [];

  let m: RegExpExecArray | null;
  while ((m = keywords.exec(line))) {
    spans.push({ start: m.index, end: m.index + m[0].length, color: "#c678dd" });
  }
  while ((m = strings.exec(line))) {
    spans.push({ start: m.index, end: m.index + m[0].length, color: "#98c379" });
  }
  while ((m = jsxTag.exec(line))) {
    spans.push({ start: m.index, end: m.index + m[0].length, color: "#61dafb" });
  }

  spans.sort((a, b) => a.start - b.start);

  const merged: Span[] = [];
  for (const s of spans) {
    if (merged.length > 0 && s.start < merged[merged.length - 1].end) continue;
    merged.push(s);
  }

  let cursor = 0;
  merged.forEach((span, i) => {
    if (cursor < span.start) {
      tokens.push(
        <span key={`t${i}`} style={{ color: "#abb2bf" }}>
          {line.slice(cursor, span.start)}
        </span>
      );
    }
    tokens.push(
      <span key={`s${i}`} style={{ color: span.color }}>
        {line.slice(span.start, span.end)}
      </span>
    );
    cursor = span.end;
  });
  if (cursor < line.length) {
    tokens.push(
      <span key="rest" style={{ color: "#abb2bf" }}>
        {line.slice(cursor)}
      </span>
    );
  }
  return tokens;
}

/* ---------- Component preview card ---------- */

function ComponentPreviewCard({
  name,
  componentName,
  sourcePreview,
  url,
  mediaId,
  onDelete,
  onPreview,
}: {
  name: string;
  componentName?: string;
  sourcePreview?: string;
  url?: string | null;
  mediaId?: string;
  onDelete: () => void;
  onPreview?: () => void;
}) {
  const ext = name.match(/\.(\w+)$/)?.[1] || "tsx";
  const displayName = componentName || name.replace(/\.[^.]+$/, "");
  const lines = sourcePreview
    ? sourcePreview.split("\n").slice(0, 8)
    : [];

  const handleDragStart = (e: React.DragEvent) => {
    if (!url) {
      e.preventDefault();
      return;
    }
    const data = JSON.stringify({
      url,
      name,
      type: "component",
      mediaId: mediaId || "",
      componentName: componentName || displayName,
    });
    e.dataTransfer.setData("application/x-media-item", data);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      className="rounded-lg border overflow-hidden group relative"
      draggable={!!url}
      onDragStart={handleDragStart}
      style={{
        borderColor: "var(--border-subtle)",
        cursor: url ? "grab" : onPreview ? "pointer" : "default",
      }}
      onDoubleClick={onPreview}
      title={url
        ? "Double-click to preview · Drag to add as scene"
        : onPreview ? "Double-click to preview source" : undefined}
    >
      {/* Code preview area */}
      <div
        className="w-full aspect-video relative overflow-hidden"
        style={{ background: "#1e1e2e" }}
      >
        {/* Top bar mimicking an editor tab */}
        <div
          className="flex items-center gap-1 px-2 py-1"
          style={{ background: "#181825", borderBottom: "1px solid #313244" }}
        >
          <div className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f38ba8" }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f9e2af" }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#a6e3a1" }} />
          </div>
          <span
            className="text-[7px] ml-1 truncate"
            style={{ color: "#6c7086", fontFamily: "monospace" }}
          >
            {name}
          </span>
        </div>

        {/* Code lines */}
        <div className="px-2 py-1 space-y-px overflow-hidden">
          {lines.length > 0 ? (
            lines.map((line, i) => (
              <div
                key={i}
                className="flex gap-1.5 items-start"
                style={{ fontFamily: "monospace", fontSize: "6px", lineHeight: "9px" }}
              >
                <span
                  className="shrink-0 w-3 text-right select-none"
                  style={{ color: "#45475a" }}
                >
                  {i + 1}
                </span>
                <span className="truncate">{colorizeCodeLine(line)}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full pt-2">
              <ReactIcon size={20} color="#61dafb" />
            </div>
          )}
        </div>

        {/* Gradient fade at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-4"
          style={{
            background: "linear-gradient(transparent, #1e1e2e)",
          }}
        />

        {onPreview && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-1.5 py-1 flex items-center gap-1.5"
        style={{ background: "var(--surface)" }}
      >
        <ReactIcon size={10} color="#61dafb" />
        <span
          className="text-[10px] font-medium truncate flex-1"
          style={{ color: "var(--foreground)" }}
        >
          {displayName}
        </span>
        <span
          className="text-[8px] px-1 py-px rounded font-mono shrink-0"
          style={{
            background: "rgba(97,218,251,0.1)",
            color: "#61dafb",
          }}
        >
          .{ext}
        </span>
        <button
          onClick={onDelete}
          className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 ml-0.5"
          style={{ color: "var(--muted)" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* ---------- Collapsible section header ---------- */

function SectionHeader({
  icon,
  label,
  count,
  expanded,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left text-xs font-medium px-1 py-0.5 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
      style={{ color: "var(--muted)" }}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className="text-[10px] font-normal opacity-70">({count})</span>
      )}
      <span
        className="ml-auto text-[10px] transition-transform duration-150"
        style={{
          color: "var(--muted)",
          transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
        }}
      >
        ▾
      </span>
    </button>
  );
}

/* ---------- Agent context section ---------- */

function AgentContextSection({
  projectId,
  readmeContent,
  designContext,
}: {
  projectId: Id<"projects">;
  readmeContent?: string;
  designContext?: Record<string, unknown>;
}) {
  const [readmeExpanded, setReadmeExpanded] = useState(false);
  const [brandExpanded, setBrandExpanded] = useState(true);
  const [editingReadme, setEditingReadme] = useState(false);
  const [readmeDraft, setReadmeDraft] = useState(readmeContent || "");
  const [editingBrand, setEditingBrand] = useState(false);

  const updateReadme = useMutation(api.projects.updateReadmeContent);
  const saveDesignCtx = useMutation(api.projects.saveDesignContext);

  const brandColors = designContext?.brandColors as Record<string, string> | undefined;
  const fonts = designContext?.fonts as { heading?: string; body?: string } | undefined;
  const designStyle = designContext?.designStyle as string | undefined;
  const designNotes = designContext?.designNotes as string | undefined;

  const colorEntries = brandColors ? Object.entries(brandColors).slice(0, 16) : [];

  const [colorDrafts, setColorDrafts] = useState<Record<string, string>>(brandColors || {});
  const [fontDrafts, setFontDrafts] = useState(fonts || { heading: "", body: "" });
  const [styleDraft, setStyleDraft] = useState(designStyle || "");
  const [notesDraft, setNotesDraft] = useState(designNotes || "");

  useEffect(() => { setReadmeDraft(readmeContent || ""); }, [readmeContent]);
  useEffect(() => {
    setColorDrafts(brandColors || {});
    setFontDrafts(fonts || { heading: "", body: "" });
    setStyleDraft(designStyle || "");
    setNotesDraft(designNotes || "");
  }, [brandColors, fonts, designStyle, designNotes]);

  const handleSaveReadme = useCallback(async () => {
    await updateReadme({ projectId, readmeContent: readmeDraft });
    setEditingReadme(false);
  }, [updateReadme, projectId, readmeDraft]);

  const handleSaveBrand = useCallback(async () => {
    const cleanColors: Record<string, string> = {};
    for (const [k, v] of Object.entries(colorDrafts)) {
      if (v.trim()) cleanColors[k] = v.trim();
    }
    await saveDesignCtx({
      projectId,
      designContext: {
        ...(designContext || {}),
        brandColors: cleanColors,
        fonts: fontDrafts,
        designStyle: styleDraft,
        designNotes: notesDraft,
      },
    });
    setEditingBrand(false);
  }, [saveDesignCtx, projectId, colorDrafts, fontDrafts, styleDraft, notesDraft, designContext]);

  const handleColorChange = (name: string, value: string) => {
    setColorDrafts((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddColor = () => {
    const name = `color${Object.keys(colorDrafts).length + 1}`;
    setColorDrafts((prev) => ({ ...prev, [name]: "#000000" }));
  };

  const handleRemoveColor = (name: string) => {
    setColorDrafts((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Project Understanding */}
      {(readmeContent || editingReadme) && (
        <div>
          <SectionHeader
            icon={<span style={{ fontSize: 11, opacity: 0.7 }}>📄</span>}
            label="Project Understanding"
            expanded={readmeExpanded}
            onToggle={() => setReadmeExpanded(!readmeExpanded)}
          />
          {readmeExpanded && (
            <div className="mt-1">
              {editingReadme ? (
                <div className="space-y-1.5">
                  <textarea
                    value={readmeDraft}
                    onChange={(e) => setReadmeDraft(e.target.value)}
                    className="w-full rounded-lg px-2.5 py-2 text-[11px] leading-relaxed resize-y outline-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--brand-teal)",
                      color: "var(--foreground)",
                      minHeight: 100,
                      maxHeight: 240,
                      fontFamily: "inherit",
                    }}
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => { setEditingReadme(false); setReadmeDraft(readmeContent || ""); }}
                      className="text-[10px] px-2 py-0.5 rounded"
                      style={{ color: "var(--muted)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveReadme}
                      className="text-[10px] px-2 py-0.5 rounded font-medium text-white"
                      style={{ background: "var(--brand-teal)" }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="group relative rounded-lg px-2.5 py-2 text-[11px] leading-relaxed overflow-y-auto cursor-pointer hover:ring-1 transition-all"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--foreground)",
                    maxHeight: 200,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                  onClick={() => setEditingReadme(true)}
                  title="Click to edit"
                >
                  {readmeContent}
                  <span
                    className="absolute top-1.5 right-1.5 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 rounded"
                    style={{ background: "var(--border-subtle)", color: "var(--foreground)" }}
                  >
                    Edit
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Brand Identity */}
      {designContext && (colorEntries.length > 0 || fonts || designStyle || editingBrand) && (
        <div>
          <SectionHeader
            icon={<span style={{ fontSize: 11, opacity: 0.7 }}>🎨</span>}
            label="Brand Identity"
            expanded={brandExpanded}
            onToggle={() => setBrandExpanded(!brandExpanded)}
          />
          {brandExpanded && (
            <div className="mt-1">
              {editingBrand ? (
                <div
                  className="rounded-lg px-2.5 py-2 space-y-2.5"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--brand-teal)",
                  }}
                >
                  {/* Style input */}
                  <div>
                    <label className="text-[10px] font-medium block mb-0.5" style={{ color: "var(--muted)" }}>
                      Design Style
                    </label>
                    <input
                      value={styleDraft}
                      onChange={(e) => setStyleDraft(e.target.value)}
                      placeholder="e.g. dark-modern, minimal-light"
                      className="w-full rounded px-2 py-1 text-[11px] outline-none"
                      style={{
                        background: "var(--background)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  {/* Color editors */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-medium" style={{ color: "var(--muted)" }}>
                        Colors
                      </label>
                      <button
                        onClick={handleAddColor}
                        className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: "var(--border-subtle)", color: "var(--foreground)" }}
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(colorDrafts).map(([name, color]) => (
                        <div key={name} className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={color.startsWith("#") ? color : "#000000"}
                            onChange={(e) => handleColorChange(name, e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer shrink-0"
                            style={{ border: "1px solid var(--border-subtle)", padding: 0, background: "none" }}
                          />
                          <input
                            value={name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setColorDrafts((prev) => {
                                const next = { ...prev };
                                delete next[name];
                                next[newName] = color;
                                return next;
                              });
                            }}
                            className="flex-1 rounded px-1.5 py-0.5 text-[10px] font-mono outline-none min-w-0"
                            style={{
                              background: "var(--background)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--foreground)",
                            }}
                          />
                          <span className="text-[9px] font-mono shrink-0" style={{ color: "var(--muted)" }}>
                            {color}
                          </span>
                          <button
                            onClick={() => handleRemoveColor(name)}
                            className="text-[10px] shrink-0 hover:text-red-400 transition-colors"
                            style={{ color: "var(--muted)" }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Font editors */}
                  <div>
                    <label className="text-[10px] font-medium block mb-0.5" style={{ color: "var(--muted)" }}>
                      Fonts
                    </label>
                    <div className="flex gap-1.5">
                      <div className="flex-1">
                        <span className="text-[9px]" style={{ color: "var(--muted)" }}>Heading</span>
                        <input
                          value={fontDrafts.heading || ""}
                          onChange={(e) => setFontDrafts((p) => ({ ...p, heading: e.target.value }))}
                          placeholder="Inter"
                          className="w-full rounded px-1.5 py-0.5 text-[10px] outline-none"
                          style={{
                            background: "var(--background)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[9px]" style={{ color: "var(--muted)" }}>Body</span>
                        <input
                          value={fontDrafts.body || ""}
                          onChange={(e) => setFontDrafts((p) => ({ ...p, body: e.target.value }))}
                          placeholder="Inter"
                          className="w-full rounded px-1.5 py-0.5 text-[10px] outline-none"
                          style={{
                            background: "var(--background)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] font-medium block mb-0.5" style={{ color: "var(--muted)" }}>
                      Design Notes
                    </label>
                    <textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Describe the visual identity..."
                      rows={2}
                      className="w-full rounded px-2 py-1 text-[10px] outline-none resize-none"
                      style={{
                        background: "var(--background)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  <div className="flex gap-1 justify-end pt-0.5">
                    <button
                      onClick={() => {
                        setEditingBrand(false);
                        setColorDrafts(brandColors || {});
                        setFontDrafts(fonts || { heading: "", body: "" });
                        setStyleDraft(designStyle || "");
                        setNotesDraft(designNotes || "");
                      }}
                      className="text-[10px] px-2 py-0.5 rounded"
                      style={{ color: "var(--muted)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBrand}
                      className="text-[10px] px-2 py-0.5 rounded font-medium text-white"
                      style={{ background: "var(--brand-teal)" }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="group relative rounded-lg px-2.5 py-2 space-y-2 cursor-pointer hover:ring-1 transition-all"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onClick={() => setEditingBrand(true)}
                  title="Click to edit"
                >
                  <span
                    className="absolute top-1.5 right-1.5 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 rounded"
                    style={{ background: "var(--border-subtle)", color: "var(--foreground)" }}
                  >
                    Edit
                  </span>

                  {designStyle && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: "var(--border-subtle)", color: "var(--foreground)" }}
                      >
                        {designStyle}
                      </span>
                    </div>
                  )}

                  {colorEntries.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium mb-1" style={{ color: "var(--muted)" }}>
                        Colors
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {colorEntries.map(([name, color]) => (
                          <div
                            key={name}
                            className="flex items-center gap-1 rounded px-1 py-0.5"
                            style={{ background: "var(--background)" }}
                            title={`${name}: ${color}`}
                          >
                            <div
                              className="w-3 h-3 rounded-sm shrink-0"
                              style={{ background: color, border: "1px solid rgba(128,128,128,0.2)" }}
                            />
                            <span className="text-[9px] font-mono" style={{ color: "var(--foreground)", opacity: 0.8 }}>
                              {name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {fonts && (fonts.heading || fonts.body) && (
                    <div>
                      <p className="text-[10px] font-medium mb-0.5" style={{ color: "var(--muted)" }}>Fonts</p>
                      <div className="flex gap-2">
                        {fonts.heading && (
                          <span className="text-[10px]" style={{ color: "var(--foreground)" }}>
                            <span style={{ color: "var(--muted)" }}>H: </span>{fonts.heading}
                          </span>
                        )}
                        {fonts.body && fonts.body !== fonts.heading && (
                          <span className="text-[10px]" style={{ color: "var(--foreground)" }}>
                            <span style={{ color: "var(--muted)" }}>B: </span>{fonts.body}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {designNotes && (
                    <p className="text-[10px] leading-snug" style={{ color: "var(--muted)" }}>
                      {designNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

/* ---------- Custom Components section ---------- */

interface RepoComponentItem {
  _id: Id<"media">;
  name: string;
  componentName?: string;
  sourcePreview?: string;
}

function CustomComponentsSection({
  projectId,
  repoComponents,
}: {
  projectId: Id<"projects">;
  repoComponents?: RepoComponentItem[];
}) {
  const customComponents = useQuery(
    api.customComponents.list,
    { projectId },
  );
  const scenes = useQuery(api.scenes.getScenes, { projectId });
  const project = useQuery(api.projects.getProjectById, { projectId });
  const removeComponent = useMutation(api.customComponents.remove);
  const removeScene = useMutation(api.scenes.removeScene);
  const updateScene = useMutation(api.scenes.updateScene);
  const saveComponentCode = useMutation(api.customComponents.saveCode);
  const [expanded, setExpanded] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [previewComp, setPreviewComp] = useState<{
    name: string;
    code: string;
    description: string;
    sourceType: "scene" | "custom";
    sourceId: string;
  } | null>(null);

  const themeId = (project?.theme as string) || "saas";

  const generatedScenes = useMemo(() => {
    if (!scenes) return [];
    return (scenes as Array<{
      _id: Id<"scenes">;
      title: string;
      type: string;
      content: Record<string, unknown>;
    }>).filter((s) => s.type === "generated");
  }, [scenes]);

  const totalCount =
    (customComponents?.length || 0) + generatedScenes.length;
  const hasItems = totalCount > 0;

  const handleSaveCode = useCallback(
    async (newCode: string) => {
      if (!previewComp) return;
      if (previewComp.sourceType === "scene") {
        const sceneId = previewComp.sourceId as Id<"scenes">;
        const scene = generatedScenes.find(
          (s) => s._id === sceneId,
        );
        if (scene) {
          await updateScene({
            sceneId,
            content: {
              ...scene.content,
              generatedCode: newCode,
              generationStatus: "ready",
            },
          });
        }
      } else {
        const componentId =
          previewComp.sourceId as Id<"customComponents">;
        await saveComponentCode({
          componentId,
          code: newCode,
        });
      }
      setPreviewComp((prev) =>
        prev ? { ...prev, code: newCode } : null,
      );
    },
    [
      previewComp,
      generatedScenes,
      updateScene,
      saveComponentCode,
    ],
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionHeader
          icon={<ReactIcon size={11} color="var(--muted)" />}
          label="Components"
          count={totalCount || undefined}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
        />
        <button
          onClick={() => setShowModal(true)}
          className="text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors hover:opacity-80"
          style={{ background: "var(--brand-orange)", color: "white" }}
        >
          + Add
        </button>
      </div>

      {expanded && hasItems && (
        <div className="space-y-1.5 mt-1.5">
          {generatedScenes.map((scene) => (
            <GeneratedSceneCard
              key={scene._id}
              scene={scene}
              onPreview={() => {
                const code =
                  scene.content?.generatedCode as string;
                if (code) {
                  setPreviewComp({
                    name: scene.title || "Generated Scene",
                    code,
                    description:
                      (scene.content?.intent as string) ||
                      "",
                    sourceType: "scene",
                    sourceId: scene._id,
                  });
                }
              }}
              onDelete={() =>
                removeScene({ sceneId: scene._id })
              }
            />
          ))}
          {customComponents?.map((comp) => (
            <CustomComponentCard
              key={comp._id}
              component={comp}
              onDelete={() =>
                removeComponent({ componentId: comp._id })
              }
              projectId={projectId}
              onPreview={() =>
                setPreviewComp({
                  name: comp.name,
                  code: comp.code,
                  description: comp.description,
                  sourceType: "custom",
                  sourceId: comp._id,
                })
              }
            />
          ))}
        </div>
      )}

      {expanded && !hasItems && (
        <p
          className="text-[10px] px-1 py-2"
          style={{ color: "var(--muted)" }}
        >
          No components yet. Click + Add or use chat to
          generate.
        </p>
      )}

      {showModal && (
        <ComponentPickerModal
          projectId={projectId}
          repoComponents={repoComponents || []}
          onClose={() => setShowModal(false)}
        />
      )}

      {previewComp && (
        <ComponentLivePreview
          component={previewComp}
          themeId={themeId}
          onClose={() => setPreviewComp(null)}
          onSaveCode={handleSaveCode}
        />
      )}
    </div>
  );
}

/* ---------- Component Picker Modal ---------- */

function ComponentPickerModal({
  projectId,
  repoComponents,
  onClose,
}: {
  projectId: Id<"projects">;
  repoComponents: RepoComponentItem[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<RepoComponentItem | null>(null);
  const [customName, setCustomName] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<"pick" | "custom">(
    repoComponents.length > 0 ? "pick" : "custom",
  );

  const handleSelectComponent = (item: RepoComponentItem) => {
    setSelected(item);
    const name = item.componentName || item.name.replace(/\.[^.]+$/, "");
    setCustomName(name);
    setDescription(
      `Recreate the "${name}" component from the repo. ` +
      `Match its exact visual layout, colors, spacing, typography, and content. ` +
      `Read the source file "${item.name}" and its associated CSS for reference.`,
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    try {
      const convexSiteUrl =
        process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
        process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site") ||
        "";
      await fetch(
        `${convexSiteUrl}/tools/generate-custom-component`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            name: customName.trim() || "Custom Component",
            description: description.trim(),
          }),
        },
      );
      onClose();
    } catch (err) {
      console.error("Failed to trigger generation:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [customName, description, projectId, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-[560px] max-h-[80vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          background: "var(--background)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Generate Component
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
              Select a detected component to recreate, or describe a custom one
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            ×
          </button>
        </div>

        {/* Mode tabs */}
        {repoComponents.length > 0 && (
          <div
            className="px-5 pt-3 flex gap-1"
          >
            <button
              onClick={() => { setMode("pick"); setSelected(null); setDescription(""); setCustomName(""); }}
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: mode === "pick" ? "var(--brand-orange)" : "var(--surface)",
                color: mode === "pick" ? "white" : "var(--muted)",
              }}
            >
              From Detected ({repoComponents.length})
            </button>
            <button
              onClick={() => { setMode("custom"); setSelected(null); setDescription(""); setCustomName(""); }}
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: mode === "custom" ? "var(--brand-orange)" : "var(--surface)",
                color: mode === "custom" ? "white" : "var(--muted)",
              }}
            >
              Custom
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {mode === "pick" && (
            <div className="grid grid-cols-2 gap-2">
              {repoComponents.map((item) => {
                const name = item.componentName || item.name.replace(/\.[^.]+$/, "");
                const isSelected = selected?._id === item._id;
                const lines = item.sourcePreview
                  ? item.sourcePreview.split("\n").slice(0, 5)
                  : [];
                return (
                  <button
                    key={item._id}
                    onClick={() => handleSelectComponent(item)}
                    className="text-left rounded-xl overflow-hidden transition-all"
                    style={{
                      border: isSelected
                        ? "2px solid var(--brand-orange)"
                        : "1px solid var(--border-subtle)",
                      background: isSelected
                        ? "rgba(255,92,40,0.04)"
                        : "var(--surface)",
                      transform: isSelected ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    {/* Mini code preview */}
                    <div
                      className="px-2.5 py-2 overflow-hidden"
                      style={{ background: "#1e1e2e" }}
                    >
                      <div className="flex items-center gap-1 mb-1.5">
                        <div className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f38ba8" }} />
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f9e2af" }} />
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#a6e3a1" }} />
                        </div>
                        <span
                          className="text-[8px] ml-1 truncate"
                          style={{ color: "#6c7086", fontFamily: "monospace" }}
                        >
                          {item.name}
                        </span>
                      </div>
                      {lines.length > 0 ? (
                        <div className="space-y-px">
                          {lines.map((line, i) => (
                            <div
                              key={i}
                              className="truncate"
                              style={{
                                fontFamily: "monospace",
                                fontSize: "7px",
                                lineHeight: "11px",
                                color: "#cdd6f4",
                              }}
                            >
                              {line || "\u00A0"}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-2">
                          <ReactIcon size={16} color="#61dafb" />
                        </div>
                      )}
                    </div>
                    {/* Label */}
                    <div className="px-2.5 py-2 flex items-center gap-1.5">
                      <ReactIcon size={12} color={isSelected ? "var(--brand-orange)" : "#61dafb"} />
                      <span
                        className="text-[11px] font-medium truncate"
                        style={{ color: "var(--foreground)" }}
                      >
                        {name}
                      </span>
                      {isSelected && (
                        <span
                          className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: "var(--brand-orange)", color: "white" }}
                        >
                          Selected
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Name field */}
          <div>
            <label
              className="text-[11px] font-medium block mb-1"
              style={{ color: "var(--muted)" }}
            >
              Component Name
            </label>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Dashboard, Sidebar, ProfileCard"
              className="w-full rounded-lg px-3 py-2 text-[12px] outline-none transition-all focus:ring-1"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {/* Description / Instructions */}
          <div>
            <label
              className="text-[11px] font-medium block mb-1"
              style={{ color: "var(--muted)" }}
            >
              Agent Instructions
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                mode === "pick"
                  ? "Select a component above to auto-fill, then customize the instructions..."
                  : "Describe what the component should look like. The AI agent will read the repo's source files and CSS to match the visual style."
              }
              rows={4}
              className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none resize-none transition-all focus:ring-1 leading-relaxed"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--foreground)",
              }}
            />
            <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>
              The agent will read the repo&apos;s CSS, component source, and brand colors to generate a Remotion-compatible version.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between border-t"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <button
            onClick={onClose}
            className="text-[11px] px-3 py-1.5 rounded-lg"
            style={{ color: "var(--muted)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!description.trim() || isGenerating}
            className="text-[12px] px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
            style={{ background: "var(--brand-orange)" }}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate Component"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomComponentCard({
  component,
  onDelete,
  projectId,
  onPreview,
}: {
  component: {
    _id: Id<"customComponents">;
    name: string;
    description: string;
    code: string;
    status: string;
    error?: string;
  };
  onDelete: () => void;
  projectId: Id<"projects">;
  onPreview?: () => void;
}) {
  const [showCode, setShowCode] = useState(false);
  const addScene = useMutation(api.scenes.addScene);
  const scenes = useQuery(api.scenes.getScenes, { projectId });
  const codePreviewLines = component.code
    ? component.code.split("\n").slice(0, 6)
    : [];

  const handleUseInScene = useCallback(async () => {
    if (!component.code || component.status !== "ready") return;
    const order = scenes ? scenes.length : 0;
    await addScene({
      projectId,
      type: "generated",
      title: component.name,
      order,
      content: {
        generatedCode: component.code,
        generationStatus: "ready",
        componentName: component.name,
      },
      durationInFrames: 150,
      transition: "fade",
    });
  }, [component, scenes, addScene, projectId]);

  const statusColor =
    component.status === "ready"
      ? "var(--brand-teal)"
      : component.status === "generating"
        ? "var(--brand-orange)"
        : "#ef4444";

  const statusLabel =
    component.status === "ready"
      ? "Ready"
      : component.status === "generating"
        ? "Generating..."
        : "Error";

  return (
    <div
      className="rounded-lg border overflow-hidden group"
      style={{ borderColor: "var(--border-subtle)" }}
      onDoubleClick={
        component.status === "ready" && onPreview
          ? onPreview
          : undefined
      }
      title={
        component.status === "ready"
          ? "Double-click to preview"
          : undefined
      }
    >
      <div
        className="px-2 py-1.5 flex items-center gap-1.5"
        style={{ background: "var(--surface)" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: statusColor }}
        />
        <span
          className="text-[11px] font-medium truncate flex-1 cursor-pointer"
          style={{ color: "var(--foreground)" }}
          onClick={() => component.code && setShowCode(!showCode)}
          title={component.description}
        >
          {component.name}
        </span>
        <span
          className="text-[9px] px-1 py-px rounded shrink-0"
          style={{ background: `${statusColor}20`, color: statusColor }}
        >
          {statusLabel}
        </span>
        {component.status === "ready" && (
          <button
            onClick={handleUseInScene}
            className="text-[9px] px-1.5 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: "var(--brand-teal)",
              color: "white",
            }}
            title="Add as a scene in the timeline"
          >
            + Scene
          </button>
        )}
        <button
          onClick={onDelete}
          className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
          style={{ color: "var(--muted)" }}
        >
          ×
        </button>
      </div>

      {component.status === "generating" && (
        <div
          className="px-2 py-2 flex items-center justify-center"
          style={{ background: "#1e1e2e" }}
        >
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--brand-orange)", borderTopColor: "transparent" }}
          />
          <span className="text-[10px] ml-2" style={{ color: "var(--muted)" }}>
            AI is generating...
          </span>
        </div>
      )}

      {component.status === "error" && component.error && (
        <div className="px-2 py-1.5" style={{ background: "rgba(239,68,68,0.05)" }}>
          <p className="text-[10px]" style={{ color: "#ef4444" }}>
            {component.error}
          </p>
        </div>
      )}

      {showCode && component.code && (
        <div
          className="overflow-hidden"
          style={{ background: "#1e1e2e" }}
        >
          <div
            className="flex items-center gap-1 px-2 py-1"
            style={{ background: "#181825", borderBottom: "1px solid #313244" }}
          >
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f38ba8" }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f9e2af" }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#a6e3a1" }} />
            </div>
            <span className="text-[7px] ml-1" style={{ color: "#6c7086", fontFamily: "monospace" }}>
              {component.name}.tsx
            </span>
          </div>
          <div className="px-2 py-1 space-y-px overflow-hidden max-h-24">
            {codePreviewLines.map((line, i) => (
              <div
                key={i}
                className="flex gap-1.5 items-start"
                style={{ fontFamily: "monospace", fontSize: "6px", lineHeight: "9px" }}
              >
                <span className="shrink-0 w-3 text-right select-none" style={{ color: "#45475a" }}>
                  {i + 1}
                </span>
                <span className="truncate" style={{ color: "#cdd6f4" }}>{line}</span>
              </div>
            ))}
          </div>
          <div
            className="h-3"
            style={{ background: "linear-gradient(transparent, #1e1e2e)" }}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Generated Scene Card ---------- */

function GeneratedSceneCard({
  scene,
  onPreview,
  onDelete,
}: {
  scene: {
    _id: Id<"scenes">;
    title: string;
    content: Record<string, unknown>;
  };
  onPreview: () => void;
  onDelete: () => void;
}) {
  const status =
    (scene.content?.generationStatus as string) || "pending";
  const error =
    scene.content?.generationError as string | undefined;
  const code =
    scene.content?.generatedCode as string | undefined;
  const intent =
    scene.content?.intent as string | undefined;
  const [showError, setShowError] = useState(false);

  const statusColor =
    status === "ready"
      ? "var(--brand-teal)"
      : status === "generating" || status === "pending"
        ? "var(--brand-orange)"
        : "#ef4444";

  const statusLabel =
    status === "ready"
      ? "Ready"
      : status === "generating" || status === "pending"
        ? "Generating..."
        : "Error";

  return (
    <div
      className="rounded-lg border overflow-hidden group"
      style={{ borderColor: "var(--border-subtle)" }}
      onDoubleClick={
        status === "ready" && code ? onPreview : undefined
      }
      title={
        status === "ready"
          ? "Double-click to preview"
          : status === "error"
            ? "Click to see error"
            : "Generating..."
      }
    >
      <div
        className="px-2 py-1.5 flex items-center gap-1.5"
        style={{
          background: "var(--surface)",
          cursor:
            status === "ready" ? "pointer" : "default",
        }}
      >
        {status === "generating" || status === "pending" ? (
          <div
            className="w-3 h-3 border-[1.5px] border-t-transparent rounded-full animate-spin shrink-0"
            style={{
              borderColor: "var(--brand-orange)",
              borderTopColor: "transparent",
            }}
          />
        ) : (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: statusColor }}
          />
        )}
        <span
          className="text-[11px] font-medium truncate flex-1"
          style={{ color: "var(--foreground)" }}
        >
          {scene.title}
        </span>
        <span
          className="text-[9px] px-1 py-px rounded shrink-0"
          style={{
            background: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {statusLabel}
        </span>
        {status === "ready" && code && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="text-[9px] px-1.5 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: "var(--brand-teal)",
              color: "white",
            }}
          >
            Preview
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-[9px] w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          style={{
            color: "#ef4444",
            background: "rgba(239,68,68,0.08)",
          }}
          title="Delete"
        >
          ×
        </button>
      </div>

      {(status === "generating" || status === "pending") && (
        <div
          className="px-2 py-2 flex items-center gap-2"
          style={{ background: "#1e1e2e" }}
        >
          <div className="flex-1 min-w-0">
            {intent && (
              <p
                className="text-[9px] truncate"
                style={{ color: "var(--muted)" }}
              >
                {intent}
              </p>
            )}
            <div
              className="mt-1.5 h-1 rounded-full overflow-hidden"
              style={{ background: "var(--border-subtle)" }}
            >
              <div
                className="h-full rounded-full animate-pulse"
                style={{
                  background: "var(--brand-orange)",
                  width: "60%",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div
          className="px-2 py-1.5 cursor-pointer"
          style={{ background: "rgba(239,68,68,0.05)" }}
          onClick={() => setShowError(!showError)}
        >
          <div className="flex items-center gap-1">
            <span
              className="text-[10px]"
              style={{ color: "#ef4444" }}
            >
              Generation failed
            </span>
            <span
              className="text-[9px] ml-auto"
              style={{ color: "#ef4444" }}
            >
              {showError ? "▾" : "▸"} details
            </span>
          </div>
          {showError && error && (
            <pre
              className="text-[9px] mt-1.5 p-1.5 rounded overflow-x-auto whitespace-pre-wrap break-words"
              style={{
                color: "#ef4444",
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                fontFamily: "monospace",
                maxHeight: 120,
                overflowY: "auto",
              }}
            >
              {error}
            </pre>
          )}
        </div>
      )}

      {status === "ready" && code && (
        <div
          className="px-2 py-1"
          style={{ background: "#1e1e2e" }}
        >
          <div
            className="text-[8px] overflow-hidden"
            style={{
              fontFamily: "monospace",
              color: "#6c7086",
              maxHeight: 32,
              lineHeight: "11px",
            }}
          >
            {code
              .split("\n")
              .slice(0, 3)
              .map((line, i) => (
                <div key={i} className="truncate">
                  {line || "\u00A0"}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Live Component Preview + AI Editor ---------- */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ComponentLivePreview({
  component,
  themeId,
  onClose,
  onSaveCode,
}: {
  component: {
    name: string;
    code: string;
    description: string;
    sourceType?: "scene" | "custom";
    sourceId?: string;
  };
  themeId: string;
  onClose: () => void;
  onSaveCode: (code: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<"preview" | "source">(
    "preview",
  );
  const [liveCode, setLiveCode] = useState(component.code);
  const [chatMessages, setChatMessages] = useState<
    ChatMessage[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewError, setPreviewError] = useState<
    string | null
  >(null);
  const [autoMocked, setAutoMocked] = useState<string[]>(
    [],
  );
  const [compileStatus, setCompileStatus] = useState<
    "idle" | "compiling" | "success" | "error"
  >("idle");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const justEditedRef = useRef(false);
  const autoFixCountRef = useRef(0);
  const sendChatMessageRef = useRef<
    ((msg: string) => void) | null
  >(null);

  useEffect(() => {
    setLiveCode(component.code);
    setDirty(false);
    setPreviewError(null);
    setAutoMocked([]);
  }, [component.code]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "preview-error") {
        setPreviewError(e.data.error);
        if (
          justEditedRef.current &&
          autoFixCountRef.current < 2
        ) {
          justEditedRef.current = false;
          autoFixCountRef.current += 1;
          const errMsg = e.data.error;
          const fixPrompt = `The code you just produced has a RUNTIME ERROR:\n\`\`\`\n${errMsg}\n\`\`\`\n\nFix this error. The preview crashed after your edit. Check for undefined variables, wrong function usage, or type mismatches.`;
          setChatMessages((prev) => [
            ...prev,
            { role: "user", content: `Auto-fix: runtime error detected` },
          ]);
          setTimeout(() => {
            sendChatMessageRef.current?.(fixPrompt);
          }, 100);
        }
      } else if (e.data?.type === "preview-success") {
        setPreviewError(null);
        if (justEditedRef.current) {
          justEditedRef.current = false;
          autoFixCountRef.current = 0;
          setChatMessages((prev) => {
            const last = prev[prev.length - 1];
            if (
              last?.role === "assistant" &&
              !last.content.includes("✓ Preview OK")
            ) {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...last,
                content:
                  last.content + "\n\n✓ Preview OK — component renders successfully.",
              };
              return updated;
            }
            return prev;
          });
        }
      } else if (e.data?.type === "preview-warning") {
        setAutoMocked(e.data.autoMocked || []);
      }
    };
    window.addEventListener("message", handler);
    return () =>
      window.removeEventListener("message", handler);
  }, []);

  const theme = useMemo(
    () => getTheme(themeId),
    [themeId],
  );

  const srcdoc = useMemo(
    () =>
      buildComponentSrcdoc(
        liveCode,
        "GeneratedComponent",
        {
          content: DEFAULT_CONTENT,
          theme: JSON.stringify(theme),
        },
      ),
    [liveCode, theme],
  );

  const sourceLines = useMemo(
    () => liveCode.split("\n"),
    [liveCode],
  );

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(liveCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [liveCode]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSaveCode(liveCode);
      setDirty(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [liveCode, onSaveCode]);

  const handleRecompile = useCallback(() => {
    setCompileStatus("compiling");
    setPreviewError(null);
    setAutoMocked([]);

    const testSrcdoc = buildComponentSrcdoc(
      liveCode,
      "GeneratedComponent",
      {
        content: DEFAULT_CONTENT,
        theme: JSON.stringify(theme),
      },
    );

    const iframe = document.createElement("iframe");
    iframe.sandbox.add("allow-scripts");
    iframe.style.cssText =
      "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px";
    iframe.srcdoc = testSrcdoc;

    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      try {
        iframe.remove();
      } catch {
        /* noop */
      }
    };

    const onMsg = (e: MessageEvent) => {
      if (settled) return;
      if (e.data?.type === "preview-error") {
        cleanup();
        window.removeEventListener("message", onMsg);
        setPreviewError(e.data.error);
        setCompileStatus("error");
      } else if (e.data?.type === "preview-success") {
        cleanup();
        window.removeEventListener("message", onMsg);
        setPreviewError(null);
        setCompileStatus("success");
        setPreviewKey((k) => k + 1);
        setTimeout(
          () => setCompileStatus("idle"),
          2500,
        );
      } else if (e.data?.type === "preview-warning") {
        setAutoMocked(e.data.autoMocked || []);
      }
    };

    window.addEventListener("message", onMsg);
    document.body.appendChild(iframe);

    setTimeout(() => {
      if (!settled) {
        cleanup();
        window.removeEventListener("message", onMsg);
        setPreviewError("Compile check timed out — no response from sandbox");
        setCompileStatus("error");
      }
    }, 8000);
  }, [liveCode, theme]);

  const sendChatMessage = useCallback(
    async (msgText: string) => {
      if (!msgText.trim() || isStreaming) return;
      setIsStreaming(true);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "",
      };
      setChatMessages((prev) => [...prev, assistantMsg]);

      const activityLog: string[] = [];
      const appendActivity = (line: string) => {
        activityLog.push(line);
        setChatMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: activityLog.join("\n"),
          };
          return updated;
        });
      };

      try {
        const sceneId =
          component.sourceType === "scene"
            ? component.sourceId
            : undefined;

        const res = await fetch("/api/component/edit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: liveCode,
            instruction: msgText,
            history: chatMessages,
            sceneId,
          }),
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, {
            stream: true,
          });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") break;

            try {
              const event = JSON.parse(payload);

              if (event.type === "tool_call") {
                const toolName = event.tool || "unknown";
                const msg = event.message || `Using ${toolName}...`;
                appendActivity(`[Agent] ${msg}`);
              } else if (event.type === "code_update") {
                if (event.code) {
                  setLiveCode(event.code);
                  setPreviewKey((k) => k + 1);
                }
              } else if (event.type === "validation") {
                if (event.valid) {
                  appendActivity("[Agent] Validation passed.");
                } else {
                  appendActivity(
                    `[Agent] Validation error: ${event.error || "unknown"}`,
                  );
                }
              } else if (event.type === "status") {
                appendActivity(
                  `[Agent] ${event.message || "Working..."}`,
                );
              } else if (event.type === "delta") {
                setChatMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: last.content + event.content,
                  };
                  return updated;
                });
              } else if (
                event.type === "done" &&
                event.code
              ) {
                setLiveCode(event.code);
                setPreviewError(null);
                setAutoMocked([]);
                justEditedRef.current = true;
                setPreviewKey((k) => k + 1);

                onSaveCode(event.code)
                  .then(() => {
                    setDirty(false);
                  })
                  .catch((err) => {
                    console.error(
                      "Auto-save after edit failed:",
                      err,
                    );
                    setDirty(true);
                  });

                let explanation =
                  event.explanation ||
                  "Changes applied.";
                if (event.validated === false) {
                  explanation +=
                    "\n\n⚠️ Validation issue detected — check preview for runtime errors.";
                }
                explanation +=
                  "\n\n✅ Saved & recompiling preview...";

                if (activityLog.length > 0) {
                  activityLog.push("");
                  activityLog.push(explanation);
                  setChatMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: activityLog.join("\n"),
                    };
                    return updated;
                  });
                } else {
                  setChatMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: explanation,
                    };
                    return updated;
                  });
                }
              } else if (event.type === "error") {
                appendActivity(
                  `[Error] ${event.message}`,
                );
              }
            } catch {
              /* skip malformed */
            }
          }
        }
      } catch (err) {
        setChatMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, liveCode, chatMessages, onSaveCode, component.sourceType, component.sourceId],
  );

  sendChatMessageRef.current = sendChatMessage;

  const handleFixWithAI = useCallback(() => {
    if (!previewError) return;
    const msg = `Fix this runtime error:\n${previewError}\n\nLook at the code and fix the issue. Common causes: undefined variables, wrong function signatures, missing helpers.`;
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: msg },
    ]);
    setTimeout(() => sendChatMessage(msg), 50);
  }, [previewError, sendChatMessage]);

  const handleSendChat = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg || isStreaming) return;
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: msg },
    ]);
    sendChatMessage(msg);
  }, [chatInput, isStreaming, sendChatMessage]);

  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendChat();
      }
    },
    [handleSendChat],
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          background: "var(--background)",
          border: "1px solid var(--border-subtle)",
          width: "96vw",
          height: "94vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center shrink-0 border-b"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface)",
          }}
        >
          <div className="flex">
            {(["preview", "source"] as const).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2.5 text-xs font-medium transition-colors relative capitalize"
                  style={{
                    color:
                      tab === t
                        ? "var(--foreground)"
                        : "var(--muted)",
                  }}
                >
                  {t}
                  {tab === t && (
                    <div
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{
                        background: "var(--brand-orange)",
                      }}
                    />
                  )}
                </button>
              ),
            )}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 pr-2">
            <button
              onClick={handleRecompile}
              disabled={compileStatus === "compiling"}
              className="text-[10px] px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
              style={{
                background:
                  compileStatus === "success"
                    ? "rgba(62,208,195,0.15)"
                    : compileStatus === "error"
                      ? "rgba(239,68,68,0.12)"
                      : "var(--border-subtle)",
                color:
                  compileStatus === "success"
                    ? "var(--brand-teal)"
                    : compileStatus === "error"
                      ? "#ef4444"
                      : "var(--muted)",
              }}
              title="Compile and check for errors"
            >
              {compileStatus === "compiling" ? (
                <span
                  className="w-2.5 h-2.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin"
                />
              ) : compileStatus === "success" ? (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : compileStatus === "error" ? (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M6 3l12 9-12 9V3z" />
                </svg>
              )}
              {compileStatus === "compiling"
                ? "Compiling..."
                : compileStatus === "success"
                  ? "Compiled"
                  : compileStatus === "error"
                    ? "Failed"
                    : "Compile"}
            </button>
            <button
              onClick={handleCopy}
              className="text-[10px] px-2 py-1 rounded-md font-medium transition-all"
              style={{
                background: copied
                  ? "rgba(62,208,195,0.15)"
                  : "var(--border-subtle)",
                color: copied
                  ? "var(--brand-teal)"
                  : "var(--muted)",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            {dirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-[10px] px-2 py-1 rounded-md font-semibold text-white disabled:opacity-50"
                style={{
                  background: "var(--brand-teal)",
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            )}
            <div
              className="w-px h-4 mx-0.5"
              style={{
                background: "var(--border-subtle)",
              }}
            />
            <ReactIcon
              size={12}
              color="var(--brand-teal)"
            />
            <span
              className="text-[11px] font-medium truncate max-w-[140px]"
              style={{ color: "var(--foreground)" }}
            >
              {component.name}
            </span>
            <button
              onClick={onClose}
              className="ml-1 w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity text-sm"
              style={{
                background: "var(--border-subtle)",
                color: "var(--muted)",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content: left=preview/source, right=chat */}
        <div
          className="flex-1 flex overflow-hidden"
          style={{ minHeight: 0 }}
        >
          {/* Left panel */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Error banner */}
            {previewError && (
              <div
                className="shrink-0 px-3 py-2 flex items-start gap-2 border-b"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  borderColor:
                    "rgba(239,68,68,0.15)",
                }}
              >
                <span
                  className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background:
                      "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                  }}
                >
                  !
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: "#ef4444" }}
                  >
                    Runtime Error
                  </p>
                  <p
                    className="text-[10px] mt-0.5 truncate"
                    style={{
                      color: "#ef4444",
                      opacity: 0.8,
                    }}
                    title={previewError}
                  >
                    {previewError}
                  </p>
                </div>
                <button
                  onClick={handleFixWithAI}
                  disabled={isStreaming}
                  className="shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "var(--brand-orange)",
                  }}
                >
                  Fix with AI
                </button>
              </div>
            )}

            {/* Auto-mocked warning */}
            {autoMocked.length > 0 && !previewError && (
              <div
                className="shrink-0 px-3 py-1.5 flex items-center gap-2 border-b"
                style={{
                  background:
                    "rgba(255,180,40,0.06)",
                  borderColor:
                    "rgba(255,180,40,0.15)",
                }}
              >
                <span
                  className="text-[10px]"
                  style={{ color: "#f59e0b" }}
                >
                  Auto-mocked undefined:{" "}
                  <strong>
                    {autoMocked.join(", ")}
                  </strong>
                </span>
                <button
                  onClick={handleFixWithAI}
                  disabled={isStreaming}
                  className="shrink-0 text-[9px] px-2 py-0.5 rounded font-medium text-white hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "var(--brand-orange)",
                  }}
                >
                  Fix
                </button>
              </div>
            )}

            <div
              className="flex-1 relative"
              style={{ minHeight: 0 }}
            >
              {tab === "preview" ? (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ background: "#0f0f17" }}
                >
                  <iframe
                    key={`preview-${previewKey}`}
                    srcDoc={srcdoc}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts"
                    title={`Preview: ${component.name}`}
                  />
                </div>
              ) : (
                <div
                  className="absolute inset-0 overflow-auto p-4"
                  style={{ background: "#1e1e2e" }}
                >
                  {sourceLines.map((line, i) => (
                    <div
                      key={i}
                      className="flex items-start hover:bg-white/[0.03]"
                      style={{
                        fontFamily:
                          "'SF Mono', 'Fira Code', monospace",
                        fontSize: "13px",
                        lineHeight: "22px",
                      }}
                    >
                      <span
                        className="shrink-0 w-12 text-right select-none pr-4"
                        style={{ color: "#45475a" }}
                      >
                        {i + 1}
                      </span>
                      <span className="whitespace-pre">
                        {colorizeCodeLine(line)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel — AI Editor */}
          <div
            className="flex flex-col shrink-0"
            style={{
              width: 360,
              borderLeft:
                "1px solid var(--border-subtle)",
              background: "var(--background)",
            }}
          >
            <div
              className="px-3 py-2 flex items-center gap-2 shrink-0 border-b"
              style={{
                borderColor: "var(--border-subtle)",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--brand-orange)"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <span
                className="text-[11px] font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                AI Editor
              </span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,92,40,0.1)",
                  color: "var(--brand-orange)",
                }}
              >
                agentic
              </span>
            </div>

            <div
              className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
              style={{ minHeight: 0 }}
            >
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <p
                    className="text-[11px] text-center leading-relaxed max-w-[220px]"
                    style={{ color: "var(--muted)" }}
                  >
                    Describe changes and the AI will
                    edit the code. Errors are
                    auto-detected.
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center mt-1">
                    {[
                      "Make it more vibrant",
                      "Add a glowing border",
                      "Bigger headings",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setChatInput(s);
                          inputRef.current?.focus();
                        }}
                        className="text-[9px] px-2 py-1 rounded-full transition-colors hover:opacity-80"
                        style={{
                          background:
                            "var(--surface)",
                          color: "var(--muted)",
                          border:
                            "1px solid var(--border-subtle)",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[92%] rounded-xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap"
                    style={
                      msg.role === "user"
                        ? {
                            background:
                              "var(--brand-orange)",
                            color: "white",
                            borderBottomRightRadius: 4,
                          }
                        : {
                            background:
                              "var(--surface)",
                            color:
                              "var(--foreground)",
                            border:
                              "1px solid var(--border-subtle)",
                            borderBottomLeftRadius: 4,
                          }
                    }
                  >
                    {msg.content ||
                      (isStreaming &&
                      i ===
                        chatMessages.length - 1 ? (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{
                              background:
                                "var(--brand-orange)",
                            }}
                          />
                          Editing code...
                        </span>
                      ) : null)}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div
              className="shrink-0 px-3 py-2 border-t"
              style={{
                borderColor: "var(--border-subtle)",
              }}
            >
              <div
                className="flex items-end gap-1.5 rounded-xl px-3 py-2"
                style={{
                  background: "var(--surface)",
                  border:
                    "1px solid var(--border-subtle)",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={chatInput}
                  onChange={(e) =>
                    setChatInput(e.target.value)
                  }
                  onKeyDown={handleChatKeyDown}
                  placeholder="Describe a change..."
                  rows={1}
                  className="flex-1 bg-transparent text-[12px] resize-none outline-none"
                  style={{
                    color: "var(--foreground)",
                    maxHeight: 80,
                  }}
                  disabled={isStreaming}
                />
                <button
                  onClick={handleSendChat}
                  disabled={
                    isStreaming || !chatInput.trim()
                  }
                  className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                  style={{
                    background: "var(--brand-orange)",
                    color: "white",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Component skeleton section ---------- */

function ComponentSkeletonSection() {
  return (
    <div>
      <h4
        className="text-xs font-medium mb-1.5 px-1 flex items-center gap-1.5"
        style={{ color: "var(--muted)" }}
      >
        <ReactIcon size={11} color="var(--muted)" />
        Components
        <span
          className="text-[9px] font-normal"
          style={{ color: "var(--brand-orange)" }}
        >
          scanning...
        </span>
      </h4>
      <div className="grid grid-cols-2 gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg overflow-hidden animate-pulse"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="w-full aspect-video relative"
              style={{ background: "#1e1e2e" }}
            >
              <div
                className="flex items-center gap-1 px-2 py-1"
                style={{ background: "#181825", borderBottom: "1px solid #313244" }}
              >
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#45475a" }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#45475a" }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#45475a" }} />
                </div>
                <div
                  className="h-1.5 rounded ml-1"
                  style={{ background: "#313244", width: `${30 + i * 15}%` }}
                />
              </div>
              <div className="px-2 py-1.5 space-y-1">
                {[...Array(4)].map((_, j) => (
                  <div
                    key={j}
                    className="h-1.5 rounded"
                    style={{
                      background: "#313244",
                      width: `${60 + ((j * 17 + i * 13) % 30)}%`,
                      opacity: 1 - j * 0.15,
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              className="px-1.5 py-1 flex items-center gap-1.5"
              style={{ background: "var(--surface)" }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "var(--border-subtle)" }}
              />
              <div
                className="h-2 rounded flex-1"
                style={{
                  background: "var(--border-subtle)",
                  width: `${50 + i * 10}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Standard media section ---------- */

const MEDIA_ICONS: Record<string, string> = {
  Images: "🖼️",
  "Video Clips": "🎬",
  Audio: "🎵",
};

function MediaSection({
  title,
  items,
  onDelete,
  onPreview,
}: {
  title: string;
  items: { _id: Id<"media">; name: string; type: string; url: string | null; mimeType: string; width?: number; height?: number }[];
  onDelete: (id: Id<"media">) => void;
  onPreview?: (item: PreviewItem) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const handleDragStart = (e: React.DragEvent, item: typeof items[0]) => {
    if (!item.url || (item.type !== "image" && item.type !== "video")) {
      e.preventDefault();
      return;
    }
    const data = JSON.stringify({
      url: item.url,
      name: item.name,
      type: item.type,
      mediaId: item._id,
      width: item.width,
      height: item.height,
    });
    e.dataTransfer.setData("application/x-media-item", data);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div>
      <SectionHeader
        icon={<span style={{ fontSize: 11, opacity: 0.7 }}>{MEDIA_ICONS[title] || "📁"}</span>}
        label={title}
        count={items.length}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      {expanded && (
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          {items.map((item) => {
            const isDraggable = item.url && (item.type === "image" || item.type === "video");
            return (
              <div
                key={item._id}
                draggable={!!isDraggable}
                onDragStart={(e) => handleDragStart(e, item)}
                onDoubleClick={() => {
                  if (item.url && onPreview && (item.type === "image" || item.type === "video")) {
                    onPreview({
                      name: item.name,
                      url: item.url,
                      type: item.type,
                      mimeType: item.mimeType,
                      width: item.width,
                      height: item.height,
                    });
                  }
                }}
                className="rounded-lg border overflow-hidden group relative"
                style={{
                  borderColor: "var(--border-subtle)",
                  cursor: isDraggable ? "grab" : "default",
                }}
                title={isDraggable ? "Double-click to preview · Drag to add as scene" : undefined}
              >
                {item.type === "image" && item.url ? (
                  <div className="relative">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full aspect-video object-cover"
                      draggable={false}
                    />
                    {onPreview && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : item.type === "video" && item.url ? (
                  <div className="w-full aspect-video flex items-center justify-center relative" style={{ background: "var(--surface)" }}>
                    <span className="text-lg">🎬</span>
                    {onPreview && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center" style={{ background: "var(--surface)" }}>
                    <span className="text-lg">🎵</span>
                  </div>
                )}
                <div className="px-1.5 py-1 flex items-center justify-between" style={{ background: "var(--surface)" }}>
                  <span className="text-[10px] truncate flex-1" style={{ color: "var(--foreground)" }}>
                    {item.name}
                  </span>
                  <button
                    onClick={() => onDelete(item._id)}
                    className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 ml-1"
                    style={{ color: "var(--muted)" }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
