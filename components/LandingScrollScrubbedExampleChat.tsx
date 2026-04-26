"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { LandingExampleChatPreview } from "@/components/LandingExampleChatPreview";

function subscribePrefersReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getPrefersReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getPrefersReducedMotionServerSnapshot() {
  return false;
}

/**
 * Sticky scroll track: progress 0→1 is tied to how far the user has scrolled
 * through this block (not time). Inner panel stays pinned while the outer
 * height (200vh) is consumed, then normal scrolling resumes.
 */
export function LandingScrollScrubbedExampleChat() {
  const trackRef = useRef<HTMLDivElement>(null);
  /** Highest raw scroll progress seen; upward scroll never lowers this. */
  const maxProgressReachedRef = useRef(0);
  const smoothedRef = useRef(0);
  const rafRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const prefersReducedMotion = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotionSnapshot,
    getPrefersReducedMotionServerSnapshot,
  );

  useEffect(() => {
    const reduced = prefersReducedMotion;

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
      if (reduced) {
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

    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion]);

  return (
    <div ref={trackRef} className="relative min-h-[200vh] w-full">
      <div className="sticky top-0 flex h-[100vh] min-h-[100vh] w-full items-center justify-center">
        <div className="w-full min-w-0 -translate-y-[3%]">
          <div className="nyra-landing-glass-content nyra-landing-reveal-card nyra-landing-reveal-sequence-tail min-h-0 w-full min-w-0 overflow-hidden rounded-2xl">
            <LandingExampleChatPreview scrollProgress={scrollProgress} />
          </div>
        </div>
      </div>
    </div>
  );
}
