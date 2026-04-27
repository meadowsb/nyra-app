"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const PLACEHOLDER_EXAMPLES = [
  "Plan a 3-day wedding in Miami for 80 guests",
  "I want something modern, outdoors, under $40k",
  "Help me plan a Hindu + Western wedding weekend",
] as const;

function randomInRange(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

const TYPE_MS_MIN = 35;
const TYPE_MS_MAX = 55;
const DELETE_MS_MIN = 18;
const DELETE_MS_MAX = 28;
const PAUSE_TYPED_MS_MIN = 1200;
const PAUSE_TYPED_MS_MAX = 1600;
const PAUSE_BEFORE_NEXT_MS_MIN = 250;
const PAUSE_BEFORE_NEXT_MS_MAX = 400;

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

export function LandingHeroQueryInput({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [displayedPlaceholderText, setDisplayedPlaceholderText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const textRef = useRef("");
  const deletingRef = useRef(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    clearTimer();

    if (value.length > 0 || reduceMotion) {
      return;
    }

    let cancelled = false;

    const schedule = (fn: () => void, ms: number) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (!cancelled) fn();
      }, ms);
    };

    const step = () => {
      if (cancelled) return;
      const target = PLACEHOLDER_EXAMPLES[indexRef.current];

      if (!deletingRef.current) {
        if (textRef.current.length < target.length) {
          textRef.current = target.slice(0, textRef.current.length + 1);
          setDisplayedPlaceholderText(textRef.current);
          setIsDeleting(false);
          setCurrentExampleIndex(indexRef.current);
          schedule(step, randomInRange(TYPE_MS_MIN, TYPE_MS_MAX));
        } else {
          schedule(() => {
            if (cancelled) return;
            deletingRef.current = true;
            setIsDeleting(true);
            step();
          }, randomInRange(PAUSE_TYPED_MS_MIN, PAUSE_TYPED_MS_MAX));
        }
      } else if (textRef.current.length > 0) {
        textRef.current = textRef.current.slice(0, -1);
        setDisplayedPlaceholderText(textRef.current);
        schedule(step, randomInRange(DELETE_MS_MIN, DELETE_MS_MAX));
      } else {
        deletingRef.current = false;
        setIsDeleting(false);
        indexRef.current =
          (indexRef.current + 1) % PLACEHOLDER_EXAMPLES.length;
        setCurrentExampleIndex(indexRef.current);
        schedule(step, randomInRange(PAUSE_BEFORE_NEXT_MS_MIN, PAUSE_BEFORE_NEXT_MS_MAX));
      }
    };

    queueMicrotask(() => {
      if (cancelled) return;
      indexRef.current = 0;
      textRef.current = "";
      deletingRef.current = false;
      setCurrentExampleIndex(0);
      setDisplayedPlaceholderText("");
      setIsDeleting(false);
      step();
    });

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [value, reduceMotion]);

  const showFake = value.length === 0;

  const placeholderOverlayText = reduceMotion
    ? PLACEHOLDER_EXAMPLES[0]
    : displayedPlaceholderText;

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
                  data-example-index={reduceMotion ? 0 : currentExampleIndex}
                  data-deleting={
                    reduceMotion ? "false" : isDeleting ? "true" : "false"
                  }
                >
                  {placeholderOverlayText}
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
}
