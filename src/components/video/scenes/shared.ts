import { interpolate, Easing } from "remotion";
import type { VideoTheme, SceneStyleOverrides } from "@/types";
import type { CSSProperties } from "react";

// ---------------------------------------------------------------------------
// Safe theme defaults — prevents crashes when theme/colors/fonts are missing
// ---------------------------------------------------------------------------

const DEFAULT_COLORS = {
  background: "#0f0f14",
  surface: "#1a1a24",
  primary: "#6366f1",
  secondary: "#8b5cf6",
  text: "#f0f0f5",
  textMuted: "#888",
  accent: "#a78bfa",
  glow: "#6366f1",
} as const;

const DEFAULT_FONTS = { heading: "system-ui", body: "system-ui" } as const;

function safeTheme(theme: VideoTheme | null | undefined) {
  const t = theme ?? ({} as Partial<VideoTheme>);
  return {
    colors: { ...DEFAULT_COLORS, ...t.colors },
    fonts: { ...DEFAULT_FONTS, ...t.fonts },
    borderRadius: t.borderRadius ?? 20,
    personality: t.personality ?? {},
    vibe: t.personality?.vibe as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Easing presets
// ---------------------------------------------------------------------------

export const easings = {
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  snappy: Easing.bezier(0.16, 1, 0.3, 1),
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
  elastic: Easing.bezier(0.68, -0.6, 0.32, 1.6),
  decel: Easing.out(Easing.cubic),
};

// ---------------------------------------------------------------------------
// Animation builders — return partial CSSProperties keyed to the current frame
// ---------------------------------------------------------------------------

export function fadeInUp(
  frame: number,
  delay: number,
  distance = 40,
  dur = 20,
): CSSProperties {
  const o = interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });
  const y = interpolate(frame, [delay, delay + dur], [distance, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });
  return { opacity: o, transform: `translateY(${y}px)` };
}

export function fadeInBlur(
  frame: number,
  delay: number,
  dur = 22,
): CSSProperties {
  const o = interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
  const blur = interpolate(frame, [delay, delay + dur], [16, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
  const y = interpolate(frame, [delay, delay + dur], [24, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
  return {
    opacity: o,
    transform: `translateY(${y}px)`,
    filter: `blur(${blur}px)`,
  };
}

export function scaleIn(
  frame: number,
  delay: number,
  dur = 18,
): CSSProperties {
  const o = interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.spring,
  });
  const s = interpolate(frame, [delay, delay + dur], [0.7, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.spring,
  });
  return { opacity: o, transform: `scale(${s})` };
}

export function slideFromLeft(
  frame: number,
  delay: number,
  distance = 60,
  dur = 20,
): CSSProperties {
  const o = interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });
  const x = interpolate(frame, [delay, delay + dur], [-distance, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });
  return { opacity: o, transform: `translateX(${x}px)` };
}

export function slideFromRight(
  frame: number,
  delay: number,
  distance = 60,
  dur = 20,
): CSSProperties {
  const o = interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });
  const x = interpolate(frame, [delay, delay + dur], [distance, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });
  return { opacity: o, transform: `translateX(${x}px)` };
}

export function revealLine(
  frame: number,
  delay: number,
  dur = 16,
): CSSProperties {
  const w = interpolate(frame, [delay, delay + dur], [0, 100], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.decel,
  });
  return { width: `${w}%` };
}

export function glowPulse(
  frame: number,
  delay: number,
  color: string,
): CSSProperties {
  const o = interpolate(frame, [delay, delay + 14], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });
  const pulse = interpolate(
    frame,
    [delay + 20, delay + 40, delay + 60, delay + 80, delay + 100],
    [1, 1.06, 1, 1.04, 1],
    { extrapolateRight: "extend" },
  );
  const glowIntensity = interpolate(
    frame,
    [delay + 20, delay + 40, delay + 60, delay + 80],
    [30, 50, 30, 45],
    { extrapolateRight: "extend" },
  );
  return {
    opacity: o,
    transform: `scale(${pulse})`,
    boxShadow: `0 0 ${glowIntensity}px ${color}50, 0 0 ${glowIntensity * 2}px ${color}25`,
  };
}

// ---------------------------------------------------------------------------
// Animated number counter — interpolates between 0 and a target value
// ---------------------------------------------------------------------------

export function animatedNumber(
  frame: number,
  delay: number,
  targetStr: string,
  dur = 24,
): string {
  const numericMatch = targetStr.match(/([\d,.]+)/);
  if (!numericMatch) return targetStr;

  const numStr = numericMatch[1];
  const numVal = parseFloat(numStr.replace(/,/g, ""));
  if (isNaN(numVal)) return targetStr;

  const current = interpolate(frame, [delay, delay + dur], [0, numVal], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.decel,
  });

  const hasDecimal = numStr.includes(".");
  const decimals = hasDecimal ? (numStr.split(".")[1]?.length || 1) : 0;
  const formatted = hasDecimal ? current.toFixed(decimals) : Math.round(current).toLocaleString();

  return targetStr.replace(numStr, formatted);
}

// ---------------------------------------------------------------------------
// Decorative background helpers — return CSSProperties for layered backgrounds
// ---------------------------------------------------------------------------

export function meshGradientStyle(theme: VideoTheme): CSSProperties {
  const { colors, vibe } = safeTheme(theme);
  const base: CSSProperties = { position: "absolute", inset: 0 };

  if (vibe === "cyberpunk") {
    return {
      ...base,
      background: [
        `radial-gradient(ellipse 70% 50% at 20% 30%, ${colors.primary}35 0%, transparent 55%)`,
        `radial-gradient(ellipse 50% 60% at 80% 70%, ${colors.secondary}30 0%, transparent 50%)`,
        `radial-gradient(ellipse 80% 30% at 50% 0%, ${colors.accent}22 0%, transparent 45%)`,
      ].join(", "),
    };
  }

  if (vibe === "minimal") {
    return {
      ...base,
      background: `radial-gradient(ellipse 120% 80% at 50% 30%, ${colors.primary}06 0%, transparent 70%)`,
    };
  }

  if (vibe === "editorial") {
    return {
      ...base,
      background: `radial-gradient(ellipse 100% 100% at 50% 50%, ${colors.background} 40%, ${colors.secondary}08 100%)`,
    };
  }

  if (vibe === "energetic") {
    return {
      ...base,
      background: [
        `radial-gradient(ellipse 60% 60% at 10% 20%, ${colors.primary}30 0%, transparent 50%)`,
        `radial-gradient(ellipse 50% 50% at 90% 80%, ${colors.secondary}28 0%, transparent 45%)`,
        `radial-gradient(ellipse 70% 40% at 50% 10%, ${colors.accent}20 0%, transparent 50%)`,
        `linear-gradient(135deg, transparent 40%, ${colors.primary}08 50%, transparent 60%)`,
      ].join(", "),
    };
  }

  if (vibe === "luxury") {
    return {
      ...base,
      background: `radial-gradient(ellipse 90% 70% at 50% 40%, ${colors.accent}0a 0%, transparent 60%)`,
    };
  }

  return {
    ...base,
    background: [
      `radial-gradient(ellipse 80% 50% at 20% 30%, ${colors.primary}25 0%, transparent 60%)`,
      `radial-gradient(ellipse 60% 70% at 80% 70%, ${colors.accent}20 0%, transparent 55%)`,
      `radial-gradient(ellipse 90% 40% at 50% 0%, ${colors.secondary}18 0%, transparent 50%)`,
    ].join(", "),
  };
}

export function gridPatternStyle(theme: VideoTheme): CSSProperties {
  const { colors, vibe } = safeTheme(theme);
  const base: CSSProperties = { position: "absolute", inset: 0 };

  if (vibe === "cyberpunk") {
    const c = `${colors.primary}18`;
    return {
      ...base,
      backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
      backgroundSize: "40px 40px",
    };
  }

  if (vibe === "minimal") {
    const c = `${colors.textMuted}08`;
    return {
      ...base,
      backgroundImage: `radial-gradient(circle, ${c} 1px, transparent 1px)`,
      backgroundSize: "32px 32px",
    };
  }

  if (vibe === "editorial" || vibe === "luxury") {
    return { ...base, background: "transparent" };
  }

  if (vibe === "energetic") {
    const c1 = `${colors.primary}10`;
    const c2 = `${colors.secondary}08`;
    return {
      ...base,
      backgroundImage: `repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 80px,
        ${c1} 80px,
        ${c1} 82px
      ), repeating-linear-gradient(
        45deg,
        transparent,
        transparent 120px,
        ${c2} 120px,
        ${c2} 122px
      )`,
    };
  }

  const c = `${colors.textMuted}12`;
  return {
    ...base,
    backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
    backgroundSize: "60px 60px",
  };
}

export function noiseOverlayStyle(): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    opacity: 0.03,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    backgroundSize: "128px 128px",
  };
}

// ---------------------------------------------------------------------------
// Glassmorphism card style
// ---------------------------------------------------------------------------

export function glassSurface(theme: VideoTheme): CSSProperties {
  const { colors, vibe } = safeTheme(theme);

  if (vibe === "cyberpunk") {
    const glow = colors.glow || colors.primary;
    return {
      background: `${colors.surface}cc`,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${glow}30`,
      boxShadow: `0 0 20px ${glow}12, 0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${glow}10`,
    };
  }

  if (vibe === "minimal") {
    return {
      background: colors.surface,
      border: "1px solid rgba(0,0,0,0.06)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
    };
  }

  if (vibe === "editorial") {
    return {
      background: "transparent",
      border: `1px solid ${colors.primary}15`,
      boxShadow: "none",
    };
  }

  if (vibe === "energetic") {
    return {
      background: `${colors.surface}ee`,
      border: `2px solid ${colors.primary}35`,
      boxShadow: `0 4px 24px ${colors.primary}15, 0 1px 2px rgba(0,0,0,0.2)`,
    };
  }

  if (vibe === "luxury") {
    return {
      background: colors.surface,
      border: `1px solid ${colors.accent}25`,
      boxShadow: `0 4px 20px rgba(45,42,38,0.06), 0 1px 2px rgba(45,42,38,0.04)`,
    };
  }

  const isDark = isThemeDark(theme);
  return {
    background: isDark
      ? `${colors.surface}dd`
      : `${colors.surface}ee`,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
    boxShadow: isDark
      ? `0 4px 32px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)`
      : `0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`,
  };
}

export function glassCard(theme: VideoTheme, radius?: number): CSSProperties {
  const r = radius ?? safeTheme(theme).borderRadius;
  return {
    ...glassSurface(theme),
    borderRadius: r,
  };
}

// ---------------------------------------------------------------------------
// Gradient text
// ---------------------------------------------------------------------------

export function gradientText(from: string, to: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  };
}

// ---------------------------------------------------------------------------
// Shimmer / shine sweep on a surface
// ---------------------------------------------------------------------------

export function shimmerStyle(frame: number, delay: number): CSSProperties {
  const pos = interpolate(frame, [delay, delay + 40], [-100, 200], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
  return {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(105deg, transparent ${pos - 30}%, rgba(255,255,255,0.08) ${pos}%, transparent ${pos + 30}%)`,
    pointerEvents: "none",
    borderRadius: "inherit",
  };
}

// ---------------------------------------------------------------------------
// Glow orb (decorative floating circle)
// ---------------------------------------------------------------------------

export function glowOrbStyle(
  frame: number,
  color: string,
  size: number,
  x: string,
  y: string,
  delay = 0,
): CSSProperties {
  const s = interpolate(frame, [delay, delay + 40], [0.6, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
  const breathe = interpolate(
    frame,
    [0, 60, 120],
    [1, 1.12, 1],
    { extrapolateRight: "extend" },
  );
  return {
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${color}38 0%, ${color}15 50%, transparent 70%)`,
    left: x,
    top: y,
    transform: `scale(${s * breathe})`,
    filter: "blur(2px)",
    pointerEvents: "none",
  };
}

// ---------------------------------------------------------------------------
// Multi-layer shadow
// ---------------------------------------------------------------------------

export function depthShadow(theme?: VideoTheme): string {
  const { colors, vibe } = safeTheme(theme);

  if (vibe === "cyberpunk") {
    const glow = colors.glow || colors.primary;
    return `0 0 15px ${glow}18, 0 4px 24px rgba(0,0,0,0.5), 0 16px 64px rgba(0,0,0,0.4)`;
  }

  if (vibe === "minimal") {
    return `0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.03)`;
  }

  if (vibe === "editorial") {
    return `0 2px 8px rgba(0,0,0,0.04)`;
  }

  if (vibe === "energetic") {
    return `0 4px 16px ${colors.primary}18, 0 12px 40px rgba(0,0,0,0.35), 0 32px 80px rgba(0,0,0,0.2)`;
  }

  if (vibe === "luxury") {
    return `0 2px 8px rgba(45,42,38,0.06), 0 12px 32px rgba(45,42,38,0.08)`;
  }

  const isDark = isThemeDark(theme);
  if (isDark) {
    return `0 2px 6px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.35), 0 32px 80px rgba(0,0,0,0.25)`;
  }
  return `0 2px 6px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.1), 0 32px 64px rgba(0,0,0,0.06)`;
}

// ---------------------------------------------------------------------------
// Spacing & layout constants
// ---------------------------------------------------------------------------

export const spacing = {
  scenePadding: 80,
  scenePaddingX: 100,
  sectionGap: 56,
  cardGap: 24,
  cardPadding: 32,
  borderRadius: { sm: 10, md: 16, lg: 24, xl: 32 },
} as const;

export const typography = {
  heroTitle: { fontSize: 80, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.04em" } as CSSProperties,
  sectionTitle: { fontSize: 54, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em" } as CSSProperties,
  cardTitle: { fontSize: 24, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.015em" } as CSSProperties,
  body: { fontSize: 20, fontWeight: 500, lineHeight: 1.6 } as CSSProperties,
  bodyLg: { fontSize: 26, fontWeight: 500, lineHeight: 1.5 } as CSSProperties,
  caption: { fontSize: 15, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" } as CSSProperties,
  stat: { fontSize: 72, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" } as CSSProperties,
  label: { fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" } as CSSProperties,
} as const;

export const typo = typography;

export function getTypography(theme?: VideoTheme) {
  const d = theme?.fonts?.heading
    ? `"${theme.fonts.heading}", system-ui, sans-serif`
    : undefined;
  const b = theme?.fonts?.body
    ? `"${theme.fonts.body}", system-ui, sans-serif`
    : undefined;
  return {
    heroTitle: { ...typography.heroTitle, fontFamily: d } as CSSProperties,
    sectionTitle: { ...typography.sectionTitle, fontFamily: d } as CSSProperties,
    cardTitle: { ...typography.cardTitle, fontFamily: d } as CSSProperties,
    body: { ...typography.body, fontFamily: b } as CSSProperties,
    bodyLg: { ...typography.bodyLg, fontFamily: b } as CSSProperties,
    caption: { ...typography.caption, fontFamily: b } as CSSProperties,
    stat: { ...typography.stat, fontFamily: d } as CSSProperties,
  };
}

// ---------------------------------------------------------------------------
// Theme-driven headline style — each theme gets a distinct headline treatment
// ---------------------------------------------------------------------------

export function themedHeadlineStyle(theme: VideoTheme): CSSProperties {
  const { colors, vibe } = safeTheme(theme);

  if (vibe === "cyberpunk") {
    const glow = colors.glow || colors.primary;
    return {
      backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.accent}, ${colors.secondary})`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
      textShadow: `0 0 40px ${glow}30`,
    };
  }

  if (vibe === "minimal") {
    return { color: colors.text };
  }

  if (vibe === "editorial") {
    return {
      color: colors.text,
      fontStyle: "italic",
    };
  }

  if (vibe === "energetic") {
    return {
      backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
    };
  }

  if (vibe === "luxury") {
    return { color: colors.primary };
  }

  return { color: colors.text };
}

// ---------------------------------------------------------------------------
// Theme-driven button style
// ---------------------------------------------------------------------------

export function themedButtonStyle(theme: VideoTheme): CSSProperties {
  const { colors, fonts, borderRadius, vibe } = safeTheme(theme);

  if (vibe === "cyberpunk") {
    const glow = colors.glow || colors.primary;
    return {
      padding: "16px 44px",
      borderRadius,
      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      color: "#000",
      fontSize: 16,
      fontWeight: 700,
      fontFamily: `"${fonts.heading}", monospace`,
      letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
      boxShadow: `0 0 24px ${glow}40, 0 0 48px ${glow}20`,
      border: "none",
    };
  }

  if (vibe === "minimal") {
    return {
      padding: "16px 40px",
      borderRadius,
      background: colors.primary,
      color: "#fff",
      fontSize: 16,
      fontWeight: 600,
      border: "none",
    };
  }

  if (vibe === "editorial") {
    return {
      padding: "14px 0",
      borderRadius: 0,
      background: "transparent",
      color: colors.text,
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase" as const,
      borderBottom: `2px solid ${colors.accent}`,
      border: "none",
      borderBottomWidth: 2,
      borderBottomStyle: "solid" as const,
      borderBottomColor: colors.accent,
    };
  }

  if (vibe === "energetic") {
    return {
      padding: "20px 52px",
      borderRadius: 999,
      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      color: "#000",
      fontSize: 18,
      fontWeight: 800,
      border: "none",
      boxShadow: `0 4px 24px ${colors.primary}35`,
    };
  }

  if (vibe === "luxury") {
    return {
      padding: "16px 44px",
      borderRadius,
      background: colors.primary,
      color: "#fff",
      fontSize: 15,
      fontWeight: 500,
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      border: "none",
    };
  }

  return {
    padding: "17px 42px",
    borderRadius,
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
    border: "none",
  };
}

// ---------------------------------------------------------------------------
// Helper: detect dark theme
// ---------------------------------------------------------------------------

export function isThemeDark(theme?: VideoTheme): boolean {
  const bg = safeTheme(theme).colors.background;
  const r = parseInt(bg.slice(1, 3), 16) || 0;
  const g = parseInt(bg.slice(3, 5), 16) || 0;
  const b = parseInt(bg.slice(5, 7), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

// ---------------------------------------------------------------------------
// Accent color rotation
// ---------------------------------------------------------------------------

export function accentColor(theme: VideoTheme, index: number): string {
  const { colors } = safeTheme(theme);
  const palette = [
    colors.primary,
    colors.accent,
    colors.secondary || colors.primary,
  ];
  return palette[index % palette.length];
}

// ---------------------------------------------------------------------------
// Typewriter text reveal — returns visible character count and cursor state
// ---------------------------------------------------------------------------

export function typewriterReveal(
  frame: number,
  delay: number,
  totalChars: number,
  dur = 30,
): { visibleChars: number; showCursor: boolean } {
  const progress = interpolate(frame, [delay, delay + dur], [0, totalChars], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.decel,
  });
  const cursorBlink = Math.floor((frame - delay) / 8) % 2 === 0;
  return {
    visibleChars: Math.floor(progress),
    showCursor: frame >= delay && (frame < delay + dur + 20 || cursorBlink),
  };
}

// ---------------------------------------------------------------------------
// Counter spin-up with overshoot — number ramps past target then settles back
// ---------------------------------------------------------------------------

export function counterSpinUp(
  frame: number,
  delay: number,
  target: number,
  dur = 28,
): number {
  if (frame < delay) return 0;
  if (frame >= delay + dur + 10) return target;

  const overshoot = target * 1.12;
  if (frame < delay + dur) {
    return interpolate(frame, [delay, delay + dur], [0, overshoot], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: easings.snappy,
    });
  }
  return interpolate(frame, [delay + dur, delay + dur + 10], [overshoot, target], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
}

// ---------------------------------------------------------------------------
// Horizontal wipe reveal via clip-path
// ---------------------------------------------------------------------------

export function horizontalWipe(
  frame: number,
  delay: number,
  dur = 20,
  direction: "left" | "right" = "left",
): CSSProperties {
  const progress = interpolate(frame, [delay, delay + dur], [0, 100], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snappy,
  });
  const clipPath =
    direction === "left"
      ? `inset(0 ${100 - progress}% 0 0)`
      : `inset(0 0 0 ${100 - progress}%)`;
  return { clipPath };
}

// ---------------------------------------------------------------------------
// Parallax layer — subtle positional drift driven by frame progression
// ---------------------------------------------------------------------------

export function parallaxLayer(
  frame: number,
  speed = 0.3,
  direction: "up" | "down" | "left" | "right" = "up",
): CSSProperties {
  const offset = frame * speed;
  const transforms: Record<string, string> = {
    up: `translateY(-${offset}px)`,
    down: `translateY(${offset}px)`,
    left: `translateX(-${offset}px)`,
    right: `translateX(${offset}px)`,
  };
  return { transform: transforms[direction] };
}

// ---------------------------------------------------------------------------
// Exit animation — fade out while sliding down
// ---------------------------------------------------------------------------

export function fadeOutDown(
  frame: number,
  startFrame: number,
  dur = 18,
  distance = 40,
): CSSProperties {
  const o = interpolate(frame, [startFrame, startFrame + dur], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
  const y = interpolate(frame, [startFrame, startFrame + dur], [0, distance], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
  return { opacity: o, transform: `translateY(${y}px)` };
}

// ---------------------------------------------------------------------------
// Animated background — gradient that slowly drifts over time
// ---------------------------------------------------------------------------

export function animatedMeshBg(
  frame: number,
  theme: VideoTheme,
): CSSProperties {
  const { colors, vibe } = safeTheme(theme);
  const base: CSSProperties = { position: "absolute", inset: 0 };

  const x1 = interpolate(frame, [0, 120], [20, 35], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });
  const y1 = interpolate(frame, [0, 90], [30, 45], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });
  const x2 = interpolate(frame, [0, 100], [80, 65], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });
  const y2 = interpolate(frame, [0, 110], [70, 55], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });

  if (vibe === "cyberpunk") {
    return {
      ...base,
      background: [
        `radial-gradient(ellipse 70% 45% at ${x1}% ${y1}%, ${colors.primary}38 0%, transparent 55%)`,
        `radial-gradient(ellipse 55% 65% at ${x2}% ${y2}%, ${colors.secondary}32 0%, transparent 50%)`,
        `radial-gradient(ellipse 80% 30% at 50% 5%, ${colors.accent}25 0%, transparent 45%)`,
      ].join(", "),
    };
  }

  if (vibe === "minimal") {
    return {
      ...base,
      background: `radial-gradient(ellipse 100% 70% at ${x1 + 20}% ${y1}%, ${colors.primary}05 0%, transparent 65%)`,
    };
  }

  if (vibe === "editorial") {
    return { ...base, background: "transparent" };
  }

  if (vibe === "energetic") {
    const angle = interpolate(frame, [0, 120], [-15, 15], {
      extrapolateRight: "clamp",
      easing: easings.smooth,
    });
    return {
      ...base,
      background: [
        `radial-gradient(ellipse 60% 50% at ${x1 - 5}% ${y1 - 10}%, ${colors.primary}35 0%, transparent 50%)`,
        `radial-gradient(ellipse 50% 60% at ${x2 + 5}% ${y2 + 5}%, ${colors.secondary}30 0%, transparent 45%)`,
        `linear-gradient(${angle + 135}deg, transparent 30%, ${colors.accent}0c 50%, transparent 70%)`,
      ].join(", "),
    };
  }

  if (vibe === "luxury") {
    const spotX = interpolate(frame, [0, 120], [45, 55], {
      extrapolateRight: "clamp",
      easing: easings.smooth,
    });
    return {
      ...base,
      background: `radial-gradient(ellipse 80% 60% at ${spotX}% 40%, ${colors.accent}08 0%, transparent 60%)`,
    };
  }

  return {
    ...base,
    background: [
      `radial-gradient(ellipse 80% 50% at ${x1}% ${y1}%, ${colors.primary}28 0%, transparent 60%)`,
      `radial-gradient(ellipse 60% 70% at ${x2}% ${y2}%, ${colors.accent}22 0%, transparent 55%)`,
      `radial-gradient(ellipse 90% 40% at 50% 0%, ${colors.secondary}18 0%, transparent 50%)`,
    ].join(", "),
  };
}

// ---------------------------------------------------------------------------
// Floating animation — continuous subtle y-axis drift after entrance
// ---------------------------------------------------------------------------

export function floatY(
  frame: number,
  amplitude = 6,
  speed = 0.05,
  phase = 0,
): CSSProperties {
  const y = Math.sin((frame + phase) * speed) * amplitude;
  return { transform: `translateY(${y}px)` };
}

// ---------------------------------------------------------------------------
// Scanning accent line — a glowing horizontal line that sweeps down a section
// ---------------------------------------------------------------------------

export function scanLineStyle(
  frame: number,
  delay: number,
  color: string,
  dur = 40,
): CSSProperties {
  const pos = interpolate(frame, [delay, delay + dur], [-5, 105], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });
  const opacity = interpolate(
    frame,
    [delay, delay + 8, delay + dur - 8, delay + dur],
    [0, 0.7, 0.7, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );
  return {
    position: "absolute",
    left: 0,
    right: 0,
    top: `${pos}%`,
    height: 2,
    background: `linear-gradient(90deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
    boxShadow: `0 0 20px ${color}60, 0 0 60px ${color}30`,
    opacity,
    pointerEvents: "none",
    zIndex: 10,
  };
}

// ---------------------------------------------------------------------------
// Breathing scale — continuous subtle scale pulse for cards/elements
// ---------------------------------------------------------------------------

export function breathe(
  frame: number,
  speed = 0.04,
  amount = 0.008,
  phase = 0,
): CSSProperties {
  const s = 1 + Math.sin((frame + phase) * speed) * amount;
  return { transform: `scale(${s})` };
}

// ---------------------------------------------------------------------------
// Stagger entrance — mix of different entrance types based on index
// ---------------------------------------------------------------------------

export function staggerEntrance(
  frame: number,
  index: number,
  baseDelay: number,
  spacing = 10,
): CSSProperties {
  const delay = baseDelay + index * spacing;
  const variant = index % 4;
  switch (variant) {
    case 0: return fadeInUp(frame, delay, 35, 22);
    case 1: return slideFromLeft(frame, delay, 45, 22);
    case 2: return scaleIn(frame, delay, 22);
    case 3: return slideFromRight(frame, delay, 45, 22);
    default: return fadeInUp(frame, delay, 35, 22);
  }
}

// ---------------------------------------------------------------------------
// Animated border glow — rotating gradient border around an element
// ---------------------------------------------------------------------------

export function glowBorderStyle(
  frame: number,
  color: string,
  delay = 0,
): CSSProperties {
  const angle = interpolate(frame, [delay, delay + 120], [0, 360], {
    extrapolateRight: "extend",
  });
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  return {
    position: "absolute",
    inset: -1,
    borderRadius: "inherit",
    background: `conic-gradient(from ${angle}deg, transparent 0%, ${color}40 25%, transparent 50%, ${color}25 75%, transparent 100%)`,
    opacity,
    pointerEvents: "none",
    zIndex: -1,
  };
}

// ---------------------------------------------------------------------------
// Scene-level theme overrides — merges per-scene accent/tint with global theme
// ---------------------------------------------------------------------------

export function mergeThemeWithOverrides(
  theme: VideoTheme,
  overrides?: SceneStyleOverrides,
): VideoTheme {
  if (!overrides) return theme;

  return {
    ...theme,
    colors: {
      ...theme.colors,
      ...(overrides.accentColor && {
        accent: overrides.accentColor,
        primary: overrides.accentColor,
      }),
      ...(overrides.backgroundTint && { background: overrides.backgroundTint }),
      ...(overrides.headlineColor && { text: overrides.headlineColor }),
      ...(overrides.surfaceColor && { surface: overrides.surfaceColor }),
    },
  };
}
