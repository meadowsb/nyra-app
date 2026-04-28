"use client";

import { forwardRef, useEffect, useLayoutEffect, useMemo, useState } from "react";

const EXAMPLE_PROMPTS = [
  "Looking for a modern venue for 80 guests in Miami...",
  "Outdoor wedding in California, ~120 people, relaxed vibe...",
  "Small wedding in Toronto, 40 guests, elegant but simple...",
  "Looking for a chic rooftop option with great food and easy parking...",
] as const;

type TypingPhase = "typing" | "pause_after_typed" | "clearing" | "pause_after_cleared";

function SendArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 5.25v12.5M12 5.25 17.25 10.5M12 5.25 6.75 10.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const LandingHeroQueryInput = forwardRef<
  HTMLInputElement,
  { id: string; name: string; className?: string }
>(function LandingHeroQueryInput({ id, name, className }, ref) {
  const [value, setValue] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [phase, setPhase] = useState<TypingPhase>("typing");
  const [typed, setTyped] = useState("");

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const showFake = value.length === 0;

  const prompts = useMemo(() => [...EXAMPLE_PROMPTS], []);

  useEffect(() => {
    if (!showFake) return;
    if (reduceMotion) {
      setExampleIndex(0);
      setPhase("typing");
      setTyped(prompts[0] ?? "");
      return;
    }

    setExampleIndex(0);
    setPhase("typing");
    setTyped("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, showFake]);

  useEffect(() => {
    if (!showFake) return;
    if (reduceMotion) return;

    const current = prompts[exampleIndex % prompts.length] ?? "";

    const typeDelayMs = 52;
    const typeJitterMs = 58;
    const pauseAfterTypedMs = 1100;
    const clearDelayMs = 22;
    const clearJitterMs = 26;
    const pauseAfterClearedMs = 320;

    const schedule = (ms: number, fn: () => void) => window.setTimeout(fn, ms);

    let timeoutId: number | null = null;

    if (phase === "typing") {
      if (typed.length >= current.length) {
        timeoutId = schedule(pauseAfterTypedMs, () => setPhase("pause_after_typed"));
      } else {
        const nextChar = current.slice(0, typed.length + 1);
        const jitter = Math.round(Math.random() * typeJitterMs);
        timeoutId = schedule(typeDelayMs + jitter, () => setTyped(nextChar));
      }
    }

    if (phase === "pause_after_typed") {
      timeoutId = schedule(80, () => setPhase("clearing"));
    }

    if (phase === "clearing") {
      if (typed.length === 0) {
        timeoutId = schedule(pauseAfterClearedMs, () => setPhase("pause_after_cleared"));
      } else {
        const next = typed.slice(0, -1);
        const jitter = Math.round(Math.random() * clearJitterMs);
        timeoutId = schedule(clearDelayMs + jitter, () => setTyped(next));
      }
    }

    if (phase === "pause_after_cleared") {
      timeoutId = schedule(0, () => {
        setExampleIndex((i) => (i + 1) % prompts.length);
        setPhase("typing");
      });
    }

    return () => {
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [exampleIndex, phase, prompts, reduceMotion, showFake, typed]);

  return (
    <div
      className={`nyra-landing-composer-host mx-auto w-full max-w-[min(900px,92vw)] [@media(min-width:800px)]:min-w-[720px] ${className ?? ""}`}
    >
      <div className="nyra-landing-composer-ring">
        <div
          className="nyra-landing-glass-header nyra-landing-composer flex min-h-[72px] items-center gap-2 rounded-[1.6875rem] py-2 pl-4 pr-2.5 sm:min-h-[80px] sm:py-2.5 sm:pl-5 sm:pr-3"
        >
          <div className="relative min-h-[52px] min-w-0 flex-1 sm:min-h-[56px]">
            <label htmlFor={id} className="sr-only">
              Message Nyra with what you want to plan
            </label>
            <input
              ref={ref}
              id={id}
              name={name}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder=""
              autoComplete="off"
              className="relative z-10 min-h-[52px] w-full min-w-0 bg-transparent py-3.5 pe-1 ps-0 text-[16px] leading-[1.35] tracking-[-0.01em] text-chat-text-primary outline-none sm:min-h-[56px] sm:py-4"
            />
            {showFake ? (
              <div
                className="pointer-events-none absolute inset-y-0 left-0 right-1 z-[5] flex items-center sm:right-2"
                aria-hidden
              >
                <div
                  className="min-h-[1.25rem] min-w-0 flex-1 text-left text-[16px] leading-[1.35] tracking-[-0.01em] text-chat-text-secondary whitespace-normal break-words"
                  data-example-index={exampleIndex}
                  data-deleting={phase === "clearing" ? "true" : "false"}
                >
                  {typed}
                  {!reduceMotion ? <span className="nyra-hero-query-caret" /> : null}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            aria-label="Start"
            className="nyra-landing-hero-send flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12"
          >
            <SendArrowIcon className="h-5 w-5 -translate-y-px sm:h-[1.35rem] sm:w-[1.35rem]" />
          </button>
        </div>
      </div>
    </div>
  );
});
