"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { usePrefersReducedMotion } from "@/components/AssistantStreamedText";
import { LandingHeroQueryInput } from "@/components/LandingHeroQueryInput";

const THINKING_LINES = [
  "Finding venues that match your vision…",
  "Checking availability and pricing…",
  "Matching vendors to your style…",
] as const;

/** Total time before the waitlist modal opens (ms). */
const THINKING_DURATION_MIN_MS = 1500;
const THINKING_DURATION_MAX_MS = 2500;
const THINKING_LINE_ROTATE_MS = 700;
const THINKING_DURATION_REDUCED_MS = 450;

export function LandingHeroWaitlistGate() {
  const titleId = useId();
  const descriptionId = useId();
  const emailFieldId = useId();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [thinkingActive, setThinkingActive] = useState(false);
  const [thinkingLineIndex, setThinkingLineIndex] = useState(0);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  /** Prompt from the hero form, stored when opening the waitlist modal (no navigation). */
  const [storedPrompt, setStoredPrompt] = useState("");
  const [email, setEmail] = useState("");
  const [waitlistPhase, setWaitlistPhase] = useState<"form" | "success">(
    "form"
  );
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  const closeWaitlistModal = useCallback(() => {
    setWaitlistOpen(false);
    setEmail("");
    setWaitlistPhase("form");
    setWaitlistSubmitting(false);
    setWaitlistError(null);
  }, []);

  const dismissThinking = useCallback(() => {
    setThinkingActive(false);
    setThinkingLineIndex(0);
  }, []);

  const handleHeroSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = fd.get("query");
    const query = typeof raw === "string" ? raw : "";
    const trimmed = query.trim();

    setStoredPrompt(trimmed);
    setWaitlistPhase("form");
    setThinkingLineIndex(0);
    setThinkingActive(true);
  };

  const handleJoinWaitlist = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
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
  }, [email, storedPrompt]);

  useEffect(() => {
    if (thinkingActive) {
      const totalMs = prefersReducedMotion
        ? THINKING_DURATION_REDUCED_MS
        : THINKING_DURATION_MIN_MS +
          Math.random() * (THINKING_DURATION_MAX_MS - THINKING_DURATION_MIN_MS);
      const id = window.setTimeout(() => {
        setThinkingActive(false);
        setThinkingLineIndex(0);
        setWaitlistOpen(true);
      }, totalMs);
      return () => window.clearTimeout(id);
    }
  }, [thinkingActive, prefersReducedMotion]);

  useEffect(() => {
    if (!thinkingActive || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setThinkingLineIndex((i) => (i + 1) % THINKING_LINES.length);
    }, THINKING_LINE_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [thinkingActive, prefersReducedMotion]);

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
      emailInputRef.current?.focus();
    });
  }, [waitlistOpen, waitlistPhase]);

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
          className="fixed inset-0 z-[79] flex items-end justify-center py-5 sm:items-center sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Cancel"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={dismissThinking}
          />
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="relative z-[1] mx-auto w-full max-w-[min(420px,100%)] rounded-t-2xl border border-white/[0.09] bg-[rgba(20,20,25,0.78)] px-6 pb-6 pt-5 shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[10px] sm:max-w-lg sm:rounded-2xl sm:px-7 sm:pb-7 sm:pt-6"
          >
            <p className="text-center text-[15px] leading-snug tracking-[-0.01em] text-chat-text-primary">
              {THINKING_LINES[thinkingLineIndex]}
            </p>
          </div>
        </div>
      ) : null}

      {waitlistOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center py-5 sm:items-center sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Close waitlist dialog"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={closeWaitlistModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative z-[1] mx-auto w-full max-w-[min(420px,100%)] rounded-t-2xl border border-white/[0.09] bg-[rgba(20,20,25,0.78)] px-6 pb-6 pt-5 shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[10px] sm:max-w-lg sm:rounded-2xl sm:px-7 sm:pb-7 sm:pt-6"
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
                  You&apos;re on the list 💌
                </h2>
                <p
                  id={descriptionId}
                  className="mt-2 text-[15px] leading-snug text-chat-text-secondary"
                >
                  We&apos;ll send your matches as soon as Nyra opens access.
                </p>
              </>
            ) : (
              <>
                <h2
                  id={titleId}
                  className="pr-10 text-lg font-semibold leading-[1.2] tracking-[-0.03em] text-chat-text-primary"
                >
                  Your matches are ready
                </h2>
                <p
                  id={descriptionId}
                  className="mt-2 text-[15px] leading-snug text-chat-text-secondary"
                >
                  Enter your email to unlock your results and see venues and
                  vendors that fit your vision.
                </p>

                <div className="mt-4">
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
                    {waitlistSubmitting ? "Unlocking…" : "Unlock my results"}
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
