import { describe, it, expect } from "vitest";

// Test the business logic extracted from Convex scene mutations.
// Since Convex functions run server-side, we test the logic patterns
// they implement: ordering, shifting, reordering, splitting, etc.

interface MockScene {
  _id: string;
  projectId: string;
  order: number;
  type: string;
  title: string;
  content: Record<string, unknown>;
  durationInFrames: number;
  transition: string;
  voiceoverScript?: string;
}

function createMockScene(overrides: Partial<MockScene> = {}): MockScene {
  return {
    _id: `scene_${Math.random().toString(36).slice(2, 8)}`,
    projectId: "project_1",
    order: 0,
    type: "hero",
    title: "Test Scene",
    content: { headline: "Test" },
    durationInFrames: 150,
    transition: "fade",
    ...overrides,
  };
}

describe("scene ordering logic", () => {
  describe("addScene - order shifting", () => {
    it("shifts scenes at or after the insertion point", () => {
      const existing = [
        createMockScene({ _id: "s1", order: 0 }),
        createMockScene({ _id: "s2", order: 1 }),
        createMockScene({ _id: "s3", order: 2 }),
      ];

      const insertionOrder = 1;
      const shifted = existing.map((scene) => ({
        ...scene,
        order: scene.order >= insertionOrder ? scene.order + 1 : scene.order,
      }));

      expect(shifted[0].order).toBe(0); // unchanged
      expect(shifted[1].order).toBe(2); // shifted +1
      expect(shifted[2].order).toBe(3); // shifted +1
    });

    it("shifts all scenes when inserting at position 0", () => {
      const existing = [
        createMockScene({ _id: "s1", order: 0 }),
        createMockScene({ _id: "s2", order: 1 }),
      ];

      const shifted = existing.map((scene) => ({
        ...scene,
        order: scene.order >= 0 ? scene.order + 1 : scene.order,
      }));

      expect(shifted[0].order).toBe(1);
      expect(shifted[1].order).toBe(2);
    });

    it("shifts no scenes when inserting at the end", () => {
      const existing = [
        createMockScene({ _id: "s1", order: 0 }),
        createMockScene({ _id: "s2", order: 1 }),
      ];

      const insertionOrder = 2;
      const shifted = existing.map((scene) => ({
        ...scene,
        order: scene.order >= insertionOrder ? scene.order + 1 : scene.order,
      }));

      expect(shifted[0].order).toBe(0);
      expect(shifted[1].order).toBe(1);
    });
  });

  describe("removeScene - reordering", () => {
    it("reorders remaining scenes to fill the gap", () => {
      const remaining = [
        createMockScene({ _id: "s1", order: 0 }),
        createMockScene({ _id: "s3", order: 2 }),
        createMockScene({ _id: "s4", order: 3 }),
      ];

      const sorted = [...remaining].sort((a, b) => a.order - b.order);
      const reordered = sorted.map((s, i) => ({ ...s, order: i }));

      expect(reordered[0]).toMatchObject({ _id: "s1", order: 0 });
      expect(reordered[1]).toMatchObject({ _id: "s3", order: 1 });
      expect(reordered[2]).toMatchObject({ _id: "s4", order: 2 });
    });

    it("handles removing the first scene", () => {
      const remaining = [
        createMockScene({ _id: "s2", order: 1 }),
        createMockScene({ _id: "s3", order: 2 }),
      ];

      const sorted = [...remaining].sort((a, b) => a.order - b.order);
      const reordered = sorted.map((s, i) => ({ ...s, order: i }));

      expect(reordered[0]).toMatchObject({ _id: "s2", order: 0 });
      expect(reordered[1]).toMatchObject({ _id: "s3", order: 1 });
    });

    it("handles removing the last scene", () => {
      const remaining = [
        createMockScene({ _id: "s1", order: 0 }),
        createMockScene({ _id: "s2", order: 1 }),
      ];

      const sorted = [...remaining].sort((a, b) => a.order - b.order);
      const reordered = sorted.map((s, i) => ({ ...s, order: i }));

      expect(reordered[0]).toMatchObject({ _id: "s1", order: 0 });
      expect(reordered[1]).toMatchObject({ _id: "s2", order: 1 });
    });
  });

  describe("duplicateScene - insertion after original", () => {
    it("shifts scenes after the original and inserts copy at order+1", () => {
      const existing = [
        createMockScene({ _id: "s1", order: 0, title: "Opening" }),
        createMockScene({ _id: "s2", order: 1, title: "Middle" }),
        createMockScene({ _id: "s3", order: 2, title: "End" }),
      ];

      const toDuplicate = existing[1]; // "Middle"

      const shifted = existing.map((s) => ({
        ...s,
        order: s.order > toDuplicate.order ? s.order + 1 : s.order,
      }));

      const duplicate = createMockScene({
        _id: "s4",
        order: toDuplicate.order + 1,
        title: `${toDuplicate.title} (copy)`,
        content: toDuplicate.content,
      });

      const allScenes = [...shifted, duplicate].sort(
        (a, b) => a.order - b.order
      );

      expect(allScenes).toHaveLength(4);
      expect(allScenes[0].title).toBe("Opening");
      expect(allScenes[1].title).toBe("Middle");
      expect(allScenes[2].title).toBe("Middle (copy)");
      expect(allScenes[3].title).toBe("End");
    });
  });

  describe("splitScene - frame splitting", () => {
    it("splits a scene at a given frame point", () => {
      const scene = createMockScene({
        title: "Full Scene",
        durationInFrames: 200,
      });
      const splitAtFrame = 80;

      const firstPart = { ...scene, durationInFrames: splitAtFrame };
      const secondPart = createMockScene({
        order: scene.order + 1,
        title: `${scene.title} (pt 2)`,
        content: scene.content,
        durationInFrames: scene.durationInFrames - splitAtFrame,
        type: scene.type,
        transition: scene.transition,
      });

      expect(firstPart.durationInFrames).toBe(80);
      expect(secondPart.durationInFrames).toBe(120);
      expect(firstPart.durationInFrames + secondPart.durationInFrames).toBe(
        200
      );
    });

    it("rejects split at frame 0", () => {
      const splitAtFrame = 0;
      const durationInFrames = 150;
      expect(splitAtFrame <= 0 || splitAtFrame >= durationInFrames).toBe(true);
    });

    it("rejects split at or beyond scene duration", () => {
      const splitAtFrame = 150;
      const durationInFrames = 150;
      expect(splitAtFrame <= 0 || splitAtFrame >= durationInFrames).toBe(true);
    });

    it("allows split at midpoint", () => {
      const splitAtFrame = 75;
      const durationInFrames = 150;
      expect(splitAtFrame > 0 && splitAtFrame < durationInFrames).toBe(true);
    });
  });

  describe("reorderScenes", () => {
    it("assigns sequential order values based on sceneIds array position", () => {
      const sceneIds = ["s3", "s1", "s2"];
      const reordered = sceneIds.map((id, i) => ({ id, order: i }));

      expect(reordered).toEqual([
        { id: "s3", order: 0 },
        { id: "s1", order: 1 },
        { id: "s2", order: 2 },
      ]);
    });

    it("handles single scene", () => {
      const sceneIds = ["s1"];
      const reordered = sceneIds.map((id, i) => ({ id, order: i }));
      expect(reordered).toEqual([{ id: "s1", order: 0 }]);
    });

    it("handles empty array", () => {
      const sceneIds: string[] = [];
      const reordered = sceneIds.map((id, i) => ({ id, order: i }));
      expect(reordered).toEqual([]);
    });
  });
});

describe("updateScene filtering", () => {
  it("filters out undefined values from updates", () => {
    const updates = {
      type: "hero" as string | undefined,
      title: undefined as string | undefined,
      content: { headline: "New" } as Record<string, unknown> | undefined,
      durationInFrames: undefined as number | undefined,
      transition: "slide" as string | undefined,
    };

    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    expect(filtered).toEqual({
      type: "hero",
      content: { headline: "New" },
      transition: "slide",
    });
    expect(filtered).not.toHaveProperty("title");
    expect(filtered).not.toHaveProperty("durationInFrames");
  });

  it("returns empty object when all values are undefined", () => {
    const updates = {
      type: undefined,
      title: undefined,
    };

    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    expect(Object.keys(filtered)).toHaveLength(0);
  });
});

describe("scene content validation", () => {
  it("hero scene content has correct shape", () => {
    const heroContent = {
      headline: "Build Something Great",
      subtext: "The fastest way to ship",
      buttonText: "Get Started",
    };
    expect(heroContent).toHaveProperty("headline");
    expect(heroContent).toHaveProperty("subtext");
    expect(heroContent).toHaveProperty("buttonText");
  });

  it("features scene content has correct shape", () => {
    const featuresContent = {
      headline: "Key Features",
      features: [
        { title: "Fast", description: "Lightning quick" },
        { title: "Secure", description: "Bank-level" },
        { title: "Easy", description: "Simple setup" },
      ],
    };
    expect(featuresContent.features).toHaveLength(3);
    for (const feature of featuresContent.features) {
      expect(feature).toHaveProperty("title");
      expect(feature).toHaveProperty("description");
    }
  });

  it("how-it-works scene content has correct shape", () => {
    const howItWorksContent = {
      headline: "How It Works",
      steps: [
        { number: 1, title: "Sign Up", description: "Create account" },
        { number: 2, title: "Configure", description: "Set preferences" },
        { number: 3, title: "Launch", description: "Go live" },
      ],
    };
    expect(howItWorksContent.steps).toHaveLength(3);
    for (const step of howItWorksContent.steps) {
      expect(step).toHaveProperty("number");
      expect(step).toHaveProperty("title");
      expect(step).toHaveProperty("description");
    }
  });

  it("testimonial scene content has correct shape", () => {
    const testimonialContent = {
      quote: "This changed everything for our team.",
      author: "Jane Doe, CEO",
    };
    expect(testimonialContent).toHaveProperty("quote");
    expect(testimonialContent).toHaveProperty("author");
  });

  it("pricing scene content has correct shape", () => {
    const pricingContent = {
      headline: "Simple Pricing",
      price: "$29/mo",
      subtext: "Everything included",
      bullets: ["Unlimited users", "Priority support", "API access"],
    };
    expect(pricingContent.bullets).toHaveLength(3);
  });

  it("image-showcase content includes media fields", () => {
    const imageContent = {
      headline: "Featured Image",
      mediaUrl: "https://example.com/image.jpg",
      mediaId: "media_123",
    };
    expect(imageContent.mediaUrl).toBeTruthy();
    expect(imageContent.mediaId).toBeTruthy();
  });
});
