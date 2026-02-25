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
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: "var(--brand-orange)" }}
              >
                PC
              </span>
              PromoClip
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
