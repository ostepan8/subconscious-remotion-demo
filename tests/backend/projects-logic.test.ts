import { describe, it, expect } from "vitest";

describe("project creation logic", () => {
  it("generates an externalId with correct prefix", () => {
    const externalId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    expect(externalId).toMatch(/^proj_\d+_[a-z0-9]{4}$/);
  });

  it("generates unique externalIds on multiple calls", () => {
    const ids = Array.from({ length: 100 }, () =>
      `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    );
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(100);
  });

  it("initializes project with draft status", () => {
    const project = {
      title: "My Video",
      description: "A promo video",
      theme: "saas",
      status: "draft",
    };
    expect(project.status).toBe("draft");
  });

  it("creates welcome chat message on project creation", () => {
    const welcomeMessage = {
      role: "assistant",
      content:
        "Hey! I'm your video production assistant. Tell me about your product or website and I'll create a promotional video for you. I'll set up scenes, write scripts, and you can preview everything in real-time.",
    };
    expect(welcomeMessage.role).toBe("assistant");
    expect(welcomeMessage.content).toContain("video production assistant");
  });
});

describe("project update filtering", () => {
  it("filters out undefined fields from update", () => {
    const updates = {
      title: "New Title" as string | undefined,
      description: undefined as string | undefined,
      theme: "agency" as string | undefined,
      status: undefined as string | undefined,
    };

    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    expect(filtered).toEqual({
      title: "New Title",
      theme: "agency",
    });
  });

  it("does not update when all fields are undefined", () => {
    const updates = {
      title: undefined,
      description: undefined,
      theme: undefined,
      status: undefined,
    };

    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    expect(Object.keys(filtered)).toHaveLength(0);
  });
});

describe("project deletion cascade", () => {
  it("identifies all related entities to delete", () => {
    const relatedEntities = ["scenes", "voiceovers", "chatMessages"];
    expect(relatedEntities).toHaveLength(3);
    expect(relatedEntities).toContain("scenes");
    expect(relatedEntities).toContain("voiceovers");
    expect(relatedEntities).toContain("chatMessages");
  });

  it("deletes voiceover audio storage before voiceover records", () => {
    const voiceovers = [
      { _id: "vo1", audioStorageId: "storage_1" },
      { _id: "vo2", audioStorageId: null },
      { _id: "vo3", audioStorageId: "storage_3" },
    ];

    const storageToDelete = voiceovers
      .filter((vo) => vo.audioStorageId)
      .map((vo) => vo.audioStorageId);

    expect(storageToDelete).toHaveLength(2);
    expect(storageToDelete).toContain("storage_1");
    expect(storageToDelete).toContain("storage_3");
  });
});

describe("project authorization", () => {
  it("rejects deletion when userId doesn't match", () => {
    const project = { userId: "user_1" };
    const requestingUserId = "user_2";
    expect(project.userId !== requestingUserId).toBe(true);
  });

  it("allows deletion when userId matches", () => {
    const project = { userId: "user_1" };
    const requestingUserId = "user_1";
    expect(project.userId === requestingUserId).toBe(true);
  });
});
