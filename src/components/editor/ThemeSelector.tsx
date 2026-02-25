"use client";

import { themeList } from "@/components/video/themes";

interface ThemeSelectorProps {
  selected: string;
  onSelect: (themeId: string) => void;
  compact?: boolean;
}

const vibeIcons: Record<string, string> = {
  cyberpunk: "//",
  minimal: "—",
  editorial: "§",
  energetic: "⚡",
  luxury: "✦",
};

export default function ThemeSelector({ selected, onSelect, compact }: ThemeSelectorProps) {
  return (
    <div className={`grid gap-3 ${compact ? "grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
      {themeList.map((theme) => {
        const isActive = selected === theme.id;
        const icon = vibeIcons[theme.personality?.vibe ?? ""] ?? "•";
        return (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            className={`rounded-xl border-2 p-3 text-left transition-all hover:scale-[1.02] ${
              isActive ? "ring-2 ring-offset-2" : ""
            }`}
            style={{
              borderColor: isActive ? "var(--brand-orange)" : "var(--border-subtle)",
              background: "var(--surface)",
            }}
          >
            <div
              className="w-full aspect-video rounded-lg mb-2 flex items-end justify-between px-2 pb-1.5"
              style={{ background: theme.preview }}
            >
              <span
                className="text-[10px] font-bold tracking-wider uppercase opacity-70"
                style={{ color: theme.colors.text }}
              >
                {icon}
              </span>
              <span
                className="text-[10px] font-mono opacity-50"
                style={{ color: theme.colors.text }}
              >
                {theme.fonts.heading.split(" ")[0]}
              </span>
            </div>
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              {theme.name}
            </div>
            {!compact && (
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {theme.description}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
