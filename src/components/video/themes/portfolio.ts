import type { VideoTheme } from "@/types";

export const portfolio: VideoTheme = {
  id: "portfolio",
  name: "Editorial",
  description: "Serif typography, warm cream, copper accents",
  preview: "linear-gradient(180deg, #f5f0e8 0%, #ede5d8 50%, #c4956a33 100%)",
  colors: {
    background: "#f5f0e8",
    surface: "#ffffff",
    primary: "#1a1a1a",
    secondary: "#c4956a",
    text: "#1a1a1a",
    textMuted: "#8a8578",
    accent: "#c4956a",
  },
  fonts: { heading: "Playfair Display", body: "Source Serif 4" },
  transitions: { default: "fade" },
  borderRadius: 2,
  personality: {
    vibe: "editorial",
    mood: "Magazine editorial, artistic, typographically rich",
    designPrompt: `You are designing for an EDITORIAL / MAGAZINE theme. Key visual rules:
- Background is warm cream (#f5f0e8) — feels like quality paper
- Typography is THE STAR: use Playfair Display (serif) for dramatic headlines
- Body text uses Source Serif 4 — sophisticated and readable
- Accent color is warm copper/terracotta (#c4956a) — used SPARINGLY
- Border radius is nearly zero (2px) — sharp, editorial, intentional
- Cards use THIN BORDERS only: \`border: 1px solid #1a1a1a15\` — NO fills, NO glass
- NO gradient backgrounds, NO mesh patterns, NO glow effects
- Background should be CLEAN — just the cream color, maybe a subtle vignette
- Use horizontal RULES (thin lines) as decorative dividers
- Headlines should be LARGE with dramatic weight contrast (mix of light and bold)
- Think Monocle magazine, Kinfolk, editorial design
- Spacing is generous and asymmetric where appropriate
- Use \`letter-spacing: 0.15em; text-transform: uppercase\` for labels/captions
- Buttons are outlined or text-only with underlines — never filled/chunky
- Everything should feel curated, intentional, and artistically restrained`,
  },
};
