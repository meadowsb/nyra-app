"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type LandingRevealOnViewProps = {
  className?: string;
  children: ReactNode;
};

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
 * Hydration-safe: content stays visible until layout has measured visibility,
 * then optional entrance motion runs when the block scrolls into view.
 */
export function LandingRevealOnView({ className = "", children }: LandingRevealOnViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [active, setActive] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotionSnapshot,
    getPrefersReducedMotionServerSnapshot,
  );

  /* Layout-time visibility read must run before paint so below-the-fold sections are not stuck visible until IO. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      setActive(true);
      setHydrated(true);
      return;
    }
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const inView = rect.top < vh * 0.88 && rect.bottom > vh * 0.1;
      if (inView) {
        setActive(true);
      }
    }
    setHydrated(true);
  }, [prefersReducedMotion]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated || prefersReducedMotion || active) {
      return undefined;
    }
    const el = ref.current;
    if (!el) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hydrated, prefersReducedMotion, active]);

  const stateClass = [hydrated ? "nyra-landing-reveal--hydrated" : "", active ? "nyra-landing-reveal--active" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={`nyra-landing-reveal ${stateClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
