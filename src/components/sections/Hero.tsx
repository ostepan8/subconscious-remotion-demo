"use client";

interface HeroProps {
  onStart: () => void;
}

export default function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative overflow-hidden py-28 sm:py-40 px-4">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: [
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,92,40,0.10), transparent 60%)",
            "radial-gradient(ellipse 50% 40% at 80% 100%, rgba(62,208,195,0.07), transparent 60%)",
            "radial-gradient(ellipse 40% 30% at 10% 60%, rgba(181,232,0,0.04), transparent 60%)",
          ].join(", "),
        }}
      />

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03] animate-pulse-soft"
          style={{ background: "var(--brand-orange)" }}
        />
        <div
          className="absolute -bottom-1/3 -left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.02]"
          style={{ background: "var(--brand-teal)", animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8 border animate-fade-in-up"
          style={{
            color: "var(--brand-orange)",
            borderColor: "rgba(255,92,40,0.2)",
            background: "rgba(255,92,40,0.06)",
            animationDelay: "0.1s",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: "var(--brand-green)" }} />
          AI-powered video creation
        </div>

        <h1
          className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 animate-fade-in-up"
          style={{ color: "var(--foreground)", animationDelay: "0.2s" }}
        >
          Describe your product.
          <br />
          <span style={{ color: "var(--brand-orange)" }}>Get a video.</span>
        </h1>

        <p
          className="text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up"
          style={{ color: "var(--muted)", animationDelay: "0.3s" }}
        >
          Enter your product name, pick a theme, and an AI agent builds a
          multi-scene promo video with animations, scripts, and voiceover.
          No editing skills needed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <button
            onClick={onStart}
            className="group px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: "var(--brand-orange)", boxShadow: "0 8px 32px rgba(255,92,40,0.25)" }}
          >
            <span className="flex items-center gap-2">
              Start Building
              <svg className="transition-transform group-hover:translate-x-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </button>
          <a
            href="#how-it-works"
            className="px-6 py-3.5 rounded-2xl font-medium text-base border transition-colors hover:bg-(--surface-hover)"
            style={{ color: "var(--foreground)", borderColor: "var(--border)" }}
          >
            See How It Works
          </a>
        </div>

        <div className="mt-16 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <p className="text-xs font-medium mb-4" style={{ color: "var(--muted)" }}>
            Generates videos like this in minutes
          </p>
          <div className="flex justify-center gap-3">
            {[
              { bg: "linear-gradient(135deg, #0f0c29, #302b63)", label: "Tech Startup" },
              { bg: "linear-gradient(135deg, #f0f4ff, #dbeafe)", label: "SaaS" },
              { bg: "linear-gradient(135deg, #ff5c28, #ffd54f)", label: "Agency" },
            ].map((t) => (
              <div
                key={t.label}
                className="w-24 sm:w-32 aspect-video rounded-xl border transition-transform hover:scale-105"
                style={{ background: t.bg, borderColor: "var(--border-subtle)" }}
                title={t.label}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
