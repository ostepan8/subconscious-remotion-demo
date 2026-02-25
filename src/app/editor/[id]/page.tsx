"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import VideoEditor from "@/components/editor/VideoEditor";

export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <Navbar />
      <EditorContent externalId={id} />
    </AuthGuard>
  );
}

function EditorContent({ externalId }: { externalId: string }) {
  const project = useQuery(api.projects.getProject, { externalId });

  if (project === undefined) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "calc(100vh - 56px)", background: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--brand-orange)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "calc(100vh - 56px)", background: "var(--background)" }}
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            Project not found
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            This project doesn&apos;t exist or you don&apos;t have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <VideoEditor
      project={{
        _id: project._id,
        externalId: project.externalId,
        title: project.title,
        description: project.description,
        theme: project.theme,
        status: project.status,
        githubUrl: project.githubUrl,
        githubExtract: project.githubExtract as Record<string, unknown> | null | undefined,
      }}
    />
  );
}
