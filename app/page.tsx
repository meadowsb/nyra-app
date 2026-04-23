import type { ReactNode } from "react";

import { LandingVenueExample } from "@/components/LandingVenueExample";

const steps = [
  {
    kind: "details" as const,
    title: "Tell us your event details",
    body: "Guest count, location, style, and budget—in everyday language. No forms that feel like homework.",
  },
  {
    kind: "match" as const,
    title: "We find venues that actually fit",
    body: 'A tight shortlist with clear "why this works" context—not a noisy list of every venue nearby.',
  },
  {
    kind: "outreach" as const,
    title: "We contact them and send you real pricing",
    body: "We reach out on your behalf, then deliver availability and numbers in one easy-to-scan summary.",
  },
] as const;

const trustStatements = [
  "Designed for couples planning real events",
  "Skip hours of venue outreach",
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

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="nyra-eyebrow">{children}</p>;
}

function HowItWorksIcon({ kind }: { kind: (typeof steps)[number]["kind"] }) {
  const cls = "h-6 w-6 text-neutral-500";
  if (kind === "details") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 4.75h12a1.25 1.25 0 011.25 1.25v12.5A1.25 1.25 0 0120 19.75H4a1.25 1.25 0 01-1.25-1.25V9.25L8 4.75z"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
        <path
          d="M8 4.75v4.5H3.5M8 11.25h8M8 14.75h5.5"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === "match") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="5.25" stroke="currentColor" strokeWidth="1.35" />
        <path
          d="M15.25 15.25 19 19"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <path
          d="M8.75 11.25 10.5 13l3-3.5"
          stroke="currentColor"
          strokeWidth="1.35"
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
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M4.75 8.75 12 13.25l7.25-4.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 16.25h6"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-100 font-sans text-neutral-900 antialiased">
      <main>
        {/* Hero */}
        <section className="border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-[1200px] px-2 pb-24 pt-20 sm:px-3 sm:pb-28 sm:pt-24 lg:pb-32 lg:pt-28">
            <SectionLabel>Nyra</SectionLabel>
            <h1 className="mt-5 max-w-3xl text-[clamp(1.875rem,4.2vw,2.875rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-neutral-950">
              Find your wedding venue without the back-and-forth
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-neutral-500">
              Nyra finds, shortlists, and contacts venues for pricing and availability—so you can
              decide with clarity, not chaos.
            </p>

            <form action="/chat" method="get" className="mt-10 w-full max-w-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <label htmlFor="landing-query" className="sr-only">
                  Describe your venue search
                </label>
                <input
                  id="landing-query"
                  name="query"
                  placeholder="e.g. 80 guests, Miami, modern, under $25k"
                  className="nyra-surface-soft min-h-[48px] flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none ring-1 ring-black/[0.03] transition-[box-shadow,border-color] placeholder:text-neutral-400 focus:border-neutral-300 focus:ring-4 focus:ring-nyra-accent/10"
                />
                <button type="submit" className="nyra-btn-primary w-full shrink-0 sm:w-auto sm:min-w-[132px]">
                  Start
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1200px] px-2 py-20 sm:px-3 sm:py-24 lg:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="mt-4 text-xl font-semibold leading-snug tracking-[-0.02em] text-neutral-950 sm:text-[1.375rem] sm:leading-tight lg:text-2xl">
                Real matches, real numbers—without the runaround
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
                A simple flow designed to save hours of research and inbox chaos.
              </p>
            </div>
            <ol className="mx-auto mt-12 grid max-w-5xl gap-12 sm:mt-14 sm:grid-cols-3 sm:gap-10 lg:gap-12">
              {steps.map((step, index) => (
                <li key={step.title} className="flex flex-col items-center text-center">
                  <div className="relative flex flex-col items-center">
                    <span
                      aria-hidden
                      className="absolute -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-nyra-accent text-[10px] font-semibold leading-none text-nyra-accent-fg shadow-sm shadow-nyra-accent/25 ring-2 ring-white"
                    >
                      {index + 1}
                    </span>
                    <span
                      aria-hidden
                      className="nyra-surface-soft flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white ring-1 ring-black/[0.03]"
                    >
                      <HowItWorksIcon kind={step.kind} />
                    </span>
                  </div>
                  <h3 className="mt-5 max-w-[16rem] text-base font-semibold leading-snug tracking-[-0.015em] text-neutral-950 sm:max-w-none">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-neutral-500 sm:max-w-[17rem]">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Example output */}
        <section className="border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-[1200px] px-2 py-20 sm:px-3 sm:py-24 lg:py-28">
            <SectionLabel>Example</SectionLabel>
            <h2 className="mt-4 max-w-xl text-xl font-semibold leading-snug tracking-[-0.02em] text-neutral-950 sm:text-[1.375rem] lg:text-2xl">
              What a first pass can look like
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-500">
              Illustrative preview—your results are tailored to what you share.
            </p>

            <div className="nyra-surface-elevated mt-10 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-7 ring-1 ring-black/[0.03] sm:p-9">
              <div className="flex flex-col gap-12">
                <div className="flex flex-col items-end gap-2 text-right">
                  <p className="nyra-eyebrow">You</p>
                  <div className="nyra-user-bubble max-w-[min(100%,28rem)] rounded-2xl px-5 py-3.5 text-left text-[15px] leading-relaxed">
                    Looking for a modern venue for 80 guests in Miami.
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="nyra-eyebrow">Nyra</p>
                  <div className="nyra-surface-soft max-w-[min(100%,42rem)] rounded-2xl border border-neutral-200/90 bg-white px-5 py-3.5 text-[15px] leading-relaxed text-neutral-700 ring-1 ring-black/[0.03]">
                    <p>
                      For your wedding in Miami with a guest count of 80 and a modern style, I
                      pulled venues that match the feel without forcing a one-size-fits-all pick.
                    </p>
                  </div>
                  <p className="mt-6 max-w-[min(100%,42rem)] text-sm font-medium leading-snug tracking-[-0.01em] text-neutral-900">
                    These are the strongest matches based on your criteria:
                  </p>
                  <LandingVenueExample />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1200px] px-2 py-20 sm:px-3 sm:py-24 lg:py-28">
            <SectionLabel>Testimonials</SectionLabel>
            <h2 className="mt-4 max-w-lg text-xl font-semibold leading-snug tracking-[-0.02em] text-neutral-950 sm:text-[1.375rem] lg:text-2xl">
              Couples who wanted clarity, not noise
            </h2>
            <ul className="mt-10 grid gap-8 sm:mt-12 sm:grid-cols-3 sm:gap-8 lg:gap-10">
              {testimonials.map((t) => (
                <li
                  key={t.name}
                  className="nyra-surface-soft rounded-2xl border border-neutral-200 bg-white p-7 ring-1 ring-black/[0.03]"
                >
                  <p className="text-[15px] leading-relaxed text-neutral-600">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-6 text-sm font-semibold tracking-[-0.01em] text-neutral-950">{t.name}</p>
                  <p className="mt-1 text-[12px] text-neutral-400">{t.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Trust — quiet reassurance above the footer */}
        <section className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-[1200px] px-2 py-20 sm:px-3 sm:py-24 lg:py-28">
            <div
              className="mx-auto max-w-2xl"
              role="region"
              aria-label="How Nyra approaches planning"
            >
              <ul className="flex flex-col gap-5 text-center sm:gap-6">
                {trustStatements.map((line, index) => (
                  <li key={line}>
                    {index > 0 ? (
                      <div
                        aria-hidden
                        className="mx-auto mb-5 h-px max-w-[12rem] bg-gradient-to-r from-transparent via-neutral-200 to-transparent sm:mb-6"
                      />
                    ) : null}
                    <p className="text-[15px] leading-relaxed tracking-[-0.01em] text-neutral-500">
                      {line}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-2 py-16 sm:px-3 lg:flex-row lg:items-center lg:justify-between lg:py-20">
          <div>
            <p className="text-sm font-semibold tracking-[-0.01em] text-neutral-950">Nyra</p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-neutral-500">
              Venue discovery and outreach, without the runaround.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-normal text-neutral-500">
              <li>
                <a
                  href="mailto:support@nyra.com"
                  className="transition-colors hover:text-neutral-950"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@nyra.com"
                  className="transition-colors hover:text-neutral-950"
                >
                  Contact
                </a>
              </li>
              <li>
                <a href="/terms" className="transition-colors hover:text-neutral-950">
                  Terms
                </a>
              </li>
              <li>
                <a href="/privacy" className="transition-colors hover:text-neutral-950">
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
