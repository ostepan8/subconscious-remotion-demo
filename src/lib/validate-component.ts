import { transform } from "sucrase";

/**
 * Every name that exists in the iframe sandbox. If a reference isn't
 * here and isn't locally defined, the component WILL crash at runtime.
 */
const SANDBOX_NAMES = new Set([
  // React
  "React", "useState", "useEffect", "useRef", "useMemo", "useCallback",
  "useContext", "createContext", "useReducer", "useLayoutEffect",
  "forwardRef", "memo", "Children", "cloneElement", "isValidElement",
  "h", "Fragment",

  // Remotion mocks
  "useCurrentFrame", "useVideoConfig", "interpolate", "spring",
  "Easing", "AbsoluteFill", "Sequence", "Img", "staticFile",
  "OffthreadVideo", "Audio", "Video", "continueRender", "delayRender",
  "useNoise2D", "useNoise3D",
  "TransitionSeries", "linearTiming", "springTiming", "fade", "slide", "wipe",

  // Animation helpers from shared.ts
  "fadeInBlur", "fadeInUp", "scaleIn",
  "slideFromLeft", "slideFromRight",
  "glowPulse", "revealLine", "animatedNumber",
  "typewriterReveal", "counterSpinUp", "horizontalWipe",
  "parallaxLayer", "fadeOutDown",
  "staggerEntrance", "floatY", "breathe",

  // Style helpers
  "meshGradientStyle", "animatedMeshBg", "gridPatternStyle",
  "noiseOverlayStyle", "glowOrbStyle", "scanLineStyle", "glowBorderStyle",
  "glassSurface", "glassCard", "depthShadow", "gradientText",
  "accentColor", "shimmerStyle", "isThemeDark", "mergeThemeWithOverrides",

  // Typography & layout
  "getTypography", "spacing", "typography", "typo", "easings",
  "themedHeadlineStyle", "themedButtonStyle",

  // Other sandbox globals
  "MockupPlaceholder",
]);

export interface ValidateResult {
  valid: boolean;
  error?: string;
  fixedCode: string;
}

function stripAndFix(code: string): string {
  let fixed = code
    .replace(/^import\s+type\s[\s\S]*?from\s+['"].*?['"]\s*;?\s*$/gm, "")
    .replace(/^import\s[\s\S]*?from\s+['"].*?['"]\s*;?\s*$/gm, "")
    .replace(/^import\s+['"].*?['"]\s*;?\s*$/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+(const|let|function)\s+/gm, "$1 ")
    .replace(/^export\s+/gm, "")
    .replace(/['"]use client['"]\s*;?/g, "")
    .replace(/['"]use server['"]\s*;?/g, "");

  if (!/function\s+GeneratedComponent\s*\(/.test(fixed)) {
    const funcMatch = fixed.match(
      /function\s+(\w+)\s*\(\s*\{\s*content\s*,\s*theme\s*\}\s*\)/,
    );
    if (funcMatch && funcMatch[1] !== "GeneratedComponent") {
      fixed = fixed.replace(
        new RegExp(`function\\s+${funcMatch[1]}\\b`),
        "function GeneratedComponent",
      );
    }
  }

  fixed = fixed.replace(
    /\.\.\.depthShadow\s*\(([^)]*)\)/g,
    "boxShadow: depthShadow($1)",
  );
  fixed = fixed.replace(
    /const\s*\{\s*typo\s*\}\s*=\s*getTypography\(([^)]*)\)/g,
    "const typo = getTypography($1)",
  );
  fixed = fixed.replace(
    /const\s*\{\s*typography\s*\}\s*=\s*getTypography\(([^)]*)\)/g,
    "const typography = getTypography($1)",
  );

  // Fix typewriterReveal used with a string arg instead of totalChars number.
  fixed = fixed.replace(
    /typewriterReveal\((\w+),\s*(\w+),\s*(\w+)\s*\)/g,
    (match, f, d, third) => {
      if (/^\d+$/.test(third)) return match;
      if (third.endsWith(".length")) return match;
      return `typewriterReveal(${f}, ${d}, ${third}.length)`;
    },
  );

  // Fix theme.brandColors → theme.colors (brandColors doesn't exist)
  fixed = fixed.replace(/theme\.brandColors\.foreground/g, "theme.colors.text");
  fixed = fixed.replace(/theme\.brandColors\.background/g, "theme.colors.background");
  fixed = fixed.replace(/theme\.brandColors\.primary/g, "theme.colors.primary");
  fixed = fixed.replace(/theme\.brandColors\.secondary/g, "theme.colors.secondary");
  fixed = fixed.replace(/theme\.brandColors\.accent/g, "theme.colors.accent");
  fixed = fixed.replace(/theme\.brandColors\./g, "theme.colors.");
  fixed = fixed.replace(/theme\.foreground\b/g, "theme.colors.text");
  fixed = fixed.replace(/theme\.palette\./g, "theme.colors.");

  return fixed;
}

/**
 * Validates generated component code by:
 * 1. Stripping imports/exports
 * 2. Auto-fixing common mistakes
 * 3. Compiling TSX → JS with sucrase (same as preview iframe uses Babel)
 * 4. Evaluating the compiled JS to check for runtime-detectable errors
 */
export function validateComponent(code: string): ValidateResult {
  if (!code?.trim()) {
    return { valid: false, error: "Empty code", fixedCode: code };
  }

  const fixed = stripAndFix(code);

  if (!/function\s+GeneratedComponent\s*\(/.test(fixed)) {
    return {
      valid: false,
      error:
        "Missing 'function GeneratedComponent({ content, theme })'. " +
        "Your component function must be named GeneratedComponent.",
      fixedCode: fixed,
    };
  }

  // Step 1: Compile TSX → JS (mirrors the iframe's Babel transform)
  let compiled: string;
  try {
    const result = transform(fixed, {
      transforms: ["typescript", "jsx"],
      jsxRuntime: "classic",
      jsxPragma: "React.createElement",
      jsxFragmentPragma: "React.Fragment",
    });
    compiled = result.code;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      error: `JSX/TypeScript compilation failed: ${msg}`,
      fixedCode: fixed,
    };
  }

  // Step 2: Check the compiled JS is syntactically valid and
  // all top-level references exist in the sandbox
  const stubDeclarations = Array.from(SANDBOX_NAMES)
    .map((n) => `var ${n} = undefined;`)
    .join("\n");

  try {
    new Function(
      `"use strict";
${stubDeclarations}
var content = {}, theme = {};
${compiled}
return typeof GeneratedComponent;`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    const refMatch = msg.match(/(\w+) is not defined/);
    if (refMatch) {
      return {
        valid: false,
        error:
          `Undefined reference: "${refMatch[1]}" is not available in the sandbox. ` +
          `Only use functions listed in the API reference. Do NOT invent functions.`,
        fixedCode: fixed,
      };
    }

    return {
      valid: false,
      error: `Runtime check failed: ${msg}`,
      fixedCode: fixed,
    };
  }

  // Static check: typewriterReveal returns an object, not a string.
  // If the code calls typewriterReveal but never accesses .visibleChars,
  // it will crash at runtime with "Objects are not valid as a React child".
  if (
    fixed.includes("typewriterReveal(") &&
    !fixed.includes(".visibleChars") &&
    !fixed.includes("visibleChars")
  ) {
    return {
      valid: false,
      error:
        "typewriterReveal() returns { visibleChars, showCursor }, NOT a string. " +
        "You must use: const tw = typewriterReveal(frame, delay, text.length); " +
        "then render text.slice(0, tw.visibleChars). " +
        "Never pass the return value directly as a React child.",
      fixedCode: fixed,
    };
  }

  return { valid: true, fixedCode: fixed };
}
