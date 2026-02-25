import { httpRouter } from "convex/server";
import { auth } from "./auth";
import {
  getProject,
  listScenes,
  addScene,
  updateScene,
  removeScene,
  reorderScenes,
  updateProjectTool,
  generateVoiceoverScript,
  generateVoiceover,
  listMedia,
  setSceneMedia,
  saveComponent,
  saveDesignContext,
  getComponentSource,
  saveGeneratedCode,
  writeCode,
  editCode,
  readBuffer,
  appendCode,
  finalizeComponent,
  updateGenerationStatus,
  exploreRepo,
  readFile,
  readFiles,
  searchRepoFiles,
  listRepoFiles,
  fetchGithubFile,
} from "./toolRoutes";
import {
  generateComponentHttp,
  editGeneratedSceneHttp,
  generateCustomComponentHttp,
  saveCustomComponentHttp,
} from "./generateComponent";
import { getKnowledge } from "./knowledge";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({ path: "/tools/get-project", method: "POST", handler: getProject });
http.route({ path: "/tools/list-scenes", method: "POST", handler: listScenes });
http.route({ path: "/tools/add-scene", method: "POST", handler: addScene });
http.route({ path: "/tools/update-scene", method: "POST", handler: updateScene });
http.route({ path: "/tools/remove-scene", method: "POST", handler: removeScene });
http.route({ path: "/tools/reorder-scenes", method: "POST", handler: reorderScenes });
http.route({ path: "/tools/update-project", method: "POST", handler: updateProjectTool });
http.route({ path: "/tools/generate-voiceover-script", method: "POST", handler: generateVoiceoverScript });
http.route({ path: "/tools/generate-voiceover", method: "POST", handler: generateVoiceover });
http.route({ path: "/tools/list-media", method: "POST", handler: listMedia });
http.route({ path: "/tools/set-scene-media", method: "POST", handler: setSceneMedia });
http.route({ path: "/tools/get-knowledge", method: "POST", handler: getKnowledge });
http.route({ path: "/tools/save-component", method: "POST", handler: saveComponent });
http.route({ path: "/tools/save-design-context", method: "POST", handler: saveDesignContext });
http.route({ path: "/tools/get-component-source", method: "POST", handler: getComponentSource });
http.route({ path: "/tools/explore-repo", method: "POST", handler: exploreRepo });
http.route({ path: "/tools/read-file", method: "POST", handler: readFile });
http.route({ path: "/tools/read-files", method: "POST", handler: readFiles });
http.route({ path: "/tools/search-repo", method: "POST", handler: searchRepoFiles });
http.route({ path: "/tools/write-code", method: "POST", handler: writeCode });
http.route({ path: "/tools/edit-code", method: "POST", handler: editCode });
http.route({ path: "/tools/read-buffer", method: "POST", handler: readBuffer });
// Backward-compatible aliases
http.route({ path: "/tools/list-repo-files", method: "POST", handler: listRepoFiles });
http.route({ path: "/tools/fetch-github-file", method: "POST", handler: fetchGithubFile });
http.route({ path: "/tools/search-repo-files", method: "POST", handler: searchRepoFiles });
http.route({ path: "/tools/save-generated-code", method: "POST", handler: saveGeneratedCode });
http.route({ path: "/tools/append-code", method: "POST", handler: appendCode });
http.route({ path: "/tools/finalize-component", method: "POST", handler: finalizeComponent });
http.route({ path: "/tools/update-generation-status", method: "POST", handler: updateGenerationStatus });
http.route({ path: "/tools/generate-component", method: "POST", handler: generateComponentHttp });
http.route({ path: "/tools/edit-generated-scene", method: "POST", handler: editGeneratedSceneHttp });
http.route({ path: "/tools/generate-custom-component", method: "POST", handler: generateCustomComponentHttp });
http.route({ path: "/tools/save-custom-component", method: "POST", handler: saveCustomComponentHttp });

export default http;
