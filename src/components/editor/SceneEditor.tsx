"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { SceneType, SceneLayout } from "@/types";

/* ═══════════════════ Constants ═══════════════════ */

const ALL_TYPES: { value: SceneType; label: string }[] = [
  { value: "hero", label: "Hero" },
  { value: "features", label: "Features" },
  { value: "stats", label: "Stats" },
  { value: "testimonial", label: "Testimonial" },
  { value: "logo-cloud", label: "Logo Cloud" },
  { value: "how-it-works", label: "How It Works" },
  { value: "comparison", label: "Comparison" },
  { value: "pricing", label: "Pricing" },
  { value: "faq", label: "FAQ" },
  { value: "cta", label: "Call to Action" },
  { value: "image-showcase", label: "Image Showcase" },
  { value: "video-clip", label: "Video Clip" },
  { value: "component-showcase", label: "Component" },
  { value: "custom", label: "Custom" },
];

const LAYOUT_OPTIONS: Record<
  string,
  { value: SceneLayout; label: string }[]
> = {
  hero: [
    { value: "centered", label: "Center" },
    { value: "split", label: "Split" },
    { value: "minimal", label: "Minimal" },
  ],
  features: [
    { value: "grid", label: "Grid" },
    { value: "list", label: "Stack" },
    { value: "cards", label: "Cards" },
    { value: "split", label: "Split" },
  ],
  stats: [
    { value: "grid", label: "Grid" },
    { value: "split", label: "Split" },
    { value: "banner", label: "Banner" },
  ],
  testimonial: [
    { value: "centered", label: "Quote" },
    { value: "cards", label: "Card" },
    { value: "split", label: "Split" },
  ],
  cta: [
    { value: "bold", label: "Bold" },
    { value: "minimal", label: "Minimal" },
  ],
  "how-it-works": [
    { value: "list", label: "List" },
    { value: "grid", label: "Grid" },
    { value: "split", label: "Split" },
  ],
  "image-showcase": [
    { value: "centered", label: "Center" },
    { value: "split", label: "Split" },
  ],
};

const MEDIA_PLACEMENTS = [
  { value: "background", label: "BG" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "overlay", label: "Over" },
  { value: "inline", label: "Inline" },
  { value: "fill", label: "Fill" },
] as const;

/* ═══════════════════ Types ═══════════════════ */

interface SceneEditorProps {
  scene: {
    _id: Id<"scenes">;
    type: string;
    title: string;
    content: Record<string, unknown>;
    durationInFrames: number;
    transition: string;
    voiceoverScript?: string;
  };
  onClose: () => void;
}

/* ═══════════════════ Main Component ═══════════════════ */

export default function SceneEditor({ scene, onClose }: SceneEditorProps) {
  const updateScene = useMutation(api.scenes.updateScene);

  // Use a ref for the latest content to avoid stale closures
  const contentRef = useRef<Record<string, unknown>>(scene.content);
  const [, forceRender] = useState(0);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");

  const content = contentRef.current;

  // Reset when switching scenes
  useEffect(() => {
    contentRef.current = scene.content;
    forceRender((n) => n + 1);
  }, [scene._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(
    async (patch: Record<string, unknown>) => {
      setSaveStatus("saving");
      try {
        await updateScene({
          sceneId: scene._id,
          ...patch,
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 800);
      } catch {
        setSaveStatus("idle");
      }
    },
    [updateScene, scene._id],
  );

  const patchContent = useCallback(
    (key: string, value: unknown) => {
      const updated = { ...contentRef.current, [key]: value };
      contentRef.current = updated;
      forceRender((n) => n + 1);
      save({ content: updated });
    },
    [save],
  );

  const patchMeta = useCallback(
    (key: string, value: unknown) => {
      save({ [key]: value });
    },
    [save],
  );

  const type = scene.type;
  const layout = (content.layout as SceneLayout) || "centered";
  const layoutOpts = LAYOUT_OPTIONS[type];
  const hasMedia = Boolean(content.mediaUrl || content.mediaId);
  const isMediaDedicatedType =
    type === "image-showcase" ||
    type === "video-clip" ||
    type === "product-showcase" ||
    type === "component-showcase";
  const typeLabel =
    ALL_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-[var(--surface-hover)]"
          title="Back"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ color: "var(--muted)" }}
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="text-[11px] font-semibold truncate"
            style={{ color: "var(--foreground)" }}
          >
            {scene.title}
          </div>
          <div className="text-[9px]" style={{ color: "var(--muted)" }}>
            {typeLabel} · {(scene.durationInFrames / 30).toFixed(1)}s
          </div>
        </div>
        <StatusDot status={saveStatus} />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Layout pills (if applicable) */}
        {layoutOpts && layoutOpts.length > 1 && (
          <div
            className="px-3 py-2 border-b flex items-center gap-1 flex-wrap"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span
              className="text-[9px] font-medium mr-1"
              style={{ color: "var(--muted)" }}
            >
              Layout
            </span>
            {layoutOpts.map((opt) => (
              <Pill
                key={opt.value}
                active={layout === opt.value}
                onClick={() => patchContent("layout", opt.value)}
              >
                {opt.label}
              </Pill>
            ))}
          </div>
        )}

        {/* ── Elements ── */}
        <div className="flex flex-col">
          {/* Text elements based on scene type */}
          {hasField(type, "headline") && (
            <ElementBlock
              label="Headline"
              icon="H"
              iconColor="var(--brand-orange)"
            >
              <InlineEdit
                value={String(content.headline ?? "")}
                placeholder="Enter headline..."
                large
                onChange={(v) => patchContent("headline", v)}
              />
              <SizeSlider
                value={content.headlineFontSize as number | undefined}
                defaultValue={54}
                min={24}
                max={120}
                label="Size"
                onChange={(v) => patchContent("headlineFontSize", v)}
              />
            </ElementBlock>
          )}

          {hasField(type, "subtext") && (
            <ElementBlock label="Subtext" icon="T" iconColor="#888">
              <InlineEdit
                value={String(content.subtext ?? "")}
                placeholder="Enter subtext..."
                multiline
                onChange={(v) => patchContent("subtext", v)}
              />
              <SizeSlider
                value={content.subtextFontSize as number | undefined}
                defaultValue={22}
                min={12}
                max={48}
                label="Size"
                onChange={(v) => patchContent("subtextFontSize", v)}
              />
            </ElementBlock>
          )}

          {hasField(type, "buttonText") && (
            <ElementBlock
              label="Button"
              icon="▶"
              iconColor="var(--brand-teal)"
            >
              <InlineEdit
                value={String(content.buttonText ?? "")}
                placeholder="Button text..."
                onChange={(v) => patchContent("buttonText", v)}
              />
            </ElementBlock>
          )}

          {hasField(type, "quote") && (
            <ElementBlock label="Quote" icon="❝" iconColor="#9070DB">
              <InlineEdit
                value={String(content.quote ?? "")}
                placeholder="Enter quote..."
                multiline
                onChange={(v) => patchContent("quote", v)}
              />
            </ElementBlock>
          )}

          {hasField(type, "author") && (
            <ElementBlock label="Author" icon="@" iconColor="#6B8EC9">
              <InlineEdit
                value={String(content.author ?? "")}
                placeholder="Author name..."
                onChange={(v) => patchContent("author", v)}
              />
            </ElementBlock>
          )}

          {hasField(type, "price") && (
            <ElementBlock label="Price" icon="$" iconColor="#DBA01D">
              <InlineEdit
                value={String(content.price ?? "")}
                placeholder="$49/mo"
                onChange={(v) => patchContent("price", v)}
              />
            </ElementBlock>
          )}

          {hasField(type, "componentName") && (
            <ElementBlock label="Component" icon="⟨⟩" iconColor="#7580D8">
              <InlineEdit
                value={String(content.componentName ?? "")}
                placeholder="Component name..."
                onChange={(v) => patchContent("componentName", v)}
              />
            </ElementBlock>
          )}

          {/* Media element */}
          {hasMedia && (
            <ElementBlock label="Media" icon="◻" iconColor="#2EBE7E">
              <MediaControls
                placement={String(content.mediaPlacement ?? "")}
                scale={Number(content.mediaScale ?? 1)}
                fit={String(content.mediaFit ?? "")}
                frame={String(content.mediaFrame ?? "none")}
                shadow={content.mediaShadow !== false}
                width={content.mediaWidth as number | undefined}
                height={content.mediaHeight as number | undefined}
                hidePlacement={isMediaDedicatedType}
                onChangePlacement={(v) =>
                  patchContent("mediaPlacement", v)
                }
                onChangeScale={(v) => patchContent("mediaScale", v)}
                onChangeFit={(v) => patchContent("mediaFit", v)}
                onChangeFrame={(v) => patchContent("mediaFrame", v)}
                onChangeShadow={(v) => patchContent("mediaShadow", v)}
              />
            </ElementBlock>
          )}

          {/* List elements */}
          {hasField(type, "bullets") && (
            <ElementBlock label="Bullets" icon="•" iconColor="#4DB89A">
              <ListEditor
                items={
                  Array.isArray(content.bullets)
                    ? (content.bullets as string[])
                    : []
                }
                onChange={(v) => patchContent("bullets", v)}
                placeholder="Add bullet point..."
              />
            </ElementBlock>
          )}

          {hasField(type, "features") && (
            <ElementBlock
              label="Features"
              icon="✦"
              iconColor="var(--brand-teal)"
            >
              <PairListEditor
                items={
                  Array.isArray(content.features)
                    ? (content.features as {
                        title: string;
                        description: string;
                      }[])
                    : []
                }
                onChange={(v) => patchContent("features", v)}
                aPlaceholder="Feature title"
                bPlaceholder="Description"
                addLabel="+ Feature"
              />
            </ElementBlock>
          )}

          {hasField(type, "steps") && (
            <ElementBlock label="Steps" icon="①" iconColor="#5196DE">
              <StepsEditor
                items={
                  Array.isArray(content.steps)
                    ? (content.steps as {
                        number: number;
                        title: string;
                        description: string;
                      }[])
                    : []
                }
                onChange={(v) => patchContent("steps", v)}
              />
            </ElementBlock>
          )}

          {hasField(type, "stats") && (
            <ElementBlock label="Stats" icon="📊" iconColor="#D4881A">
              <PairListEditor
                items={
                  Array.isArray(content.stats)
                    ? (content.stats as {
                        title: string;
                        description: string;
                      }[]).map((s: Record<string, string>) => ({
                        title: s.value ?? s.title ?? "",
                        description: s.label ?? s.description ?? "",
                      }))
                    : []
                }
                onChange={(v) =>
                  patchContent(
                    "stats",
                    v.map((s) => ({
                      value: s.title,
                      label: s.description,
                    })),
                  )
                }
                aPlaceholder="Value (e.g. 10K+)"
                bPlaceholder="Label"
                addLabel="+ Stat"
              />
            </ElementBlock>
          )}

          {hasField(type, "logos") && (
            <ElementBlock label="Logos" icon="◈" iconColor="#6B8EC9">
              <ListEditor
                items={
                  Array.isArray(content.logos)
                    ? (content.logos as string[])
                    : []
                }
                onChange={(v) => patchContent("logos", v)}
                placeholder="Company name..."
              />
            </ElementBlock>
          )}

          {hasField(type, "questions") && (
            <ElementBlock label="FAQ" icon="?" iconColor="#C95D8F">
              <FaqEditor
                items={
                  Array.isArray(content.questions)
                    ? (content.questions as {
                        question: string;
                        answer: string;
                      }[])
                    : []
                }
                onChange={(v) => patchContent("questions", v)}
              />
            </ElementBlock>
          )}

          {hasField(type, "items") && (
            <ElementBlock
              label="Comparison"
              icon="⇔"
              iconColor="#C95D8F"
            >
              <ComparisonEditor
                items={
                  Array.isArray(content.items)
                    ? (content.items as {
                        label: string;
                        us: string;
                        them: string;
                      }[])
                    : []
                }
                onChange={(v) => patchContent("items", v)}
              />
            </ElementBlock>
          )}

          {/* Style overrides */}
          <ElementBlock label="Colors" icon="◆" iconColor="#9070DB">
            <StyleControls
              overrides={
                (content.styleOverrides as Record<string, string>) || {}
              }
              onChange={(key, val) => {
                const curr =
                  (content.styleOverrides as Record<string, string>) ||
                  {};
                patchContent("styleOverrides", {
                  ...curr,
                  [key]: val,
                });
              }}
            />
          </ElementBlock>

          {/* Scene settings (collapsed by default) */}
          <SettingsBlock
            type={type}
            duration={scene.durationInFrames}
            transition={scene.transition}
            voiceover={scene.voiceoverScript || ""}
            onChangeType={(v) => patchMeta("type", v)}
            onChangeDuration={(v) =>
              patchMeta("durationInFrames", v)
            }
            onChangeTransition={(v) => patchMeta("transition", v)}
            onChangeVoiceover={(v) =>
              patchMeta("voiceoverScript", v || undefined)
            }
          />
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}

/* ═══════════════════ Field Presence Map ═══════════════════ */

const SCENE_FIELDS: Record<string, string[]> = {
  hero: ["headline", "subtext", "buttonText"],
  features: ["headline", "features"],
  stats: ["headline", "stats"],
  testimonial: ["quote", "author"],
  "logo-cloud": ["headline", "logos"],
  "how-it-works": ["headline", "steps"],
  comparison: ["headline", "items"],
  pricing: ["headline", "price", "subtext", "bullets"],
  faq: ["headline", "questions"],
  cta: ["headline", "subtext", "buttonText"],
  "image-showcase": ["headline", "subtext"],
  "video-clip": ["headline"],
  "component-showcase": ["headline", "subtext", "componentName"],
  custom: ["headline", "subtext", "bullets"],
};

function hasField(type: string, field: string): boolean {
  return (SCENE_FIELDS[type] || SCENE_FIELDS.custom).includes(field);
}

/* ═══════════════════ Save Status ═══════════════════ */

function StatusDot({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background:
            status === "saving"
              ? "var(--brand-orange)"
              : "var(--brand-teal)",
          animation:
            status === "saving" ? "pulse 0.8s infinite" : undefined,
        }}
      />
      <span
        className="text-[9px]"
        style={{
          color:
            status === "saving"
              ? "var(--brand-orange)"
              : "var(--brand-teal)",
        }}
      >
        {status === "saving" ? "Saving" : "Saved"}
      </span>
    </div>
  );
}

/* ═══════════════════ Element Block ═══════════════════ */

function ElementBlock({
  label,
  icon,
  iconColor,
  children,
}: {
  label: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="px-3 py-2.5 border-b"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10px]" style={{ color: iconColor }}>
          {icon}
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--muted)" }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════ Inline Text Edit ═══════════════════ */

function InlineEdit({
  value,
  placeholder,
  onChange,
  large,
  multiline,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  large?: boolean;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const editingRef = useRef(false);

  // Only sync external value when NOT actively editing
  useEffect(() => {
    if (!editingRef.current) setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    editingRef.current = false;
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  const startEditing = () => {
    editingRef.current = true;
    setEditing(true);
  };

  if (editing) {
    const shared = {
      ref: inputRef as React.RefObject<HTMLTextAreaElement & HTMLInputElement>,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
        setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          editingRef.current = false;
          setDraft(value);
          setEditing(false);
        }
      },
      placeholder,
      className: `w-full px-2 py-1.5 rounded-lg border text-[11px] outline-none resize-none ${
        large ? "font-semibold" : ""
      }`,
      style: {
        background: "var(--background)",
        borderColor: "var(--brand-teal)",
        color: "var(--foreground)",
        boxShadow: "0 0 0 1px var(--brand-teal)",
      },
    };

    return multiline ? (
      <textarea {...shared} rows={3} />
    ) : (
      <input {...shared} type="text" />
    );
  }

  return (
    <div
      onClick={startEditing}
      className={`px-2 py-1.5 rounded-lg cursor-text transition-colors hover:bg-[var(--surface-hover)] ${
        large ? "text-[12px] font-semibold" : "text-[11px]"
      }`}
      style={{
        color: value
          ? "var(--foreground)"
          : "var(--muted)",
        minHeight: multiline ? 40 : undefined,
        border: "1px solid transparent",
      }}
    >
      {value || placeholder}
    </div>
  );
}

/* ═══════════════════ Size Slider ═══════════════════ */

function SizeSlider({
  value,
  defaultValue,
  min,
  max,
  label,
  onChange,
}: {
  value: number | undefined;
  defaultValue: number;
  min: number;
  max: number;
  label: string;
  onChange: (v: number) => void;
}) {
  const current = value ?? defaultValue;
  return (
    <div className="flex items-center gap-2 mt-1">
      <span
        className="text-[9px] w-7 shrink-0"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
        style={{ height: 3, accentColor: "var(--brand-teal)" }}
      />
      <span
        className="text-[9px] font-mono w-7 text-right"
        style={{ color: "var(--foreground)" }}
      >
        {current}px
      </span>
    </div>
  );
}

/* ═══════════════════ Media Controls ═══════════════════ */

function MediaControls({
  placement,
  scale,
  fit,
  frame,
  shadow,
  width,
  height,
  hidePlacement,
  onChangePlacement,
  onChangeScale,
  onChangeFit,
  onChangeFrame,
  onChangeShadow,
}: {
  placement: string;
  scale: number;
  fit: string;
  frame: string;
  shadow: boolean;
  width?: number;
  height?: number;
  hidePlacement?: boolean;
  onChangePlacement: (v: string) => void;
  onChangeScale: (v: number) => void;
  onChangeFit: (v: string) => void;
  onChangeFrame: (v: string) => void;
  onChangeShadow: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Placement grid — hidden for dedicated media scene types */}
      {!hidePlacement && (
        <div className="flex gap-1 flex-wrap">
          {MEDIA_PLACEMENTS.map((p) => (
            <Pill
              key={p.value}
              active={placement === p.value}
              onClick={() => onChangePlacement(p.value)}
            >
              {p.label}
            </Pill>
          ))}
        </div>
      )}

      {/* Scale slider — transform multiplier (1.0 = default size) */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] w-8 shrink-0" style={{ color: "var(--muted)" }}>
          Size
        </span>
        <input
          type="range"
          min="0.2"
          max="3"
          step="0.05"
          value={scale}
          onChange={(e) => onChangeScale(parseFloat(e.target.value))}
          className="flex-1"
          style={{ height: 3, accentColor: "var(--brand-teal)" }}
        />
        <span
          className="text-[9px] font-mono w-8 text-right"
          style={{ color: "var(--foreground)" }}
        >
          {scale.toFixed(1)}x
        </span>
      </div>

      {/* Fit + Frame */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="flex gap-1">
            {(["cover", "contain", "fill"] as const).map((f) => (
              <Pill
                key={f}
                active={fit === f}
                onClick={() => onChangeFit(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Pill>
            ))}
          </div>
        </div>
        <div className="flex gap-1">
          {(["none", "browser", "phone"] as const).map((f) => (
            <Pill
              key={f}
              active={frame === f}
              onClick={() => onChangeFrame(f)}
            >
              {f === "none"
                ? "—"
                : f.charAt(0).toUpperCase() + f.slice(1)}
            </Pill>
          ))}
        </div>
      </div>

      {/* Shadow toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] w-8 shrink-0" style={{ color: "var(--muted)" }}>
          Shadow
        </span>
        <button
          onClick={() => onChangeShadow(!shadow)}
          className="relative w-7 h-3.5 rounded-full transition-colors"
          style={{
            background: shadow ? "var(--brand-teal)" : "var(--border)",
          }}
        >
          <div
            className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all"
            style={{ left: shadow ? 14 : 2 }}
          />
        </button>
      </div>

      {width && height && (
        <span className="text-[9px]" style={{ color: "var(--muted)" }}>
          {width}×{height}px
        </span>
      )}
    </div>
  );
}

/* ═══════════════════ Style Controls ═══════════════════ */

function StyleControls({
  overrides,
  onChange,
}: {
  overrides: Record<string, string>;
  onChange: (key: string, val: string) => void;
}) {
  const colors = [
    { key: "accentColor", label: "Accent" },
    { key: "backgroundTint", label: "Background" },
    { key: "headlineColor", label: "Headline" },
    { key: "surfaceColor", label: "Surface" },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {colors.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <input
              type="color"
              value={overrides[key] || "#000000"}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-5 h-5 rounded border-0 cursor-pointer p-0"
              style={{ background: "transparent" }}
            />
            <div className="flex-1 min-w-0">
              <span
                className="text-[9px] block truncate"
                style={{ color: "var(--muted)" }}
              >
                {label}
              </span>
              {overrides[key] && (
                <span
                  className="text-[8px] font-mono block"
                  style={{ color: "var(--foreground)" }}
                >
                  {overrides[key]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Emphasis */}
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[9px]" style={{ color: "var(--muted)" }}>
          Emphasis
        </span>
        <div className="flex gap-1">
          {(["low", "medium", "high"] as const).map((e) => (
            <Pill
              key={e}
              active={overrides.emphasisLevel === e}
              onClick={() => onChange("emphasisLevel", e)}
            >
              {e === "low" ? "Subtle" : e === "medium" ? "Normal" : "Bold"}
            </Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ List Editor ═══════════════════ */

function ListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1 group">
          <InlineEdit
            value={item}
            placeholder={placeholder}
            onChange={(v) => {
              const u = [...items];
              u[i] = v;
              onChange(u);
            }}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-[10px] px-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400 shrink-0"
            style={{ color: "var(--muted)" }}
          >
            ×
          </button>
        </div>
      ))}
      <AddBtn onClick={() => onChange([...items, ""])}>+ Add</AddBtn>
    </div>
  );
}

/* ═══════════════════ Pair List Editor ═══════════════════ */

function PairListEditor({
  items,
  onChange,
  aPlaceholder,
  bPlaceholder,
  addLabel,
}: {
  items: { title: string; description: string }[];
  onChange: (v: { title: string; description: string }[]) => void;
  aPlaceholder: string;
  bPlaceholder: string;
  addLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-1.5 group relative"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <InlineEdit
            value={item.title}
            placeholder={aPlaceholder}
            large
            onChange={(v) => {
              const u = [...items];
              u[i] = { ...u[i], title: v };
              onChange(u);
            }}
          />
          <InlineEdit
            value={item.description}
            placeholder={bPlaceholder}
            onChange={(v) => {
              const u = [...items];
              u[i] = { ...u[i], description: v };
              onChange(u);
            }}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="absolute top-1 right-1 text-[10px] px-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400"
            style={{ color: "var(--muted)" }}
          >
            ×
          </button>
        </div>
      ))}
      <AddBtn
        onClick={() =>
          onChange([...items, { title: "", description: "" }])
        }
      >
        {addLabel}
      </AddBtn>
    </div>
  );
}

/* ═══════════════════ Steps Editor ═══════════════════ */

function StepsEditor({
  items,
  onChange,
}: {
  items: { number: number; title: string; description: string }[];
  onChange: (
    v: { number: number; title: string; description: string }[],
  ) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-1.5 group relative flex gap-1.5"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-1"
            style={{ background: "var(--brand-teal)" }}
          >
            {item.number || i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <InlineEdit
              value={item.title}
              placeholder="Step title"
              large
              onChange={(v) => {
                const u = [...items];
                u[i] = { ...u[i], title: v };
                onChange(u);
              }}
            />
            <InlineEdit
              value={item.description}
              placeholder="Step description"
              onChange={(v) => {
                const u = [...items];
                u[i] = { ...u[i], description: v };
                onChange(u);
              }}
            />
          </div>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="absolute top-1 right-1 text-[10px] px-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400"
            style={{ color: "var(--muted)" }}
          >
            ×
          </button>
        </div>
      ))}
      <AddBtn
        onClick={() =>
          onChange([
            ...items,
            {
              number: items.length + 1,
              title: "",
              description: "",
            },
          ])
        }
      >
        + Step
      </AddBtn>
    </div>
  );
}

/* ═══════════════════ FAQ Editor ═══════════════════ */

function FaqEditor({
  items,
  onChange,
}: {
  items: { question: string; answer: string }[];
  onChange: (v: { question: string; answer: string }[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-1.5 group relative"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <InlineEdit
            value={item.question}
            placeholder="Question"
            large
            onChange={(v) => {
              const u = [...items];
              u[i] = { ...u[i], question: v };
              onChange(u);
            }}
          />
          <InlineEdit
            value={item.answer}
            placeholder="Answer"
            multiline
            onChange={(v) => {
              const u = [...items];
              u[i] = { ...u[i], answer: v };
              onChange(u);
            }}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="absolute top-1 right-1 text-[10px] px-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400"
            style={{ color: "var(--muted)" }}
          >
            ×
          </button>
        </div>
      ))}
      <AddBtn
        onClick={() =>
          onChange([...items, { question: "", answer: "" }])
        }
      >
        + Question
      </AddBtn>
    </div>
  );
}

/* ═══════════════════ Comparison Editor ═══════════════════ */

function ComparisonEditor({
  items,
  onChange,
}: {
  items: { label: string; us: string; them: string }[];
  onChange: (v: { label: string; us: string; them: string }[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-1.5 group relative"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <InlineEdit
            value={item.label}
            placeholder="Feature"
            large
            onChange={(v) => {
              const u = [...items];
              u[i] = { ...u[i], label: v };
              onChange(u);
            }}
          />
          <div className="grid grid-cols-2 gap-1">
            <InlineEdit
              value={item.us}
              placeholder="Us"
              onChange={(v) => {
                const u = [...items];
                u[i] = { ...u[i], us: v };
                onChange(u);
              }}
            />
            <InlineEdit
              value={item.them}
              placeholder="Others"
              onChange={(v) => {
                const u = [...items];
                u[i] = { ...u[i], them: v };
                onChange(u);
              }}
            />
          </div>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="absolute top-1 right-1 text-[10px] px-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400"
            style={{ color: "var(--muted)" }}
          >
            ×
          </button>
        </div>
      ))}
      <AddBtn
        onClick={() =>
          onChange([...items, { label: "", us: "", them: "" }])
        }
      >
        + Row
      </AddBtn>
    </div>
  );
}

/* ═══════════════════ Settings Block ═══════════════════ */

function SettingsBlock({
  type,
  duration,
  transition,
  voiceover,
  onChangeType,
  onChangeDuration,
  onChangeTransition,
  onChangeVoiceover,
}: {
  type: string;
  duration: number;
  transition: string;
  voiceover: string;
  onChangeType: (v: string) => void;
  onChangeDuration: (v: number) => void;
  onChangeTransition: (v: string) => void;
  onChangeVoiceover: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [voDraft, setVoDraft] = useState(voiceover);

  useEffect(() => {
    setVoDraft(voiceover);
  }, [voiceover]);

  return (
    <div
      className="border-b"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-left hover:bg-[var(--surface-hover)]"
      >
        <span className="text-[10px]" style={{ color: "var(--muted)" }}>
          ⚙
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-wider flex-1"
          style={{ color: "var(--muted)" }}
        >
          Settings
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            color: "var(--muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2.5">
          <div>
            <MiniLabel>Type</MiniLabel>
            <select
              value={type}
              onChange={(e) => onChangeType(e.target.value)}
              className="w-full px-2 py-1 rounded-lg border text-[11px] outline-none"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              {ALL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <MiniLabel>
              Duration ({(duration / 30).toFixed(1)}s)
            </MiniLabel>
            <input
              type="range"
              min="30"
              max="600"
              step="15"
              value={duration}
              onChange={(e) =>
                onChangeDuration(Number(e.target.value))
              }
              className="w-full"
              style={{ accentColor: "var(--brand-teal)", height: 3 }}
            />
          </div>

          <div>
            <MiniLabel>Transition</MiniLabel>
            <div className="flex gap-1">
              {["fade", "slide", "zoom", "none"].map((t) => (
                <Pill
                  key={t}
                  active={transition === t}
                  onClick={() => onChangeTransition(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <MiniLabel>Voiceover</MiniLabel>
            <textarea
              value={voDraft}
              onChange={(e) => setVoDraft(e.target.value)}
              onBlur={() => {
                if (voDraft !== voiceover) onChangeVoiceover(voDraft);
              }}
              rows={3}
              placeholder="Narration script..."
              className="w-full px-2 py-1.5 rounded-lg border text-[11px] outline-none resize-none"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ Tiny Shared Components ═══════════════════ */

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-1.5 py-0.5 rounded text-[9px] font-medium transition-all"
      style={{
        background: active ? "var(--brand-orange)" : "var(--background)",
        color: active ? "#fff" : "var(--muted)",
        border: active
          ? "1px solid transparent"
          : "1px solid var(--border-subtle)",
      }}
    >
      {children}
    </button>
  );
}

function AddBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[9px] self-start px-1.5 py-0.5 rounded border hover:bg-[var(--surface-hover)]"
      style={{ borderColor: "var(--border)", color: "var(--muted)" }}
    >
      {children}
    </button>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[9px] font-medium mb-1"
      style={{ color: "var(--muted)" }}
    >
      {children}
    </div>
  );
}
