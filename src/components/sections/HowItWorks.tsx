"use client";

const steps = [
  {
    num: "01",
    title: "Describe your product",
    description:
      "Enter the name, description, and optionally link a GitHub repo. We'll extract logos, screenshots, and features.",
    color: "var(--brand-orange)",
  },
  {
    num: "02",
    title: "Pick a theme",
    description:
      "Choose from five curated visual themes. Each sets the colors, typography, and animation style.",
    color: "var(--brand-teal)",
  },
  {
    num: "03",
    title: "AI builds your video",
    description:
      "Our AI agent creates hero, features, testimonials, pricing, and CTA scenes — all updating live in the preview.",
    color: "var(--brand-green)",
  },
  {
    num: "04",
    title: "Refine & add voiceover",
    description:
      "Chat with the AI to tweak scenes, then generate professional ElevenLabs voiceover for every slide.",
    color: "var(--brand-orange)",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-4" id="how-it-works">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: "var(--foreground)" }}
          >
            How it works
          </h2>
          <p
            className="text-lg max-w-xl mx-auto"
            style={{ color: "var(--muted)" }}
          >
            Four steps from idea to polished promo video.
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute left-[23px] top-6 bottom-6 w-px hidden sm:block"
            style={{ background: "var(--border)" }}
          />
          <div className="flex flex-col gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-5 rounded-xl border p-6 transition-all hover:shadow-md relative"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white relative z-10"
                  style={{ background: step.color }}
                >
                  {step.num}
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold mb-1"
                    style={{ color: "var(--foreground)" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
