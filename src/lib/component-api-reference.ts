/**
 * Exhaustive reference of every function/variable available in the
 * generated-component sandbox. This string is injected into LLM prompts
 * so the model knows *exactly* what it can call.
 */
export const COMPONENT_API_REFERENCE = `
## AVAILABLE API — use ONLY these. Everything else is UNDEFINED and will crash.

### React (already in scope — do NOT import)
- useState, useEffect, useRef, useMemo, useCallback
- useContext, createContext, useReducer, useLayoutEffect
- forwardRef, memo, Children, cloneElement, isValidElement
- React.createElement (aliased as h), Fragment

### Remotion (already in scope — do NOT import)
- useCurrentFrame() → number (current frame, starts at 0)
- useVideoConfig() → { fps: 30, durationInFrames: 150, width: 1920, height: 1080 }
- interpolate(value: number, inputRange: number[], outputRange: number[], options?: { extrapolateLeft?: 'clamp', extrapolateRight?: 'clamp' }) → number
- spring({ frame, fps, config? }) → number (0→1 spring)
- Easing.bezier(x1,y1,x2,y2), Easing.in(fn), Easing.out(fn), Easing.inOut(fn)
- AbsoluteFill — component, pass style and children
- Sequence — component with from/durationInFrames props
- Img — component with src/style props
- staticFile(path) → string

### Animation helpers (in scope — do NOT import)
All take frame (number) as first arg and delay (number, in FRAMES not seconds) as second:
- fadeInBlur(frame, delay, dur?) → { opacity, transform, filter }
- fadeInUp(frame, delay, distance?, dur?) → { opacity, transform }
- scaleIn(frame, delay, dur?) → { opacity, transform }
- slideFromLeft(frame, delay, distance?, dur?) → { opacity, transform }
- slideFromRight(frame, delay, distance?, dur?) → { opacity, transform }
- glowPulse(frame, delay, color) → { opacity, boxShadow }
- revealLine(frame, delay, dur?) → { width: "X%" }
- animatedNumber(frame, delay, targetStr, dur?) → string
- typewriterReveal(frame, delay, totalChars, dur?) → { visibleChars: number, showCursor: boolean }
  Returns an OBJECT, NOT a string. You MUST slice your text with visibleChars and render showCursor separately.
  CORRECT usage:
    const text = "Hello world";
    const tw = typewriterReveal(frame, 10, text.length, 30);
    const revealed = text.slice(0, tw.visibleChars) + (tw.showCursor ? "|" : "");
    // Then render: React.createElement('span', null, revealed)
  WRONG: React.createElement('span', null, typewriterReveal(frame, 10, text.length))
    ← This renders an OBJECT as a React child and CRASHES with "Objects are not valid as a React child"
  WRONG: typewriterReveal(frame, 10, myString) ← third arg is totalChars (number), NOT the string itself
- counterSpinUp(frame, delay, target, dur?) → number (raw float — always wrap: Math.round() or .toFixed())
- horizontalWipe(frame, delay, dur?, direction?) → { clipPath }
- parallaxLayer(frame, speed?, direction?) → { transform }
- fadeOutDown(frame, startFrame, dur?, distance?) → { opacity, transform }
- staggerEntrance(frame, index, baseDelay, spacing?) → CSSProperties
  Picks a different entrance animation per index (fadeInUp, slideFromLeft, scaleIn, slideFromRight).
  Great for animating lists/grids.
  Example: staggerEntrance(frame, i, 0, 10) — each item enters 10 frames apart
- floatY(frame, amplitude?, speed?, phase?) → { transform }
  Continuous subtle y-axis floating after entrance. Good for cards/icons.
- breathe(frame, speed?, amount?, phase?) → { transform }
  Continuous subtle scale pulse for cards/elements.

IMPORTANT: delay is in FRAMES (integers like 0, 5, 10, 15, 20), NOT seconds or floats.
Correct: fadeInUp(frame, 10, 20)
WRONG:   fadeInUp(frame, 0.5, 20)   ← 0.5 is not a valid frame number

### Background & decoration helpers (in scope — do NOT import)
- animatedMeshBg(frame, theme) → CSSProperties (animated radial gradient background)
  Use as: style={{ ...animatedMeshBg(frame, theme) }} on a background layer div.
- meshGradientStyle(theme) → CSSProperties (static radial gradient bg)
- gridPatternStyle(theme) → CSSProperties (grid overlay)
- noiseOverlayStyle() → CSSProperties
- glowOrbStyle(frame, color, size, xPercent, yPercent, delay?) → CSSProperties
  Example: glowOrbStyle(frame, theme.colors.primary, 400, "20%", "30%", 0)
- scanLineStyle(frame, delay, color, dur?) → CSSProperties
  Animated horizontal scanning line that sweeps down.
- glowBorderStyle(frame, color, delay?) → CSSProperties
  Rotating gradient border glow around an element.

### Surface & card helpers (in scope — do NOT import)
- glassSurface(theme) → CSSProperties (translucent bg + blur)
- glassCard(theme, radius?) → CSSProperties (glassSurface + borderRadius)
- depthShadow(theme?) → string (a boxShadow value, use as: boxShadow: depthShadow())
  WRONG: ...depthShadow()  ← spreading a string crashes
- gradientText(fromColor, toColor) → CSSProperties
- themedHeadlineStyle(theme) → CSSProperties (gradient text using theme colors)
- themedButtonStyle(theme) → CSSProperties (styled button with theme primary color)
- accentColor(theme, index?) → string (hex color)
- shimmerStyle() → CSSProperties
- isThemeDark(theme) → boolean
- mergeThemeWithOverrides(theme, overrides?) → theme

### Typography & layout (in scope — do NOT import)
- getTypography(theme) → object with: heroTitle, sectionTitle, cardTitle, body, bodyLg, caption, stat, label
  Each has: { fontSize, fontWeight, lineHeight?, letterSpacing?, fontFamily?, textTransform? }
  Correct:   const typo = getTypography(theme);
  WRONG:     const { typo } = getTypography(theme);  ← getTypography returns the object directly
- typo → alias for typography (raw presets). You can use typo.stat, typo.body etc. directly.
  If you call getTypography(theme), assign it to a local variable (e.g. const typo = getTypography(theme)).
- spacing → { scenePadding: 80, scenePaddingX: 100, sectionGap: 56, cardGap: 24, cardPadding: 32, borderRadius: { sm: 10, md: 16, lg: 24, xl: 32 } }
- typography → raw typography presets (prefer getTypography(theme) for font-aware versions)
- easings → { smooth, snappy, spring, elastic, decel, bounce } (each is t→t)

### Other (in scope)
- MockupPlaceholder — component that renders a placeholder box

### Theme object shape (passed as prop)
theme.colors: { background, surface, primary, secondary, text, textMuted, accent }
theme.fonts: { heading, body }
theme.borderRadius: number
IMPORTANT: The theme object has ONLY these properties. There is NO theme.brandColors, NO theme.foreground,
NO theme.palette, NO theme.brand. If you need colors, use theme.colors.primary, theme.colors.background, etc.
WRONG: theme.brandColors.foreground  ← brandColors does NOT exist, will crash
WRONG: theme.foreground              ← does NOT exist
CORRECT: theme.colors.text           ← use this for text/foreground color
CORRECT: theme.colors.background     ← use this for background color

### Content object shape (passed as prop)
content: { headline, subtext, buttonText, bullets, features, steps, stats, questions, items, cells, milestones, members, reviews, logos, before, after, quote, author, price, date, rating, reviewCount, mediaUrl, layout }

## CRITICAL RULES
1. Your function MUST be named: function GeneratedComponent({ content, theme })
2. Do NOT import or export anything. All helpers above are already in scope.
3. Do NOT invent functions. If it's not listed above, it DOES NOT EXIST.
4. Use FRAME numbers (integers) for delays, not seconds/floats.
5. Use AbsoluteFill as the root wrapper.
6. Always call useCurrentFrame() to get the frame variable.
7. depthShadow() returns a STRING. Use it as: boxShadow: depthShadow() — never spread it.
8. getTypography(theme) returns the typography object directly. Do NOT destructure it.
9. typewriterReveal() returns an OBJECT { visibleChars, showCursor }, NOT a string.
   Slice your text: myString.slice(0, tw.visibleChars). NEVER pass the return value directly as a React child.
10. counterSpinUp() returns a raw float. Always format: Math.round(counterSpinUp(...)) or .toFixed(0).
11. NEVER pass an object as a React child. Only strings and numbers are valid children.
12. theme has ONLY: theme.colors, theme.fonts, theme.borderRadius. There is NO theme.brandColors,
    NO theme.foreground, NO theme.palette. Use theme.colors.text for foreground, theme.colors.background for bg.
`;
