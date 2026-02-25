import type { VideoTheme } from "@/types";

export const ecommerce: VideoTheme = {
  id: "ecommerce",
  name: "Premium Luxe",
  description: "Forest green, gold accents, refined elegance",
  preview: "linear-gradient(180deg, #faf5ef 0%, #f0e8db 50%, #c9a84c22 100%)",
  colors: {
    background: "#faf5ef",
    surface: "#ffffff",
    primary: "#1a5c3a",
    secondary: "#b8860b",
    text: "#2d2a26",
    textMuted: "#8a8478",
    accent: "#c9a84c",
  },
  fonts: { heading: "Cormorant Garamond", body: "Lato" },
  transitions: { default: "slide" },
  borderRadius: 6,
  personality: {
    vibe: "luxury",
    mood: "Premium, refined, luxurious product brand",
    designPrompt: `You are designing for a PREMIUM LUXURY / E-COMMERCE theme. Key visual rules:
- Background is warm cream (#faf5ef) — feels like expensive paper
- PRIMARY is deep forest green (#1a5c3a) — premium, natural, trustworthy
- ACCENT is GOLD (#c9a84c) — used for highlights, dividers, and special elements
- Secondary is dark gold (#b8860b) for depth
- Cards use ELEGANT BORDERS: \`border: 1px solid #c9a84c30\` with white fill
- Shadows are warm: \`0 4px 20px rgba(45,42,38,0.08)\`
- Headlines use Cormorant Garamond (elegant serif) — large, refined, luxurious
- Body text uses Lato — clean, readable, modern
- Border radius is subtle (6px) — refined, not chunky
- NO neon glows, NO heavy gradients — subtle and tasteful
- Use THIN GOLD LINES as decorative accents and dividers
- Think Aesop, Le Labo, luxury product packaging
- Buttons have thin borders or subtle fills — never loud
- Gold accent should feel like real gold foil — warm, metallic, precious
- Spacing is elegant and balanced — premium products need room
- Everything should feel LUXURIOUS, REFINED, and WORTH THE PRICE
- Use warm tones throughout — nothing cold or digital-feeling`,
  },
};
