"use client";

/** Placeholder hero art lane — maps to distinct abstract visuals in `/public/venues/`. */
export type VenueHeroPreset = "modern-city" | "waterfront" | "loft-industrial";

export type Venue = {
  id: string;
  name: string;
  location: string;
  price: string;
  tag: string;
  /** One or two short, sentence-case highlight labels for the card. */
  highlights: readonly [string] | readonly [string, string];
  vibe: string;
  capacity: string;
  whyFit: string;
  /** When set, selects hero placeholder; otherwise inferred from tag/vibe/name/location. */
  heroPreset?: VenueHeroPreset;
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function resolveVenueHeroPreset(venue: Venue): VenueHeroPreset {
  if (venue.heroPreset) return venue.heroPreset;
  const text = `${venue.tag} ${venue.vibe} ${venue.name} ${venue.location}`.toLowerCase();
  if (
    /waterfront|ocean|beach|bay|harbor|harbour|shore|coastal|terrace|salt air|marine|riverside|lakefront/.test(
      text,
    )
  ) {
    return "waterfront";
  }
  if (
    /loft|industrial|warehouse|exposed brick|\bconcrete|beams?\b|factory|raw space|distillery/.test(text)
  ) {
    return "loft-industrial";
  }
  if (/modern|glass|skyline|tower|city views|urban|penthouse|high-?rise|downtown/.test(text)) {
    return "modern-city";
  }
  const order: VenueHeroPreset[] = ["modern-city", "waterfront", "loft-industrial"];
  return order[hashId(venue.id) % 3]!;
}

function venueHeroSrc(venue: Venue): string {
  const paths: Record<VenueHeroPreset, string> = {
    "modern-city": "/venues/hero-modern-city.svg",
    waterfront: "/venues/hero-waterfront.svg",
    "loft-industrial": "/venues/hero-loft-industrial.svg",
  };
  return paths[resolveVenueHeroPreset(venue)];
}

function CheckStrokeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M4.5 10.2 8.4 14l7.1-7.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VenueSelectedMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-chat-raised text-nyra-accent shadow-none ring-1 ring-[var(--nyra-accent-ring)] ${className ?? ""}`}
    >
      <CheckStrokeIcon className="h-2 w-2" />
    </span>
  );
}

function EditorialHighlights({
  highlights,
  selected,
}: {
  highlights: readonly [string] | readonly [string, string];
  selected: boolean;
}) {
  const line = highlights.join(" · ");
  return (
    <p
      className={`mt-1 line-clamp-1 text-[10px] font-medium leading-tight tracking-[-0.01em] ${
        selected ? "text-chat-text-secondary" : "text-chat-text-muted"
      }`}
      aria-label="Highlights"
    >
      {line}
    </p>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1 px-0 py-0 first:pl-0 last:pr-0 sm:px-1.5 sm:first:pl-0 sm:last:pr-0">
      <p className="nyra-eyebrow mb-px text-[7.5px] tracking-[0.12em]">{label}</p>
      <p className="line-clamp-1 break-words text-[10px] font-medium leading-tight tracking-[-0.01em] text-chat-text-primary">
        {value}
      </p>
    </div>
  );
}

type VenueCardProps = {
  venue: Venue;
  selected: boolean;
  pulse: boolean;
  onToggle: () => void;
};

/** Calm easing aligned with venue selection micro-motion in chat styles. */
const easePremium = "ease-[cubic-bezier(0.22,1,0.36,1)]";

export function VenueCard({ venue, selected, pulse, onToggle }: VenueCardProps) {
  const heroSrc = venueHeroSrc(venue);

  const rationaleTitle = `${venue.vibe}\n\n${venue.whyFit}`;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-[border-color,background-color,box-shadow] duration-500 ${easePremium} motion-reduce:duration-200 ${
        selected
          ? "nyra-venue-card--selected nyra-venue-card--selected-surface nyra-surface-soft border ring-0 motion-reduce:hover:shadow-none"
          : `nyra-surface-soft border-chat-border bg-chat-raised ring-0 hover:border-white/12 hover:bg-[#333333] motion-reduce:hover:shadow-none`
      } ${pulse ? "nyra-venue-card--pulse ring-1 ring-white/12" : ""}`}
    >
      {/* Inset frame: reads as print layout, not edge-to-edge product photography */}
      <div
        className={`relative shrink-0 px-1.5 pt-1.5 sm:px-2 sm:pt-2 ${
          selected ? "bg-black/20" : "bg-black/25"
        }`}
      >
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-md bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] ring-1 ring-white/[0.06] sm:rounded-md">
          {/* eslint-disable-next-line @next/next/no-img-element -- local SVG heroes */}
          <img
            src={heroSrc}
            alt=""
            width={960}
            height={480}
            className={`absolute inset-0 h-full w-full origin-center object-cover transition-transform duration-[720ms] ${easePremium} motion-reduce:duration-0 group-hover:scale-[1.006] motion-reduce:group-hover:scale-100`}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/35 transition-opacity duration-[720ms] ${easePremium} motion-reduce:duration-0 group-hover:opacity-95`}
          />
          {selected ? (
            <div className="absolute left-1.5 top-1.5 z-[1] sm:left-2 sm:top-2">
              <VenueSelectedMark className="nyra-venue-selected-check" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col px-3 pb-2 pt-2 sm:px-3.5 sm:pb-2.5 sm:pt-2">
        <header className="min-w-0 text-left">
          <p className="nyra-eyebrow mb-0.5 text-[8px] tracking-[0.16em]">{venue.tag}</p>
          <h3
            className="line-clamp-2 text-[0.9375rem] font-medium leading-[1.14] tracking-[-0.028em] text-chat-text-primary sm:text-[1rem] sm:leading-[1.12]"
            title={venue.name}
          >
            {venue.name}
          </h3>
        </header>

        <EditorialHighlights highlights={venue.highlights} selected={selected} />

        <div
          className={`mt-2 grid grid-cols-1 gap-1.5 border-t border-chat-border pt-2 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-chat-border`}
        >
          <MetaCell label="Setting" value={venue.location} />
          <MetaCell label="Budget" value={venue.price} />
          <MetaCell label="Guest count" value={venue.capacity} />
        </div>

        <p
          className="mt-1.5 line-clamp-2 text-[10px] font-normal leading-snug tracking-[-0.01em] text-chat-text-secondary"
          title={rationaleTitle}
        >
          {venue.vibe} <span className="text-chat-text-muted">·</span> {venue.whyFit}
        </p>

        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          className={`mt-2 flex w-full items-center justify-center gap-1 rounded-md px-2.5 py-1 text-[11px] leading-snug transition-[background-color,color,transform,border-color] duration-200 ease-out active:scale-[0.995] motion-reduce:active:scale-100 ${
            selected
              ? "nyra-shortlist-toggle nyra-shortlist-toggle--selected shadow-none"
              : "nyra-shortlist-toggle shadow-none"
          }`}
        >
          {selected ? (
            <>
              <CheckStrokeIcon className="h-2.5 w-2.5 shrink-0 opacity-90" />
              <span>Shortlisted</span>
            </>
          ) : (
            "Add to shortlist"
          )}
        </button>
      </div>
    </div>
  );
}
