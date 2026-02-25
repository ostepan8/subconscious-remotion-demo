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
- typewriterReveal(frame, delay, totalChars, dur?) → { visibleChars, showCursor }
- counterSpinUp(frame, delay, target, dur?) → number
- horizontalWipe(frame, delay, dur?, direction?) → { clipPath }
- parallaxLayer(frame, speed?, direction?) → { transform }
- fadeOutDown(frame, startFrame, dur?, distance?) → { opacity, transform }

IMPORTANT: delay is in FRAMES (integers like 0, 5, 10, 15, 20), NOT seconds or floats.
Correct: fadeInUp(frame, 10, 20)
WRONG:   fadeInUp(frame, 0.5, 20)   ← 0.5 is not a valid frame number

### Style helpers (in scope — do NOT import)
- meshGradientStyle(theme) → CSSProperties (radial gradient bg)
- gridPatternStyle(theme) → CSSProperties (grid overlay)
- noiseOverlayStyle() → CSSProperties
- glowOrbStyle(frame, color, size, xPercent, yPercent, delay?) → CSSProperties
  Example: glowOrbStyle(frame, theme.colors.primary, 400, "20%", "30%", 0)
- glassSurface(theme) → CSSProperties (translucent bg + blur)
- glassCard(theme, radius?) → CSSProperties (glassSurface + borderRadius)
- depthShadow(theme?) → string (a boxShadow value, use as: boxShadow: depthShadow())
  WRONG: ...depthShadow()  ← spreading a string crashes
- gradientText(fromColor, toColor) → CSSProperties
- accentColor(theme, index?) → string (hex color)
- shimmerStyle() → CSSProperties
- isThemeDark(theme) → boolean
- mergeThemeWithOverrides(theme, overrides?) → theme

### Typography & layout (in scope — do NOT import)
- getTypography(theme) → object with: heroTitle, sectionTitle, cardTitle, body, bodyLg, caption, stat, label
  Each has: { fontSize, fontWeight, lineHeight?, letterSpacing?, fontFamily?, textTransform? }
  Correct:   const typo = getTypography(theme);
  WRONG:     const { typo } = getTypography(theme);  ← getTypography returns the object directly
- spacing → { scenePadding: 80, scenePaddingX: 100, sectionGap: 56, cardGap: 24, cardPadding: 32, borderRadius: { sm: 10, md: 16, lg: 24, xl: 32 } }
- typography → raw typography presets (prefer getTypography(theme) for font-aware versions)
- easings → { smooth, snappy, spring, elastic, decel, bounce } (each is t→t)

### Other (in scope)
- MockupPlaceholder — component that renders a placeholder box

### Theme object shape (passed as prop)
theme.colors: { background, surface, primary, secondary, text, textMuted, accent }
theme.fonts: { heading, body }
theme.borderRadius: number

### Content object shape (passed as prop)
content: { headline, subtext, buttonText, bullets, features, steps, stats, questions, items, cells, milestones, members, reviews, logos, before, after, quote, author, price, date, rating, reviewCount, mediaUrl, layout }

## CRITICAL RULES
1. Your function MUST be named: function GeneratedComponent({ content, theme })
2. Do NOT import or export anything. All helpers above are already in scope.
3. Do NOT invent functions. If it's not listed above, it DOES NOT EXIST.
   Common mistakes: staggerEntrance, animatedMeshBg, createAnimation, fadeIn — NONE of these exist.
4. Use FRAME numbers (integers) for delays, not seconds/floats.
5. Use AbsoluteFill as the root wrapper.
6. Always call useCurrentFrame() to get the frame variable.
7. depthShadow() returns a STRING. Use it as: boxShadow: depthShadow() — never spread it.
8. getTypography(theme) returns the typography object directly. Do NOT destructure it.
`;
