"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import SceneCard from "./SceneCard";
import AddSceneModal from "./AddSceneModal";
import type { Id } from "../../../convex/_generated/dataModel";

interface Scene {
  _id: Id<"scenes">;
  order: number;
  type: string;
  title: string;
  durationInFrames: number;
  voiceoverScript?: string;
  content: unknown;
  projectId: Id<"projects">;
  transition: string;
}

interface SceneListProps {
  scenes: Scene[];
  activeSceneId: string | null;
  projectId: Id<"projects">;
  onSelectScene: (id: string) => void;
  onEditScene: (id: string) => void;
  onSplitScene: (id: string) => void;
  onDeleteScene: (id: string) => void;
}

export default function SceneList({
  scenes,
  activeSceneId,
  projectId,
  onSelectScene,
  onEditScene,
  onSplitScene,
  onDeleteScene,
}: SceneListProps) {
  const duplicateScene = useMutation(api.scenes.duplicateScene);
  const reorderScenes = useMutation(api.scenes.reorderScenes);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const totalDuration = scenes.reduce((sum, s) => sum + s.durationInFrames, 0);
  const totalSeconds = (totalDuration / 30).toFixed(1);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDragFromIndex(index);
  }

  function handleDragEnd() {
    setDragFromIndex(null);
    setDragOverIndex(null);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    setDragOverIndex(null);
    setDragFromIndex(null);
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (fromIndex === dropIndex || isNaN(fromIndex)) return;
    const ids = scenes.map((s) => s._id);
    const [moved] = ids.splice(fromIndex, 1);
    const insertAt = dropIndex > fromIndex ? dropIndex - 1 : dropIndex;
    ids.splice(insertAt, 0, moved);
    reorderScenes({ projectId, sceneIds: ids });
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {scenes.length} scenes · {totalSeconds}s
        </span>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-[11px] px-2 py-0.5 rounded-md font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--brand-orange)" }}
        >
          + Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0">
        {scenes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              No scenes yet. Use the AI or click + Add.
            </p>
          </div>
        ) : (
          <>
            {scenes.map((scene, i) => {
              const showIndicatorBefore =
                dragOverIndex === i &&
                dragFromIndex !== null &&
                dragFromIndex !== i &&
                dragFromIndex !== i - 1;
              return (
                <div key={scene._id}>
                  {showIndicatorBefore && (
                    <div
                      style={{
                        height: 2,
                        background: "var(--brand-orange)",
                        borderRadius: 1,
                        margin: "1px 4px",
                        boxShadow: "0 0 4px var(--brand-orange)",
                      }}
                    />
                  )}
                  <SceneCard
                    scene={{
                      _id: scene._id as string,
                      order: scene.order,
                      type: scene.type,
                      title: scene.title,
                      durationInFrames: scene.durationInFrames,
                      voiceoverScript: scene.voiceoverScript,
                    }}
                    isActive={activeSceneId === scene._id}
                    isDragTarget={false}
                    onClick={() => onSelectScene(scene._id as string)}
                    onDelete={() => onDeleteScene(scene._id as string)}
                    onDuplicate={() => duplicateScene({ sceneId: scene._id })}
                    onSplit={() => onSplitScene(scene._id as string)}
                    dragHandleProps={{
                      draggable: true,
                      onDragStart: (e) => handleDragStart(e, i),
                      onDragEnd: handleDragEnd,
                      onDragOver: (e) => handleDragOver(e, i),
                      onDragLeave: () => setDragOverIndex(null),
                      onDrop: (e) => handleDrop(e, i),
                    }}
                  />
                </div>
              );
            })}

            {/* Drop zone after last scene */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverIndex(scenes.length);
              }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, scenes.length)}
              style={{
                minHeight: dragFromIndex !== null ? 40 : 8,
                borderRadius: 6,
                border:
                  dragOverIndex === scenes.length
                    ? "2px dashed var(--brand-orange)"
                    : dragFromIndex !== null
                      ? "2px dashed rgba(255,255,255,0.1)"
                      : "2px dashed transparent",
                background:
                  dragOverIndex === scenes.length
                    ? "rgba(232,93,58,0.08)"
                    : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                marginTop: 2,
              }}
            >
              {dragFromIndex !== null && (
                <span
                  style={{
                    fontSize: 10,
                    color:
                      dragOverIndex === scenes.length
                        ? "var(--brand-orange)"
                        : "rgba(255,255,255,0.25)",
                    fontWeight: 500,
                  }}
                >
                  Drop here to place at end
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <AddSceneModal
          projectId={projectId}
          insertAtOrder={scenes.length}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
