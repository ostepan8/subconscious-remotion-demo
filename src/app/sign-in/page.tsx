"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import SubconsciousLogo from "@/components/layout/SubconsciousLogo";
import { loadDraft, clearDraft } from "@/components/onboarding/OnboardingWizard";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const createProject = useMutation(api.projects.createProject);
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasDraft = typeof window !== "undefined" && loadDraft() !== null;
  const createdRef = useRef(false);

  const handlePendingProject = useCallback(async () => {
    if (createdRef.current) return;
    const draft = loadDraft();
    if (!draft) {
      router.replace("/dashboard");
      return;
    }
    createdRef.current = true;
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
      router.replace(`/editor/${externalId}`);
    } catch {
      createdRef.current = false;
      router.replace("/dashboard");
    }
  }, [createProject, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      handlePendingProject();
    }
  }, [isLoading, isAuthenticated, handlePendingProject]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-(--brand-orange) border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {isAuthenticated ? "Setting up your video..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("flow", flow);

    try {
      await signIn("password", formData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("InvalidAccountId")) {
          setError("No account found with this email. Try signing up.");
        } else if (err.message.includes("InvalidSecret")) {
          setError("Incorrect password. Please try again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      <div className="absolute inset-0 -z-10" style={{
        background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,92,40,0.06), transparent 70%)",
      }} />

      <Link href="/" className="flex items-center gap-2.5 mb-10 group transition-transform group-hover:scale-[1.02]">
        <SubconsciousLogo size={36} textClass="text-xl" />
      </Link>

      <div
        className="w-full max-w-sm rounded-2xl border p-7 animate-fade-in-up"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
        }}
      >
        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
          {flow === "signIn" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          {flow === "signIn"
            ? "Sign in to your account to continue."
            : hasDraft
              ? "Sign up to save your video and start editing."
              : "Get started creating promotional videos."
          }
        </p>

        {hasDraft && (
          <div
            className="flex items-center gap-3 p-3 rounded-xl mb-5 border"
            style={{ background: "var(--background)", borderColor: "var(--border-subtle)" }}
          >
            <div
              className="w-10 h-7 rounded-lg shrink-0"
              style={{ background: "linear-gradient(135deg, var(--brand-orange), #ffd54f)" }}
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>
                {loadDraft()?.title}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                Your video is ready to build
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-(--brand-orange) focus:shadow-[0_0_0_3px_rgba(255,92,40,0.08)]"
            style={{
              background: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={8}
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-(--brand-orange) focus:shadow-[0_0_0_3px_rgba(255,92,40,0.08)]"
            style={{
              background: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3.5 py-2.5 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "var(--brand-orange)" }}
          >
            {isSubmitting
              ? "One moment..."
              : flow === "signIn"
                ? "Sign In"
                : "Create Account"
            }
          </button>
        </form>

        <p className="text-sm text-center mt-5" style={{ color: "var(--muted)" }}>
          {flow === "signIn" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setFlow(flow === "signIn" ? "signUp" : "signIn"); setError(null); }}
            className="font-semibold hover:underline"
            style={{ color: "var(--brand-orange)" }}
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>

      <Link
        href="/"
        className="mt-6 text-sm transition-opacity hover:opacity-80"
        style={{ color: "var(--muted)" }}
      >
        Back to home
      </Link>
    </div>
  );
}
