import type { VideoTheme } from "@/types";

export const retroHtml: VideoTheme = {
  id: "retro-html",
  name: "Retro Web",
  description: "90s HTML nostalgia, Times New Roman, blue links",
  preview: "linear-gradient(180deg, #c0c0c0 0%, #d4d0c8 50%, #808080 100%)",
  colors: {
    background: "#c0c0c0",
    surface: "#ffffff",
    primary: "#0000ee",
    secondary: "#551a8b",
    text: "#000000",
    textMuted: "#555555",
    accent: "#ff0000",
  },
  fonts: { heading: "Times New Roman", body: "Courier New" },
  transitions: { default: "fade" },
  borderRadius: 0,
  personality: {
    vibe: "retro",
    mood: "Nostalgic 90s web, early internet, GeoCities energy",
    designPrompt: `You are designing for a RETRO / OLD-SCHOOL HTML theme. Key visual rules:
- Background is CLASSIC GRAY (#c0c0c0) — like Windows 95 dialog boxes
- Surface is plain WHITE (#ffffff) with BEVELED BORDERS: use \`border: 2px outset #d4d0c8\` or \`inset\` for inputs
- Primary is HYPERLINK BLUE (#0000ee) — the original blue link color
- Secondary is VISITED PURPLE (#551a8b) — classic web
- Accent is RED (#ff0000) — for "NEW!" badges, hit counters, attention
- Border radius is ZERO — everything is SHARP and RECTANGULAR
- Font is Times New Roman for headings — THE default web font
- Body text is Courier New (monospace) — feels like a terminal or early web
- Cards use THICK BORDERS: \`border: 3px ridge #808080\` or \`groove\` — classic Win95 UI
- Add nostalgic elements: "Under Construction" vibes, marquee-like animations, thick HR lines
- Buttons look like classic OS buttons: raised/beveled, gray, with dark text
- Think GeoCities, Angelfire, early Yahoo, Windows 95 dialog boxes
- Use TABLE-LIKE layouts with clear grid structures and borders
- Headlines can be underlined like <u> tags — old-school formatting
- Color palette is limited: gray, white, blue, purple, red, black
- Everything should feel AUTHENTIC to 1995-2000 web — charmingly ugly
- NO gradients, NO glass, NO modern polish — raw HTML energy
- Use ★ stars, → arrows, ● bullets as decorative text elements
- Shadow effects use simple \`2px 2px 0px #808080\` — hard pixel shadows`,
  },
};
