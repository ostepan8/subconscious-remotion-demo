import type { VideoTheme } from "@/types";

export const saas: VideoTheme = {
  id: "saas",
  name: "SaaS Clean",
  description: "Crisp white, soft indigo, trustworthy",
  preview: "linear-gradient(180deg, #ffffff 0%, #f0f0ff 50%, #e0e7ff 100%)",
  colors: {
    background: "#ffffff",
    surface: "#f8f9fc",
    primary: "#4f46e5",
    secondary: "#06b6d4",
    text: "#111827",
    textMuted: "#6b7280",
    accent: "#818cf8",
  },
  fonts: { heading: "Inter", body: "Inter" },
  transitions: { default: "slide" },
  borderRadius: 16,
  personality: {
    vibe: "minimal",
    mood: "Clean, professional, Apple-like minimalism",
    designPrompt: `You are designing for a CLEAN SAAS / CORPORATE theme. Key visual rules:
- Background is PURE WHITE (#ffffff) — maximize whitespace
- Colors are soft and professional: indigo primary (#4f46e5), subtle cyan secondary
- Cards use CLEAN ELEVATION: white background, very soft shadows (\`0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)\`)
- NO glow effects, NO neon, NO heavy gradients
- Border radius is generous (16px) — soft, modern, friendly
- Typography is Inter for everything — clean and readable
- Headlines are SOLID color, not gradient — clean and direct
- Subtle background: barely-visible dot grid or no pattern at all
- Think Apple.com, Linear, Vercel — polished and understated
- Buttons are solid indigo with no glow, subtle hover shadow
- Use lots of WHITESPACE — let content breathe
- Accent color is soft indigo (#818cf8) for highlights
- Everything should feel trustworthy, professional, and premium without being flashy`,
  },
};
