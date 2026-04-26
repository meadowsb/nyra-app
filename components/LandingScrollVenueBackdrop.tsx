"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SECTION_ORDER = ["how", "example", "testimonials", "trust", "footer"] as const;

export type LandingScrollBgSection = (typeof SECTION_ORDER)[number];

/**
 * Curated Unsplash stills (stable `images.unsplash.com` IDs — not search/query URLs).
 * Request 2880px wide + q=90 so full-viewport backgrounds stay sharp (no CSS blur / minimal scale).
 * how: garden gazebo / greenery
 * example: modern concrete / minimalist hall
 * testimonials: chandelier dining / warm reception
 * trust: long-table banquet / refined hall
 */
const IMAGE_BY_SECTION: Record<Exclude<LandingScrollBgSection, "footer">, string> = {
  how: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=2880&q=90&auto=format&fit=crop",
  example:
    "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=2880&q=90&auto=format&fit=crop",
  testimonials:
    "https://images.unsplash.com/photo-1675247488725-22d1b78e75db?w=2880&q=90&auto=format&fit=crop",
  trust: "https://images.unsplash.com/photo-1762765684673-d22ece602b10?w=2880&q=90&auto=format&fit=crop",
};

const FADE_MS_DEFAULT = 2200;
const FADE_MS_REDUCED = 420;
/** Photo sections: lighter base overlay so photography stays crisp; glass cards carry readability. */
const OVERLAY = "rgba(0,0,0,0.58)";
const VIGNETTE =
  "radial-gradient(ellipse 82% 72% at 50% 44%, transparent 0%, transparent 34%, rgba(0,0,0,0.28) 72%, rgba(0,0,0,0.55) 100%), radial-gradient(ellipse 125% 95% at 50% 100%, rgba(0,0,0,0.38) 0%, transparent 52%), radial-gradient(ellipse 100% 55% at 50% 0%, rgba(0,0,0,0.2) 0%, transparent 45%)";

const FOOTER_GRADIENT =
  "linear-gradient(165deg, #050508 0%, #0a0810 38%, #0e0c14 72%, #121016 100%)";

const IO_THRESHOLDS = [0, 0.04, 0.08, 0.12, 0.18, 0.25, 0.35, 0.5, 0.65, 0.8, 1];

function pickActiveFromRatios(
  ratios: Map<LandingScrollBgSection, number>,
): LandingScrollBgSection | null {
  let best: LandingScrollBgSection = "how";
  let bestR = -1;
  for (const id of SECTION_ORDER) {
    const r = ratios.get(id) ?? 0;
    if (r > bestR) {
      bestR = r;
      best = id;
    }
  }
  return bestR > 0 ? best : null;
}

export function LandingScrollVenueBackdrop() {
  const [active, setActive] = useState<LandingScrollBgSection>("how");
  const [reduceMotion, setReduceMotion] = useState(false);
  const parallaxWrapRef = useRef<HTMLDivElement>(null);
  const ratiosRef = useRef<Map<LandingScrollBgSection, number>>(new Map());
  const scrollRafRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduceMotion(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  const applyParallax = useCallback(() => {
    const y = window.scrollY;
    const wrap = parallaxWrapRef.current;
    if (!wrap) return;
    if (reduceMotion) {
      wrap.style.transform = "translate3d(0,0,0) scale(1)";
      return;
    }
    const translate = y * 0.034;
    /** Keep parallax scale minimal so raster backgrounds are not softened by upscaling. */
    const scale = 1 + Math.min(y / 14000, 0.012);
    wrap.style.transform = `translate3d(0, ${translate}px, 0) scale(${scale})`;
  }, [reduceMotion]);

  useEffect(() => {
    const onScrollOrResize = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        applyParallax();
      });
    };
    applyParallax();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (scrollRafRef.current) window.cancelAnimationFrame(scrollRafRef.current);
    };
  }, [applyParallax]);

  useEffect(() => {
    const roots = SECTION_ORDER.map((id) => document.getElementById(`landing-section-${id}`)).filter(
      (n): n is HTMLElement => Boolean(n),
    );
    if (roots.length === 0) return;

    const flush = () => {
      const next = pickActiveFromRatios(ratiosRef.current);
      if (next !== null) setActive(next);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.landingBg as LandingScrollBgSection | undefined;
          if (!id) continue;
          ratiosRef.current.set(id, e.intersectionRatio);
        }
        flush();
      },
      {
        root: null,
        rootMargin: "-42% 0px -42% 0px",
        threshold: IO_THRESHOLDS,
      },
    );

    for (const el of roots) {
      observer.observe(el);
    }
    flush();

    return () => observer.disconnect();
  }, []);

  const isFooter = active === "footer";
  const fadeMs = reduceMotion ? FADE_MS_REDUCED : FADE_MS_DEFAULT;
  const imageKeys = Object.keys(IMAGE_BY_SECTION) as (keyof typeof IMAGE_BY_SECTION)[];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div ref={parallaxWrapRef} className="absolute inset-[-4%] will-change-transform">
        {imageKeys.map((key) => {
          const on = active === key;
          const src = IMAGE_BY_SECTION[key];
          return (
            <div key={key} className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${src})`,
                  opacity: isFooter ? 0 : on ? 1 : 0,
                  transitionProperty: "opacity",
                  transitionDuration: `${fadeMs}ms`,
                  transitionTimingFunction: "cubic-bezier(0.33, 1, 0.32, 1)",
                  transform: "scale(1)",
                  filter: "contrast(1.05) saturate(1.05) brightness(0.97)",
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className="absolute inset-0"
        style={{
          background: FOOTER_GRADIENT,
          opacity: isFooter ? 1 : 0,
          transition: `opacity ${fadeMs}ms cubic-bezier(0.33, 1, 0.32, 1)`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundColor: OVERLAY,
          opacity: isFooter ? 0.64 : 1,
          transition: `opacity ${fadeMs}ms cubic-bezier(0.33, 1, 0.32, 1)`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: VIGNETTE,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
