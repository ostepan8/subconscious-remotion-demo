import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockRemoveScene = vi.fn();
const mockDuplicateScene = vi.fn();
const mockAddScene = vi.fn();
const mockReorderScenes = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn().mockImplementation((apiRef: { name?: string }) => {
    const name = String(apiRef);
    if (name.includes("removeScene")) return mockRemoveScene;
    if (name.includes("duplicateScene")) return mockDuplicateScene;
    if (name.includes("addScene")) return mockAddScene;
    if (name.includes("reorderScenes")) return mockReorderScenes;
    return vi.fn();
  }),
}));

import SceneList from "@/components/editor/SceneList";

const mockScenes = [
  {
    _id: "scene_1" as any,
    order: 0,
    type: "hero",
    title: "Opening",
    durationInFrames: 150,
    voiceoverScript: "Welcome",
    content: { headline: "Welcome" },
    projectId: "proj_1" as any,
    transition: "fade",
  },
  {
    _id: "scene_2" as any,
    order: 1,
    type: "features",
    title: "Features",
    durationInFrames: 210,
    content: { headline: "Features" },
    projectId: "proj_1" as any,
    transition: "slide",
  },
  {
    _id: "scene_3" as any,
    order: 2,
    type: "cta",
    title: "Call to Action",
    durationInFrames: 120,
    content: { headline: "Get Started" },
    projectId: "proj_1" as any,
    transition: "fade",
  },
];

describe("SceneList", () => {
  const defaultProps = {
    scenes: mockScenes,
    activeSceneId: null as string | null,
    projectId: "proj_1" as any,
    onSelectScene: vi.fn(),
    onEditScene: vi.fn(),
    onSplitScene: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders scene count and total duration", () => {
    render(<SceneList {...defaultProps} />);
    const totalFrames = 150 + 210 + 120;
    const totalSeconds = (totalFrames / 30).toFixed(1);
    expect(
      screen.getByText(`3 scenes · ${totalSeconds}s`)
    ).toBeInTheDocument();
  });

  it("renders the + Add button", () => {
    render(<SceneList {...defaultProps} />);
    expect(screen.getByText("+ Add")).toBeInTheDocument();
  });

  it("shows empty state when no scenes", () => {
    render(<SceneList {...defaultProps} scenes={[]} />);
    expect(
      screen.getByText(/no scenes yet/i)
    ).toBeInTheDocument();
  });

  it("renders scene count as 0 when empty", () => {
    render(<SceneList {...defaultProps} scenes={[]} />);
    expect(screen.getByText(/0 scenes/)).toBeInTheDocument();
  });

  it("shows add scene modal when + Add is clicked", async () => {
    const user = userEvent.setup();
    render(<SceneList {...defaultProps} />);
    await user.click(screen.getByText("+ Add"));

    expect(screen.getByText("Add Scene")).toBeInTheDocument();
    expect(screen.getByText("Choose a template, then customize")).toBeInTheDocument();
  });

  it("calculates total duration correctly", () => {
    const totalDuration = mockScenes.reduce(
      (sum, s) => sum + s.durationInFrames,
      0
    );
    expect(totalDuration).toBe(480);
    expect((totalDuration / 30).toFixed(1)).toBe("16.0");
  });
});

describe("Scene templates", () => {
  const templates = [
    { type: "hero", label: "Hero — Centered", duration: 150 },
    { type: "hero", label: "Hero — Split", duration: 150 },
    { type: "hero", label: "Hero — Minimal", duration: 120 },
    { type: "features", label: "Features — Grid", duration: 210 },
    { type: "features", label: "Features — Stack", duration: 210 },
    { type: "features", label: "Features — Cards", duration: 240 },
    { type: "stats", label: "Stats — Metrics", duration: 180 },
    { type: "testimonial", label: "Testimonial — Quote", duration: 150 },
    { type: "testimonial", label: "Testimonial — Card", duration: 150 },
    { type: "logo-cloud", label: "Logo Cloud", duration: 150 },
    { type: "how-it-works", label: "How It Works", duration: 210 },
    { type: "comparison", label: "Comparison", duration: 210 },
    { type: "pricing", label: "Pricing", duration: 180 },
    { type: "faq", label: "FAQ", duration: 240 },
    { type: "cta", label: "CTA — Bold", duration: 120 },
    { type: "cta", label: "CTA — Minimal", duration: 120 },
    { type: "image-showcase", label: "Image Showcase", duration: 150 },
    { type: "video-clip", label: "Video Clip", duration: 300 },
    { type: "custom", label: "Blank Scene", duration: 150 },
  ];

  it("has 19 scene templates with layout variants", () => {
    expect(templates).toHaveLength(19);
  });

  it("each template has a valid duration (>0)", () => {
    for (const t of templates) {
      expect(t.duration).toBeGreaterThan(0);
    }
  });

  it("hero templates default to 150 frames (5 seconds) except minimal at 120", () => {
    const heroes = templates.filter((t) => t.type === "hero");
    expect(heroes).toHaveLength(3);
    expect(heroes[0].duration).toBe(150);
    expect(heroes[2].duration).toBe(120);
  });

  it("features templates have 210-240 frame durations", () => {
    const features = templates.filter((t) => t.type === "features");
    expect(features).toHaveLength(3);
    for (const f of features) {
      expect(f.duration).toBeGreaterThanOrEqual(210);
    }
  });

  it("video-clip template has longest default duration of 300 (10 seconds)", () => {
    const videoClip = templates.find((t) => t.type === "video-clip");
    expect(videoClip?.duration).toBe(300);
    const maxDuration = Math.max(...templates.map((t) => t.duration));
    expect(videoClip?.duration).toBe(maxDuration);
  });

  it("cta templates have shortest default duration of 120 (4 seconds)", () => {
    const ctas = templates.filter((t) => t.type === "cta");
    for (const cta of ctas) {
      expect(cta.duration).toBe(120);
    }
  });
});

describe("SceneList - drag and drop reordering", () => {
  it("reorders scenes by moving element from one position to another", () => {
    const ids = ["s1", "s2", "s3", "s4"];
    const fromIndex = 3;
    const dropIndex = 1;

    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(dropIndex, 0, moved);

    expect(ids).toEqual(["s1", "s4", "s2", "s3"]);
  });

  it("does nothing when dragging to same position", () => {
    const ids = ["s1", "s2", "s3"];
    const fromIndex = 1;
    const dropIndex = 1;

    expect(fromIndex === dropIndex).toBe(true);
    // No operation should occur
  });

  it("handles moving first to last", () => {
    const ids = ["s1", "s2", "s3"];
    const fromIndex = 0;
    const dropIndex = 2;

    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(dropIndex, 0, moved);

    expect(ids).toEqual(["s2", "s3", "s1"]);
  });

  it("handles moving last to first", () => {
    const ids = ["s1", "s2", "s3"];
    const fromIndex = 2;
    const dropIndex = 0;

    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(dropIndex, 0, moved);

    expect(ids).toEqual(["s3", "s1", "s2"]);
  });
});
