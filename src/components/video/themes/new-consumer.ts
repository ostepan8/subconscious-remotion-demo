import type { VideoTheme } from "@/types";

export const newConsumer: VideoTheme = {
  id: "new-consumer",
  name: "New Consumer",
  description: "Soft pastels, playful gradients, gen-z energy",
  preview: "linear-gradient(135deg, #fdf2f8 0%, #ede9fe 40%, #dbeafe 70%, #d1fae5 100%)",
  colors: {
    background: "#fdf2f8",
    surface: "#ffffff",
    primary: "#a855f7",
    secondary: "#f472b6",
    text: "#1e1b4b",
    textMuted: "#7c7399",
    accent: "#06b6d4",
    glow: "#a855f7",
  },
  fonts: { heading: "Sora", body: "DM Sans" },
  transitions: { default: "slide" },
  borderRadius: 28,
  personality: {
    vibe: "consumer",
    mood: "Playful, warm, trendy consumer brand for gen-z/millennials",
    designPrompt: `You are designing for a NEW-AGE CONSUMER / GEN-Z theme. Key visual rules:
- Background uses SOFT PASTEL GRADIENTS — lavender, pink, mint, peach blending together
- Start with blush pink (#fdf2f8) and let it flow into lavender and mint
- Primary is VIBRANT PURPLE (#a855f7) — trendy, youthful, eye-catching
- Secondary is HOT PINK (#f472b6) — playful, warm, energetic
- Accent is CYAN (#06b6d4) — fresh, modern contrast
- Border radius is VERY ROUNDED (28px) — everything feels like a pill or bubble
- Cards should feel like FLOATING BUBBLES: white with pastel shadows (\`0 8px 32px rgba(168,85,247,0.08), 0 2px 8px rgba(0,0,0,0.04)\`)
- Use MULTI-COLOR GRADIENTS for headlines: purple → pink → cyan
- Font is Sora for headings — geometric, modern, friendly
- Body text uses DM Sans — clean and approachable
- Think Notion, Arc browser, Figma, Framer — modern design tools
- Add PLAYFUL decorations: rounded blobs, soft gradients, floating shapes
- Buttons are pill-shaped with gradient fills: purple → pink
- Use EMOJI-STYLE icons and decorative elements sparingly for personality
- Backgrounds should feel like a SOFT WATERCOLOR wash — organic and warm
- Everything should feel APPROACHABLE, FUN, and PREMIUM without being corporate
- Shadows are COLORED: use pastel purple/pink tints, never gray
- Animations should be BOUNCY with spring physics — playful and delightful
- Use frosted glass with WARM tints: \`background: rgba(255,255,255,0.7); backdrop-filter: blur(20px)\`
- Headlines are dark indigo (#1e1b4b) for readability against pastels
- Mix THICK and THIN text weights for visual interest in headlines`,
  },
};
