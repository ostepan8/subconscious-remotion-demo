import type { VideoTheme } from "@/types";

export const agency: VideoTheme = {
  id: "agency",
  name: "Bold Creative",
  description: "Hot pink, electric yellow, maximum energy",
  preview: "linear-gradient(135deg, #0a0a1f 0%, #ff2d5544 50%, #ffee0033 100%)",
  colors: {
    background: "#0a0a1f",
    surface: "#161636",
    primary: "#ff2d55",
    secondary: "#ffee00",
    text: "#ffffff",
    textMuted: "#8888b3",
    accent: "#ff6b35",
    glow: "#ff2d55",
  },
  fonts: { heading: "Space Grotesk", body: "DM Sans" },
  transitions: { default: "zoom" },
  borderRadius: 24,
  personality: {
    vibe: "energetic",
    mood: "Bold, playful, in-your-face creative energy",
    designPrompt: `You are designing for a BOLD CREATIVE / AGENCY theme. Key visual rules:
- Background is deep dark navy (#0a0a1f) — creates dramatic contrast
- PRIMARY is HOT PINK (#ff2d55) — bold, attention-grabbing, unapologetic
- SECONDARY is ELECTRIC YELLOW (#ffee00) — high energy, contrasting
- Use BOTH colors together for maximum impact — gradient from pink to yellow
- Border radius is SUPER ROUNDED (24px) — playful, chunky, fun
- Cards have THICK BORDERS: \`border: 3px solid #ff2d5540\` with colored backgrounds
- Headlines use gradient text: hot pink → electric yellow
- Add DIAGONAL elements — rotated decorative strips, angled backgrounds
- Typography is bold and large — Space Grotesk for geometric, modern headings
- Think Spotify Wrapped, creative agencies, festival branding
- Buttons are chunky, filled with gradient, rounded pills
- Use accent orange (#ff6b35) for tertiary highlights
- Glow effects use pink: \`box-shadow: 0 0 40px #ff2d5530\`
- Everything should feel ENERGETIC, BOLD, and UNAPOLOGETICALLY CREATIVE
- Animations should be snappy and bouncy, not subtle`,
  },
};
