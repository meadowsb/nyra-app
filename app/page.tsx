import type { ReactNode } from "react";

import { LandingHowItWorksSection } from "@/components/LandingHowItWorksSection";
import { LandingScrollScrubbedExampleChat } from "@/components/LandingScrollScrubbedExampleChat";
import { LandingHeroBackgroundMedia } from "@/components/LandingHeroBackgroundMedia";
import { LandingWaitlistDirectCta } from "@/components/LandingWaitlistDirectCta";
import { LandingHeroWaitlistGate } from "@/components/LandingHeroWaitlistGate";
import { LandingRevealOnView } from "@/components/LandingRevealOnView";
import { LandingScrollVenueBackdrop } from "@/components/LandingScrollVenueBackdrop";

const testimonials = [
  {
    quote:
      "We stopped living in our inboxes. Nyra’s shortlist felt intentional, not like a generic list from Google.",
    name: "Jordan & Sam",
    detail: "Toronto, Ontario",
  },
  {
    quote:
      "The write-ups helped us compare apples to apples before we ever picked up the phone.",
    name: "Priya K.",
    detail: "Chicago, IL",
  },
  {
    quote:
      "Calm, clear, and fast. Exactly what we wanted while planning alongside full-time jobs.",
    name: "Alex & Morgan",
    detail: "Austin, TX",
  },
] as const;

function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`nyra-eyebrow${className ? ` ${className}` : ""}`}>{children}</p>;
}

export default function Home() {
  return (
    <div className="nyra-landing-root nyra-chat-shell relative min-h-screen bg-chat-canvas font-sans text-chat-text-primary antialiased">
      <LandingScrollVenueBackdrop />
      <main className="nyra-landing-main">
        {/* Hero */}
        <section className="nyra-landing-hero-section relative flex flex-col justify-center overflow-hidden border-b border-chat-border">
          <LandingHeroBackgroundMedia />
          <div className="relative z-10 mx-auto w-full max-w-[1200px] px-2 py-16 sm:px-3 sm:py-20 lg:py-24">
            <SectionLabel className="nyra-landing-hero-wordmark nyra-landing-hero-fade-up nyra-landing-hero-fade-up--delay-1 text-center">
              NYRA
            </SectionLabel>
            <h1 className="nyra-landing-hero-fade-up nyra-landing-hero-fade-up--delay-2 mx-auto mt-5 max-w-[46rem] text-center text-[clamp(1.875rem,4.2vw,2.875rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-chat-text-primary">
              Plan your wedding <br />
              <span className="whitespace-nowrap">without the chaos</span>
            </h1>
            <p className="nyra-landing-hero-fade-up nyra-landing-hero-fade-up--delay-3 mx-auto mt-5 max-w-[40rem] text-center text-[15px] leading-relaxed text-chat-text-secondary">
              Nyra helps you plan everything — venues, vendors, timelines, and decisions —{" "}
              {"all\u00A0in\u00A0one\u00A0place"}.
            </p>

            <LandingHeroWaitlistGate />
          </div>
        </section>

        {/* How it works */}
        <LandingHowItWorksSection />

        {/* Shortlist outcome */}
        <section
          id="landing-section-example"
          data-landing-bg="example"
          className="border-b border-white/[0.07] bg-transparent"
        >
          <LandingRevealOnView className="mx-auto max-w-[1200px] px-2 py-20 max-lg:pb-12 sm:px-3 sm:py-24 lg:py-28">
            <header className="nyra-landing-glass-header nyra-landing-section-head-card nyra-landing-reveal-head mx-auto max-w-2xl text-center">
              <SectionLabel>YOUR RESULTS</SectionLabel>
              <h2 className="nyra-landing-section-headline">See what Nyra brings back</h2>
              <p className="nyra-landing-section-sub mx-auto max-w-md">
                A clear view of options, details, and next steps.
              </p>
            </header>

            <div className="nyra-landing-section-head-to-content nyra-landing-section-head-to-example-chat">
              <LandingScrollScrubbedExampleChat />
            </div>
          </LandingRevealOnView>
        </section>

        {/* Testimonials */}
        <section
          id="landing-section-testimonials"
          data-landing-bg="testimonials"
          className="border-b border-white/[0.07] bg-transparent max-lg:mt-16"
        >
          <LandingRevealOnView className="mx-auto max-w-[1200px] px-2 py-20 sm:px-3 sm:py-24 lg:py-28">
            <div className="nyra-landing-glass-header nyra-landing-section-head-card nyra-landing-reveal-head mx-auto max-w-2xl text-center">
              <SectionLabel>Testimonials</SectionLabel>
              <h2 className="nyra-landing-section-headline">Couples who wanted clarity, not noise</h2>
              <p className="nyra-landing-section-sub mx-auto max-w-md">
                Real experiences from people who used Nyra
              </p>
            </div>
            <ul className="nyra-landing-section-head-to-content nyra-landing-reveal-stagger grid gap-8 sm:grid-cols-3 sm:items-stretch sm:gap-8 lg:gap-10">
              {testimonials.map((t) => (
                <li key={t.name} className="flex min-h-0">
                  <div className="nyra-landing-glass-content nyra-landing-reveal-card flex h-full min-h-0 w-full flex-col rounded-xl p-7">
                    <div className="flex min-h-0 flex-1 flex-col">
                      <p className="text-[15px] leading-relaxed text-chat-text-secondary">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                    </div>
                    <div className="mt-auto shrink-0 pt-6">
                      <p className="text-sm font-semibold tracking-[-0.01em] text-chat-text-primary">
                        {t.name}
                      </p>
                      <p className="mt-1 text-[12px] text-chat-text-muted">{t.detail}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </LandingRevealOnView>
        </section>

        {/* Final CTA */}
        <section
          id="landing-section-trust"
          data-landing-bg="trust"
          className="border-t border-white/[0.07] bg-transparent"
        >
          <LandingRevealOnView className="mx-auto max-w-[1200px] px-2 py-20 sm:px-3 sm:py-24 lg:py-28">
            <div
              className="nyra-landing-glass-content nyra-landing-reveal-head mx-auto max-w-2xl rounded-2xl px-6 py-10 sm:px-10 sm:py-11"
              role="region"
              aria-label="Get early access"
            >
              <div className="text-center">
                <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-chat-text-primary">
                  Get early access
                </h2>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-chat-text-secondary">
                  Tell us what you’re planning — we’ll follow up as Nyra becomes available
                </p>
                <LandingWaitlistDirectCta />
              </div>
            </div>
          </LandingRevealOnView>
        </section>
      </main>

      <footer
        id="landing-section-footer"
        data-landing-bg="footer"
        className="relative z-[1] min-h-[min(36vh,22rem)] border-t border-white/[0.08] bg-transparent"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mt-12 pb-10 px-6">
            <nav aria-label="Footer">
              <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-white/60">
                <a href="/privacy" className="hover:text-white transition">
                  Privacy
                </a>
                <a href="/terms" className="hover:text-white transition">
                  Terms
                </a>
              </div>
            </nav>
            <p className="text-xs text-white/40 mt-4 text-center">© 2026 Nyra</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
