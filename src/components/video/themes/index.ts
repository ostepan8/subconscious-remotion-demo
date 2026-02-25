import type { VideoTheme } from "@/types";
import { techStartup } from "./tech-startup";
import { saas } from "./saas";
import { portfolio } from "./portfolio";
import { agency } from "./agency";
import { ecommerce } from "./ecommerce";

export const themes: Record<string, VideoTheme> = {
  "tech-startup": techStartup,
  saas,
  portfolio,
  agency,
  ecommerce,
};

export const themeList: VideoTheme[] = Object.values(themes);

export function getTheme(id: string): VideoTheme {
  return themes[id] ?? themes["saas"];
}
