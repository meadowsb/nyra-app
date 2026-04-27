"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { LandingRevealOnView } from "@/components/LandingRevealOnView";

const steps = [
  {
    kind: "details" as const,
    title: "Tell Nyra what you're imagining",
    body: "Share your guest count, location, style, budget, and priorities.",
  },
  {
    kind: "match" as const,
    title: "See your plan come together",
    body: "Get curated venues, vendors, and recommendations tailored to you.",
  },
  {
    kind: "outreach" as const,
    title: "We handle the back-and-forth",
    body: "We reach out, gather pricing and availability, and bring everything back in one place.",
  },
] as const;

const HOW_CARD_DELAYS = [0, 0.14, 0.28] as const;
const HOW_CARD_EASE = [0.22, 1, 0.36, 1] as const;

function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`nyra-eyebrow${className ? ` ${className}` : ""}`}>{children}</p>;
}

function HowItWorksIcon({ kind }: { kind: (typeof steps)[number]["kind"] }) {
  const cls = "h-7 w-7 shrink-0 text-current";
  const sw = 1.5;
  if (kind === "details") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 4.75h12a1.25 1.25 0 011.25 1.25v12.5A1.25 1.25 0 0120 19.75H4a1.25 1.25 0 01-1.25-1.25V9.25L8 4.75z"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <path
          d="M8 4.75v4.5H3.5M8 11.25h8M8 14.75h5.5"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === "match") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="5.25" stroke="currentColor" strokeWidth={sw} />
        <path
          d="M15.25 15.25 19 19"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <path
          d="M8.75 11.25 10.5 13l3-3.5"
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.75 7.75h14.5a1.25 1.25 0 011.25 1.25v8.5a1.25 1.25 0 01-1.25 1.25H4.75a1.25 1.25 0 01-1.25-1.25V9a1.25 1.25 0 011.25-1.25z"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <path
        d="M4.75 8.75 12 13.25l7.25-4.5"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 16.25h6"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LandingHowItWorksSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="landing-section-how"
      data-landing-bg="how"
      className="border-b border-white/[0.07] bg-transparent"
    >
      <LandingRevealOnView className="mx-auto max-w-[1200px] px-2 py-20 sm:px-3 sm:py-24 lg:py-28">
        <div className="nyra-landing-glass-header nyra-landing-section-head-card nyra-landing-reveal-head mx-auto max-w-2xl text-center">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="nyra-landing-section-headline">Plan everything, without the chaos</h2>
          <p className="nyra-landing-section-sub mx-auto max-w-md">
            From venues to vendors to timelines — Nyra handles the back-and-forth so you don&apos;t have to.
          </p>
        </div>
        <ol className="nyra-landing-section-head-to-content nyra-landing-reveal-stagger mx-auto grid max-w-5xl gap-5 sm:grid-cols-3 sm:items-stretch sm:gap-4 lg:gap-5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex min-h-0">
              <motion.div
                data-step={String(index + 1)}
                className="nyra-landing-glass-content nyra-how-step-card flex h-full w-full flex-col justify-start rounded-xl"
                initial={
                  prefersReducedMotion
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 18, scale: 0.98 }
                }
                whileInView={
                  prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
                }
                viewport={prefersReducedMotion ? undefined : { once: true, amount: 0.35 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.5, ease: HOW_CARD_EASE, delay: HOW_CARD_DELAYS[index] }
                }
              >
                <div className="nyra-how-step-card__stack">
                  <div className="nyra-how-step-card__group">
                    <div className="nyra-how-step-card__icon-slot">
                      <div className="nyra-how-step-card__icon-shell">
                        <span className="nyra-how-step-card__badge" aria-hidden>
                          {index + 1}
                        </span>
                        <HowItWorksIcon kind={step.kind} />
                      </div>
                    </div>
                    <h3 className="nyra-how-step-card__title">
                      <span className="nyra-how-step-card__title-inner">{step.title}</span>
                    </h3>
                    <p className="nyra-how-step-card__desc">{step.body}</p>
                  </div>
                </div>
              </motion.div>
            </li>
          ))}
        </ol>
      </LandingRevealOnView>
    </section>
  );
}
