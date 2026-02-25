import { useCurrentFrame } from "remotion";
import type { VideoTheme } from "@/types";
import { fadeInUp, scaleIn, isThemeDark, spacing, easings } from "./shared";
import { interpolate } from "remotion";

type MockupVariant = "browser" | "phone" | "app";

export default function MockupPlaceholder({
  theme,
  variant = "browser",
}: {
  theme: VideoTheme;
  variant?: MockupVariant;
}) {
  const frame = useCurrentFrame();
  const isDark = isThemeDark(theme);

  if (variant === "phone") return <PhoneMockup frame={frame} theme={theme} isDark={isDark} />;
  if (variant === "app") return <AppMockup frame={frame} theme={theme} isDark={isDark} />;
  return <BrowserMockup frame={frame} theme={theme} isDark={isDark} />;
}

function SkeletonLine({
  width,
  height = 10,
  color,
  frame,
  delay,
  radius = 5,
}: {
  width: string | number;
  height?: number;
  color: string;
  frame: number;
  delay: number;
  radius?: number;
}) {
  const shimmerPos = interpolate(frame, [delay + 10, delay + 50], [-100, 200], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.smooth,
  });

  return (
    <div
      style={{
        ...fadeInUp(frame, delay, 12, 12),
        width,
        height,
        borderRadius: radius,
        background: color,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            `linear-gradient(105deg,`,
            `transparent ${shimmerPos - 30}%,`,
            `rgba(255,255,255,0.12) ${shimmerPos}%,`,
            `transparent ${shimmerPos + 30}%)`,
          ].join(" "),
        }}
      />
    </div>
  );
}

function BrowserMockup({
  frame,
  theme,
  isDark,
}: {
  frame: number;
  theme: VideoTheme;
  isDark: boolean;
}) {
  const chrome = isDark ? "#1e1e2e" : "#f1f1f5";
  const surface = isDark ? "#141420" : "#ffffff";
  const skeleton = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const skeletonStrong = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.09)";
  const dotColors = ["#ff5f57", "#ffbd2e", "#28c840"];

  return (
    <div
      style={{
        ...scaleIn(frame, 10, 22),
        width: "100%",
        borderRadius: spacing.borderRadius.lg,
        overflow: "hidden",
        boxShadow: isDark
          ? "0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)"
          : "0 8px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: chrome,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {dotColors.map((c, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: c,
                opacity: 0.85,
              }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            height: 22,
            borderRadius: 6,
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            marginLeft: 12,
            marginRight: 40,
            display: "flex",
            alignItems: "center",
            paddingLeft: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: `1.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
              marginRight: 6,
            }}
          />
          <SkeletonLine width={100} height={6} color={skeleton} frame={frame} delay={14} />
        </div>
      </div>

      {/* Browser content */}
      <div style={{ background: surface, padding: 24, flex: 1 }}>
        {/* Nav skeleton */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
          <SkeletonLine width={80} height={16} color={skeletonStrong} frame={frame} delay={16} />
          <div style={{ flex: 1 }} />
          <SkeletonLine width={48} height={9} color={skeleton} frame={frame} delay={18} />
          <SkeletonLine width={48} height={9} color={skeleton} frame={frame} delay={20} />
          <SkeletonLine width={48} height={9} color={skeleton} frame={frame} delay={22} />
          <div
            style={{
              ...fadeInUp(frame, 24, 10, 12),
              width: 72,
              height: 28,
              borderRadius: 7,
              background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.accent}30)`,
            }}
          />
        </div>

        {/* Hero section skeleton */}
        <div
          style={{
            display: "flex",
            gap: 28,
            marginBottom: 24,
            padding: "20px 0",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
            <SkeletonLine width="90%" height={18} color={skeletonStrong} frame={frame} delay={26} />
            <SkeletonLine width="70%" height={18} color={skeletonStrong} frame={frame} delay={28} />
            <div style={{ height: 8 }} />
            <SkeletonLine width="85%" height={9} color={skeleton} frame={frame} delay={30} />
            <SkeletonLine width="65%" height={9} color={skeleton} frame={frame} delay={32} />
            <div style={{ height: 8 }} />
            <div
              style={{
                ...fadeInUp(frame, 34, 10, 12),
                width: 100,
                height: 32,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                boxShadow: `0 2px 12px ${theme.colors.primary}25`,
              }}
            />
          </div>
          <div
            style={{
              ...scaleIn(frame, 30, 18),
              flex: 0.85,
              height: 120,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.accent}15)`,
              border: `1px solid ${theme.colors.primary}18`,
            }}
          />
        </div>

        {/* Cards row */}
        <div style={{ display: "flex", gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                ...scaleIn(frame, 36 + i * 6, 16),
                flex: 1,
                padding: 16,
                borderRadius: 12,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.accent}10)`,
                }}
              />
              <SkeletonLine width="75%" height={9} color={skeletonStrong} frame={frame} delay={40 + i * 6} />
              <SkeletonLine width="90%" height={7} color={skeleton} frame={frame} delay={42 + i * 6} />
              <SkeletonLine width="60%" height={7} color={skeleton} frame={frame} delay={44 + i * 6} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneMockup({
  frame,
  theme,
  isDark,
}: {
  frame: number;
  theme: VideoTheme;
  isDark: boolean;
}) {
  const surface = isDark ? "#141420" : "#ffffff";
  const skeleton = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const skeletonStrong = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.09)";

  return (
    <div
      style={{
        ...scaleIn(frame, 10, 22),
        width: 200,
        height: 400,
        borderRadius: 28,
        overflow: "hidden",
        background: isDark ? "#0a0a14" : "#e5e5ea",
        padding: 4,
        boxShadow: isDark
          ? "0 12px 48px rgba(0,0,0,0.6)"
          : "0 12px 48px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 24,
          overflow: "hidden",
          background: surface,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Status bar */}
        <div
          style={{
            padding: "8px 16px 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <SkeletonLine width={36} height={6} color={skeletonStrong} frame={frame} delay={14} />
          <div
            style={{
              width: 50,
              height: 18,
              borderRadius: 10,
              background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            }}
          />
          <SkeletonLine width={36} height={6} color={skeletonStrong} frame={frame} delay={14} />
        </div>

        {/* App content */}
        <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
          <SkeletonLine width="70%" height={14} color={skeletonStrong} frame={frame} delay={18} />
          <SkeletonLine width="90%" height={7} color={skeleton} frame={frame} delay={20} />
          <SkeletonLine width="65%" height={7} color={skeleton} frame={frame} delay={22} />

          <div
            style={{
              ...scaleIn(frame, 26, 18),
              width: "100%",
              height: 90,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.accent}15)`,
              marginTop: 4,
            }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  ...scaleIn(frame, 32 + i * 6, 16),
                  flex: 1,
                  height: 70,
                  borderRadius: 10,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    background: `${theme.colors.primary}12`,
                  }}
                />
                <SkeletonLine width="80%" height={5} color={skeleton} frame={frame} delay={36 + i * 6} />
                <SkeletonLine width="55%" height={5} color={skeleton} frame={frame} delay={38 + i * 6} />
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div
            style={{
              ...fadeInUp(frame, 40, 12, 12),
              width: "100%",
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
            }}
          />
        </div>

        {/* Home indicator */}
        <div style={{ padding: "6px 0 8px", display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: 80,
              height: 4,
              borderRadius: 2,
              background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AppMockup({
  frame,
  theme,
  isDark,
}: {
  frame: number;
  theme: VideoTheme;
  isDark: boolean;
}) {
  const surface = isDark ? "#141420" : "#ffffff";
  const skeleton = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const skeletonStrong = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.09)";

  return (
    <div
      style={{
        ...scaleIn(frame, 10, 22),
        width: "100%",
        aspectRatio: "4/3",
        borderRadius: spacing.borderRadius.lg,
        overflow: "hidden",
        background: surface,
        boxShadow: isDark
          ? "0 8px 40px rgba(0,0,0,0.5)"
          : "0 8px 40px rgba(0,0,0,0.1)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        display: "flex",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 60,
          borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          padding: "16px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "center",
        }}
      >
        <div
          style={{
            ...fadeInUp(frame, 14, 10, 10),
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
          }}
        />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              ...fadeInUp(frame, 18 + i * 4, 8, 10),
              width: 24,
              height: 24,
              borderRadius: 6,
              background: i === 0 ? `${theme.colors.primary}20` : skeleton,
            }}
          />
        ))}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SkeletonLine width={100} height={12} color={skeletonStrong} frame={frame} delay={18} />
          <div style={{ flex: 1 }} />
          <div
            style={{
              ...fadeInUp(frame, 22, 8, 10),
              width: 70,
              height: 22,
              borderRadius: 6,
              background: `${theme.colors.primary}20`,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flex: 1 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                ...scaleIn(frame, 26 + i * 6, 16),
                flex: 1,
                borderRadius: 10,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <SkeletonLine width="60%" height={8} color={skeletonStrong} frame={frame} delay={30 + i * 6} />
              <SkeletonLine width="90%" height={6} color={skeleton} frame={frame} delay={32 + i * 6} />
              <SkeletonLine width="75%" height={6} color={skeleton} frame={frame} delay={34 + i * 6} />
              <div style={{ flex: 1 }} />
              <div
                style={{
                  width: "100%",
                  height: 40,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${theme.colors.primary}08, ${theme.colors.accent}08)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
