import { AbsoluteFill, useCurrentFrame, Img } from "remotion";
import type { VideoTheme, SceneContent } from "@/types";
import {
  animatedMeshBg,
  noiseOverlayStyle,
  fadeInBlur,
  fadeInUp,
  scaleIn,
  glowOrbStyle,
  glowPulse,
  shimmerStyle,
  scanLineStyle,
  breathe,
  resolvePublicAsset,
} from "./shared";

const b = {
  cream: "#f0f3ef",
  black: "#101820",
  orange: "#ff5c28",
  teal: "#3ed0c3",
  green: "#b5e800",
  white: "#ffffff",
  border: "#d4d9cf",
  borderSubtle: "#e8ebe5",
  muted: "#6b7b6e",
};

const projects = [
  {
    title: "Acme Analytics",
    desc: "A modern SaaS analytics platform for teams",
    gradient: "linear-gradient(135deg, #f0f4ff, #dbeafe)",
    status: "ready" as const,
  },
  {
    title: "Resume Tailor",
    desc: "AI-powered resume builder for job seekers",
    gradient: "linear-gradient(135deg, #ff5c28, #ffd54f)",
    status: "processing" as const,
  },
  {
    title: "DevPortfolio",
    desc: "Beautiful developer portfolio in minutes",
    gradient: "linear-gradient(135deg, #0f0c29, #302b63)",
    status: "ready" as const,
  },
];

const font = "Inter, system-ui, -apple-system, sans-serif";

export default function DemoDashboardScene({
  content: _content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();

  // Browser window entrance via scaleIn
  const winEntrance = scaleIn(frame, 0, 22);
  const winScale = parseFloat(
    (winEntrance.transform as string).match(/scale\(([^)]+)\)/)?.[1] || "1",
  );

  return (
    <AbsoluteFill
      style={{ background: theme.colors.background, overflow: "hidden" }}
    >
      <div style={animatedMeshBg(frame, theme)} />
      <div style={noiseOverlayStyle()} />

      {/* Glow orbs */}
      <div style={glowOrbStyle(frame, b.orange, 500, "70%", "-5%", 0)} />
      <div style={glowOrbStyle(frame, b.teal, 350, "-5%", "65%", 8)} />
      <div style={glowOrbStyle(frame, b.green, 280, "85%", "80%", 16)} />

      {/* Browser window */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 80,
          right: 80,
          bottom: 50,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow:
            "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          opacity: winEntrance.opacity as number,
          transform: `scale(${winScale})`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Chrome bar */}
        <div
          style={{
            height: 44,
            background: "#2a2a2e",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ff5f56",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ffbd2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#27c93f",
            }}
          />
          <div
            style={{
              flex: 1,
              marginLeft: 16,
              height: 28,
              borderRadius: 6,
              background: "#1a1a1e",
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              fontSize: 13,
              color: "#777",
              fontFamily: font,
            }}
          >
            subconscious.dev/dashboard
          </div>
          <div style={shimmerStyle(frame, 12)} />
        </div>

        {/* App body */}
        <div
          style={{
            flex: 1,
            background: b.cream,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Scan line */}
          <div style={scanLineStyle(frame, 10, b.orange, 35)} />

          {/* Navbar */}
          <NavBar frame={frame} />

          {/* Dashboard content */}
          <div style={{ padding: "36px 48px" }}>
            <DashboardHeader frame={frame} />
            <ProjectGrid frame={frame} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function NavBar({ frame }: { frame: number }) {
  const navStyle = fadeInBlur(frame, 10, 18);
  return (
    <div
      style={{
        height: 56,
        borderBottom: `1px solid ${b.borderSubtle}`,
        background: b.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        ...navStyle,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Img
          src={resolvePublicAsset("/brand/Subconscious_Logo_Graphic.svg")}
          style={{ width: 26, height: 26 }}
        />
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: b.black,
            fontFamily: font,
          }}
        >
          Subconscious
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 14, color: b.muted, fontFamily: font }}>
          Dashboard
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: b.orange,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: "#fff",
            fontWeight: 600,
            fontFamily: font,
          }}
        >
          U
        </div>
      </div>
    </div>
  );
}

function DashboardHeader({ frame }: { frame: number }) {
  const titleStyle = fadeInBlur(frame, 16, 18);
  const subStyle = fadeInUp(frame, 20, 16, 14);
  const btnGlow = glowPulse(frame, 22, b.orange);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 36,
      }}
    >
      <div>
        <div style={titleStyle}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: b.black,
              fontFamily: font,
            }}
          >
            My Videos
          </div>
        </div>
        <div style={subStyle}>
          <div
            style={{
              fontSize: 14,
              color: b.muted,
              marginTop: 4,
              fontFamily: font,
            }}
          >
            Create and manage your promotional videos.
          </div>
        </div>
      </div>
      <div
        style={{
          padding: "10px 20px",
          borderRadius: 12,
          background: b.orange,
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: font,
          ...btnGlow,
        }}
      >
        + New Video
      </div>
    </div>
  );
}

function ProjectGrid({ frame }: { frame: number }) {
  return (
    <div style={{ display: "flex", gap: 20 }}>
      {projects.map((p, i) => {
        const delay = 28 + i * 10;
        const cardEntrance = scaleIn(frame, delay, 20);
        const cardScale = parseFloat(
          (cardEntrance.transform as string)
            .match(/scale\(([^)]+)\)/)?.[1] || "1",
        );
        const cardBreath = breathe(frame, 0.03, 0.006, i * 40);
        const breathScale = parseFloat(
          (cardBreath.transform as string)
            .match(/scale\(([^)]+)\)/)?.[1] || "1",
        );

        return (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 14,
              border: `1px solid ${b.borderSubtle}`,
              background: b.white,
              overflow: "hidden",
              opacity: cardEntrance.opacity as number,
              transform: `scale(${cardScale * breathScale})`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                background: p.gradient,
              }}
            />
            <div style={{ padding: "16px 18px" }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: b.black,
                  fontFamily: font,
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: b.muted,
                  marginTop: 4,
                  fontFamily: font,
                }}
              >
                {p.desc}
              </div>
              <div style={{ marginTop: 12 }}>
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 100,
                    background:
                      p.status === "ready"
                        ? "rgba(181,232,0,0.15)"
                        : "rgba(255,92,40,0.1)",
                    color: p.status === "ready" ? b.green : b.orange,
                    fontWeight: 500,
                    fontFamily: font,
                  }}
                >
                  {p.status}
                </span>
              </div>
            </div>
            {/* Shimmer sweep */}
            <div style={shimmerStyle(frame, delay + 15)} />
          </div>
        );
      })}
    </div>
  );
}
