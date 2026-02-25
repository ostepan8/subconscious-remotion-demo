"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { SceneType, SceneLayout } from "@/types";

interface SceneTemplate {
  type: SceneType;
  layout: SceneLayout;
  label: string;
  description: string;
  preview: React.ReactNode;
  content: Record<string, unknown>;
  duration: number;
  fields: TemplateField[];
}

interface TemplateField {
  key: string;
  label: string;
  kind: "text" | "textarea" | "list" | "features" | "steps" | "stats" | "logos" | "comparison" | "faq";
}

const TEMPLATES: SceneTemplate[] = [
  // ── Hero ──
  {
    type: "hero", layout: "centered", label: "Hero — Centered",
    description: "Big headline centered with subtext and CTA",
    preview: <HeroPreview layout="centered" />,
    content: { headline: "Your Headline Here", subtext: "Compelling subtitle that converts", buttonText: "Get Started", layout: "centered" },
    duration: 150,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "subtext", label: "Subtext", kind: "textarea" },
      { key: "buttonText", label: "Button Text", kind: "text" },
    ],
  },
  {
    type: "hero", layout: "split", label: "Hero — Split",
    description: "Headline left, visual placeholder right",
    preview: <HeroPreview layout="split" />,
    content: { headline: "Build Something Great", subtext: "Ship faster with the right tools", buttonText: "Learn More", layout: "split" },
    duration: 150,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "subtext", label: "Subtext", kind: "textarea" },
      { key: "buttonText", label: "Button Text", kind: "text" },
    ],
  },
  {
    type: "hero", layout: "minimal", label: "Hero — Minimal",
    description: "Clean type-only hero with large headline",
    preview: <HeroPreview layout="minimal" />,
    content: { headline: "Less is More", subtext: "Focus on what matters", layout: "minimal" },
    duration: 120,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "subtext", label: "Subtext", kind: "textarea" },
    ],
  },
  // ── Features ──
  {
    type: "features", layout: "grid", label: "Features — Grid",
    description: "3-column grid with icon cards",
    preview: <FeaturesPreview layout="grid" />,
    content: { headline: "Key Features", features: [{ title: "Fast", description: "Blazing speed" }, { title: "Secure", description: "Enterprise-grade" }, { title: "Simple", description: "Easy to use" }], layout: "grid" },
    duration: 210,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "features", label: "Features", kind: "features" },
    ],
  },
  {
    type: "features", layout: "list", label: "Features — Stack",
    description: "Vertical list with alternating alignment",
    preview: <FeaturesPreview layout="list" />,
    content: { headline: "Why Choose Us", features: [{ title: "Performance", description: "Optimized for speed" }, { title: "Reliability", description: "99.9% uptime" }], layout: "list" },
    duration: 210,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "features", label: "Features", kind: "features" },
    ],
  },
  {
    type: "features", layout: "cards", label: "Features — Cards",
    description: "Floating cards with depth and shadow",
    preview: <FeaturesPreview layout="cards" />,
    content: { headline: "Everything You Need", features: [{ title: "Analytics", description: "Real-time insights" }, { title: "Automation", description: "Set it and forget it" }, { title: "Integrations", description: "Works with your stack" }], layout: "cards" },
    duration: 240,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "features", label: "Features", kind: "features" },
    ],
  },
  // ── Stats ──
  {
    type: "stats", layout: "centered", label: "Stats — Metrics",
    description: "Big numbers with labels — show traction",
    preview: <StatsPreview />,
    content: { headline: "By The Numbers", stats: [{ value: "10K+", label: "Users" }, { value: "99.9%", label: "Uptime" }, { value: "4.9★", label: "Rating" }], layout: "centered" },
    duration: 180,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "stats", label: "Stats", kind: "stats" },
    ],
  },
  // ── Testimonial ──
  {
    type: "testimonial", layout: "centered", label: "Testimonial — Quote",
    description: "Large centered quote with attribution",
    preview: <TestimonialPreview layout="centered" />,
    content: { quote: "This product changed everything for our team.", author: "Happy Customer, CEO", layout: "centered" },
    duration: 150,
    fields: [
      { key: "quote", label: "Quote", kind: "textarea" },
      { key: "author", label: "Author", kind: "text" },
    ],
  },
  {
    type: "testimonial", layout: "cards", label: "Testimonial — Card",
    description: "Quote in a styled card with accent bar",
    preview: <TestimonialPreview layout="cards" />,
    content: { quote: "Incredible experience from start to finish.", author: "Jane D., Product Lead", layout: "cards" },
    duration: 150,
    fields: [
      { key: "quote", label: "Quote", kind: "textarea" },
      { key: "author", label: "Author", kind: "text" },
    ],
  },
  // ── Logo Cloud ──
  {
    type: "logo-cloud", layout: "centered", label: "Logo Cloud",
    description: "Show brands and partners who trust you",
    preview: <LogoCloudPreview />,
    content: { headline: "Trusted By", logos: ["Acme Inc", "TechCorp", "StartupXYZ", "GlobalCo", "NextGen", "CloudBase"], layout: "centered" },
    duration: 150,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "logos", label: "Company Names", kind: "logos" },
    ],
  },
  // ── How It Works ──
  {
    type: "how-it-works", layout: "centered", label: "How It Works",
    description: "Numbered steps with connecting flow",
    preview: <StepsPreview />,
    content: { headline: "How It Works", steps: [{ number: 1, title: "Sign Up", description: "Create an account" }, { number: 2, title: "Configure", description: "Set your preferences" }, { number: 3, title: "Launch", description: "Go live" }], layout: "centered" },
    duration: 210,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "steps", label: "Steps", kind: "steps" },
    ],
  },
  // ── Comparison ──
  {
    type: "comparison", layout: "centered", label: "Comparison",
    description: "Side-by-side Us vs Others table",
    preview: <ComparisonPreview />,
    content: { headline: "Why Us?", usLabel: "Us", themLabel: "Others", items: [{ label: "Speed", us: "Lightning fast", them: "Average" }, { label: "Price", us: "$29/mo", them: "$99/mo" }, { label: "Support", us: "24/7", them: "Business hours" }], layout: "centered" },
    duration: 210,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "items", label: "Rows", kind: "comparison" },
    ],
  },
  // ── Pricing ──
  {
    type: "pricing", layout: "centered", label: "Pricing",
    description: "Highlighted pricing card with features",
    preview: <PricingPreview />,
    content: { headline: "Simple Pricing", price: "$29/mo", subtext: "Everything included", bullets: ["Unlimited access", "Priority support", "Custom integrations"], layout: "centered" },
    duration: 180,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "price", label: "Price", kind: "text" },
      { key: "subtext", label: "Subtext", kind: "text" },
      { key: "bullets", label: "Features", kind: "list" },
    ],
  },
  // ── FAQ ──
  {
    type: "faq", layout: "centered", label: "FAQ",
    description: "Common questions with short answers",
    preview: <FAQPreview />,
    content: { headline: "FAQ", questions: [{ question: "How do I get started?", answer: "Sign up in 30 seconds." }, { question: "Is there a free plan?", answer: "Yes, our free tier has all core features." }, { question: "Can I cancel anytime?", answer: "Absolutely. No contracts." }], layout: "centered" },
    duration: 240,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "questions", label: "Questions", kind: "faq" },
    ],
  },
  // ── CTA ──
  {
    type: "cta", layout: "bold", label: "CTA — Bold",
    description: "Full-gradient background with strong CTA",
    preview: <CTAPreview layout="bold" />,
    content: { headline: "Ready to Start?", subtext: "Join thousands of happy customers", buttonText: "Get Started Free", layout: "bold" },
    duration: 120,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "subtext", label: "Subtext", kind: "textarea" },
      { key: "buttonText", label: "Button Text", kind: "text" },
    ],
  },
  {
    type: "cta", layout: "minimal", label: "CTA — Minimal",
    description: "Clean, understated closing with button",
    preview: <CTAPreview layout="minimal" />,
    content: { headline: "Let's Build Together", buttonText: "Start Now", layout: "minimal" },
    duration: 120,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "buttonText", label: "Button Text", kind: "text" },
    ],
  },
  // ── Media ──
  {
    type: "image-showcase", layout: "centered", label: "Image Showcase",
    description: "Full-screen image with text overlay",
    preview: <MediaPreview type="image" />,
    content: { headline: "See It In Action", layout: "centered" },
    duration: 150,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "subtext", label: "Subtext", kind: "text" },
    ],
  },
  {
    type: "video-clip", layout: "centered", label: "Video Clip",
    description: "Embedded video with optional caption",
    preview: <MediaPreview type="video" />,
    content: { headline: "", layout: "centered" },
    duration: 300,
    fields: [
      { key: "headline", label: "Caption", kind: "text" },
    ],
  },
  // ── Blank ──
  {
    type: "custom", layout: "centered", label: "Blank Scene",
    description: "Empty canvas — build whatever you want",
    preview: <BlankPreview />,
    content: { headline: "", subtext: "", layout: "centered" },
    duration: 150,
    fields: [
      { key: "headline", label: "Headline", kind: "text" },
      { key: "subtext", label: "Subtext", kind: "textarea" },
      { key: "bullets", label: "Bullet Points", kind: "list" },
    ],
  },
];

interface AddSceneModalProps {
  projectId: Id<"projects">;
  insertAtOrder: number;
  onClose: () => void;
}

export default function AddSceneModal({
  projectId,
  insertAtOrder,
  onClose,
}: AddSceneModalProps) {
  const addScene = useMutation(api.scenes.addScene);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<SceneTemplate | null>(null);
  const [editContent, setEditContent] = useState<Record<string, unknown>>({});
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState(150);

  const categories = [
    { id: "all", label: "All" },
    { id: "hero", label: "Hero" },
    { id: "features", label: "Features" },
    { id: "stats", label: "Stats" },
    { id: "testimonial", label: "Social Proof" },
    { id: "logo-cloud", label: "Logos" },
    { id: "how-it-works", label: "Steps" },
    { id: "comparison", label: "Compare" },
    { id: "pricing", label: "Pricing" },
    { id: "faq", label: "FAQ" },
    { id: "cta", label: "CTA" },
    { id: "media", label: "Media" },
    { id: "custom", label: "Blank" },
  ];

  const filtered =
    selectedCategory === "all"
      ? TEMPLATES
      : selectedCategory === "media"
        ? TEMPLATES.filter((t) => t.type === "image-showcase" || t.type === "video-clip")
        : TEMPLATES.filter((t) => t.type === selectedCategory);

  function handleSelect(template: SceneTemplate) {
    setEditing(template);
    setEditContent(structuredClone(template.content));
    setEditTitle(template.label);
    setEditDuration(template.duration);
  }

  function updateField(key: string, value: unknown) {
    setEditContent((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAdd() {
    if (!editing) return;
    setAdding(true);
    try {
      await addScene({
        projectId,
        order: insertAtOrder,
        type: editing.type,
        title: editTitle,
        content: editContent,
        durationInFrames: editDuration,
        transition: "fade",
      });
      onClose();
    } finally {
      setAdding(false);
    }
  }

  // ── Customize panel (step 2) ──
  if (editing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div
          className="w-full max-w-lg rounded-2xl border max-h-[85vh] flex flex-col"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditing(null)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                style={{ color: "var(--muted)", border: "1px solid var(--border-subtle)" }}
              >
                ←
              </button>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Customize Scene
                </h2>
                <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                  Edit the content before adding
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              ×
            </button>
          </div>

          {/* Edit form */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            <div className="flex flex-col gap-3">
              {/* Title + Duration */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <FieldLabel>Scene Title</FieldLabel>
                  <FieldInput value={editTitle} onChange={setEditTitle} />
                </div>
                <div>
                  <FieldLabel>Duration</FieldLabel>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      min={30}
                      max={900}
                      className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none"
                      style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                    <span className="text-[9px] whitespace-nowrap" style={{ color: "var(--muted)" }}>
                      {(editDuration / 30).toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Content fields */}
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--background)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="text-[10px] font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                  Content
                </div>
                <div className="flex flex-col gap-3">
                  {editing.fields.map((field) => (
                    <EditableField
                      key={field.key}
                      field={field}
                      value={editContent[field.key]}
                      onChange={(val) => updateField(field.key, val)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex justify-between items-center px-5 py-3 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <button
              onClick={() => setEditing(null)}
              className="px-3 py-1.5 rounded-lg text-xs border"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              Back
            </button>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand-orange)" }}
            >
              {adding ? "Adding..." : "Add Scene"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Template picker (step 1) ──
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", padding: "0 16px",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 768,
          height: "85vh",
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header — fixed 60px */}
        <div
          style={{
            height: 60, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 20px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--foreground)" }}>
              Add Scene
            </h2>
            <p style={{ fontSize: 12, margin: "2px 0 0", color: "var(--muted)" }}>
              Choose a template, then customize
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "var(--muted)", cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* Category tabs — fixed 44px */}
        <div
          style={{
            height: 44, flexShrink: 0,
            display: "flex", gap: 4, alignItems: "center",
            padding: "0 20px",
            overflowX: "auto",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: "4px 12px", borderRadius: 999,
                  fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
                  background: isActive ? "var(--brand-orange)" : "transparent",
                  color: isActive ? "#fff" : "var(--muted)",
                  border: "1px solid",
                  borderColor: isActive ? "var(--brand-orange)" : "var(--border-subtle)",
                  cursor: "pointer",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable template grid — takes remaining height */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {filtered.map((template, i) => (
              <div
                key={`${template.type}-${template.layout}-${i}`}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(template)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelect(template); }}
                className="template-card"
                style={{
                  borderRadius: 12, cursor: "pointer", overflow: "hidden",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--background)",
                }}
              >
                {/* Preview: fixed 120px height */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 120,
                    background: "var(--surface)",
                    overflow: "hidden",
                  }}
                >
                  {template.preview}
                </div>
                {/* Label */}
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>
                    {template.label}
                  </div>
                  <div style={{ fontSize: 10, marginTop: 2, lineHeight: 1.3, color: "var(--muted)" }}>
                    {template.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Editable field components ────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium mb-0.5 block" style={{ color: "var(--muted)" }}>
      {children}
    </label>
  );
}

function FieldInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
    />
  );
}

function EditableField({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  if (field.kind === "text") {
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <FieldInput value={String(value ?? "")} onChange={onChange} />
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none resize-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
        />
      </div>
    );
  }

  if (field.kind === "list" || field.kind === "logos") {
    const items = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <div className="flex flex-col gap-1">
          {items.map((item, i) => (
            <div key={i} className="flex gap-1">
              <FieldInput
                value={item}
                onChange={(v) => { const u = [...items]; u[i] = v; onChange(u); }}
              />
              <button
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-[10px] px-1" style={{ color: "var(--muted)" }}
              >×</button>
            </div>
          ))}
          <button
            onClick={() => onChange([...items, ""])}
            className="text-[10px] self-start px-1.5 py-0.5 rounded border"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            + Add
          </button>
        </div>
      </div>
    );
  }

  if (field.kind === "features") {
    const items = Array.isArray(value) ? (value as { title: string; description: string }[]) : [];
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <div className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex gap-1 rounded-lg p-1.5" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex-1 flex flex-col gap-1">
                <FieldInput value={item.title} placeholder="Title" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], title: v }; onChange(u); }} />
                <FieldInput value={item.description} placeholder="Description" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], description: v }; onChange(u); }} />
              </div>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-[10px] px-1 self-start" style={{ color: "var(--muted)" }}>×</button>
            </div>
          ))}
          <button onClick={() => onChange([...items, { title: "", description: "" }])} className="text-[10px] self-start px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>+ Add feature</button>
        </div>
      </div>
    );
  }

  if (field.kind === "steps") {
    const items = Array.isArray(value) ? (value as { number: number; title: string; description: string }[]) : [];
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <div className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex gap-1.5 rounded-lg p-1.5" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-1" style={{ background: "var(--brand-teal)" }}>
                {item.number || i + 1}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <FieldInput value={item.title} placeholder="Step title" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], title: v }; onChange(u); }} />
                <FieldInput value={item.description} placeholder="Description" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], description: v }; onChange(u); }} />
              </div>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-[10px] px-1 self-start" style={{ color: "var(--muted)" }}>×</button>
            </div>
          ))}
          <button onClick={() => onChange([...items, { number: items.length + 1, title: "", description: "" }])} className="text-[10px] self-start px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>+ Add step</button>
        </div>
      </div>
    );
  }

  if (field.kind === "stats") {
    const items = Array.isArray(value) ? (value as { value: string; label: string }[]) : [];
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <div className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex gap-1 rounded-lg p-1.5" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex-1 flex gap-1">
                <FieldInput value={item.value} placeholder="10K+" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], value: v }; onChange(u); }} />
                <FieldInput value={item.label} placeholder="Users" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], label: v }; onChange(u); }} />
              </div>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-[10px] px-1 self-start" style={{ color: "var(--muted)" }}>×</button>
            </div>
          ))}
          <button onClick={() => onChange([...items, { value: "", label: "" }])} className="text-[10px] self-start px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>+ Add stat</button>
        </div>
      </div>
    );
  }

  if (field.kind === "comparison") {
    const items = Array.isArray(value) ? (value as { label: string; us: string; them: string }[]) : [];
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-3 gap-1 text-[9px] font-semibold uppercase tracking-wide px-1" style={{ color: "var(--muted)" }}>
            <span>Feature</span><span>Us</span><span>Others</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex gap-1 rounded-lg p-1.5" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex-1 grid grid-cols-3 gap-1">
                <FieldInput value={item.label} placeholder="Feature" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], label: v }; onChange(u); }} />
                <FieldInput value={item.us} placeholder="Us" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], us: v }; onChange(u); }} />
                <FieldInput value={item.them} placeholder="Others" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], them: v }; onChange(u); }} />
              </div>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-[10px] px-1 self-start" style={{ color: "var(--muted)" }}>×</button>
            </div>
          ))}
          <button onClick={() => onChange([...items, { label: "", us: "", them: "" }])} className="text-[10px] self-start px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>+ Add row</button>
        </div>
      </div>
    );
  }

  if (field.kind === "faq") {
    const items = Array.isArray(value) ? (value as { question: string; answer: string }[]) : [];
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <div className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex gap-1 rounded-lg p-1.5" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex-1 flex flex-col gap-1">
                <FieldInput value={item.question} placeholder="Question" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], question: v }; onChange(u); }} />
                <FieldInput value={item.answer} placeholder="Answer" onChange={(v) => { const u = [...items]; u[i] = { ...u[i], answer: v }; onChange(u); }} />
              </div>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-[10px] px-1 self-start" style={{ color: "var(--muted)" }}>×</button>
            </div>
          ))}
          <button onClick={() => onChange([...items, { question: "", answer: "" }])} className="text-[10px] self-start px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>+ Add question</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FieldLabel>{field.label}</FieldLabel>
      <FieldInput value={String(value ?? "")} onChange={onChange} />
    </div>
  );
}

/* ── Mini preview components ────────────────────────────────────── */

const FG = "var(--foreground)";
const MT = "var(--muted)";
const TEAL = "var(--brand-teal)";
const ORANGE = "var(--brand-orange)";
const BG = "var(--background)";
const BD = "var(--border-subtle)";
const SURF = "var(--surface)";

function Pv({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "12px 16px", gap: 4, overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Ln({ w = "100%", h = 4, c = FG, o = 0.55 }: { w?: string | number; h?: number; c?: string; o?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 2, background: c, opacity: o, flexShrink: 0 }} />;
}

function HeroPreview({ layout }: { layout: string }) {
  if (layout === "split") {
    return (
      <Pv style={{ flexDirection: "row", gap: 10, padding: "14px 16px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
          <Ln w="85%" h={6} o={0.65} />
          <Ln w="100%" h={3} c={MT} o={0.3} />
          <Ln w="65%" h={3} c={MT} o={0.3} />
          <div style={{ width: 40, height: 12, borderRadius: 3, background: ORANGE, opacity: 0.7, marginTop: 4 }} />
        </div>
        <div style={{ width: "36%", borderRadius: 6, background: BD, alignSelf: "stretch", opacity: 0.7 }} />
      </Pv>
    );
  }
  if (layout === "minimal") {
    return (
      <Pv>
        <Ln w="60%" h={7} o={0.55} />
        <Ln w="42%" h={3} c={MT} o={0.25} />
      </Pv>
    );
  }
  return (
    <Pv>
      <Ln w="70%" h={7} o={0.55} />
      <Ln w="50%" h={3} c={MT} o={0.3} />
      <Ln w="38%" h={3} c={MT} o={0.25} />
      <div style={{ width: 44, height: 14, borderRadius: 3, background: ORANGE, opacity: 0.7, marginTop: 4 }} />
    </Pv>
  );
}

function FeaturesPreview({ layout }: { layout: string }) {
  if (layout === "list") {
    return (
      <Pv style={{ gap: 5 }}>
        <Ln w="45%" h={5} o={0.5} />
        {[0, 1].map((i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", width: "100%" }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: TEAL, opacity: 0.6, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <Ln w="75%" h={3} o={0.45} />
              <Ln w="100%" h={2} c={MT} o={0.25} />
            </div>
          </div>
        ))}
      </Pv>
    );
  }
  if (layout === "cards") {
    return (
      <Pv style={{ gap: 5 }}>
        <Ln w="45%" h={5} o={0.5} />
        <div style={{ display: "flex", gap: 5, width: "100%" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1, borderRadius: 5, padding: 6, display: "flex", flexDirection: "column", gap: 3, background: BG, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: `1px solid ${BD}` }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: TEAL, opacity: 0.5 }} />
              <Ln w="75%" h={2} o={0.4} />
              <Ln w="100%" h={2} c={MT} o={0.2} />
            </div>
          ))}
        </div>
      </Pv>
    );
  }
  return (
    <Pv style={{ gap: 5 }}>
      <Ln w="45%" h={5} o={0.5} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, width: "100%" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ borderRadius: 5, padding: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: BG }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: TEAL, opacity: 0.5 }} />
            <Ln w="75%" h={2} o={0.4} />
          </div>
        ))}
      </div>
    </Pv>
  );
}

function StatsPreview() {
  return (
    <Pv style={{ flexDirection: "row", gap: 20 }}>
      {["10K+", "99%", "4.9"].map((v, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, opacity: 0.7 }}>{v}</span>
          <Ln w={28} h={2} c={MT} o={0.3} />
        </div>
      ))}
    </Pv>
  );
}

function TestimonialPreview({ layout }: { layout: string }) {
  if (layout === "cards") {
    return (
      <Pv style={{ padding: "14px 18px" }}>
        <div style={{ width: "100%", borderRadius: 6, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4, background: BG, border: `1px solid ${BD}`, borderLeft: `3px solid ${ORANGE}` }}>
          <Ln w="100%" h={3} c={MT} o={0.3} />
          <Ln w="75%" h={3} c={MT} o={0.3} />
          <Ln w="35%" h={3} o={0.4} />
        </div>
      </Pv>
    );
  }
  return (
    <Pv style={{ gap: 5 }}>
      <span style={{ fontSize: 20, opacity: 0.25, color: ORANGE, lineHeight: 1 }}>&ldquo;</span>
      <Ln w="75%" h={3} c={MT} o={0.3} />
      <Ln w="55%" h={3} c={MT} o={0.3} />
      <Ln w="30%" h={3} o={0.4} />
    </Pv>
  );
}

function LogoCloudPreview() {
  return (
    <Pv style={{ gap: 8 }}>
      <span style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: MT, opacity: 0.5 }}>Trusted by</span>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 7, fontWeight: 600, background: BG, color: FG, opacity: 0.4, border: `1px solid ${BD}` }}>
            Logo
          </div>
        ))}
      </div>
    </Pv>
  );
}

function ComparisonPreview() {
  return (
    <Pv style={{ gap: 4 }}>
      <Ln w="35%" h={5} o={0.5} />
      <div style={{ width: "90%", display: "flex", flexDirection: "column", gap: 3, marginTop: 2 }}>
        <div style={{ display: "flex", gap: 4 }}>
          <div style={{ flex: 1 }} />
          <span style={{ width: 28, textAlign: "center", fontSize: 7, fontWeight: 700, color: TEAL, opacity: 0.7 }}>Us</span>
          <span style={{ width: 28, textAlign: "center", fontSize: 7, color: MT, opacity: 0.5 }}>Them</span>
        </div>
        {[0, 1].map((i) => (
          <div key={i} style={{ display: "flex", gap: 4, alignItems: "center", borderTop: `1px solid ${BD}`, paddingTop: 3 }}>
            <div style={{ flex: 1 }}><Ln w="100%" h={3} o={0.3} /></div>
            <span style={{ width: 28, textAlign: "center", fontSize: 7, fontWeight: 700, color: TEAL, opacity: 0.6 }}>✓</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 7, color: MT, opacity: 0.4 }}>—</span>
          </div>
        ))}
      </div>
    </Pv>
  );
}

function StepsPreview() {
  return (
    <Pv style={{ flexDirection: "row", gap: 14 }}>
      {[1, 2, 3].map((n) => (
        <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: "#fff", background: TEAL, opacity: 0.6 }}>{n}</div>
          <Ln w={28} h={3} o={0.3} />
        </div>
      ))}
    </Pv>
  );
}

function PricingPreview() {
  return (
    <Pv style={{ padding: "12px 24px" }}>
      <div style={{ borderRadius: 6, padding: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: `1.5px solid ${ORANGE}`, background: BG, width: "70%" }}>
        <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.5, color: ORANGE }}>$29</span>
        <Ln w="75%" h={2} c={MT} o={0.25} />
        {[0, 1].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL, opacity: 0.5, flexShrink: 0 }} />
            <Ln w="100%" h={2} c={MT} o={0.2} />
          </div>
        ))}
      </div>
    </Pv>
  );
}

function FAQPreview() {
  return (
    <Pv style={{ gap: 4 }}>
      <Ln w="28%" h={5} o={0.5} />
      {[0, 1].map((i) => (
        <div key={i} style={{ width: "85%", borderRadius: 4, padding: 5, background: BG, border: `1px solid ${BD}` }}>
          <Ln w="75%" h={3} o={0.4} />
          <div style={{ marginTop: 3 }}><Ln w="100%" h={2} c={MT} o={0.2} /></div>
        </div>
      ))}
    </Pv>
  );
}

function CTAPreview({ layout }: { layout: string }) {
  if (layout === "minimal") {
    return (
      <Pv>
        <Ln w="50%" h={6} o={0.5} />
        <div style={{ width: 44, height: 14, borderRadius: 3, background: ORANGE, opacity: 0.6, marginTop: 4 }} />
      </Pv>
    );
  }
  return (
    <Pv style={{ background: `linear-gradient(135deg, ${ORANGE}, ${TEAL})`, opacity: 0.8 }}>
      <Ln w="60%" h={6} c="#fff" o={0.8} />
      <Ln w="45%" h={3} c="#fff" o={0.4} />
      <div style={{ width: 44, height: 14, borderRadius: 3, background: "#fff", opacity: 0.9, marginTop: 4 }} />
    </Pv>
  );
}

function MediaPreview({ type }: { type: string }) {
  return (
    <Pv style={{ background: BG }}>
      <span style={{ fontSize: 24, opacity: 0.2, color: FG }}>{type === "video" ? "▶" : "◻"}</span>
    </Pv>
  );
}

function BlankPreview() {
  return (
    <Pv style={{ background: BG }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, border: `2px dashed ${MT}`, opacity: 0.15 }} />
    </Pv>
  );
}
