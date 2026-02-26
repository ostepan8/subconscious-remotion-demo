"use client";

import { useState } from "react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Link from "next/link";
import SubconsciousLogo from "@/components/layout/SubconsciousLogo";

const OnboardingWizard = dynamic(
  () => import("@/components/onboarding/OnboardingWizard"),
  { ssr: false }
);

export default function Home() {
  const [showWizard, setShowWizard] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  function handleStart() {
    setShowWizard(true);
  }

  return (
    <>
      <Navbar onStartCreating={handleStart} />
      <main>
        <Hero onStart={handleStart} />
        <Features />
        <HowItWorks />

        {/* Video Showcase */}
        <section className="py-24 px-4" style={{ background: "var(--background)" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p
                className="text-xs font-semibold tracking-[0.15em] uppercase mb-3"
                style={{ color: "var(--brand-orange)" }}
              >
                Made with Subconscious
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "var(--foreground)" }}
              >
                See what you can create
              </h2>
              <p
                className="text-base max-w-lg mx-auto"
                style={{ color: "var(--muted)" }}
              >
                Real videos built with our AI-powered editor — from product demos to marketing clips.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  src: "/videos/receipt-agent-demo.mp4",
                  title: "Receipt Agent Demo",
                  description: "AI-powered receipt scanning and expense tracking",
                },
                {
                  src: "/videos/trigger-video.mp4",
                  title: "Trigger Automation",
                  description: "Workflow automation with intelligent triggers",
                },
                {
                  src: "/videos/subconscious-demo.mp4",
                  title: "Subconscious Platform",
                  description: "Build AI agents that work for you",
                },
              ].map((video) => (
                <div
                  key={video.src}
                  className="group rounded-2xl overflow-hidden border transition-all hover:border-[var(--brand-orange)]/30 hover:shadow-[0_8px_40px_rgba(255,92,40,0.08)]"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="relative aspect-video bg-black">
                    <video
                      src={video.src}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-60 group-hover:opacity-0 transition-opacity pointer-events-none">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3
                      className="text-sm font-semibold mb-1"
                      style={{ color: "var(--foreground)" }}
                    >
                      {video.title}
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {video.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div
            className="max-w-3xl mx-auto rounded-2xl p-12 text-center relative overflow-hidden"
            style={{ background: "var(--brand-black)" }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 50%, rgba(255,92,40,0.2), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(62,208,195,0.15), transparent 60%)",
              }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to create your video?
              </h2>
              <p className="text-base text-white/70 mb-8 max-w-lg mx-auto">
                It takes less than a minute to set up. Start building now and sign
                up when you&apos;re ready.
              </p>
              <button
                onClick={handleStart}
                className="inline-block px-8 py-3.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "var(--brand-orange)", boxShadow: "0 4px 20px rgba(255,92,40,0.3)" }}
              >
                Start Building — Free
              </button>
            </div>
          </div>
        </section>

        <footer
          className="border-t py-8 px-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
              <SubconsciousLogo size={20} textClass="text-sm" />
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Built with{" "}
              <a href="https://subconscious.dev" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Subconscious</a>
              {" + "}
              <a href="https://remotion.dev" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Remotion</a>
              {" + "}
              <a href="https://convex.dev" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Convex</a>
            </div>
          </div>
        </footer>
      </main>

      {showWizard && (
        <OnboardingWizard onClose={() => setShowWizard(false)} />
      )}
    </>
  );
}
