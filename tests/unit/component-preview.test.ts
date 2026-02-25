import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Replicate the key functions from MediaGallery.tsx so we can test them
// ---------------------------------------------------------------------------

function extractPropsFromSource(source: string): Record<string, string> {
  const props: Record<string, string> = {};

  const exportDefaultMatch = source.match(
    /export\s+default\s+function\s+\w+\s*\(\s*\{([^}]+)\}/
  );
  const plainFuncMatch = source.match(
    /function\s+\w+\s*\(\s*\{([^}]+)\}/
  );
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
        props[name] = '{"headline":"test"}';
      } else if (name === "theme") {
        props[name] = '{"colors":{}}';
      } else {
        props[name] = `"${name}"`;
      }
    }
    return props;
  }
  return props;
}

// ---------------------------------------------------------------------------
// Import parser + auto-mock generator (replicated from MediaGallery.tsx)
// ---------------------------------------------------------------------------

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
  "meshGradientStyle", "gridPatternStyle", "noiseOverlayStyle",
  "glowOrbStyle", "glassSurface", "glassCard", "depthShadow",
  "gradientText", "accentColor", "shimmerStyle",
  "isThemeDark", "mergeThemeWithOverrides",
  "easings", "spacing", "typography", "getTypography",
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

    const defaultMatch = clause.match(/^(\w+)/);
    if (defaultMatch && !clause.startsWith("{")) {
      results.push({ name: defaultMatch[1], source: src, isDefault: true });
    }

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

  if (source.match(/\.module\.(css|scss|less|sass)/) || name === "styles") {
    return `var ${name} = new Proxy({}, { get: (_, k) => typeof k === 'string' ? k : '' });`;
  }
  if (name === "Link" && source.includes("next")) {
    return `var Link = function(p) { return React.createElement('a', { href: p.href || '#' }, p.children); };`;
  }
  if (name === "Image" && source.includes("next")) {
    return `var Image = function(p) { return React.createElement('img', { src: p.src || '', alt: p.alt || '' }); };`;
  }
  if (name.match(/^use[A-Z]/)) {
    return `var ${name} = function() { return {}; };`;
  }
  if (name[0] === name[0].toUpperCase() && name[0] !== name[0].toLowerCase()) {
    return `var ${name} = function(p) { return React.createElement('div', null, p?.children); };`;
  }
  return `var ${name} = function() { return null; };`;
}

function generateAllAutoMocks(source: string): string[] {
  const imports = parseImports(source);
  const mocks: string[] = [];
  const seen = new Set<string>();
  for (const imp of imports) {
    if (seen.has(imp.name) || ALREADY_MOCKED.has(imp.name)) continue;
    seen.add(imp.name);
    const mock = generateAutoMock(imp);
    if (mock) mocks.push(mock);
  }
  return mocks;
}

function stripImportsAndExports(source: string): string {
  return source
    .replace(/^import\s+type\s[\s\S]*?from\s+['"].*?['"]\s*;?\s*$/gm, "")
    .replace(/^import\s[\s\S]*?from\s+['"].*?['"]\s*;?\s*$/gm, "")
    .replace(/^import\s+['"].*?['"]\s*;?\s*$/gm, "")
    .replace(/^export\s+default\s+/gm, "var __default__ = ")
    .replace(/^export\s+(const|let)\s+/gm, "var ")
    .replace(/^export\s+/gm, "")
    .replace(/['"]use client['"]\s*;?/g, "")
    .replace(/['"]use server['"]\s*;?/g, "");
}

// All top-level identifiers that our iframe provides as mocks.
// These are the things imported from remotion, ./shared, @/types, etc.
const MOCKED_TOP_LEVEL = new Set([
  // React (available globally)
  "React", "ReactDOM", "h", "Fragment",
  "useState", "useEffect", "useRef", "useMemo", "useCallback",
  "useContext", "createContext", "useReducer", "useLayoutEffect",
  "forwardRef", "memo", "Children", "cloneElement", "isValidElement",
  // Remotion
  "useCurrentFrame", "useVideoConfig", "interpolate", "spring", "Easing",
  "Sequence", "AbsoluteFill", "Img", "OffthreadVideo", "Audio", "Video",
  "staticFile", "continueRender", "delayRender",
  // Noise
  "useNoise2D", "useNoise3D",
  // Transitions
  "TransitionSeries", "linearTiming", "springTiming", "fade", "slide", "wipe",
  // Shared animation/style helpers
  "fadeInBlur", "fadeInUp", "scaleIn", "slideFromLeft", "slideFromRight",
  "glowPulse", "revealLine", "animatedNumber", "typewriterReveal",
  "counterSpinUp", "horizontalWipe", "parallaxLayer", "fadeOutDown",
  "meshGradientStyle", "gridPatternStyle", "noiseOverlayStyle",
  "glowOrbStyle", "glassSurface", "glassCard", "depthShadow",
  "gradientText", "accentColor", "shimmerStyle",
  "isThemeDark", "mergeThemeWithOverrides",
  "easings", "spacing", "typography", "getTypography",
  "MockupPlaceholder",
]);

/**
 * Find identifiers that are used as top-level function calls or JSX tags
 * AFTER import stripping, and check they're either declared locally or mocked.
 */
function findMissingTopLevelMocks(cleanedSource: string): string[] {
  const locallyDeclared = new Set<string>();
  const missingIds = new Set<string>();

  // Find all locally declared names
  const declRe = /(?:const|let|var|function|class)\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = declRe.exec(cleanedSource))) {
    locallyDeclared.add(m[1]);
  }

  // Find top-level function calls at statement level or as value expressions
  // Pattern: identifier( — but only if it's a standalone call, not a method
  const callRe = /(?:^|[=,;({[\s])([A-Z_]\w*)\s*\(/gm;
  while ((m = callRe.exec(cleanedSource))) {
    const name = m[1];
    if (!locallyDeclared.has(name) && !MOCKED_TOP_LEVEL.has(name)) {
      // Skip common JS builtins
      if (["Math", "JSON", "Object", "Array", "String", "Number", "Boolean",
           "Date", "RegExp", "Error", "Promise", "Map", "Set", "Symbol",
           "console", "parseInt", "parseFloat", "isNaN", "NaN",
           "Infinity", "undefined"].includes(name)) continue;
      missingIds.add(name);
    }
  }

  // Find JSX component usage: <ComponentName
  const jsxRe = /<([A-Z]\w+)/g;
  while ((m = jsxRe.exec(cleanedSource))) {
    const name = m[1];
    if (!locallyDeclared.has(name) && !MOCKED_TOP_LEVEL.has(name)) {
      missingIds.add(name);
    }
  }

  return Array.from(missingIds);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const scenesDir = path.resolve(__dirname, "../../src/components/video/scenes");

const SCENE_FILES = [
  "HeroScene.tsx",
  "FeaturesScene.tsx",
  "StatsScene.tsx",
  "BentoGridScene.tsx",
  "TestimonialScene.tsx",
  "CTAScene.tsx",
  "CustomScene.tsx",
  "GradientTextScene.tsx",
  "PricingScene.tsx",
  "ComparisonScene.tsx",
  "FAQScene.tsx",
  "HowItWorksScene.tsx",
  "TimelineScene.tsx",
  "CountdownScene.tsx",
  "BeforeAfterScene.tsx",
  "SocialProofScene.tsx",
  "TeamScene.tsx",
  "LogoCloudScene.tsx",
  "ImageShowcaseScene.tsx",
  "ProductShowcaseScene.tsx",
];

describe("Prop extraction", () => {
  for (const file of SCENE_FILES) {
    it(`extracts content+theme from ${file}`, () => {
      const src = fs.readFileSync(path.join(scenesDir, file), "utf-8");
      const props = extractPropsFromSource(src);
      expect(Object.keys(props).length).toBeGreaterThan(0);
      // All scene files should have content and theme
      expect(props).toHaveProperty("content");
      expect(props).toHaveProperty("theme");
    });
  }

  it("handles arrow function components", () => {
    const src = `const MyComp = ({ title, count }: { title: string; count: number }) => {
      return <div>{title}: {count}</div>;
    };
    export default MyComp;`;
    const props = extractPropsFromSource(src);
    expect(props).toHaveProperty("title");
    expect(props).toHaveProperty("count");
  });

  it("handles named export function", () => {
    const src = `export default function Card({ heading, body }: Props) {
      return <div><h1>{heading}</h1><p>{body}</p></div>;
    }`;
    const props = extractPropsFromSource(src);
    expect(props).toHaveProperty("heading");
    expect(props).toHaveProperty("body");
  });

  it("prefers export default over helper functions", () => {
    // SocialProofScene has a StarRating helper function before the main export
    const src = `
      function StarRating({ stars, color }: { stars: number; color: string }) {
        return <div>stars</div>;
      }
      export default function MainScene({ content, theme }: { content: any; theme: any }) {
        return <div><StarRating stars={5} color="gold" /></div>;
      }
    `;
    const props = extractPropsFromSource(src);
    expect(props).toHaveProperty("content");
    expect(props).toHaveProperty("theme");
  });
});

describe("Import stripping", () => {
  it("strips all import statements including type imports", () => {
    const src = `import { AbsoluteFill } from "remotion";
import type { VideoTheme } from "@/types";
import MockupPlaceholder from "./MockupPlaceholder";

export default function Test({ content }: any) { return null; }`;
    const cleaned = stripImportsAndExports(src);
    expect(cleaned).not.toContain("import");
    expect(cleaned).toContain("var __default__ = function Test");
  });

  it("converts export default to var __default__", () => {
    const src = `export default function MyComp() { return null; }`;
    const cleaned = stripImportsAndExports(src);
    expect(cleaned).toContain("var __default__ = function MyComp");
  });

  it("strips named exports and converts const/let to var", () => {
    const src = `export const helper = () => {};
export function util() {}`;
    const cleaned = stripImportsAndExports(src);
    expect(cleaned).not.toMatch(/^export /m);
    expect(cleaned).toContain("var helper");
    expect(cleaned).toContain("function util");
  });
});

describe("Mock coverage — all imported identifiers are mocked", () => {
  for (const file of SCENE_FILES) {
    it(`${file} — all top-level identifiers are mocked`, () => {
      const src = fs.readFileSync(path.join(scenesDir, file), "utf-8");
      const cleaned = stripImportsAndExports(src);
      const missing = findMissingTopLevelMocks(cleaned);
      if (missing.length > 0) {
        console.log(`  Missing mocks for ${file}: ${missing.join(", ")}`);
      }
      expect(missing).toEqual([]);
    });
  }
});

describe("Spacing mock completeness", () => {
  it("has all spacing keys used across scene files", () => {
    const allKeys = new Set<string>();
    for (const file of SCENE_FILES) {
      const src = fs.readFileSync(path.join(scenesDir, file), "utf-8");
      const re = /spacing\.(\w+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) allKeys.add(m[1]);
    }

    const mockedKeys = new Set([
      "scenePadding", "scenePaddingX", "sectionGap",
      "cardGap", "cardPadding", "borderRadius",
    ]);

    for (const key of allKeys) {
      expect(mockedKeys.has(key), `spacing.${key} should be mocked`).toBe(true);
    }
  });
});

describe("Typography mock completeness", () => {
  it("has all typography keys used across scene files", () => {
    const allKeys = new Set<string>();
    for (const file of SCENE_FILES) {
      const src = fs.readFileSync(path.join(scenesDir, file), "utf-8");
      const re = /typography\.(\w+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) allKeys.add(m[1]);
    }

    const mockedKeys = new Set([
      "heroTitle", "sectionTitle", "cardTitle",
      "body", "bodyLg", "caption", "stat", "label",
    ]);

    for (const key of allKeys) {
      expect(mockedKeys.has(key), `typography.${key} should be mocked`).toBe(true);
    }
  });
});

describe("Import parsing", () => {
  it("parses default imports", () => {
    const imports = parseImports(`import Link from 'next/link'`);
    expect(imports).toEqual([{ name: "Link", source: "next/link", isDefault: true }]);
  });

  it("parses named imports", () => {
    const imports = parseImports(`import { useState, useEffect } from 'react'`);
    expect(imports).toHaveLength(2);
    expect(imports[0].name).toBe("useState");
    expect(imports[1].name).toBe("useEffect");
  });

  it("parses aliased imports", () => {
    const imports = parseImports(`import { foo as bar } from './lib'`);
    expect(imports[0].name).toBe("bar");
  });

  it("parses mixed default + named imports", () => {
    const imports = parseImports(`import Image, { StaticImageData } from 'next/image'`);
    expect(imports).toHaveLength(2);
    expect(imports[0]).toEqual({ name: "Image", source: "next/image", isDefault: true });
    expect(imports[1]).toEqual({ name: "StaticImageData", source: "next/image", isDefault: false });
  });

  it("skips type-only imports", () => {
    const imports = parseImports(`import type { VideoTheme } from '@/types'`);
    expect(imports).toHaveLength(0);
  });
});

describe("Multi-line import stripping", () => {
  const MULTILINE_SOURCE = `'use client'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  useUser,
} from '@clerk/nextjs'
import { useAuth } from '../../lib/auth-context'
import styles from './Navbar.module.css'
export default function Navbar() {
  const x = useAuth()
  return <nav>Hello</nav>
}`;

  it("strips multi-line imports completely", () => {
    const cleaned = stripImportsAndExports(MULTILINE_SOURCE);
    expect(cleaned).not.toContain("SignInButton,");
    expect(cleaned).not.toContain("SignUpButton,");
    expect(cleaned).not.toContain("SignedIn,");
    expect(cleaned).not.toContain("SignedOut,");
    expect(cleaned).not.toContain("} from '@clerk/nextjs'");
    expect(cleaned).not.toContain("from 'react'");
    expect(cleaned).not.toContain("from 'next/link'");
    expect(cleaned).not.toContain("import");
  });

  it("preserves the function body after stripping", () => {
    const cleaned = stripImportsAndExports(MULTILINE_SOURCE);
    expect(cleaned).toContain("var __default__ = function Navbar()");
    expect(cleaned).toContain("const x = useAuth()");
    expect(cleaned).toContain("<nav>Hello</nav>");
  });

  it("strips 'use client' directive", () => {
    const cleaned = stripImportsAndExports(MULTILINE_SOURCE);
    expect(cleaned).not.toContain("use client");
  });

  it("handles side-effect-only imports", () => {
    const src = `import 'some-polyfill'\nconst x = 1;`;
    const cleaned = stripImportsAndExports(src);
    expect(cleaned).not.toContain("import");
    expect(cleaned).toContain("const x = 1;");
  });
});

describe("Auto-mock generation", () => {
  it("mocks CSS modules as Proxy", () => {
    const mock = generateAutoMock({ name: "styles", source: "./Navbar.module.css", isDefault: true });
    expect(mock).toContain("Proxy");
    expect(mock).toContain("styles");
  });

  it("mocks Next.js Link as <a>", () => {
    const mock = generateAutoMock({ name: "Link", source: "next/link", isDefault: true });
    expect(mock).toContain("Link");
    expect(mock).toContain("createElement");
    expect(mock).toContain("'a'");
  });

  it("mocks Next.js Image as <img>", () => {
    const mock = generateAutoMock({ name: "Image", source: "next/image", isDefault: true });
    expect(mock).toContain("Image");
    expect(mock).toContain("'img'");
  });

  it("mocks hooks as functions returning objects", () => {
    const mock = generateAutoMock({ name: "useAuth", source: "../../lib/auth-context", isDefault: false });
    expect(mock).toContain("useAuth");
    expect(mock).toContain("function");
    expect(mock).toContain("return");
  });

  it("mocks PascalCase names as components", () => {
    const mock = generateAutoMock({ name: "SignInButton", source: "@clerk/nextjs", isDefault: false });
    expect(mock).toContain("SignInButton");
    expect(mock).toContain("createElement");
    expect(mock).toContain("children");
  });

  it("skips already-mocked identifiers", () => {
    const mock = generateAutoMock({ name: "useState", source: "react", isDefault: false });
    expect(mock).toBe("");
  });
});

describe("Auto-mock coverage for real-world components", () => {
  const NAVBAR_SOURCE = `'use client'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  useUser,
} from '@clerk/nextjs'
import { useAuth } from '../../lib/auth-context'
import styles from './Navbar.module.css'
export default function Navbar() {
  const { profile, loading, signOut, isConfigured } = useAuth()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  return (
    <nav className={styles.nav}>
      <Link href="/"><Image src="/logo.png" alt="Logo" width={162} height={30} /></Link>
      <SignedOut><SignInButton mode="modal"><button>Sign In</button></SignInButton></SignedOut>
      <SignedIn><div>Logged in</div></SignedIn>
    </nav>
  )
}`;

  it("generates mocks for all non-React imports in Navbar", () => {
    const mocks = generateAllAutoMocks(NAVBAR_SOURCE);
    const mockText = mocks.join("\n");

    expect(mockText).toContain("Link");
    expect(mockText).toContain("Image");
    expect(mockText).toContain("SignInButton");
    expect(mockText).toContain("SignUpButton");
    expect(mockText).toContain("SignedIn");
    expect(mockText).toContain("SignedOut");
    expect(mockText).toContain("useUser");
    expect(mockText).toContain("useAuth");
    expect(mockText).toContain("styles");
    expect(mockText).toContain("Proxy");

    // Should NOT generate mocks for React builtins
    expect(mockText).not.toMatch(/var useState/);
    expect(mockText).not.toMatch(/var useEffect/);
    expect(mockText).not.toMatch(/var useRef/);
  });

  it("generates correct number of mocks (no duplicates, no React builtins)", () => {
    const mocks = generateAllAutoMocks(NAVBAR_SOURCE);
    // Link, Image, SignInButton, SignUpButton, SignedIn, SignedOut, useUser, useAuth, styles = 9
    expect(mocks).toHaveLength(9);
  });

  it("extracts no props from zero-arg Navbar component", () => {
    const props = extractPropsFromSource(NAVBAR_SOURCE);
    expect(Object.keys(props)).toHaveLength(0);
  });

  it("produces clean source with no import fragments after stripping", () => {
    const cleaned = stripImportsAndExports(NAVBAR_SOURCE);

    expect(cleaned).not.toContain("from '@clerk/nextjs'");
    expect(cleaned).not.toContain("from 'react'");
    expect(cleaned).not.toContain("from 'next/link'");
    expect(cleaned).not.toContain("from 'next/image'");
    expect(cleaned).not.toContain("from '../../lib/auth-context'");
    expect(cleaned).not.toContain("from './Navbar.module.css'");
    expect(cleaned).not.toContain("import ");

    const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
    for (const line of lines) {
      expect(line.trim()).not.toMatch(
        /^(SignInButton|SignUpButton|SignedIn|SignedOut|useUser),?$/
      );
    }

    expect(cleaned).toContain("var __default__ = function Navbar()");
  });
});
