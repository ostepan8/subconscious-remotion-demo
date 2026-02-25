function GeneratedComponent({ content, theme }) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);
  // Brand colors
  const c = {
    background: '#101820',
    surface: '#1a2430',
    border: 'rgba(255,255,255,0.06)',
    orange: '#FF5C28',
    orangeGrad: 'linear-gradient(135deg,#FF5C28,#e04820)',
    orangeLight: '#FFC0A4',
    teal: '#3ED0C3',
    accentGreen: '#B5E800',
    text: '#F0F3EF',
    textMuted: 'rgba(240,243,239,0.6)',
    font: 'Manrope, system-ui, sans-serif',
  };
  // Navbar
  const navbarAnim = fadeInBlur(frame, 2, 16);
  const logoAnim = scaleIn(frame, 6, 22);
  const loginAnim = fadeInUp(frame, 10, 22);
  const signUpAnim = fadeInUp(frame, 14, 22);
  // Cards
  const leftCardAnim = fadeInUp(frame, 8, 18);
  const leftTitleAnim = fadeInBlur(frame, 14, 16);
  const leftTextareaAnim = fadeInBlur(frame, 18, 16);
  const startBtnAnim = { ...scaleIn(frame, 22, 18), ...glowPulse(frame, 27, c.orange) };

  const rightCardAnim = fadeInUp(frame, 16, 20);
  const scoreAnim = scaleIn(frame, 20, 16);
  const pillStyles = [staggerEntrance(frame, 0, 34, 6), staggerEntrance(frame, 1, 37, 6), staggerEntrance(frame, 2, 40, 6)];
  const sugg1Anim = fadeInBlur(frame, 47, 14);
  const sugg2Anim = fadeInBlur(frame, 51, 14);

  // Animated number for score
  const scoreNum = animatedNumber(frame, 23, '87%', 23);

  return (
    <AbsoluteFill style={{ background: c.background }}>
      {/* Subtle background orb accents for depth */}
      <div style={glowOrbStyle(frame, c.orange, 400, '12%', '-18%', 0)} />
      <div style={glowOrbStyle(frame, c.teal, 320, '87%', '15%', 10)} />
      {/* Navbar */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 72,
          padding: '0 56px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 40,
          backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          background: c.surface + 'cc', // 80% opacity glass effect
          borderBottom: `1px solid ${c.border}`,
          ...navbarAnim,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...logoAnim }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: c.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" style={{ display: 'block' }} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="#fff2" />
              <path d="M9.3 14.2c.45.52 1.17.76 2.24.74 1.73-.04 2.32-.66 2.32-1.35 0-.61-.53-.96-1.87-1.14l-.25-.03c-1.24-.15-1.7-.52-1.7-1.12 0-.65.67-1.14 2.06-1.2 1.25-.06 2.04.26 2.33.97" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 23, letterSpacing: '-0.02em', color: c.orange, fontFamily: c.font }}>Custom Resume Tailor</span>
        </div>
        {/* Auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            style={{
              padding: '0 28px', height: 40,
              background: 'none',
              color: c.text,
              fontWeight: 600,
              fontSize: 16,
              border: `1px solid ${c.border}`,
              borderRadius: 9,
              fontFamily: c.font,
              cursor: 'pointer',
              ...loginAnim,
              transition: 'none',
            }}
          >
            Login
          </button>
          <button
            style={{
              padding: '0 30px', height: 44,
              background: c.orangeGrad,
              color: '#fff',
              fontWeight: 700,
              fontSize: 17,
              boxShadow: '0 2px 14px #FF5C2840',
              border: 'none',
              borderRadius: 9,
              fontFamily: c.font,
              cursor: 'pointer',
              letterSpacing: '0.01em',
              ...signUpAnim,
              ...glowPulse(frame, 14, c.orange),
              transition: 'none',
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
      {/* Main split area */}
      <div
        style={{
          position: 'absolute',
          top: 86, left: 0, right: 0, bottom: 0,
          padding: '0 58px',
          display: 'flex',
          gap: 48,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Left: Job Desc Input Card */}
        <div
          style={{
            minWidth: 410,
            maxWidth: 480,
            flex: 1,
            ...leftCardAnim,
            background: c.surface,
            borderRadius: 12,
            border: `1px solid ${c.border}`,
            boxShadow: '0 2px 22px #0008',
            padding: 36,
            display: 'flex', flexDirection: 'column',
            gap: 0,
            zIndex: 3,
          }}
        >
          {/* Title */}
          <div style={{ ...leftTitleAnim, fontWeight: 750, fontSize: 22, letterSpacing: '-0.01em', color: c.text, fontFamily: c.font, marginBottom: 17 }}>Job Description</div>
          {/* Textarea mock */}
          <div
            style={{
              ...leftTextareaAnim,
              background: '#151a22',
              border: `1.2px solid ${c.border}`,
              borderRadius: 8,
              minHeight: 106,
              fontFamily: c.font,
              color: c.textMuted,
              fontSize: 19,
              lineHeight: 1.6,
              padding: '16px 18px',
              outline: 'none',
              marginBottom: 24,
              letterSpacing: '0',
              boxShadow: '0 1px 4px #0004',
              whiteSpace: 'pre-line',
              userSelect: 'none',
            }}
          >
            Senior Frontend Engineer at Stripe.\nReact + TypeScript.\nExpertise in scalable UI systems and design.
          </div>
          {/* Start Tailoring Button */}
          <button
            style={{
              width: '100%',
              padding: '16px 0',
              marginTop: 3,
              background: c.orangeGrad,
              color: '#fff',
              fontSize: 18,
              fontWeight: 800,
              border: 'none',
              borderRadius: 9,
              fontFamily: c.font,
              cursor: 'pointer',
              letterSpacing: '0.01em',
              boxShadow: '0 1px 16px #FF5C2820',
              ...startBtnAnim,
              transition: 'none',
            }}
          >
            Start Tailoring
          </button>
        </div>
        {/* Right: Match Analysis Card */}
        <div
          style={{
            minWidth: 410,
            maxWidth: 470,
            flex: 1,
            ...rightCardAnim,
            background: c.surface,
            borderRadius: 12,
            border: `1px solid ${c.border}`,
            boxShadow: '0 2px 22px #0008',
            padding: 36,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            zIndex: 3,
          }}
        >
          {/* Circular match score */}
          <div
            style={{
              ...scoreAnim,
              position: 'relative',
              width: 132,
              height: 132,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 66,
              marginBottom: 22,
              background: '#181e29',
              boxShadow: '0 1px 10px #FF5C2825',
              border: `3px solid ${c.orange}`,
            }}
          >
            <span style={{
              fontSize: 46, fontWeight: 900, color: c.orange, fontFamily: c.font, letterSpacing: '-0.01em',
            }}>
              {scoreNum}
            </span>
          </div>
          {/* Matched Keyword Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11, marginBottom: 33, marginTop: 2, width: '100%', justifyContent: 'center' }}>
            {['React', 'TypeScript', 'System Design'].map((kw, i) => (
              <span
                key={kw}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontFamily: c.font,
                  color: '#fff',
                  background: c.teal,
                  borderRadius: 100,
                  padding: '0 15px',
                  height: 28,
                  fontSize: 17,
                  letterSpacing: '0',
                  boxShadow: '0 1px 6px #3ED0C340',
                  ...pillStyles[i],
                  transition: 'none',
                }}
              >
                {kw}
              </span>
            ))}
          </div>
          {/* Suggestions */}
          <div style={{ width: '100%', marginTop: 0, paddingLeft: 1 }}>
            <div style={{ ...sugg1Anim, color: c.textMuted, fontSize: 18, fontWeight: 500, fontFamily: c.font, lineHeight: 1.5, marginBottom: 7 }}>
              Add a quantifiable impact to your last project entry.
            </div>
            <div style={{ ...sugg2Anim, color: c.textMuted, fontSize: 18, fontWeight: 500, fontFamily: c.font, lineHeight: 1.5 }}>
              Expand on System Design for enterprise cases.
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}