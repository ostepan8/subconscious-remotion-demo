function GeneratedComponent({ content, theme }) {
  const frame = useCurrentFrame();
  const typography = getTypography(theme);
  // Brand colors
  const c_orange = "#FF5C28";
  const c_orange2 = "#FFC0A4";
  const c_teal = "#3ED0C3";
  const c_green = "#B5E800";
  const c_darkbg = "#101820";
  const c_surface = "#1a2430";
  const c_text = "#F0F3EF";
  const c_textMuted = "rgba(240,243,239,0.6)";
  const c_border = "rgba(255,255,255,0.06)";
  const dashboardNav = [
    "Overview",
    "Profile",
    "Resumes",
    "Experience",
    "Education",
    "Projects",
    "Skills",
    "Awards",
    "Saved Jobs"
  ];
  // Stat cards config
  const stats = [
    { label: "Projects", value: "12", color: c_teal },
    { label: "Skills", value: "8", color: c_green },
    { label: "Resumes", value: "3", color: c_orange },
    { label: "Match Score", value: "94%", gradient: true, color: c_orange }
  ];
  const statDelays = [36, 48, 60, 72];
  // Recent activity sample data
  const recent = [
    {
      icon: c_teal,
      title: "Tailored to 'ML Engineer @ Google'",
      sub: "1 hr ago"
    },
    {
      icon: c_orange,
      title: "Resume parsed: Resume_Boston.pdf",
      sub: "Today, 9:13am"
    },
    {
      icon: c_orange2,
      title: "Profile updated: Skills section",
      sub: "Yesterday, 7:02pm"
    }
  ];
  // Main typography
  const fontHeading = { fontFamily: 'Manrope, system-ui, sans-serif' };
  // Layout constants
  const SIDEBAR_WIDTH = 252;
  const NAV_ITEM_HEIGHT = 48;
  const CTA_HEIGHT = 52;
  return (
    <AbsoluteFill style={{ background: c_darkbg, fontFamily: 'Manrope, system-ui, sans-serif', color: c_text, overflow: "hidden" }}>
      {/* SIDEBAR */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        zIndex: 10,
        background: c_surface + 'cc',
        ...glassSurface(theme),
        borderRight: `1.5px solid ${c_border}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "32px 0 24px 0"
      }}>
        {/* SIDEBAR NAV */}
        <div style={{ padding: "0 0 0 20px" }}>
          {/* Logo */}
          <div style={{
            ...slideFromLeft(frame, 2, 64, 24),
            fontWeight: 900,
            letterSpacing: "-0.04em",
            fontSize: 27,
            lineHeight: 1.18,
            marginBottom: 32,
            display: 'flex',
            alignItems: "center",
            color: c_orange
          }}>
            <span style={{marginRight:10, fontSize:15, color: c_teal}}>🧑‍💼</span>Custom Resume Tailor
          </div>
          {/* Nav items */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {dashboardNav.map((item, i) => {
              const isActive = i === 0;
              return (
                <div
                  key={item}
                  style={{
                    ...slideFromLeft(frame, 8 + i * 3, 40, 21),
                    display: "flex",
                    alignItems: "center",
                    height: NAV_ITEM_HEIGHT,
                    fontWeight: isActive ? 700 : 600,
                    fontSize: 17,
                    color: isActive ? c_orange : c_text,
                    background: isActive ? c_orange + '1a' : 'transparent',
                    borderRadius: 8,
                    padding: isActive ? "0 16px 0 10px" : "0 10px",
                    margin: "0 12px 4px 0",
                    letterSpacing: "-0.01em",
                    boxShadow: isActive ? `0 2px 8px ${c_orange}16` : undefined,
                    transition: "none"
                  }}
                >
                  {item}
                </div>
              )
            })}
          </nav>
        </div>
        {/* New Tailoring CTA */}
        <div style={{ padding: "0 18px" }}>
          <div style={{
            ...glowPulse(frame, 36, c_orange),
            background: `linear-gradient(135deg, ${c_orange}, #e04820)`,
            color: "#fff",
            fontWeight: 800,
            fontSize: 17,
            borderRadius: 12,
            boxShadow: depthShadow(theme),
            padding: "0",
            height: CTA_HEIGHT,
            minHeight: CTA_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            border: `1.5px solid ${c_orange}40`,
            letterSpacing: ".01em",
            cursor: "pointer",
            userSelect: "none",
            marginTop: 14,
            transition: "none"
          }}>
            <span style={{marginRight:8, fontWeight:900, fontSize:21}}>＋</span>
            New Tailoring
          </div>
        </div>
      </div>
      {/* MAIN AREA */}
      <div style={{
        position: "absolute",
        left: SIDEBAR_WIDTH,
        top: 0,
        right: 0,
        bottom: 0,
        background: c_surface,
        padding: "0 0 0 0",
        overflow: "hidden"
      }}>
        {/* Dashboard Header */}
        <div style={{
          ...fadeInBlur(frame, 12, 19),
          ...typography.sectionTitle,
          ...fontHeading,
          fontSize: 36,
          padding: `38px 0 0 48px`,
          color: c_text,
          letterSpacing: "-0.02em",
          fontWeight: 900,
        }}>
          Your Profile Overview
        </div>
        {/* STAT CARDS GRID */}
        <div style={{
          display: "grid",
          gap: 28,
          gridTemplateColumns: "1fr 1fr",
          marginTop: 32,
          padding: "0 0 0 48px"
        }}>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                ...staggerEntrance(frame, i, 40, 11),
                ...glassCard(theme, 14),
                boxShadow: depthShadow(theme),
                minHeight: 106,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "26px 32px 21px 28px",
                border: `1.2px solid ${c_border}`,
                borderRadius: 14,
                marginRight: (i % 2 === 0) ? 6 : 0,
                marginBottom: (i < 2) ? 2 : 0
              }}
            >
              {/* Stat Number */}
              <div style={stat.gradient ? {
                fontSize: 38,
                fontWeight: 900,
                lineHeight: 1.1,
                background: `linear-gradient(135deg, ${c_orange}, ${c_orange2})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em"
              } : {
                fontSize: 38,
                fontWeight: 900,
                color: stat.color,
                letterSpacing: "-0.02em"
              }}>
                {animatedNumber(frame, 44 + i * 8, stat.value)}
                {stat.label === "Match Score" ? '' : <span style={{fontSize:19, color: c_textMuted, marginLeft:3, fontWeight:600}}>{stat.label === "Projects" ? '' : (stat.label === "Skills" ? '' : '')}</span>}
              </div>
              {/* Label */}
              <div style={{
                fontWeight: 600, fontSize: 17, color: c_textMuted,
                marginTop: 5, letterSpacing: "0.01em"
              }}>{stat.label}</div>
            </div>
          ))}
        </div>
        {/* RECENT ACTIVITY */}
        <div style={{
          marginTop: 48,
          padding: "0 0 0 48px",
          position: "relative",
          maxWidth: 542
        }}>
          {/* Section Header */}
          <div style={{
            ...fadeInUp(frame, 80, 31),
            ...fontHeading,
            fontSize: 23,
            fontWeight: 700,
            color: c_text,
            marginBottom: 9,
            letterSpacing: "-0.01em",
            padding: "2px 14px 2.5px 6px",
            borderRadius: 7,
            background: c_surface + 'cc',
            boxShadow: `0 2px 16px ${c_darkbg}18`,
            borderLeft: `3px solid ${c_orange}85`,
            alignSelf: "flex-start",
            display: 'inline-block'
          }}>
            Recent Activity
          </div>
          {/* List */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            background: c_surface + '80',
            borderRadius: 10,
            boxShadow: `0 2px 12px ${c_darkbg}23`,
            border: `1px solid ${c_border}`,
            padding: "7px 0 3px 0"
          }}>
            {recent.map((a, idx) => (
              <div key={a.title} style={{
                ...fadeInUp(frame, 84 + idx * 4, 20),
                display: 'flex', alignItems: 'center',
                padding: "13px 18px 13px 5px",
                borderBottom: idx < recent.length - 1 ? `1px solid ${c_border}` : "none"
              }}>
                <div style={{
                  width: 30, height: 30,
                  borderRadius: 99,
                  background: a.icon,
                  marginRight: 17,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  color: c_darkbg + 'ee',
                  border: `1.2px solid ${c_border}`
                }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: c_text, letterSpacing: "-0.01em" }}>{a.title}</div>
                  <div style={{ fontWeight: 500, fontSize: 14.5, color: c_textMuted, marginTop: 1 }}>{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
