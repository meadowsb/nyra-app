"use client";

import type { Venue } from "@/components/VenueCard";
import { VenueCard } from "@/components/VenueCard";

const previewVenues: Venue[] = [
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
    heroPreset: "modern-city",
  },
  {
    id: "preview-2",
    name: "Oceanview Terrace",
    location: "Miami Beach",
    price: "$18k–$28k",
    tag: "Waterfront",
    highlights: ["Outdoor-friendly", "Sunset light"] as const,
    vibe: "Open terrace, salt air, and golden-hour light",
    capacity: "Best for 45–95 guests",
    whyFit:
      "Perfect for sunset ceremonies with an easy indoor-outdoor flow and ocean breeze.",
    heroPreset: "waterfront",
  },
];

/** Marketing preview: must be a client island because `VenueCard` is interactive. */
export function LandingVenueExample() {
  return (
    <div className="nyra-chat-shell mt-4 rounded-2xl border border-chat-border bg-chat-canvas p-4 sm:p-5">
      <div className="grid items-start gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3 lg:gap-2">
      {previewVenues.map((venue) => (
        <VenueCard
          key={venue.id}
          venue={venue}
          selected={false}
          pulse={false}
          onToggle={() => {}}
        />
      ))}
      </div>
    </div>
  );
}
