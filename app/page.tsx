import type { ReactNode } from "react";

import { LandingHowItWorksSection } from "@/components/LandingHowItWorksSection";
import { LandingScrollScrubbedExampleChat } from "@/components/LandingScrollScrubbedExampleChat";
import { LandingHeroBackgroundMedia } from "@/components/LandingHeroBackgroundMedia";
import { LandingHeroWaitlistGate } from "@/components/LandingHeroWaitlistGate";
import { LandingRevealOnView } from "@/components/LandingRevealOnView";
import { LandingScrollVenueBackdrop } from "@/components/LandingScrollVenueBackdrop";

const trustStatements = [
  "Designed for couples planning real events",
  "Skip hours of back-and-forth",
  "Short write-ups you can skim between everything else",
] as const;

const testimonials = [
  {
    quote:
      "We stopped living in our inboxes. Nyra’s shortlist felt intentional, not like a generic list from Google.",
    name: "Jordan & Sam",
    detail: "Miami, FL",
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
              <SectionLabel>Your results</SectionLabel>
              <h2 className="nyra-landing-section-headline">Your wedding, organized in one place</h2>
              <p className="nyra-landing-section-sub mx-auto max-w-md">
                All your options, pricing, and next steps — without the chaos of managing it yourself
              </p>
            </header>

            <div className="nyra-landing-section-head-to-content">
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

        {/* Trust — quiet reassurance above the footer */}
        <section
          id="landing-section-trust"
          data-landing-bg="trust"
          className="border-t border-white/[0.07] bg-transparent"
        >
          <LandingRevealOnView className="mx-auto max-w-[1200px] px-2 py-20 sm:px-3 sm:py-24 lg:py-28">
            <div
              className="nyra-landing-glass-content nyra-landing-reveal-head mx-auto max-w-2xl rounded-2xl px-6 py-10 sm:px-10 sm:py-11"
              role="region"
              aria-label="How Nyra approaches planning"
            >
              <ul className="flex flex-col gap-5 text-center sm:gap-6">
                {trustStatements.map((line, index) => (
                  <li key={line}>
                    {index > 0 ? (
                      <div
                        aria-hidden
                        className="mx-auto mb-5 h-px max-w-[12rem] bg-gradient-to-r from-transparent via-white/10 to-transparent sm:mb-6"
                      />
                    ) : null}
                    <p className="text-[15px] leading-relaxed tracking-[-0.01em] text-chat-text-secondary">
                      {line}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </LandingRevealOnView>
        </section>
      </main>

      <footer
        id="landing-section-footer"
        data-landing-bg="footer"
        className="relative z-[1] min-h-[min(36vh,22rem)] border-t border-white/[0.08] bg-transparent"
      >
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-10 px-2 py-16 text-center sm:px-3 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:py-20 lg:text-left">
          <div className="flex max-w-xs flex-col items-center lg:max-w-none lg:items-start">
            <p className="nyra-eyebrow nyra-landing-footer-wordmark">NYRA</p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-chat-text-secondary">
              Your AI wedding planner — from first idea to final decisions
            </p>
          </div>
          <nav aria-label="Footer" className="w-full lg:w-auto">
            <ul className="flex flex-col items-center gap-4 text-sm font-normal text-chat-text-muted lg:flex-row lg:flex-wrap lg:justify-end lg:gap-x-8 lg:gap-y-3">
              <li>
                <a
                  href="mailto:support@nyra.com"
                  className="transition-colors hover:text-chat-text-primary"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@nyra.com"
                  className="transition-colors hover:text-chat-text-primary"
                >
                  Contact
                </a>
              </li>
              <li>
                <a href="/terms" className="transition-colors hover:text-chat-text-primary">
                  Terms
                </a>
              </li>
              <li>
                <a href="/privacy" className="transition-colors hover:text-chat-text-primary">
                  Privacy
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
