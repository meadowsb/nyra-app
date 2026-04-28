"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { LandingExampleChatPreview } from "@/components/LandingExampleChatPreview";

/** Scroll-scrubbing + sticky pin only at `lg` and up; mobile uses normal flow (no overlap with the next section). */
const LANDING_EXAMPLE_SCRUB_MIN_WIDTH = "(min-width: 1024px)";

/**
 * Sticky scroll track (lg+): progress 0→1 is tied to how far the user has scrolled
 * through this block (not time). Inner panel stays pinned while the outer
 * height (200vh) is consumed, then normal scrolling resumes.
 *
 * Below lg: no sticky track — full preview progress, document flow only.
 */
export function LandingScrollScrubbedExampleChat() {
  const trackRef = useRef<HTMLDivElement>(null);
  /** Highest raw scroll progress seen; upward scroll never lowers this. */
  const maxProgressReachedRef = useRef(0);
  const smoothedRef = useRef(0);
  const rafRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useLayoutEffect(() => {
    const wideMq = window.matchMedia(LANDING_EXAMPLE_SCRUB_MIN_WIDTH);
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!wideMq.matches || reducedMq.matches) {
      maxProgressReachedRef.current = 1;
      smoothedRef.current = 1;
      setScrollProgress(1);
    }
  }, []);

  useEffect(() => {
    const wideMq = window.matchMedia(LANDING_EXAMPLE_SCRUB_MIN_WIDTH);
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const computeRaw = () => {
      const el = trackRef.current;
      if (!el) {
        return 0;
      }
      const vh = window.innerHeight;
      const range = Math.max(1, el.offsetHeight - vh);
      const top = el.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, -top / range));
    };

    const tick = () => {
      if (reducedMq.matches || !wideMq.matches) {
        maxProgressReachedRef.current = 1;
        smoothedRef.current = 1;
        setScrollProgress(1);
        return;
      }

      const raw = computeRaw();
      const clampedRaw = Math.min(1, Math.max(0, raw));
      const capped = Math.max(maxProgressReachedRef.current, clampedRaw);
      maxProgressReachedRef.current = capped;

      const prev = smoothedRef.current;
      const alpha = 0.22;
      let next = prev + (capped - prev) * alpha;
      // Never unwind: display progress only increases until completion.
      next = Math.max(prev, next);
      if (Math.abs(capped - next) < 0.0015) {
        next = capped;
      }
      smoothedRef.current = next;
      setScrollProgress(next);

      if (Math.abs(next - capped) > 0.002) {
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };

    const kick = () => {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const onBreakpointOrMotion = () => {
      if (!wideMq.matches || reducedMq.matches) {
        maxProgressReachedRef.current = 1;
        smoothedRef.current = 1;
        setScrollProgress(1);
        window.cancelAnimationFrame(rafRef.current);
        return;
      }
      maxProgressReachedRef.current = 0;
      smoothedRef.current = 0;
      kick();
    };

    if (!wideMq.matches || reducedMq.matches) {
      maxProgressReachedRef.current = 1;
      smoothedRef.current = 1;
      setScrollProgress(1);
    } else {
      kick();
    }

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    wideMq.addEventListener("change", onBreakpointOrMotion);
    reducedMq.addEventListener("change", onBreakpointOrMotion);

    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      wideMq.removeEventListener("change", onBreakpointOrMotion);
      reducedMq.removeEventListener("change", onBreakpointOrMotion);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={trackRef} className="relative min-h-0 w-full lg:min-h-[200vh]">
      <div className="relative flex w-full items-center justify-center lg:sticky lg:top-0 lg:h-[100vh] lg:min-h-[100vh]">
        <div className="w-full min-w-0 sm:-translate-y-[3%]">
          <div className="nyra-landing-glass-content nyra-landing-reveal-card nyra-landing-reveal-sequence-tail min-h-0 w-full min-w-0 overflow-hidden rounded-2xl">
            <LandingExampleChatPreview scrollProgress={scrollProgress} />
          </div>
        </div>
      </div>
    </div>
  );
}
