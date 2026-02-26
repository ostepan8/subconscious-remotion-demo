import type { VideoTheme } from "@/types";
import { techStartup } from "./tech-startup";
import { saas } from "./saas";
import { portfolio } from "./portfolio";
import { agency } from "./agency";
import { ecommerce } from "./ecommerce";
import { retroHtml } from "./retro-html";
import { newConsumer } from "./new-consumer";

export const themes: Record<string, VideoTheme> = {
  "tech-startup": techStartup,
  saas,
  portfolio,
  agency,
  ecommerce,
  "retro-html": retroHtml,
  "new-consumer": newConsumer,
};

export const themeList: VideoTheme[] = Object.values(themes);

export function getTheme(id: string): VideoTheme {
  return themes[id] ?? themes["saas"];
}
