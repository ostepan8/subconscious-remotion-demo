import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Extracted scoring/classification logic from scan-components/route.ts
// for unit testing. Kept in sync manually — any change to the route's
// patterns should be mirrored here.
// ---------------------------------------------------------------------------

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

const TEST_PATTERNS =
  /\.(test|spec|stories|story)\.(tsx|jsx|ts|js)$/i;

const CONFIG_PATTERNS =
  /(next\.config|vite\.config|webpack\.config|tsconfig|eslint|prettier)/i;

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

function scoreComponentFile(path: string): number {
  const filename = path.split("/").pop() || "";
  const nameNoExt = filename.replace(/\.(tsx|jsx)$/i, "");
  let score = 0;

  if (SKIP_FILENAMES.has(filename.toLowerCase())) return -1;
  if (TEST_PATTERNS.test(filename)) return -1;
  if (CONFIG_PATTERNS.test(filename)) return -1;
  if (UTILITY_NAMES.test(nameNoExt)) return -1;
  const nameNoExtLower = nameNoExt.toLowerCase();
  if (SKIP_FILENAME_SUFFIXES.some((s) => nameNoExtLower.endsWith(s)))
    return -1;
  if (/\bapi\b/i.test(path) && !/(component|ui|section)/i.test(path))
    return -1;

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

function extractComponentName(
  source: string,
  filename: string,
): string {
  const patterns = [
    /export\s+default\s+function\s+(\w+)/,
    /export\s+default\s+class\s+(\w+)/,
    /export\s+(?:const|let)\s+(\w+)\s*[=:]/,
    /function\s+(\w+)\s*\(/,
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
  return (
    base.charAt(0).toUpperCase() +
    base.slice(1).replace(/([a-z])([A-Z])/g, "$1 $2")
  );
}

function extractDesignFromCSS(css: string) {
  const colors: Record<string, string> = {};
  const fonts: string[] = [];
  const variables: Record<string, string> = {};

  for (const m of css.matchAll(
    /--([a-zA-Z0-9-]+)\s*:\s*([^;]+)/g,
  )) {
    const name = m[1].trim();
    const value = m[2].trim();
    variables[`--${name}`] = value;

    const isColorProp =
      /color|bg|background|foreground|primary|secondary|accent|muted|border|surface/i
        .test(name);
    if (isColorProp) {
      if (
        /^#[0-9a-fA-F]{3,8}$/.test(value) ||
        /^(rgb|hsl)/i.test(value)
      ) {
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
        /system-ui|sans-serif|serif|monospace|inherit|var\(/.test(f);
      if (f && !f.startsWith("-") && !skip) {
        if (!fonts.includes(f)) fonts.push(f);
      }
    }
  }

  return { colors, fonts, variables };
}

// ===================================================================
// Tests
// ===================================================================

describe("scoreComponentFile", () => {
  it("gives high scores to components in visual directories", () => {
    expect(scoreComponentFile("src/components/HeroSection.tsx"))
      .toBeGreaterThanOrEqual(10);
    expect(scoreComponentFile("app/components/Navbar.tsx"))
      .toBeGreaterThanOrEqual(10);
    expect(scoreComponentFile("components/FeatureGrid.tsx"))
      .toBeGreaterThanOrEqual(10);
  });

  it("gives positive scores to app page files", () => {
    expect(scoreComponentFile("app/page.tsx"))
      .toBeGreaterThan(0);
    expect(scoreComponentFile("app/dashboard/page.tsx"))
      .toBeGreaterThan(0);
    expect(scoreComponentFile("src/app/settings/page.tsx"))
      .toBeGreaterThan(0);
  });

  it("skips layout, loading, error, not-found files", () => {
    expect(scoreComponentFile("app/layout.tsx")).toBe(-1);
    expect(scoreComponentFile("app/dashboard/layout.tsx")).toBe(-1);
    expect(scoreComponentFile("app/loading.tsx")).toBe(-1);
    expect(scoreComponentFile("app/error.tsx")).toBe(-1);
    expect(scoreComponentFile("app/not-found.tsx")).toBe(-1);
  });

  it("skips context/provider/hook files by suffix", () => {
    expect(scoreComponentFile("lib/auth-context.tsx")).toBe(-1);
    expect(scoreComponentFile("src/theme-provider.tsx")).toBe(-1);
    expect(scoreComponentFile("lib/query-hooks.tsx")).toBe(-1);
    expect(scoreComponentFile("src/app.provider.tsx")).toBe(-1);
  });

  it("skips utility-named files", () => {
    expect(scoreComponentFile("lib/useAuth.tsx")).toBe(-1);
    expect(scoreComponentFile("hooks/useTheme.tsx")).toBe(-1);
    expect(scoreComponentFile("lib/formatDate.tsx")).toBe(-1);
    expect(scoreComponentFile("utils/helpers.tsx")).toBe(-1);
  });

  it("skips test and config files", () => {
    expect(scoreComponentFile("Button.test.tsx")).toBe(-1);
    expect(scoreComponentFile("Card.stories.tsx")).toBe(-1);
    expect(scoreComponentFile("next.config.tsx")).toBe(-1);
  });

  it("skips api directory files", () => {
    expect(scoreComponentFile("app/api/route.tsx")).toBe(-1);
    expect(scoreComponentFile("app/api/upload/pdf-server.tsx"))
      .toBe(-1);
  });

  it("does not skip api paths with component dirs", () => {
    expect(
      scoreComponentFile("app/api/components/SharedUI.tsx"),
    ).toBeGreaterThanOrEqual(0);
  });

  it("gives PascalCase bonus", () => {
    const upper = scoreComponentFile("misc/Something.tsx");
    const lower = scoreComponentFile("misc/something.tsx");
    expect(upper).toBeGreaterThan(lower);
  });

  it("penalises deeply nested files", () => {
    const shallow = scoreComponentFile("src/components/Card.tsx");
    const deep = scoreComponentFile(
      "src/app/deep/nested/more/stuff/extra/Card.tsx",
    );
    expect(shallow).toBeGreaterThan(deep);
  });

  // resume-tailoring-agent specific paths
  it("scores resume-tailoring-agent components correctly", () => {
    expect(scoreComponentFile("app/components/Navbar.tsx"))
      .toBeGreaterThanOrEqual(10);
    expect(scoreComponentFile("app/components/OnboardingTour.tsx"))
      .toBeGreaterThanOrEqual(10);
    expect(scoreComponentFile("app/components/Skeleton.tsx"))
      .toBeGreaterThanOrEqual(10);
    expect(
      scoreComponentFile(
        "app/tailor/components/JobDescriptionStep.tsx",
      ),
    ).toBeGreaterThanOrEqual(5);
    expect(scoreComponentFile("app/dashboard/awards/page.tsx"))
      .toBeGreaterThan(0);
    expect(scoreComponentFile("app/page.tsx"))
      .toBeGreaterThan(0);
  });
});

describe("isReactComponent", () => {
  it("detects a function component", () => {
    const code = `
export default function MyComponent() {
  return (
    <div>
      <h1>Hello</h1>
    </div>
  );
}`;
    expect(isReactComponent(code)).toBe(true);
  });

  it("detects an arrow function component", () => {
    const code = `
export const Card = () => (
  <div className="card">
    <span>Content</span>
  </div>
);`;
    expect(isReactComponent(code)).toBe(true);
  });

  it("rejects non-component TS files", () => {
    const code = `
export function formatDate(d: Date): string {
  return d.toISOString();
}
export const API_URL = "https://api.example.com";
`;
    expect(isReactComponent(code)).toBe(false);
  });

  it("rejects very short files", () => {
    expect(isReactComponent("hi")).toBe(false);
    expect(isReactComponent("")).toBe(false);
  });

  it("detects component with return <", () => {
    const code = `
export default function Page() {
  return <main>
    <header>Welcome</header>
  </main>;
}`;
    expect(isReactComponent(code)).toBe(true);
  });
});

describe("extractComponentName", () => {
  it("extracts name from export default function", () => {
    const code = "export default function HeroSection() { return <div />; }";
    expect(extractComponentName(code, "HeroSection.tsx"))
      .toBe("Hero Section");
  });

  it("extracts name from export const", () => {
    const code = "export const FeatureGrid = () => <div />;";
    expect(extractComponentName(code, "FeatureGrid.tsx"))
      .toBe("Feature Grid");
  });

  it("falls back to filename when no patterns match", () => {
    const code = "// just a comment, nothing else";
    expect(extractComponentName(code, "MyWidget.tsx"))
      .toBe("My Widget");
  });
});

describe("extractDesignFromCSS", () => {
  it("extracts CSS custom properties with color names", () => {
    const css = `
:root {
  --color-primary: #FF5C28;
  --color-background: #F0F3EF;
  --spacing-lg: 2rem;
}`;
    const { colors, variables } = extractDesignFromCSS(css);
    expect(colors["color-primary"]).toBe("#FF5C28");
    expect(colors["color-background"]).toBe("#F0F3EF");
    expect(variables["--spacing-lg"]).toBe("2rem");
    expect(Object.keys(colors)).not.toContain("spacing-lg");
  });

  it("extracts font families from font-family declarations", () => {
    const css = `
.code { font-family: "Menlo", Monaco, monospace; }
.body { font-family: "Inter", sans-serif; }
`;
    const { fonts } = extractDesignFromCSS(css);
    expect(fonts).toContain("Menlo");
    expect(fonts).toContain("Monaco");
    expect(fonts).toContain("Inter");
    expect(fonts).not.toContain("monospace");
    expect(fonts).not.toContain("sans-serif");
  });

  it("handles CSS with no design tokens gracefully", () => {
    const css = `.wrapper { display: flex; gap: 1rem; }`;
    const { colors, fonts, variables } = extractDesignFromCSS(css);
    expect(Object.keys(colors)).toHaveLength(0);
    expect(fonts).toHaveLength(0);
    expect(Object.keys(variables)).toHaveLength(0);
  });

  it("matches the resume-tailoring-agent globals.css colors", () => {
    const css = `
:root {
  --color-primary-black: #101820;
  --color-primary-orange: #FF5C28;
  --color-secondary-orange: #FFC0A4;
  --color-secondary-teal: #3ED0C3;
  --color-accent-green: #B5E800;
  --color-graphite-gray: #5A5A5A;
  --color-background-cream: #F0F3EF;
}`;
    const { colors } = extractDesignFromCSS(css);
    expect(colors["color-primary-orange"]).toBe("#FF5C28");
    expect(colors["color-secondary-teal"]).toBe("#3ED0C3");
    expect(colors["color-accent-green"]).toBe("#B5E800");
    expect(colors["color-background-cream"]).toBe("#F0F3EF");
    expect(Object.keys(colors).length).toBeGreaterThanOrEqual(5);
  });
});
