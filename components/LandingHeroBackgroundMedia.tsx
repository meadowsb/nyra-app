"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const POSTER_SRC = "/images/landing/hero-poster.jpg";

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Full-bleed hero media: looping video for motion-safe users, static poster when reduced motion is preferred.
 */
export function LandingHeroBackgroundMedia() {
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !mounted || prefersReducedMotion) return;
    const run = () => {
      const p = el.play();
      if (p !== undefined) void p.catch(() => {});
    };
    run();
    el.addEventListener("loadeddata", run);
    return () => el.removeEventListener("loadeddata", run);
  }, [mounted, prefersReducedMotion]);

  const showPosterOnly = !mounted || prefersReducedMotion;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 min-h-full min-w-full overflow-hidden">
      <div className="nyra-landing-hero-media-shell absolute inset-0">
        {showPosterOnly ? (
          <Image
            src={POSTER_SRC}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={POSTER_SRC}
            src="/videos/hero.mp4"
          />
        )}
      </div>
      <div className="nyra-landing-hero-overlay" aria-hidden />
    </div>
  );
}
