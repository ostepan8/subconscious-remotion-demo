"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import ThemeSelector from "@/components/editor/ThemeSelector";
import { loadDraft, clearDraft } from "@/components/onboarding/OnboardingWizard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Navbar />
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const projects = useQuery(api.projects.getMyProjects);
  const createProject = useMutation(api.projects.createProject);
  const deleteProject = useMutation(api.projects.deleteProject);
  const router = useRouter();
  const draftHandled = useRef(false);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("saas");
  const [githubUrl, setGithubUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingProject, setDeletingProject] = useState<{
    id: (typeof api.projects.deleteProject)["_args"]["projectId"];
    title: string;
  } | null>(null);

  useEffect(() => {
    if (draftHandled.current) return;
    const draft = loadDraft();
    if (!draft) return;
    draftHandled.current = true;
    (async () => {
      try {
        const { externalId, projectId } = await createProject({
          title: draft.title,
          description: draft.description,
          theme: draft.theme,
          githubUrl: draft.githubUrl || undefined,
        });
        if (draft.githubUrl) {
          fetch("/api/github/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ githubUrl: draft.githubUrl, projectId }),
          }).catch(() => {});
        }
        clearDraft();
        router.push(`/editor/${externalId}`);
      } catch {
        draftHandled.current = false;
        clearDraft();
      }
    })();
  }, [createProject, router]);

  async function handleCreate() {
    if (!title.trim() || !description.trim()) return;
    setCreating(true);
    try {
      const { externalId, projectId } = await createProject({
        title: title.trim(),
        description: description.trim(),
        theme,
        githubUrl: githubUrl.trim() || undefined,
      });

      if (githubUrl.trim()) {
        fetch("/api/github/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            githubUrl: githubUrl.trim(),
            projectId: projectId,
          }),
        }).catch(() => {});
      }

      router.push(`/editor/${externalId}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            My Videos
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Create and manage your promotional videos.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--brand-orange)" }}
        >
          + New Video
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="w-full max-w-2xl rounded-2xl border p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              Create New Video
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: "var(--foreground)" }}>
                  Product Name
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Acme Analytics"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[var(--brand-orange)]"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: "var(--foreground)" }}>
                  Product Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product, what it does, and who it's for..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none focus:border-[var(--brand-orange)]"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: "var(--foreground)" }}>
                  GitHub Repository
                  <span className="text-xs font-normal ml-1.5" style={{ color: "var(--muted)" }}>
                    optional
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:border-[var(--brand-teal)]"
                    style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>
                <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
                  We'll extract logos, screenshots, features, and design assets from the repo.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: "var(--foreground)" }}>
                  Theme
                </label>
                <ThemeSelector selected={theme} onSelect={setTheme} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-[var(--surface-hover)]"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim() || !description.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--brand-orange)" }}
              >
                {creating ? "Creating..." : "Create Video"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project list */}
      {projects === undefined ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[var(--brand-orange)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl border border-dashed"
          style={{ borderColor: "var(--border)" }}
        >
          <Image
            src="/brand/Subconscious_Logo_Graphic.svg"
            alt="Subconscious"
            width={48}
            height={48}
            className="mx-auto mb-4 opacity-30"
          />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            No videos yet
          </h3>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Create your first video with Subconscious AI.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--brand-orange)" }}
          >
            + New Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p._id}
              className="rounded-xl border p-4 cursor-pointer transition-all hover:border-[var(--brand-orange)] group"
              style={{ background: "var(--surface)", borderColor: "var(--border-subtle)" }}
              onClick={() => router.push(`/editor/${p.externalId}`)}
            >
              <div
                className="w-full aspect-video rounded-lg mb-3"
                style={{
                  background:
                    p.theme === "tech-startup"
                      ? "linear-gradient(135deg, #0f0c29, #302b63)"
                      : p.theme === "saas"
                        ? "linear-gradient(135deg, #f0f4ff, #dbeafe)"
                        : p.theme === "portfolio"
                          ? "linear-gradient(135deg, #fafaf9, #e7e5e4)"
                          : p.theme === "agency"
                            ? "linear-gradient(135deg, #ff5c28, #ffd54f)"
                            : "linear-gradient(135deg, #fef3c7, #fcd34d)",
                }}
              />
              <h3 className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>
                {p.title}
              </h3>
              <p className="text-xs mt-1 truncate" style={{ color: "var(--muted)" }}>
                {p.description}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{
                    background:
                      p.status === "ready" ? "rgba(181,232,0,0.15)" : "rgba(255,92,40,0.1)",
                    color: p.status === "ready" ? "var(--brand-green)" : "var(--brand-orange)",
                  }}
                >
                  {p.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingProject({
                      id: p._id,
                      title: p.title,
                    });
                  }}
                  className="text-xs opacity-0 group-hover:opacity-100
                    transition-opacity hover:text-red-500"
                  style={{ color: "var(--muted)" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deletingProject && (
        <DeleteProjectModal
          title={deletingProject.title}
          onCancel={() => setDeletingProject(null)}
          onConfirm={async () => {
            await deleteProject({
              projectId: deletingProject.id,
            });
            setDeletingProject(null);
          }}
        />
      )}
    </div>
  );
}

function DeleteProjectModal({
  title,
  onCancel,
  onConfirm,
}: {
  title: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [visible, setVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function animateOut(then: () => void) {
    setVisible(false);
    setTimeout(then, 200);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={() => animateOut(onCancel)}
      style={{
        background: visible
          ? "rgba(0,0,0,0.5)"
          : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(4px)" : "blur(0px)",
        transition:
          "background 200ms ease, backdrop-filter 200ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] rounded-2xl border overflow-hidden"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          opacity: visible ? 1 : 0,
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.85) translateY(12px)",
          transition: [
            "opacity 200ms cubic-bezier(0.16,1,0.3,1)",
            "transform 200ms cubic-bezier(0.16,1,0.3,1)",
          ].join(", "),
        }}
      >
        <div
          style={{
            height: 3,
            background:
              "linear-gradient(90deg, #E85D3A 0%, #D32F2F 100%)",
          }}
        />

        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center
                justify-center shrink-0"
              style={{ background: "rgba(232,93,58,0.12)" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E85D3A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Delete Project
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--muted)" }}
              >
                This will permanently delete the project and all its
                scenes. This cannot be undone.
              </p>
            </div>
          </div>

          <div
            className="rounded-lg p-3 mb-4 flex items-center gap-3"
            style={{
              background: "var(--background)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center
                justify-center text-sm shrink-0"
              style={{ background: "rgba(232,93,58,0.7)" }}
            >
              🎬
            </div>
            <div
              className="text-xs font-medium truncate"
              style={{ color: "var(--foreground)" }}
            >
              {title}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => animateOut(onCancel)}
              className="flex-1 px-3 py-2 rounded-lg text-xs
                font-medium border transition-colors
                hover:bg-(--surface-hover)"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-3 py-2 rounded-lg text-xs
                font-medium text-white transition-all
                hover:brightness-110 disabled:opacity-50"
              style={{ background: "#E85D3A" }}
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
