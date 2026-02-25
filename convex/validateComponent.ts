/**
 * Server-side validation of generated component code.
 * Checks for syntax issues and attempts to auto-fix common problems.
 */
export function validateComponentCode(code: string): {
  valid: boolean;
  error?: string;
  fixedCode: string;
} {
  if (!code || !code.trim()) {
    return { valid: false, error: "Empty code", fixedCode: code };
  }

  let fixed = code;

  fixed = fixed
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
    .replace(/^export\s+(const|let)\s+/gm, "$1 ")
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

  const spreadDepthShadow = /\.\.\.depthShadow\s*\(/g;
  if (spreadDepthShadow.test(fixed)) {
    fixed = fixed.replace(
      /\.\.\.depthShadow\s*\(([^)]*)\)/g,
      "boxShadow: depthShadow($1)",
    );
  }

  const destructureTypo = /const\s*\{\s*typo\s*\}\s*=\s*getTypography/g;
  if (destructureTypo.test(fixed)) {
    fixed = fixed.replace(
      /const\s*\{\s*typo\s*\}\s*=\s*getTypography\(([^)]*)\)/g,
      "const typo = getTypography($1)",
    );
  }

  try {
    new Function(
      "React",
      "useCurrentFrame",
      "interpolate",
      "spring",
      "AbsoluteFill",
      "Sequence",
      "Img",
      "useVideoConfig",
      "useState",
      "useEffect",
      "useRef",
      "useMemo",
      "useCallback",
      `"use strict";\n${fixed}\nreturn typeof GeneratedComponent !== 'undefined';`,
    );
    return { valid: true, fixedCode: fixed };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err),
      fixedCode: fixed,
    };
  }
}
