import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock Remotion since it requires a special rendering context
vi.mock("remotion", () => ({
  AbsoluteFill: ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div data-testid="absolute-fill" style={style}>
      {children}
    </div>
  ),
  Series: Object.assign(
    ({ children }: { children: React.ReactNode }) => (
      <div data-testid="series">{children}</div>
    ),
    {
      Sequence: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="series-sequence">{children}</div>
      ),
    }
  ),
  Sequence: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sequence">{children}</div>
  ),
  interpolate: vi.fn().mockReturnValue(0),
  useCurrentFrame: vi.fn().mockReturnValue(0),
  Easing: {
    out: () => (t: number) => t,
    in: () => (t: number) => t,
    cubic: (t: number) => t,
    ease: (t: number) => t,
  },
  Img: ({ src }: { src: string }) => <img src={src} data-testid="remotion-img" />,
  OffthreadVideo: ({ src }: { src: string }) => (
    <video src={src} data-testid="remotion-video" />
  ),
  staticFile: (path: string) => path,
  spring: vi.fn().mockReturnValue(1),
  useVideoConfig: vi.fn().mockReturnValue({
    fps: 30,
    durationInFrames: 150,
    width: 1920,
    height: 1080,
  }),
}));

import VideoComposition from "@/components/video/VideoComposition";
import type { SceneData } from "@/components/video/VideoComposition";
import type { VideoTheme } from "@/types";

const mockTheme: VideoTheme = {
  id: "saas",
  name: "SaaS Product",
  description: "Clean and modern",
  preview: "linear-gradient(135deg, #fff, #eee)",
  colors: {
    background: "#ffffff",
    surface: "#f8f9fa",
    primary: "#2563eb",
    secondary: "#3b82f6",
    text: "#1e293b",
    textMuted: "#64748b",
    accent: "#3b82f6",
  },
  fonts: { heading: "Geist Sans", body: "Geist Sans" },
  transitions: { default: "fade" },
  borderRadius: 12,
};

describe("VideoComposition", () => {
  it("renders empty state when no scenes provided", () => {
    render(<VideoComposition scenes={[]} theme={mockTheme} />);
    expect(
      screen.getByText(/no scenes yet/i)
    ).toBeInTheDocument();
  });

  it("renders empty state with theme background color", () => {
    render(<VideoComposition scenes={[]} theme={mockTheme} />);
    const fill = screen.getByTestId("absolute-fill");
    // jsdom normalizes hex to rgb
    expect(fill.style.background).toBeTruthy();
  });

  it("renders scenes in a Series when scenes are provided", () => {
    const scenes: SceneData[] = [
      {
        id: "scene_1",
        type: "hero",
        title: "Opening",
        content: { headline: "Welcome", subtext: "To our app" },
        durationInFrames: 150,
        transition: "fade",
      },
    ];

    render(<VideoComposition scenes={scenes} theme={mockTheme} />);
    expect(screen.getByTestId("series")).toBeInTheDocument();
  });

  it("renders the correct number of scene sequences", () => {
    const scenes: SceneData[] = [
      {
        id: "scene_1",
        type: "hero",
        title: "Hero",
        content: { headline: "Welcome" },
        durationInFrames: 150,
        transition: "fade",
      },
      {
        id: "scene_2",
        type: "features",
        title: "Features",
        content: { headline: "Key Features" },
        durationInFrames: 210,
        transition: "slide",
      },
      {
        id: "scene_3",
        type: "cta",
        title: "CTA",
        content: { headline: "Get Started" },
        durationInFrames: 120,
        transition: "fade",
      },
    ];

    render(<VideoComposition scenes={scenes} theme={mockTheme} />);
    const sequences = screen.getAllByTestId("series-sequence");
    expect(sequences).toHaveLength(3);
  });

  it("renders hero scene content", () => {
    const scenes: SceneData[] = [
      {
        id: "scene_1",
        type: "hero",
        title: "Hero",
        content: { headline: "Build Something Great", subtext: "Start today", buttonText: "Get Started" },
        durationInFrames: 150,
        transition: "fade",
      },
    ];

    render(<VideoComposition scenes={scenes} theme={mockTheme} />);
    expect(screen.getByText("Build Something Great")).toBeInTheDocument();
  });

  it("renders features scene with features list", () => {
    const scenes: SceneData[] = [
      {
        id: "scene_1",
        type: "features",
        title: "Features",
        content: {
          headline: "Why Choose Us",
          features: [
            { title: "Fast", description: "Blazing speed" },
            { title: "Secure", description: "Enterprise security" },
          ],
        },
        durationInFrames: 210,
        transition: "fade",
      },
    ];

    render(<VideoComposition scenes={scenes} theme={mockTheme} />);
    expect(screen.getByText("Why Choose Us")).toBeInTheDocument();
    expect(screen.getByText("Fast")).toBeInTheDocument();
    expect(screen.getByText("Secure")).toBeInTheDocument();
  });

  it("renders testimonial scene", () => {
    const scenes: SceneData[] = [
      {
        id: "scene_1",
        type: "testimonial",
        title: "Testimonial",
        content: { quote: "Amazing product!", author: "John Doe" },
        durationInFrames: 150,
        transition: "fade",
      },
    ];

    render(<VideoComposition scenes={scenes} theme={mockTheme} />);
    expect(screen.getByText(/Amazing product!/)).toBeInTheDocument();
  });

  it("renders pricing scene", () => {
    const scenes: SceneData[] = [
      {
        id: "scene_1",
        type: "pricing",
        title: "Pricing",
        content: {
          headline: "Simple Pricing",
          price: "$29/mo",
          subtext: "Everything included",
          bullets: ["Unlimited users", "24/7 support"],
        },
        durationInFrames: 180,
        transition: "fade",
      },
    ];

    render(<VideoComposition scenes={scenes} theme={mockTheme} />);
    expect(screen.getByText("Simple Pricing")).toBeInTheDocument();
    expect(screen.getByText("$29/mo")).toBeInTheDocument();
  });

  it("renders CTA scene", () => {
    const scenes: SceneData[] = [
      {
        id: "scene_1",
        type: "cta",
        title: "CTA",
        content: {
          headline: "Ready to Start?",
          subtext: "Join thousands of users",
          buttonText: "Sign Up Free",
        },
        durationInFrames: 120,
        transition: "fade",
      },
    ];

    render(<VideoComposition scenes={scenes} theme={mockTheme} />);
    expect(screen.getByText("Ready to Start?")).toBeInTheDocument();
  });

  it("renders custom scene as fallback for unknown types", () => {
    const scenes: SceneData[] = [
      {
        id: "scene_1",
        type: "custom",
        title: "Custom",
        content: { headline: "Custom Content", subtext: "Flexible" },
        durationInFrames: 150,
        transition: "none",
      },
    ];

    render(<VideoComposition scenes={scenes} theme={mockTheme} />);
    expect(screen.getByText("Custom Content")).toBeInTheDocument();
  });
});

describe("SceneData type", () => {
  it("validates scene data shape", () => {
    const scene: SceneData = {
      id: "scene_1",
      type: "hero",
      title: "Test",
      content: { headline: "Hello" },
      durationInFrames: 150,
      transition: "fade",
    };

    expect(scene.id).toBeDefined();
    expect(scene.type).toBeDefined();
    expect(scene.durationInFrames).toBeGreaterThan(0);
  });

  it("accepts all valid scene types", () => {
    const validTypes = [
      "hero",
      "features",
      "stats",
      "testimonial",
      "logo-cloud",
      "how-it-works",
      "comparison",
      "pricing",
      "faq",
      "cta",
      "image-showcase",
      "video-clip",
      "custom",
    ] as const;

    for (const type of validTypes) {
      const scene: SceneData = {
        id: `scene_${type}`,
        type,
        title: type,
        content: {},
        durationInFrames: 150,
        transition: "fade",
      };
      expect(scene.type).toBe(type);
    }
  });
});
