"use client";

import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { usePrefersReducedMotion } from "@/components/AssistantStreamedText";
import { LandingHeroQueryInput } from "@/components/LandingHeroQueryInput";
import { NYRA_OPEN_WAITLIST_DIRECT } from "@/components/LandingWaitlistDirectCta";

/** Hard cap: waitlist modal opens after this (ms). */
const THINKING_TOTAL_MS = 2000;

/** Opacity crossfade between lines — mid-range of 1.2–1.8s brief, compressed to stay under 2s total. */
const THINKING_CROSSFADE_MS = 520;

const THINKING_DURATION_REDUCED_MS = 450;

const STYLE_KEYWORDS = [
  "modern",
  "minimal",
  "minimalist",
  "waterfront",
  "beach",
  "garden",
  "industrial",
  "classic",
  "romantic",
  "rustic",
  "luxe",
  "luxury",
  "editorial",
  "boho",
  "vintage",
  "intimate",
] as const;

function titleCase(phrase: string) {
  return phrase
    .trim()
    .split(/\s+/g)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

function normalizeStyle(style: string) {
  const t = style.trim().toLowerCase();
  if (t === "minimalist") return "minimal";
  if (t === "luxury") return "luxe";
  return t;
}

type LandingSignals = {
  guestCount?: number;
  location?: string;
  style?: string;
  outdoorPreference?: boolean;
  budgetLabel?: string;
};

function parseLandingSignals(query: string): LandingSignals {
  const lower = query.toLowerCase();

  const guestMatch =
    lower.match(/(\d{1,4})\s*(?:guests|people|ppl|attendees)\b/i) ||
    lower.match(/\bfor\s+(\d{1,4})\s+guests?\b/i);
  const guestCount = guestMatch ? Number(guestMatch[1]) : undefined;

  const styleHit = STYLE_KEYWORDS.find((kw) => lower.includes(kw));
  const style = styleHit ? normalizeStyle(styleHit) : undefined;

  let location: string | undefined;
  const inMatch = query.match(/\bin\s+([^.,;\n]+)/i);
  if (inMatch?.[1]) {
    let rest = inMatch[1].trim();
    const underSplit = /\s+under\b/i.exec(rest);
    if (underSplit && underSplit.index != null && underSplit.index > 0) {
      rest = rest.slice(0, underSplit.index).trim();
    }
    const forSplit = /\s+for\s+/i.exec(rest);
    if (forSplit && forSplit.index != null && forSplit.index > 0) {
      rest = rest.slice(0, forSplit.index).trim();
    }
    location = rest ? titleCase(rest) : undefined;
  }

  let outdoorPreference: boolean | undefined;
  if (/\boutdoor\b|\bgarden\b|\bbeach\b|\balfresco\b/i.test(lower)) outdoorPreference = true;
  else if (/\bindoor\b/i.test(lower)) outdoorPreference = false;

  let budgetLabel: string | undefined;
  const underMoney = lower.match(
    /\bunder\s+\$?\s*([\d]{1,3}(?:,\d{3})*|\d+)\s*(k|m|thousand|million)?\b/
  );
  if (underMoney) {
    const raw = underMoney[1].replace(/,/g, "");
    const n = Number(raw);
    const suffix = underMoney[2];
    if (Number.isFinite(n)) {
      if (suffix === "k" || suffix === "thousand") budgetLabel = `$${n}k`;
      else if (suffix === "m" || suffix === "million") budgetLabel = `$${n}M`;
      else if (n >= 1000 && n % 1000 === 0) budgetLabel = `$${n / 1000}k`;
      else if (n < 500) budgetLabel = `$${n}k`;
      else budgetLabel = `$${n.toLocaleString()}`;
    }
  }
  if (!budgetLabel) {
    const underShortK = lower.match(/\bunder\s+\$?\s*(\d{1,3})\s*k\b/);
    if (underShortK) budgetLabel = `$${underShortK[1]}k`;
    else {
      const kOnly = lower.match(/\$\s*(\d{1,3})\s*k\b/);
      if (kOnly) budgetLabel = `$${kOnly[1]}k`;
    }
  }

  return {
    guestCount: Number.isFinite(guestCount) ? guestCount : undefined,
    location,
    style,
    outdoorPreference,
    budgetLabel,
  };
}

function buildThinkingSequence(query: string): readonly string[] {
  void query;
  return ["Understanding what you're planning…", "Reviewing your details…", "Almost ready…"];
}

function isValidEmail(email: string): boolean {
  if (!email || email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type WaitlistEntrySource = "prompt" | "cta";

export function LandingHeroWaitlistGate() {
  const titleId = useId();
  const descriptionId = useId();
  const firstNameFieldId = useId();
  const emailFieldId = useId();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [thinkingActive, setThinkingActive] = useState(false);
  const [thinkingSequence, setThinkingSequence] = useState<readonly string[]>([]);
  const [thinkingPhaseIndex, setThinkingPhaseIndex] = useState(0);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  /** How the waitlist modal was opened — drives modal headline copy. */
  const [waitlistEntrySource, setWaitlistEntrySource] =
    useState<WaitlistEntrySource>("cta");
  /** Prompt from the hero form, stored when opening the waitlist modal (no navigation). */
  const [storedPrompt, setStoredPrompt] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [waitlistPhase, setWaitlistPhase] = useState<"form" | "success">(
    "form"
  );
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const closeWaitlistModal = useCallback(() => {
    setWaitlistOpen(false);
    setWaitlistEntrySource("cta");
    setFirstName("");
    setEmail("");
    setWaitlistPhase("form");
    setWaitlistSubmitting(false);
    setWaitlistError(null);
  }, []);

  const dismissThinking = useCallback(() => {
    setThinkingActive(false);
    setThinkingPhaseIndex(0);
    setThinkingSequence([]);
  }, []);

  const openWaitlistDirect = useCallback(() => {
    dismissThinking();
    setStoredPrompt("");
    setFirstName("");
    setEmail("");
    setWaitlistPhase("form");
    setWaitlistSubmitting(false);
    setWaitlistError(null);
    setWaitlistEntrySource("cta");
    setWaitlistOpen(true);
  }, [dismissThinking]);

  const handleHeroSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = fd.get("query");
    const query = typeof raw === "string" ? raw : "";
    const trimmed = query.trim();

    setStoredPrompt(trimmed);
    setWaitlistPhase("form");
    const seq = buildThinkingSequence(trimmed);
    setThinkingSequence(seq.length > 0 ? seq : buildThinkingSequence(""));
    setThinkingPhaseIndex(0);
    setThinkingActive(true);
  };

  const handleJoinWaitlist = useCallback(async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName) {
      setWaitlistError("First name is required");
      firstNameInputRef.current?.focus();
      return;
    }
    if (!trimmedEmail) {
      setWaitlistError("Email is required");
      emailInputRef.current?.focus();
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setWaitlistError("Invalid email address");
      emailInputRef.current?.focus();
      return;
    }

    setWaitlistError(null);
    setWaitlistSubmitting(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: trimmedFirstName,
          email: trimmedEmail,
          prompt: storedPrompt,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!res.ok) {
        setWaitlistError(
          typeof data.error === "string"
            ? data.error
            : "Something went wrong. Please try again."
        );
        return;
      }

      setWaitlistPhase("success");
    } catch {
      setWaitlistError("Something went wrong. Please try again.");
    } finally {
      setWaitlistSubmitting(false);
    }
  }, [email, firstName, storedPrompt]);

  const sequenceForTiming = useMemo(
    () => (thinkingSequence.length > 0 ? thinkingSequence : buildThinkingSequence("")),
    [thinkingSequence]
  );

  useEffect(() => {
    if (!thinkingActive) return;

    if (prefersReducedMotion) {
      const id = window.setTimeout(() => {
        setThinkingActive(false);
        setThinkingPhaseIndex(0);
        setThinkingSequence([]);
        setWaitlistEntrySource("prompt");
        setWaitlistOpen(true);
      }, THINKING_DURATION_REDUCED_MS);
      return () => window.clearTimeout(id);
    }

    const n = Math.max(1, sequenceForTiming.length);
    const stepMs = THINKING_TOTAL_MS / n;
    const timeouts: number[] = [];

    for (let i = 1; i < n; i++) {
      timeouts.push(
        window.setTimeout(() => {
          setThinkingPhaseIndex(i);
        }, Math.round(stepMs * i))
      );
    }

    timeouts.push(
      window.setTimeout(() => {
        setThinkingActive(false);
        setThinkingPhaseIndex(0);
        setThinkingSequence([]);
        setWaitlistEntrySource("prompt");
        setWaitlistOpen(true);
      }, THINKING_TOTAL_MS)
    );

    return () => {
      for (const t of timeouts) window.clearTimeout(t);
    };
  }, [thinkingActive, prefersReducedMotion, sequenceForTiming]);

  useEffect(() => {
    if (!waitlistOpen && !thinkingActive) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [waitlistOpen, thinkingActive]);

  useEffect(() => {
    if (!waitlistOpen || waitlistPhase !== "form") return;

    queueMicrotask(() => {
      firstNameInputRef.current?.focus();
    });
  }, [waitlistOpen, waitlistPhase]);

  useEffect(() => {
    const onOpenDirect = () => openWaitlistDirect();
    window.addEventListener(NYRA_OPEN_WAITLIST_DIRECT, onOpenDirect);
    return () => window.removeEventListener(NYRA_OPEN_WAITLIST_DIRECT, onOpenDirect);
  }, [openWaitlistDirect]);

  useEffect(() => {
    if (!waitlistOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeWaitlistModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [waitlistOpen, closeWaitlistModal]);

  useEffect(() => {
    if (!thinkingActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismissThinking();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [thinkingActive, dismissThinking]);

  const crossfadeSec = prefersReducedMotion ? 0 : THINKING_CROSSFADE_MS / 1000;
  const progressDurationSec = prefersReducedMotion
    ? 0.2
    : THINKING_TOTAL_MS / 1000;

  return (
    <>
      <form
        onSubmit={handleHeroSubmit}
        className="nyra-landing-hero-fade-up nyra-landing-hero-fade-up--delay-4 mt-8 flex w-full flex-col items-center justify-center gap-3 px-1 sm:px-0"
      >
        <LandingHeroQueryInput id="landing-query" name="query" />
      </form>

      {thinkingActive ? (
        <div
          className="fixed inset-0 z-[79] flex h-[100dvh] min-h-[100dvh] w-full items-center justify-center px-4 py-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Cancel"
            className="absolute inset-0 z-0 bg-black/55 backdrop-blur-[2px]"
            onClick={dismissThinking}
          />
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="relative z-[81] mx-auto w-full max-w-md max-h-[calc(100dvh-48px)] overflow-y-auto rounded-2xl border border-white/[0.09] bg-[rgba(20,20,25,0.78)] px-6 pb-6 pt-5 shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[10px] sm:max-w-[420px] sm:px-7 sm:pb-7 sm:pt-6"
          >
            <p className="sr-only">
              {sequenceForTiming[thinkingPhaseIndex] ?? sequenceForTiming[0]}
            </p>
            <div className="relative mx-auto min-h-[3.75rem] w-full max-w-[36ch]">
              {sequenceForTiming.map((line, i) => (
                <motion.p
                  key={i}
                  aria-hidden
                  className="absolute inset-x-0 top-0 text-center text-[15px] leading-snug tracking-[-0.01em] text-chat-text-primary"
                  animate={{
                    opacity:
                      prefersReducedMotion && i === 0
                        ? 1
                        : prefersReducedMotion
                          ? 0
                          : thinkingPhaseIndex === i
                            ? 1
                            : 0,
                  }}
                  transition={{
                    duration: crossfadeSec,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {line}
                </motion.p>
              ))}
            </div>

            <div
              className="mt-5 flex justify-center gap-1.5"
              aria-hidden
            >
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="size-1.5 rounded-full bg-white/[0.42]"
                  animate={
                    prefersReducedMotion
                      ? { opacity: 0.45 }
                      : {
                          opacity: [0.28, 1, 0.28],
                          scale: [1, 1.18, 1],
                        }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          duration: 1.18,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: d * 0.15,
                        }
                  }
                />
              ))}
            </div>

            <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                className="h-full origin-left rounded-full bg-[color-mix(in_srgb,var(--nyra-accent)_78%,white)] shadow-[0_0_12px_color-mix(in_srgb,var(--nyra-accent)_35%,transparent)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: progressDurationSec,
                  ease: prefersReducedMotion ? "easeOut" : "linear",
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {waitlistOpen ? (
        <div
          className="fixed inset-0 z-[80] flex h-[100dvh] min-h-[100dvh] w-full items-center justify-center px-4 py-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Close waitlist dialog"
            className="absolute inset-0 z-0 bg-black/55 backdrop-blur-[2px]"
            onClick={closeWaitlistModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={
              descriptionId
            }
            className="relative z-[81] mx-auto w-full max-w-md max-h-[calc(100dvh-48px)] overflow-y-auto rounded-2xl border border-white/[0.09] bg-[rgba(20,20,25,0.78)] px-6 pb-6 pt-5 shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[10px] sm:max-w-[420px] sm:px-7 sm:pb-7 sm:pt-6"
          >
            <button
              type="button"
              aria-label="Close waitlist dialog"
              onClick={closeWaitlistModal}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-chat-text-muted opacity-55 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(20,20,25,0.96)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
                className="size-5"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {waitlistPhase === "success" ? (
              <>
                <h2
                  id={titleId}
                  className="pr-10 text-lg font-semibold leading-[1.2] tracking-[-0.03em] text-chat-text-primary"
                >
                  You&apos;re on the list ❤️
                </h2>
                <p
                  id={descriptionId}
                  className="mt-2 text-[15px] leading-snug text-chat-text-secondary"
                >
                  We&apos;ll let you know as soon as Nyra is ready.
                </p>
              </>
            ) : (
              <>
                <h2
                  id={titleId}
                  className="pr-10 text-lg font-semibold leading-[1.2] tracking-[-0.03em] text-chat-text-primary"
                >
                  {waitlistEntrySource === "prompt"
                    ? "We\u2019ve got your request"
                    : "Join the waitlist"}
                </h2>
                <p
                  id={descriptionId}
                  className="mt-2 text-[15px] leading-snug text-chat-text-secondary"
                >
                  {waitlistEntrySource === "prompt"
                    ? "Enter your first name and email, and we\u2019ll follow up as Nyra becomes available."
                    : "Be among the first to try Nyra when it launches."}
                </p>

                <div className="mt-4">
                  <label
                    htmlFor={firstNameFieldId}
                    className="sr-only"
                  >
                    First name
                  </label>
                  <input
                    ref={firstNameInputRef}
                    id={firstNameFieldId}
                    type="text"
                    name="waitlist-first-name"
                    autoComplete="given-name"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (waitlistError) setWaitlistError(null);
                    }}
                    disabled={waitlistSubmitting}
                    className="w-full rounded-xl border border-white/[0.12] bg-black/20 px-4 py-3 text-[15px] leading-snug tracking-[-0.01em] text-chat-text-primary outline-none placeholder:text-chat-text-muted/80 focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(20,20,25,0.96)]"
                  />
                </div>

                <div className="mt-3">
                  <label
                    htmlFor={emailFieldId}
                    className="sr-only"
                  >
                    Email address
                  </label>
                  <input
                    ref={emailInputRef}
                    id={emailFieldId}
                    type="email"
                    name="waitlist-email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (waitlistError) setWaitlistError(null);
                    }}
                    disabled={waitlistSubmitting}
                    className="w-full rounded-xl border border-white/[0.12] bg-black/20 px-4 py-3 text-[15px] leading-snug tracking-[-0.01em] text-chat-text-primary outline-none placeholder:text-chat-text-muted/80 focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(20,20,25,0.96)]"
                  />
                </div>

                {waitlistError ? (
                  <p className="mt-3 text-[14px] leading-snug text-[#f87171]">
                    {waitlistError}
                  </p>
                ) : null}

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleJoinWaitlist}
                    disabled={waitlistSubmitting}
                    className="nyra-btn-primary w-full"
                  >
                    {waitlistSubmitting ? "Sending…" : "Get early access"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
