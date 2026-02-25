"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { themeList } from "@/components/video/themes";

const STORAGE_KEY = "subconscious_vc_draft";

interface DraftProject {
  title: string;
  description: string;
  githubUrl: string;
  theme: string;
}

export function saveDraft(data: DraftProject) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function loadDraft(): DraftProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

const S = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 100,
    background: "#0c1117",
    display: "flex",
    flexDirection: "column" as const,
  },
  progress: {
    height: 3,
    background: "#1e2a35",
    flexShrink: 0,
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #ff5c28, #ff8855)",
    borderRadius: "0 2px 2px 0",
    transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  topbar: {
    display: "flex",
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: "16px 24px",
    flexShrink: 0,
  },
  backBtn: {
    display: "flex",
    alignItems: "center" as const,
    gap: 6,
    color: "#8b949e",
    fontSize: 14,
    fontWeight: 500,
    background: "none",
    border: "none",
    cursor: "pointer" as const,
    padding: "6px 10px",
    borderRadius: 8,
  },
  closeBtn: {
    color: "#8b949e",
    background: "none",
    border: "none",
    cursor: "pointer" as const,
    padding: 8,
    borderRadius: 8,
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: "0 24px 48px",
    overflowY: "auto" as const,
  },
  card: {
    width: "100%",
    maxWidth: 520,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#ff5c28",
    marginBottom: 12,
  },
  question: {
    fontSize: 32,
    fontWeight: 700,
    color: "#f0f6fc",
    lineHeight: 1.2,
    marginBottom: 8,
  },
  highlight: {
    color: "#ff5c28",
  },
  hint: {
    fontSize: 15,
    color: "#8b949e",
    lineHeight: 1.5,
    marginBottom: 28,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: 16,
    color: "#f0f6fc",
    background: "#161b22",
    border: "1.5px solid #30363d",
    borderRadius: 12,
    outline: "none",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    fontSize: 16,
    color: "#f0f6fc",
    background: "#161b22",
    border: "1.5px solid #30363d",
    borderRadius: 12,
    outline: "none",
    fontFamily: "inherit",
    resize: "none" as const,
    lineHeight: 1.6,
    minHeight: 120,
  },
  continueBtn: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    marginTop: 20,
    padding: "14px 28px",
    fontSize: 15,
    fontWeight: 600,
    color: "#fff",
    background: "#ff5c28",
    border: "none",
    borderRadius: 12,
    cursor: "pointer" as const,
    alignSelf: "flex-start" as const,
  },
  disabledBtn: {
    opacity: 0.35,
    cursor: "not-allowed" as const,
  },
  btnRow: {
    display: "flex",
    alignItems: "center" as const,
    gap: 12,
    marginTop: 20,
  },
  skipBtn: {
    padding: "14px 20px",
    fontSize: 14,
    fontWeight: 500,
    color: "#8b949e",
    background: "none",
    border: "1.5px solid #30363d",
    borderRadius: 12,
    cursor: "pointer" as const,
  },
  themes: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 12,
    marginBottom: 4,
  },
  themeCard: {
    background: "#161b22",
    border: "2px solid #30363d",
    borderRadius: 14,
    padding: 10,
    cursor: "pointer" as const,
    textAlign: "left" as const,
    transition: "border-color 0.2s, transform 0.15s",
  },
  themeSelected: {
    borderColor: "#ff5c28",
    boxShadow: "0 0 0 3px rgba(255,92,40,0.15)",
  },
  themePreview: {
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: 8,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#f0f6fc",
  },
  summary: {
    display: "flex",
    alignItems: "center" as const,
    gap: 14,
    padding: 14,
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 14,
    marginBottom: 24,
  },
  summaryPreview: {
    width: 56,
    height: 36,
    borderRadius: 8,
    flexShrink: 0,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#f0f6fc",
    whiteSpace: "nowrap" as const,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
  },
  summaryDesc: {
    fontSize: 12,
    color: "#8b949e",
    marginTop: 2,
    whiteSpace: "nowrap" as const,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
  },
  authForm: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  error: {
    fontSize: 13,
    color: "#f85149",
    background: "rgba(248,81,73,0.08)",
    border: "1px solid rgba(248,81,73,0.2)",
    padding: "10px 14px",
    borderRadius: 10,
  },
  toggleAuth: {
    textAlign: "center" as const,
    fontSize: 14,
    color: "#8b949e",
    marginTop: 20,
  },
  toggleBtn: {
    color: "#ff5c28",
    fontWeight: 600,
    background: "none",
    border: "none",
    cursor: "pointer" as const,
  },
  githubWrap: {
    position: "relative" as const,
  },
  githubIcon: {
    position: "absolute" as const,
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#484f58",
    pointerEvents: "none" as const,
  },
};

export default function OnboardingWizard({
  onClose,
}: {
  onClose: () => void;
}) {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const createProject = useMutation(api.projects.createProject);
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [theme, setTheme] = useState("saas");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authFlow, setAuthFlow] = useState<"signUp" | "signIn">("signUp");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const createdRef = useRef(false);

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [cardAnim, setCardAnim] = useState<"enter" | "idle">("enter");
  const [slideDir, setSlideDir] = useState<1 | -1>(1);

  const lastStep = isAuthenticated ? 3 : 4;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setOverlayVisible(true));
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const doCreate = useCallback(async () => {
    if (createdRef.current) return;
    createdRef.current = true;
    setCreating(true);
    try {
      saveDraft({ title, description, githubUrl, theme });
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
            projectId,
          }),
        }).catch(() => {});
      }
      clearDraft();
      router.push(`/editor/${externalId}`);
    } catch {
      createdRef.current = false;
      setCreating(false);
    }
  }, [title, description, githubUrl, theme, createProject, router]);

  useEffect(() => {
    if (isAuthenticated && step === lastStep && !createdRef.current) {
      doCreate();
    }
  }, [isAuthenticated, step, lastStep, doCreate]);

  useEffect(() => {
    setCardAnim("enter");
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCardAnim("idle");
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [step]);

  function go(next: number) {
    setSlideDir(next > step ? 1 : -1);
    setCardAnim("enter");
    setStep(next);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("email", email);
    fd.set("password", password);
    fd.set("flow", authFlow);
    try {
      await signIn("password", fd);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("InvalidAccountId")) {
          setAuthError(
            "No account found. Try signing up instead."
          );
        } else if (err.message.includes("InvalidSecret")) {
          setAuthError("Wrong password. Try again.");
        } else {
          setAuthError(err.message);
        }
      } else {
        setAuthError("Something went wrong.");
      }
      setSubmitting(false);
    }
  }

  const canContinue = [
    title.trim().length > 0,
    description.trim().length > 0,
    true,
    true,
    true,
  ];

  const progress = ((step + 1) / (lastStep + 1)) * 100;

  const arrow = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );

  return (
    <div
      style={{
        ...S.overlay,
        opacity: overlayVisible ? 1 : 0,
        transform: overlayVisible
          ? "translateY(0)"
          : "translateY(24px)",
        transition:
          "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Progress bar */}
      <div style={S.progress}>
        <div
          style={{ ...S.progressFill, width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <div style={S.topbar}>
        {step > 0 ? (
          <button onClick={() => go(step - 1)} style={S.backBtn}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onClose}
          style={S.closeBtn}
          aria-label="Close"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={S.body}>
        <div
          style={{
            ...S.card,
            opacity: cardAnim === "idle" ? 1 : 0,
            transform:
              cardAnim === "idle"
                ? "translateX(0)"
                : `translateX(${slideDir * 40}px)`,
            transition:
              cardAnim === "idle"
                ? "opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
                : "none",
          }}
        >
          {/* Step 1: Product Name */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p style={S.label}>
                Step 1 of {lastStep + 1}
              </p>
              <h2 style={S.question}>
                What&apos;s your product called?
              </h2>
              <p style={S.hint}>
                This will be the star of your video.
              </p>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  canContinue[0] &&
                  go(1)
                }
                placeholder="e.g. Acme Analytics"
                style={S.input}
              />
              <button
                disabled={!canContinue[0]}
                onClick={() => go(1)}
                style={{
                  ...S.continueBtn,
                  ...(!canContinue[0] ? S.disabledBtn : {}),
                }}
              >
                Continue {arrow}
              </button>
            </div>
          )}

          {/* Step 2: Description */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p style={S.label}>
                Step 2 of {lastStep + 1}
              </p>
              <h2 style={S.question}>
                Tell us about{" "}
                <span style={S.highlight}>{title}</span>
              </h2>
              <p style={S.hint}>
                What does it do? Who is it for? What makes it
                special?
              </p>
              <textarea
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product in a few sentences..."
                rows={4}
                style={S.textarea}
              />
              <button
                disabled={!canContinue[1]}
                onClick={() => go(2)}
                style={{
                  ...S.continueBtn,
                  ...(!canContinue[1] ? S.disabledBtn : {}),
                }}
              >
                Continue {arrow}
              </button>
            </div>
          )}

          {/* Step 3: GitHub */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p style={S.label}>
                Step 3 of {lastStep + 1}
              </p>
              <h2 style={S.question}>Got a GitHub repo?</h2>
              <p style={S.hint}>
                We&apos;ll extract screenshots, logos, and
                features automatically. Totally optional.
              </p>
              <div style={S.githubWrap}>
                <svg
                  style={S.githubIcon}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <input
                  autoFocus
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && go(3)
                  }
                  placeholder="https://github.com/owner/repo"
                  style={{ ...S.input, paddingLeft: 44 }}
                />
              </div>
              <div style={S.btnRow}>
                <button
                  onClick={() => {
                    setGithubUrl("");
                    go(3);
                  }}
                  style={S.skipBtn}
                >
                  Skip this step
                </button>
                <button
                  onClick={() => go(3)}
                  disabled={!githubUrl.trim()}
                  style={{
                    ...S.continueBtn,
                    marginTop: 0,
                    ...(!githubUrl.trim()
                      ? S.disabledBtn
                      : {}),
                  }}
                >
                  Continue {arrow}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Theme */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p style={S.label}>
                Step {isAuthenticated ? 4 : 4} of{" "}
                {lastStep + 1}
              </p>
              <h2 style={S.question}>
                Pick a vibe for{" "}
                <span style={S.highlight}>{title}</span>
              </h2>
              <p style={S.hint}>
                Choose a visual theme for your video. You can
                change this later.
              </p>
              <div style={S.themes}>
                {themeList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    style={{
                      ...S.themeCard,
                      ...(theme === t.id
                        ? S.themeSelected
                        : {}),
                    }}
                  >
                    <div
                      style={{
                        ...S.themePreview,
                        background: t.preview,
                      }}
                    />
                    <div style={S.themeName}>{t.name}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  isAuthenticated ? doCreate() : go(4)
                }
                disabled={creating}
                style={{
                  ...S.continueBtn,
                  ...(creating ? S.disabledBtn : {}),
                }}
              >
                {isAuthenticated
                  ? creating
                    ? "Creating your video..."
                    : "Create Video"
                  : "Continue"}
                {!creating && arrow}
              </button>
            </div>
          )}

          {/* Step 5: Auth */}
          {step === 4 && !isAuthenticated && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p style={S.label}>Final step</p>
              <h2 style={S.question}>
                {authFlow === "signUp"
                  ? "Create your account"
                  : "Welcome back"}
              </h2>
              <p style={S.hint}>
                {authFlow === "signUp"
                  ? "Sign up to start editing your video."
                  : "Sign in to continue building."}
              </p>

              {/* Project summary card */}
              <div style={S.summary}>
                <div
                  style={{
                    ...S.summaryPreview,
                    background:
                      themeList.find((t) => t.id === theme)
                        ?.preview ?? "",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={S.summaryTitle}>{title}</div>
                  <div style={S.summaryDesc}>
                    {description.slice(0, 80)}
                    {description.length > 80 ? "..." : ""}
                  </div>
                </div>
              </div>

              <form onSubmit={handleAuth} style={S.authForm}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  autoFocus
                  style={S.input}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min. 8 characters)"
                  required
                  minLength={8}
                  style={S.input}
                />
                {authError && (
                  <div style={S.error}>{authError}</div>
                )}
                <button
                  type="submit"
                  disabled={submitting || creating}
                  style={{
                    ...S.continueBtn,
                    marginTop: 4,
                    width: "100%",
                    ...(submitting || creating
                      ? S.disabledBtn
                      : {}),
                  }}
                >
                  {submitting || creating
                    ? "One moment..."
                    : authFlow === "signUp"
                      ? "Create Account & Start Editing"
                      : "Sign In & Start Editing"}
                  {!(submitting || creating) && arrow}
                </button>
              </form>

              <p style={S.toggleAuth}>
                {authFlow === "signUp"
                  ? "Already have an account?"
                  : "Need an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthFlow(
                      authFlow === "signUp"
                        ? "signIn"
                        : "signUp"
                    );
                    setAuthError(null);
                  }}
                  style={S.toggleBtn}
                >
                  {authFlow === "signUp"
                    ? "Sign in"
                    : "Sign up"}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
