import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { VideoTheme, SceneContent, MockupElement } from "@/types";
import {
  fadeInBlur,
  fadeInUp,
  scaleIn,
  animatedMeshBg,
  noiseOverlayStyle,
  glowOrbStyle,
  depthShadow,
  glassCard,
  isThemeDark,
  scanLineStyle,
  spacing,
  getTypography,
  easings,
} from "./shared";

function MockupRenderer({
  elements,
  theme,
  frame,
  isDark,
}: {
  elements: MockupElement[];
  theme: VideoTheme;
  frame: number;
  isDark: boolean;
}) {
  const bg = isDark ? theme.colors.surface : "#ffffff";
  const borderCol = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const textCol = isDark ? "#e4e4e7" : "#18181b";
  const mutedCol = isDark ? "#71717a" : "#a1a1aa";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  const renderElement = (el: MockupElement, idx: number) => {
    const delay = 10 + idx * 6;
    const anim = fadeInUp(frame, delay, 18);

    switch (el.type) {
      case "navbar": {
        const items = el.items || ["Home", "About", "Contact"];
        return (
          <div key={idx} style={{
            ...anim,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderBottom: `1px solid ${borderCol}`,
          }}>
            <div style={{
              fontSize: 15,
              fontWeight: 700,
              color: theme.colors.primary,
              letterSpacing: "-0.02em",
            }}>
              {el.label || "Logo"}
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              {items.map((item, i) => (
                <span key={i} style={{
                  fontSize: 12,
                  color: i === 0 ? textCol : mutedCol,
                  fontWeight: i === 0 ? 600 : 400,
                }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        );
      }

      case "hero-section":
        return (
          <div key={idx} style={{
            ...anim,
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: textCol, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              {el.label || "Headline Text"}
            </div>
            {el.description && (
              <div style={{ fontSize: 12, color: mutedCol, maxWidth: 360, lineHeight: 1.5 }}>
                {el.description}
              </div>
            )}
            {el.value && (
              <div style={{
                marginTop: 8,
                padding: "8px 24px",
                borderRadius: 8,
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
              }}>
                {el.value}
              </div>
            )}
          </div>
        );

      case "card":
        return (
          <div key={idx} style={{
            ...anim,
            margin: "8px 16px",
            padding: "16px 20px",
            borderRadius: 12,
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            border: `1px solid ${borderCol}`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: textCol, marginBottom: 6 }}>
              {el.label || "Card Title"}
            </div>
            {el.description && (
              <div style={{ fontSize: 11, color: mutedCol, lineHeight: 1.5 }}>
                {el.description}
              </div>
            )}
          </div>
        );

      case "form": {
        const fields = el.items || ["Email", "Password"];
        return (
          <div key={idx} style={{
            ...anim,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {el.label && (
              <div style={{ fontSize: 14, fontWeight: 600, color: textCol, marginBottom: 4 }}>
                {el.label}
              </div>
            )}
            {fields.map((field, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, color: mutedCol, marginBottom: 3, fontWeight: 500 }}>
                  {field}
                </div>
                <div style={{
                  height: 32,
                  borderRadius: 6,
                  background: inputBg,
                  border: `1px solid ${borderCol}`,
                }} />
              </div>
            ))}
            <div style={{
              marginTop: 4,
              padding: "8px 0",
              borderRadius: 6,
              background: theme.colors.primary,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              textAlign: "center",
            }}>
              {el.value || "Submit"}
            </div>
          </div>
        );
      }

      case "button":
        return (
          <div key={idx} style={{
            ...anim,
            display: "flex",
            justifyContent: el.variant === "center" ? "center" : "flex-start",
            padding: "8px 20px",
          }}>
            <div style={{
              padding: "8px 20px",
              borderRadius: 8,
              background: el.variant === "outline"
                ? "transparent"
                : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
              color: el.variant === "outline" ? theme.colors.primary : "#fff",
              border: el.variant === "outline" ? `1px solid ${theme.colors.primary}` : "none",
              fontSize: 12,
              fontWeight: 600,
            }}>
              {el.label || "Button"}
            </div>
          </div>
        );

      case "input":
        return (
          <div key={idx} style={{
            ...anim,
            padding: "8px 20px",
          }}>
            {el.label && (
              <div style={{ fontSize: 10, color: mutedCol, marginBottom: 3, fontWeight: 500 }}>
                {el.label}
              </div>
            )}
            <div style={{
              height: 34,
              borderRadius: 8,
              background: inputBg,
              border: `1px solid ${borderCol}`,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              fontSize: 11,
              color: mutedCol,
            }}>
              {el.value || "Type here..."}
            </div>
          </div>
        );

      case "search":
        return (
          <div key={idx} style={{
            ...anim,
            padding: "8px 20px",
          }}>
            <div style={{
              height: 36,
              borderRadius: 20,
              background: inputBg,
              border: `1px solid ${borderCol}`,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              gap: 8,
              fontSize: 11,
              color: mutedCol,
            }}>
              <span style={{ fontSize: 13, opacity: 0.5 }}>🔍</span>
              {el.value || "Search..."}
            </div>
          </div>
        );

      case "list": {
        const items = el.items || ["Item 1", "Item 2", "Item 3"];
        return (
          <div key={idx} style={{
            ...anim,
            padding: "8px 20px",
          }}>
            {el.label && (
              <div style={{ fontSize: 12, fontWeight: 600, color: textCol, marginBottom: 8 }}>
                {el.label}
              </div>
            )}
            {items.map((item, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: i < items.length - 1 ? `1px solid ${borderCol}` : "none",
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: theme.colors.primary,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: textCol }}>{item}</span>
              </div>
            ))}
          </div>
        );
      }

      case "table": {
        const cols = el.columns || ["Name", "Value"];
        const tableRows = el.rows || [["Row 1", "Data"], ["Row 2", "Data"]];
        return (
          <div key={idx} style={{
            ...anim,
            margin: "8px 16px",
            borderRadius: 8,
            overflow: "hidden",
            border: `1px solid ${borderCol}`,
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              borderBottom: `1px solid ${borderCol}`,
            }}>
              {cols.map((col, i) => (
                <div key={i} style={{
                  padding: "8px 12px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: mutedCol,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  {col}
                </div>
              ))}
            </div>
            {tableRows.map((row, ri) => (
              <div key={ri} style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
                borderBottom: ri < tableRows.length - 1 ? `1px solid ${borderCol}` : "none",
              }}>
                {row.map((cell, ci) => (
                  <div key={ci} style={{
                    padding: "8px 12px",
                    fontSize: 11,
                    color: ci === 0 ? textCol : mutedCol,
                    fontWeight: ci === 0 ? 500 : 400,
                  }}>
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }

      case "metrics": {
        const items = el.items || ["128 Users", "99.9% Uptime", "4.8 Rating"];
        return (
          <div key={idx} style={{
            ...anim,
            display: "flex",
            justifyContent: "space-around",
            padding: "16px 20px",
            gap: 16,
          }}>
            {items.map((item, i) => {
              const parts = item.match(/^([\d.,%+]+)\s*(.*)/);
              const num = parts?.[1] || item;
              const label = parts?.[2] || "";
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.primary }}>
                    {num}
                  </div>
                  {label && (
                    <div style={{ fontSize: 10, color: mutedCol, marginTop: 2 }}>
                      {label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      }

      case "sidebar": {
        const items = el.items || ["Dashboard", "Projects", "Settings"];
        return (
          <div key={idx} style={{
            ...anim,
            padding: "12px 0",
            borderRight: `1px solid ${borderCol}`,
            width: 140,
            flexShrink: 0,
          }}>
            {el.label && (
              <div style={{
                padding: "0 14px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: theme.colors.primary,
              }}>
                {el.label}
              </div>
            )}
            {items.map((item, i) => (
              <div key={i} style={{
                padding: "7px 14px",
                fontSize: 11,
                color: i === 0 ? theme.colors.primary : mutedCol,
                fontWeight: i === 0 ? 600 : 400,
                background: i === 0 ? `${theme.colors.primary}10` : "transparent",
                borderLeft: i === 0 ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
              }}>
                {item}
              </div>
            ))}
          </div>
        );
      }

      case "badge":
        return (
          <div key={idx} style={{
            ...anim,
            display: "inline-flex",
            padding: "4px 12px",
            borderRadius: 20,
            background: `${theme.colors.primary}15`,
            color: theme.colors.primary,
            fontSize: 10,
            fontWeight: 600,
            margin: "4px 20px",
          }}>
            {el.label || "Badge"}
          </div>
        );

      case "avatar":
        return (
          <div key={idx} style={{
            ...anim,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {(el.label || "U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: textCol }}>
                {el.label || "User Name"}
              </div>
              {el.description && (
                <div style={{ fontSize: 10, color: mutedCol }}>{el.description}</div>
              )}
            </div>
          </div>
        );

      case "tabs": {
        const items = el.items || ["Tab 1", "Tab 2", "Tab 3"];
        return (
          <div key={idx} style={{
            ...anim,
            display: "flex",
            borderBottom: `1px solid ${borderCol}`,
            padding: "0 16px",
          }}>
            {items.map((item, i) => (
              <div key={i} style={{
                padding: "10px 16px",
                fontSize: 12,
                fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? theme.colors.primary : mutedCol,
                borderBottom: i === 0 ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
              }}>
                {item}
              </div>
            ))}
          </div>
        );
      }

      case "toggle":
        return (
          <div key={idx} style={{
            ...anim,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
          }}>
            <span style={{ fontSize: 12, color: textCol }}>{el.label || "Setting"}</span>
            <div style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: el.value === "on" ? theme.colors.primary : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"),
              position: "relative",
            }}>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#fff",
                position: "absolute",
                top: 2,
                left: el.value === "on" ? 18 : 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </div>
          </div>
        );

      case "divider":
        return (
          <div key={idx} style={{
            ...anim,
            height: 1,
            background: borderCol,
            margin: "4px 20px",
          }} />
        );

      case "text":
        return (
          <div key={idx} style={{
            ...anim,
            padding: "6px 20px",
            fontSize: el.size === "lg" ? 16 : el.size === "sm" ? 10 : 12,
            fontWeight: el.size === "lg" ? 600 : 400,
            color: el.size === "lg" ? textCol : mutedCol,
            lineHeight: 1.5,
          }}>
            {el.label || "Text content"}
          </div>
        );

      case "image-placeholder":
        return (
          <div key={idx} style={{
            ...anim,
            margin: "8px 16px",
            height: el.size === "lg" ? 120 : el.size === "sm" ? 48 : 80,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${theme.colors.primary}10, ${theme.colors.accent}10)`,
            border: `1px dashed ${borderCol}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: mutedCol,
            fontSize: 18,
          }}>
            {el.label || "🖼"}
          </div>
        );

      case "code-snippet":
        return (
          <div key={idx} style={{
            ...anim,
            margin: "8px 16px",
            padding: "10px 14px",
            borderRadius: 8,
            background: isDark ? "#1e1e2e" : "#f4f4f5",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 10,
            lineHeight: 1.6,
            color: isDark ? "#a6e3a1" : "#16a34a",
            overflow: "hidden",
          }}>
            {el.label || "const app = create();"}
          </div>
        );

      case "progress-bar": {
        const pct = parseInt(el.value || "75", 10);
        return (
          <div key={idx} style={{
            ...anim,
            padding: "10px 20px",
          }}>
            {el.label && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: textCol }}>{el.label}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: theme.colors.primary }}>{el.value || "75%"}</span>
              </div>
            )}
            <div style={{
              height: 8,
              borderRadius: 4,
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${Math.min(pct, 100)}%`,
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                boxShadow: `0 0 8px ${theme.colors.primary}40`,
              }} />
            </div>
          </div>
        );
      }

      case "chip-group": {
        const chips = el.items || ["Tag 1", "Tag 2", "Tag 3"];
        return (
          <div key={idx} style={{
            ...anim,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "8px 20px",
          }}>
            {chips.map((chip, i) => (
              <div key={i} style={{
                padding: "4px 12px",
                borderRadius: 14,
                background: i === 0
                  ? `${theme.colors.primary}18`
                  : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                border: `1px solid ${i === 0 ? `${theme.colors.primary}30` : borderCol}`,
                color: i === 0 ? theme.colors.primary : mutedCol,
                fontSize: 10,
                fontWeight: 500,
              }}>
                {chip}
              </div>
            ))}
          </div>
        );
      }

      case "stat-card":
        return (
          <div key={idx} style={{
            ...anim,
            margin: "8px 16px",
            padding: "16px 20px",
            borderRadius: 12,
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            border: `1px solid ${borderCol}`,
          }}>
            {el.label && (
              <div style={{ fontSize: 10, color: mutedCol, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {el.label}
              </div>
            )}
            <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.primary, lineHeight: 1.1 }}>
              {el.value || "0"}
            </div>
            {el.description && (
              <div style={{ fontSize: 10, color: mutedCol, marginTop: 4 }}>
                {el.description}
              </div>
            )}
          </div>
        );

      case "dropdown": {
        const options = el.items || ["Option 1", "Option 2"];
        return (
          <div key={idx} style={{
            ...anim,
            padding: "8px 20px",
          }}>
            {el.label && (
              <div style={{ fontSize: 10, color: mutedCol, marginBottom: 3, fontWeight: 500 }}>
                {el.label}
              </div>
            )}
            <div style={{
              height: 34,
              borderRadius: 8,
              background: inputBg,
              border: `1px solid ${borderCol}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
              fontSize: 11,
              color: textCol,
            }}>
              <span>{options[0]}</span>
              <span style={{ fontSize: 8, color: mutedCol }}>▼</span>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: bg,
      overflow: "hidden",
      display: "flex",
      flexDirection: elements.some((e) => e.type === "sidebar") ? "row" : "column",
    }}>
      {elements.map((el, i) => renderElement(el, i))}
    </div>
  );
}

function DeviceFrame({
  children,
  variant,
  isDark,
  theme,
  frame,
  componentName,
}: {
  children: React.ReactNode;
  variant: "browser" | "phone" | "card";
  isDark: boolean;
  theme: VideoTheme;
  frame: number;
  componentName?: string;
}) {
  const chromeColor = isDark ? "#181825" : "#f1f1f5";
  const chromeBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const dotColors = ["#ff5f57", "#ffbd2e", "#28c840"];

  const editorScale = interpolate(frame, [4, 30], [0.94, 1], {
    extrapolateRight: "clamp",
    easing: easings.snappy,
  });
  const editorOpacity = interpolate(frame, [4, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: easings.smooth,
  });

  if (variant === "phone") {
    return (
      <div style={{
        width: 260,
        maxHeight: "88%",
        borderRadius: 28,
        overflow: "hidden",
        background: isDark ? "#1a1a2e" : "#e5e5ea",
        padding: 4,
        boxShadow: depthShadow(theme),
        opacity: editorOpacity,
        transform: `scale(${editorScale})`,
      }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 24, overflow: "hidden", position: "relative" }}>
          {children}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div style={{
        width: "82%",
        maxWidth: 800,
        maxHeight: "80%",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: depthShadow(theme),
        border: `1px solid ${chromeBorder}`,
        opacity: editorOpacity,
        transform: `scale(${editorScale})`,
      }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      width: "82%",
      maxWidth: 860,
      maxHeight: "85%",
      borderRadius: 14,
      overflow: "hidden",
      background: chromeColor,
      boxShadow: depthShadow(theme),
      border: `1px solid ${chromeBorder}`,
      display: "flex",
      flexDirection: "column",
      opacity: editorOpacity,
      transform: `scale(${editorScale})`,
    }}>
      <div style={{
        padding: "9px 15px",
        display: "flex",
        alignItems: "center",
        gap: 7,
        borderBottom: `1px solid ${chromeBorder}`,
        flexShrink: 0,
      }}>
        {dotColors.map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.85 }} />
        ))}
        {componentName && (
          <div style={{
            flex: 1,
            textAlign: "center",
            fontSize: 11,
            color: isDark ? "#71717a" : "#a1a1aa",
            fontWeight: 500,
          }}>
            {componentName}
          </div>
        )}
        {!componentName && <div style={{ flex: 1 }} />}
      </div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  );
}

export default function ComponentShowcaseScene({
  content,
  theme,
}: {
  content: SceneContent;
  theme: VideoTheme;
}) {
  const frame = useCurrentFrame();
  const typo = getTypography(theme);
  const isDark = isThemeDark(theme);
  const layout = (content.layout as string) || "centered";
  const componentName = (content.componentName as string) || "";
  const mockupElements = (content.mockupElements as MockupElement[]) || [];
  const componentProps = (content.componentProps as string[]) || [];
  const callouts = (content.callouts as { text: string }[]) || [];
  const mockupVariant = (content.mockupVariant as "browser" | "phone" | "card") || "browser";

  const defaultElements: MockupElement[] = componentName
    ? [
        { type: "navbar", label: componentName, items: ["Home", "Features", "Docs"] },
        { type: "hero-section", label: `${componentName} Component`, description: content.subtext as string || "A powerful, reusable component" },
      ]
    : [
        { type: "card", label: "Component Preview", description: "A clean, reusable UI component" },
      ];

  const elements = mockupElements.length > 0 ? mockupElements : defaultElements;

  const renderPropsChips = () => {
    if (componentProps.length === 0) return null;
    return (
      <div style={{
        ...fadeInUp(frame, 28),
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 16,
      }}>
        {componentProps.map((prop, i) => (
          <div key={i} style={{
            ...fadeInUp(frame, 32 + i * 4, 14),
            padding: "5px 14px",
            borderRadius: 20,
            background: `${theme.colors.primary}15`,
            border: `1px solid ${theme.colors.primary}30`,
            color: theme.colors.primary,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}>
            {prop}
          </div>
        ))}
      </div>
    );
  };

  if (layout === "split") {
    return (
      <AbsoluteFill style={{ background: theme.colors.background }}>
        <div style={animatedMeshBg(frame, theme)} />
        <div style={noiseOverlayStyle()} />
        <div style={glowOrbStyle(frame, theme.colors.primary, 400, "65%", "20%", 0)} />
        <div style={scanLineStyle(frame, 5, theme.colors.primary, 40)} />

        <div style={{
          display: "flex",
          height: "100%",
          padding: `${spacing.scenePadding}px ${spacing.scenePaddingX}px`,
          gap: 48,
          position: "relative",
        }}>
          <div style={{
            flex: "0 0 55%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <DeviceFrame
              variant={mockupVariant}
              isDark={isDark}
              theme={theme}
              frame={frame}
              componentName={componentName}
            >
              <MockupRenderer elements={elements} theme={theme} frame={frame} isDark={isDark} />
            </DeviceFrame>
          </div>

          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            {componentName && (
              <div style={{
                ...fadeInUp(frame, 10, 16),
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "#fff",
                  fontWeight: 700,
                }}>
                  {"⚛"}
                </div>
                <span style={{ ...typo.caption, color: theme.colors.primary }}>
                  COMPONENT
                </span>
              </div>
            )}

            {content.headline && (
              <div style={{
                ...fadeInBlur(frame, 8),
                ...typo.sectionTitle,
                color: theme.colors.text,
                marginBottom: 16,
              }}>
                {content.headline}
              </div>
            )}

            {content.subtext && (
              <div style={{
                ...fadeInUp(frame, 20),
                ...typo.bodyLg,
                color: theme.colors.textMuted,
                marginBottom: 20,
                maxWidth: 440,
              }}>
                {content.subtext}
              </div>
            )}

            {renderPropsChips()}

            {callouts.length > 0 && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 20,
              }}>
                {callouts.map((c, i) => (
                  <div key={i} style={{
                    ...fadeInUp(frame, 30 + i * 8, 18),
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 16px",
                    borderRadius: spacing.borderRadius.md,
                    ...glassCard(theme, spacing.borderRadius.md),
                  }}>
                    <div style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: theme.colors.primary,
                      boxShadow: `0 0 8px ${theme.colors.primary}50`,
                      flexShrink: 0,
                    }} />
                    <div style={{ fontSize: 15, color: theme.colors.text, fontWeight: 500 }}>
                      {c.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: theme.colors.background }}>
      <div style={animatedMeshBg(frame, theme)} />
      <div style={noiseOverlayStyle()} />
      <div style={glowOrbStyle(frame, theme.colors.primary, 500, "50%", "25%", 0)} />
      <div style={glowOrbStyle(frame, theme.colors.accent, 350, "20%", "70%", 10)} />
      <div style={scanLineStyle(frame, 3, theme.colors.primary, 35)} />

      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: `40px ${spacing.scenePaddingX}px`,
        gap: 24,
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}>
          {componentName && (
            <div style={{
              ...fadeInUp(frame, 2, 14),
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{ ...typo.caption, color: theme.colors.primary }}>
                {"⚛ "}COMPONENT
              </span>
            </div>
          )}

          {content.headline && (
            <div style={{
              ...fadeInBlur(frame, 4),
              ...typo.sectionTitle,
              color: theme.colors.text,
              textAlign: "center",
            }}>
              {content.headline}
            </div>
          )}

          {content.subtext && (
            <div style={{
              ...fadeInUp(frame, 14),
              ...typo.body,
              color: theme.colors.textMuted,
              textAlign: "center",
              maxWidth: 600,
            }}>
              {content.subtext}
            </div>
          )}
        </div>

        <DeviceFrame
          variant={mockupVariant}
          isDark={isDark}
          theme={theme}
          frame={frame}
          componentName={componentName}
        >
          <MockupRenderer elements={elements} theme={theme} frame={frame} isDark={isDark} />
        </DeviceFrame>

        {renderPropsChips()}

        {callouts.length > 0 && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {callouts.map((c, i) => {
              const positions = [
                { top: "15%", right: "6%" },
                { bottom: "18%", left: "5%" },
                { top: "40%", left: "4%" },
                { bottom: "15%", right: "5%" },
              ] as React.CSSProperties[];
              const pos = positions[i % positions.length];
              return (
                <div key={i} style={{
                  position: "absolute",
                  ...pos,
                  ...fadeInUp(frame, 36 + i * 10, 16),
                  padding: "10px 20px",
                  borderRadius: 12,
                  ...glassCard(theme, 12),
                  color: theme.colors.text,
                  fontSize: 14,
                  fontWeight: 600,
                  boxShadow: depthShadow(theme),
                }}>
                  {c.text}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
