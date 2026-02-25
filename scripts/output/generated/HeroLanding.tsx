function GeneratedComponent({ content, theme }) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);
  // Brand palette
  const COLORS = {
    background: "#101820",
    surface: "#1a2430",
    primary: "#FF5C28",
    secondary: "#FFC0A4",
    teal: "#3ED0C3",
    accent: "#B5E800",
    text: "#F0F3EF",
    textMuted: "rgba(240,243,239,0.6)",
    border: "rgba(255,255,255,0.06)",
    black: "#101820",
  };
  // Spacing
  const MAX_WIDTH = 620;
  const BADGE_HEIGHT = 32;
  const BUTTON_HEIGHT = 56;
  const BUTTON_RADIUS = 12;
  const BUTTON_GAP = 20;
  // Glow top radial
  const glowStyle = {
    position: "absolute",
    left: "50%",
    top: 0,
    width: 720,
    height: 240,
    pointerEvents: "none",
    transform: "translateX(-50%)",
    background: "radial-gradient(ellipse 70% 40% at 50% 0%, #FF5C2840 0%, #FF5C2800 100%)",
    filter: "blur(12px)",
    zIndex: 1,
  };
  return (
    <AbsoluteFill style={{ background: COLORS.background, overflow: "hidden", fontFamily: 'Manrope, system-ui, sans-serif' }}>
      {/* Background Grid + Glow */}
      <div style={{ ...gridPatternStyle(theme), zIndex: 0 }} />
      <div style={glowStyle} />
      {/* Centered Content */}
      <div style={{ position: "relative", zIndex: 2, height: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: MAX_WIDTH, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {/* Badge */}
          <div style={{ ...fadeInUp(frame, 4, 32), height: BADGE_HEIGHT, display: "inline-flex", alignItems: "center", background: COLORS.surface + "e6", border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "0 18px 0 10px", marginBottom: 42, boxShadow: "0 2px 12px #0002", backdropFilter: "blur(8px)", fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.textMuted }}>
            <span style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 999,
              background: COLORS.primary,
              marginRight: 10,
              boxShadow: "0 0 8px #FF5C2820",
            }} />
            Built with Subconscious AI Agents
          </div>

          {/* Headline & Subline */}
          <div style={{
            textAlign: "center",
            width: "100%",
          }}>
            <div style={{
              ...fadeInBlur(frame, 10, 20),
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: COLORS.primary,
              lineHeight: 1.06,
              marginBottom: 0,
            }}>
              AI-Tailored Resumes
            </div>
            <div style={{
              ...fadeInBlur(frame, 16, 18),
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: COLORS.textMuted,
              lineHeight: 1.06,
              marginTop: 0,
              marginBottom: 18,
            }}>
              for Every Opportunity
            </div>
          </div>

          {/* Subtitle/stat */}
          <div style={{
            ...fadeInUp(frame, 22, 22),
            fontSize: 22,
            fontWeight: 500,
            color: COLORS.textMuted,
            letterSpacing: "-0.01em",
            textAlign: "center",
            marginBottom: 40,
            marginTop: 0,
            maxWidth: 480,
            lineHeight: 1.5,
          }}>
            63% more effective at matching job keywords using AI-powered tailoring.
          </div>

          {/* Buttons row */}
          <div style={{ display: "flex", flexDirection: "row", gap: BUTTON_GAP, width: "100%", justifyContent: "center", marginBottom: 36 }}>
            {/* Primary CTA */}
            <div
              style={{
                ...scaleIn(frame, 32, 18),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 0,
                height: BUTTON_HEIGHT,
                padding: "0 36px",
                borderRadius: BUTTON_RADIUS,
                background: "linear-gradient(135deg,#FF5C28,#e04820)",
                color: COLORS.black,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.01em",
                boxShadow: "0 2px 12px #FF5C2830",
                cursor: "pointer",
                border: 0,
                transition: "background 0.16s",
              }}
            >
              Start Tailoring
              <svg width="26" height="26" viewBox="0 0 20 20" fill="none" style={{ marginLeft: 13, marginRight: -6, verticalAlign: "middle" }}><path d="M7 16l5-6-5-6" stroke="#101820" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            {/* Secondary (View Dashboard) */}
            <div
              style={{
                ...fadeInUp(frame, 39, 18),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                background: "transparent",
                border: `1.5px solid ${COLORS.border}`,
                color: COLORS.text,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.01em",
                padding: "0 33px",
                cursor: "pointer",
                minWidth: 0,
                boxShadow: "0 2px 8px #0001",
              }}
            >
              View Dashboard
            </div>
          </div>
          {/* Powered-by line */}
          <div style={{
            ...fadeInUp(frame, 48, 18),
            color: COLORS.textMuted,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.07em",
            textAlign: "center",
            marginTop: 4,
            textTransform: "uppercase",
            opacity: 0.99,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}>
            Powered by
            <span style={{ fontWeight: 700, color: COLORS.primary, marginLeft: 2 }}>Subconscious</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}