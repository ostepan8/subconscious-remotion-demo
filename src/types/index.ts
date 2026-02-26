export interface SceneStyleOverrides {
  accentColor?: string;
  backgroundTint?: string;
  surfaceColor?: string;
  headlineColor?: string;
  emphasisLevel?: "low" | "medium" | "high";
}

export interface ThemePersonality {
  vibe: "cyberpunk" | "minimal" | "editorial" | "energetic" | "luxury";
  mood: string;
  designPrompt: string;
}

export interface VideoTheme {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textMuted: string;
    accent: string;
    glow?: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  transitions: {
    default: "fade" | "slide" | "zoom";
  };
  borderRadius: number;
  personality: ThemePersonality;
}

export type SceneType =
  | "hero"
  | "features"
  | "testimonial"
  | "how-it-works"
  | "pricing"
  | "cta"
  | "stats"
  | "logo-cloud"
  | "comparison"
  | "faq"
  | "image-showcase"
  | "video-clip"
  | "product-showcase"
  | "custom"
  | "timeline"
  | "team"
  | "social-proof"
  | "bento-grid"
  | "gradient-text"
  | "before-after"
  | "countdown"
  | "component-showcase"
  | "generated"
  | "demo-dashboard"
  | "demo-editor"
  | "demo-chat"
  | "demo-theme-picker"
  | "demo-voiceover";

export type SceneLayout =
  | "centered"
  | "split"
  | "media-left"
  | "media-right"
  | "grid"
  | "list"
  | "cards"
  | "minimal"
  | "bold"
  | "banner";

export interface SceneContent {
  headline?: string;
  subtext?: string;
  bullets?: string[];
  quote?: string;
  author?: string;
  buttonText?: string;
  price?: string;
  features?: { title: string; description: string }[];
  steps?: { number: number; title: string; description: string }[];
  stats?: { value: string; label: string }[];
  logos?: string[];
  items?: { label: string; us: string; them: string }[];
  questions?: { question: string; answer: string }[];
  mediaUrl?: string;
  mediaId?: string;
  mediaPlacement?: "background" | "overlay" | "overlay-tl" | "overlay-tr" | "overlay-bl" | "overlay-br" | "inline" | "left" | "right" | "fill";
  mediaWidth?: number;
  mediaHeight?: number;
  mimeType?: string;
  mediaScale?: number;
  mediaFit?: "cover" | "contain" | "fill";
  mediaFrame?: "none" | "browser" | "phone";
  mediaShadow?: boolean;
  callouts?: { text: string; position?: string }[];
  componentName?: string;
  sourceCode?: string;
  componentProps?: string[];
  mockupElements?: MockupElement[];
  mockupVariant?: "browser" | "phone" | "card";
  layout?: SceneLayout;
  styleOverrides?: SceneStyleOverrides;
  milestones?: { year: string; title: string; description: string }[];
  members?: { name: string; role: string; initial?: string }[];
  rating?: number;
  reviewCount?: string;
  reviews?: { text: string; author: string; stars?: number }[];
  cells?: { title: string; description: string; size?: "sm" | "md" | "lg" }[];
  before?: { title: string; points: string[] };
  after?: { title: string; points: string[] };
  date?: string;
  usLabel?: string;
  themLabel?: string;
  generationStatus?: "pending" | "generating" | "ready" | "error";
  generatedCode?: string;
  generationError?: string;
  [key: string]: unknown;
}

export type MockupElementType =
  | "navbar" | "card" | "hero-section" | "form"
  | "button" | "input" | "list" | "table"
  | "metrics" | "sidebar" | "badge" | "avatar"
  | "divider" | "text" | "image-placeholder"
  | "code-snippet" | "tabs" | "toggle" | "search"
  | "progress-bar" | "chip-group" | "stat-card" | "dropdown";

export interface MockupElement {
  type: MockupElementType;
  label?: string;
  items?: string[];
  columns?: string[];
  rows?: string[][];
  value?: string;
  description?: string;
  variant?: string;
  size?: "sm" | "md" | "lg";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
