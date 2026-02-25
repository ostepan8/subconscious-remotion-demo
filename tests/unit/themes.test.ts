import { describe, it, expect } from "vitest";
import { themes, themeList, getTheme } from "@/components/video/themes";
import type { VideoTheme } from "@/types";

describe("themes registry", () => {
  it("contains exactly 5 themes", () => {
    expect(Object.keys(themes)).toHaveLength(5);
  });

  it("contains all expected theme IDs", () => {
    expect(themes).toHaveProperty("tech-startup");
    expect(themes).toHaveProperty("saas");
    expect(themes).toHaveProperty("portfolio");
    expect(themes).toHaveProperty("agency");
    expect(themes).toHaveProperty("ecommerce");
  });

  it("themeList is an array of all themes", () => {
    expect(themeList).toHaveLength(5);
    expect(themeList).toEqual(Object.values(themes));
  });
});

describe("getTheme", () => {
  it("returns the correct theme by ID", () => {
    const theme = getTheme("tech-startup");
    expect(theme.id).toBe("tech-startup");
    expect(theme.name).toBe("Tech Startup");
  });

  it("returns saas as default for unknown theme ID", () => {
    const theme = getTheme("nonexistent-theme");
    expect(theme.id).toBe("saas");
  });

  it("returns saas for empty string", () => {
    const theme = getTheme("");
    expect(theme.id).toBe("saas");
  });
});

describe("theme structure", () => {
  const requiredColorKeys = [
    "background",
    "surface",
    "primary",
    "secondary",
    "text",
    "textMuted",
    "accent",
  ] as const;

  for (const [themeId, theme] of Object.entries(themes)) {
    describe(`${themeId} theme`, () => {
      it("has required string fields", () => {
        expect(typeof theme.id).toBe("string");
        expect(typeof theme.name).toBe("string");
        expect(typeof theme.description).toBe("string");
        expect(typeof theme.preview).toBe("string");
      });

      it("has all required color properties", () => {
        for (const key of requiredColorKeys) {
          expect(theme.colors).toHaveProperty(key);
          expect(typeof theme.colors[key]).toBe("string");
          expect(theme.colors[key].length).toBeGreaterThan(0);
        }
      });

      it("has valid font configuration", () => {
        expect(typeof theme.fonts.heading).toBe("string");
        expect(typeof theme.fonts.body).toBe("string");
      });

      it("has a valid default transition", () => {
        expect(["fade", "slide", "zoom"]).toContain(
          theme.transitions.default
        );
      });

      it("has a numeric border radius", () => {
        expect(typeof theme.borderRadius).toBe("number");
        expect(theme.borderRadius).toBeGreaterThanOrEqual(0);
      });

      it("id matches the key in the themes map", () => {
        expect(theme.id).toBe(themeId);
      });
    });
  }
});

describe("theme color validity", () => {
  const hexColorPattern = /^#[0-9a-fA-F]{3,8}$/;

  for (const [themeId, theme] of Object.entries(themes)) {
    it(`${themeId} has valid hex colors`, () => {
      for (const [key, value] of Object.entries(theme.colors)) {
        expect(
          hexColorPattern.test(value),
          `${themeId}.colors.${key} = "${value}" is not a valid hex color`
        ).toBe(true);
      }
    });
  }
});
