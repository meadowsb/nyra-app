"use client";

import type { CSSProperties } from "react";

import type { Vendor } from "@/components/VenueCard";
import { VenueCard } from "@/components/VenueCard";

const previewVendors: Vendor[] = [
  {
    id: "preview-1",
    name: "The Glasshouse Miami",
    location: "Downtown Miami",
    price: "$20k–$30k",
    tag: "Modern",
    highlights: ["City views", "Blank-canvas space"] as const,
    vibe: "Light-filled modern space with skyline glass",
    capacity: "Best for 70–130 guests",
    whyFit:
      "Ideal for sleek mid-size weddings that want a blank-canvas space with city energy.",
    heroImage:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=2400&q=90&auto=format&fit=crop",
  },
  {
    id: "preview-2",
    name: "Oceanview Terrace",
    location: "Miami Beach",
    price: "$18k–$28k",
    tag: "Waterfront",
    highlights: ["Oceanfront", "Sunset light"] as const,
    vibe: "Open terrace, salt air, and golden-hour light",
    capacity: "Best for 45–95 guests",
    whyFit:
      "Perfect for sunset ceremonies with an easy indoor-outdoor flow.",
    heroImage:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=2400&q=90&auto=format&fit=crop",
  },
  {
    id: "preview-3",
    name: "Palm Garden House",
    location: "Coconut Grove",
    price: "$15k–$28k",
    tag: "Garden",
    highlights: ["Lush courtyard", "Private estate feel"] as const,
    vibe:
      "A tropical garden setting with greenery, palms, and an intimate outdoor feel",
    capacity: "Best for 60–120 guests",
    whyFit: "For couples who want something warm and atmospheric.",
    heroImage:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=2400&q=90&auto=format&fit=crop",
  },
];

const CARD_MOTION_MS = 560;
const CARD_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export type LandingVenueExampleProps = {
  /** When set, cards animate in order (landing preview). When unset, all cards show immediately. */
  revealedCardCount?: number;
  /** Per-card 0–1 opacity for scroll-scrubbed preview; no time-based CSS transition. */
  cardRevealAlpha?: [number, number, number];
};

/** Marketing preview: must be a client island because `VenueCard` is interactive. */
export function LandingVenueExample({
  revealedCardCount,
  cardRevealAlpha,
}: LandingVenueExampleProps = {}) {
  const scrub = cardRevealAlpha !== undefined;
  const animated = scrub || revealedCardCount !== undefined;

  return (
    <div className="rounded-2xl border border-chat-border bg-chat-canvas p-4 sm:p-5">
      <div className="grid items-start gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3 lg:gap-2">
        {previewVendors.map((v, index) => {
          const alpha = scrub
            ? Math.min(1, Math.max(0, cardRevealAlpha![index] ?? 0))
            : undefined;
          const discreteVisible = !animated || index < (revealedCardCount ?? 0);
          const wrapStyle: CSSProperties | undefined = scrub
            ? {
                opacity: alpha,
                transform: (alpha ?? 0) > 0.02 ? "translateY(0)" : "translateY(0.5rem)",
                transition: "none",
              }
            : animated
              ? {
                  opacity: discreteVisible ? 1 : 0,
                  transform: discreteVisible ? "translateY(0)" : "translateY(0.5rem)",
                  transition: `opacity ${CARD_MOTION_MS}ms ${CARD_EASE}, transform ${CARD_MOTION_MS}ms ${CARD_EASE}`,
                }
              : undefined;

          return (
            <div key={v.id} className="min-w-0" style={wrapStyle}>
              <VenueCard vendor={v} selected={false} pulse={false} onToggle={() => {}} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
