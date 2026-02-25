import type { VideoTheme } from "@/types";

export const techStartup: VideoTheme = {
  id: "tech-startup",
  name: "Cyberpunk",
  description: "Neon accents, dark depths, electric energy",
  preview: "linear-gradient(135deg, #060612 0%, #0e0e24 40%, #00e5ff22 100%)",
  colors: {
    background: "#060612",
    surface: "#0e0e24",
    primary: "#00e5ff",
    secondary: "#b347ff",
    text: "#e8eaff",
    textMuted: "#6b70a0",
    accent: "#00ffc8",
    glow: "#00e5ff",
  },
  fonts: { heading: "JetBrains Mono", body: "Inter" },
  transitions: { default: "zoom" },
  borderRadius: 8,
  personality: {
    vibe: "cyberpunk",
    mood: "Futuristic, electric, high-tech hacker aesthetic",
    designPrompt: `You are designing for a CYBERPUNK / NEON theme. Key visual rules:
- Background is nearly black (#060612) with electric neon accents
- Use neon cyan (#00e5ff) and electric purple (#b347ff) as primary/secondary
- Add GLOW EFFECTS: box-shadow with neon colors (e.g., \`0 0 30px #00e5ff40, 0 0 60px #00e5ff20\`)
- Cards should have glass morphism with NEON BORDERS: \`border: 1px solid #00e5ff30\`
- Use monospace font for headings (JetBrains Mono) — feels like a terminal
- Headlines should use gradient text from cyan to purple
- Add subtle scan-line effects and grid patterns in the background
- Decorative elements: glowing lines, matrix-like grids, pulsing borders
- Think Tron, Blade Runner, hacker terminals
- Buttons glow with neon box-shadows
- HIGH CONTRAST: bright neon on deep dark backgrounds
- Use \`#00ffc8\` (mint/cyan) for accent highlights
- Avoid warm colors entirely — everything should feel cold, electric, digital`,
  },
};
