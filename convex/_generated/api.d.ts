/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as autoPlaceMedia from "../autoPlaceMedia.js";
import type * as chat from "../chat.js";
import type * as constants from "../constants.js";
import type * as customComponents from "../customComponents.js";
import type * as generateComponent from "../generateComponent.js";
import type * as http from "../http.js";
import type * as knowledge from "../knowledge.js";
import type * as media from "../media.js";
import type * as projects from "../projects.js";
import type * as scenes from "../scenes.js";
import type * as toolRoutes from "../toolRoutes.js";
import type * as validateComponent from "../validateComponent.js";
import type * as voiceovers from "../voiceovers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  autoPlaceMedia: typeof autoPlaceMedia;
  chat: typeof chat;
  constants: typeof constants;
  customComponents: typeof customComponents;
  generateComponent: typeof generateComponent;
  http: typeof http;
  knowledge: typeof knowledge;
  media: typeof media;
  projects: typeof projects;
  scenes: typeof scenes;
  toolRoutes: typeof toolRoutes;
  validateComponent: typeof validateComponent;
  voiceovers: typeof voiceovers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
