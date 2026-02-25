/**
 * Server-side validation of generated component code.
 *
 * Convex runtime can't use sucrase/Babel, so we do static analysis:
 * - Strip imports/exports
 * - Auto-fix common mistakes
 * - Check for the GeneratedComponent function
 * - Scan for references to functions that don't exist in the sandbox
 *
 * The Next.js API route does the REAL compile check with sucrase.
 * This catches the obvious issues before code even reaches the DB.
 */

const SANDBOX_NAMES = new Set([
  // React
  "React", "useState", "useEffect", "useRef", "useMemo", "useCallback",
  "useContext", "createContext", "useReducer", "useLayoutEffect",
  "forwardRef", "memo", "Children", "cloneElement", "isValidElement",
  "h", "Fragment",

  // Remotion
  "useCurrentFrame", "useVideoConfig", "interpolate", "spring",
  "Easing", "AbsoluteFill", "Sequence", "Img", "staticFile",
  "OffthreadVideo", "Audio", "Video", "continueRender", "delayRender",
  "useNoise2D", "useNoise3D",
  "TransitionSeries", "linearTiming", "springTiming", "fade", "slide", "wipe",

  // Animation helpers
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

  // Other
  "MockupPlaceholder",
]);

const JS_KEYWORDS = new Set([
  "if", "else", "return", "const", "let", "var", "function", "for",
  "while", "switch", "case", "break", "continue", "new", "typeof",
  "instanceof", "void", "delete", "throw", "try", "catch", "finally",
  "do", "in", "of", "class", "extends", "super", "this", "import",
  "export", "default", "from", "as", "async", "await", "yield",
  "static", "get", "set", "with", "debugger", "true", "false",
  "null", "undefined", "NaN", "Infinity",
]);

const JS_BUILTINS = new Set([
  "console", "Math", "Object", "Array", "String", "Number", "Boolean",
  "Date", "JSON", "Map", "Set", "WeakMap", "WeakSet", "Promise",
  "Error", "TypeError", "ReferenceError", "SyntaxError", "RangeError",
  "parseInt", "parseFloat", "isNaN", "isFinite", "RegExp", "Symbol",
  "encodeURIComponent", "decodeURIComponent", "encodeURI", "decodeURI",
  "setTimeout", "clearTimeout", "setInterval", "clearInterval",
  "window", "document", "Proxy", "Reflect",
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  fixedCode: string;
  undefinedRefs?: string[];
}

function stripAndFix(code: string): string {
  let fixed = code
    .replace(
      /^import\s+type\s[\s\S]*?from\s+['"].*?['"]\s*;?\s*$/gm,
      "",
    )
    .replace(
      /^import\s[\s\S]*?from\s+['"].*?['"]\s*;?\s*$/gm,
      "",
    )
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

  fixed = fixed.replace(
    /typewriterReveal\((\w+),\s*(\w+),\s*(\w+)\s*\)/g,
    (match, f, d, third) => {
      if (/^\d+$/.test(third)) return match;
      if (third.endsWith(".length")) return match;
      return `typewriterReveal(${f}, ${d}, ${third}.length)`;
    },
  );

  return fixed;
}

/**
 * Strip comments and string literal contents so the identifier scanner
 * doesn't flag CSS function names (rgba, translateY, scale, gradient)
 * or words inside comments (palette, colors) as undefined references.
 *
 * Preserves ${...} expressions inside template literals so real
 * identifiers within them still get checked.
 */
function stripCommentsAndStrings(code: string): string {
  const out: string[] = [];
  let i = 0;
  const len = code.length;

  while (i < len) {
    const c = code[i];

    if (c === "/" && i + 1 < len && code[i + 1] === "/") {
      const nl = code.indexOf("\n", i);
      const end = nl === -1 ? len : nl;
      out.push(" ".repeat(end - i));
      i = end;
      continue;
    }

    if (c === "/" && i + 1 < len && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const close = end === -1 ? len : end + 2;
      for (let j = i; j < close; j++) {
        out.push(code[j] === "\n" ? "\n" : " ");
      }
      i = close;
      continue;
    }

    if (c === "'" || c === '"') {
      out.push(c);
      i++;
      while (i < len && code[i] !== c) {
        if (code[i] === "\\" && i + 1 < len) {
          out.push("  ");
          i += 2;
        } else {
          out.push(code[i] === "\n" ? "\n" : " ");
          i++;
        }
      }
      if (i < len) { out.push(c); i++; }
      continue;
    }

    if (c === "`") {
      out.push(c);
      i++;
      while (i < len && code[i] !== "`") {
        if (code[i] === "\\" && i + 1 < len) {
          out.push("  ");
          i += 2;
        } else if (code[i] === "$" && i + 1 < len && code[i + 1] === "{") {
          out.push("${");
          i += 2;
          let depth = 1;
          while (i < len && depth > 0) {
            if (code[i] === "{") depth++;
            else if (code[i] === "}") {
              depth--;
              if (depth === 0) { out.push("}"); i++; break; }
            }
            out.push(code[i]);
            i++;
          }
        } else {
          out.push(code[i] === "\n" ? "\n" : " ");
          i++;
        }
      }
      if (i < len) { out.push("`"); i++; }
      continue;
    }

    out.push(c);
    i++;
  }

  return out.join("");
}

/**
 * Extract function/variable calls that look like top-level sandbox
 * references and check they exist. Only flags PascalCase components
 * and camelCase function calls that are clearly not local.
 */
function findUndefinedCalls(code: string): string[] {
  const stripped = stripCommentsAndStrings(code);

  const localDefs = new Set<string>();

  for (const m of code.matchAll(
    /(?:const|let|var|function)\s+(\w+)/g,
  )) {
    localDefs.add(m[1]);
  }
  for (const m of code.matchAll(
    /\(\s*\{\s*([^}]+)\}\s*\)/g,
  )) {
    for (const p of m[1].split(",")) {
      const name = p.trim().split(/\s*[=:]/)[0].trim();
      if (name && /^\w+$/.test(name)) localDefs.add(name);
    }
  }
  for (const m of code.matchAll(
    /\.(?:map|filter|reduce|forEach|find|some|every|flatMap)\(\s*\(?\s*(\w+)/g,
  )) {
    localDefs.add(m[1]);
  }
  for (const m of code.matchAll(
    /\(([^)]*)\)\s*=>/g,
  )) {
    for (const p of m[1].split(",")) {
      const name = p.trim().split(/\s*[=:]/)[0].trim();
      if (name && /^\w+$/.test(name)) localDefs.add(name);
    }
  }

  const callRe = /(?<![.'"\w])([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:\(|<(?![/=]))/g;
  const undefined_: string[] = [];
  let match;
  while ((match = callRe.exec(stripped)) !== null) {
    const name = match[1];
    if (
      name.length <= 1 ||
      SANDBOX_NAMES.has(name) ||
      JS_KEYWORDS.has(name) ||
      JS_BUILTINS.has(name) ||
      localDefs.has(name) ||
      name === "GeneratedComponent" ||
      name === "content" ||
      name === "theme" ||
      name === "frame" ||
      /^(type|interface|string|number|boolean|any|void|never|unknown|object)$/.test(name)
    ) {
      continue;
    }

    if (
      name[0] === name[0].toUpperCase() ||
      match[0].includes("(")
    ) {
      undefined_.push(name);
    }
  }

  return [...new Set(undefined_)];
}

export function validateComponentCode(code: string): ValidationResult {
  if (!code || !code.trim()) {
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

  const undefinedRefs = findUndefinedCalls(fixed);
  if (undefinedRefs.length > 0) {
    return {
      valid: false,
      error:
        `Undefined references: ${undefinedRefs.join(", ")}. ` +
        `These functions/components don't exist in the sandbox. ` +
        `Only use functions listed in the API reference. Do NOT invent functions.`,
      fixedCode: fixed,
      undefinedRefs,
    };
  }

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
