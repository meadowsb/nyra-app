"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/components/AssistantStreamedText";

export type Vendor = {
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
  heroImage: string;
  /**
   * Optional second row labels under the highlights. Defaults to Setting / Budget / Guest count (venue).
   */
  metaRowLabels?: readonly [string, string, string];
};

/** @deprecated use `Vendor`; UI copy still says “venue”. */
export type Venue = Vendor;

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
  vendor: Vendor;
  selected: boolean;
  /** True only when this venue’s outreach row is `contacted` or `replied` (main card ignores queue). */
  inquirySent?: boolean;
  /** Shown in the read-only footer when `inquirySent` (default “Inquiry sent”). */
  inquirySentLabel?: string;
  pulse: boolean;
  onToggle: () => void;
  /** When set, shows a subtle “Remove” overlay in the footer; shortlisted button stays full-width. */
  onRemoveFromShortlist?: () => void;
};

/** Calm easing aligned with venue selection micro-motion in chat styles. */
const easePremium = "ease-[cubic-bezier(0.22,1,0.36,1)]";

export function VenueCard({
  vendor,
  selected,
  inquirySent = false,
  inquirySentLabel = "Inquiry sent",
  pulse,
  onToggle,
  onRemoveFromShortlist,
}: VenueCardProps) {
  const heroSrc = vendor.heroImage;
  const reduceMotion = usePrefersReducedMotion();
  const prevSelectedRef = useRef<boolean | null>(null);
  const [shortlistAddGlow, setShortlistAddGlow] = useState(false);
  const [checkArrival, setCheckArrival] = useState(false);

  useEffect(() => {
    if (reduceMotion || inquirySent) {
      prevSelectedRef.current = selected;
      return;
    }
    if (prevSelectedRef.current === null) {
      prevSelectedRef.current = selected;
      return;
    }
    const prev = prevSelectedRef.current;
    prevSelectedRef.current = selected;
    if (prev === false && selected === true) {
      setShortlistAddGlow(true);
      setCheckArrival(true);
      const glowClear = window.setTimeout(() => setShortlistAddGlow(false), 1080);
      const checkClear = window.setTimeout(() => setCheckArrival(false), 300);
      return () => {
        window.clearTimeout(glowClear);
        window.clearTimeout(checkClear);
      };
    }
  }, [selected, inquirySent, reduceMotion]);

  /** Main-thread cards: chrome follows shortlist or recorded inquiry only. */
  const showSelectedChrome = selected || inquirySent;
  const showSelectedCheck = selected && !inquirySent;
  const lockedFooterText = inquirySent ? inquirySentLabel : "";

  const rationaleTitle = `${vendor.vibe}\n\n${vendor.whyFit}`;
  const metaLabels = vendor.metaRowLabels ?? (["Setting", "Budget", "Guest count"] as const);

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-[border-color,background-color,box-shadow] duration-500 ${easePremium} motion-reduce:duration-200 ${
        showSelectedChrome
          ? `nyra-venue-card--selected nyra-venue-card--selected-surface nyra-surface-soft border ring-0 motion-reduce:hover:shadow-none${
              inquirySent ? " nyra-venue-card--outreach-readonly" : ""
            }`
          : `nyra-surface-soft border-chat-border bg-chat-raised ring-0 hover:border-white/12 hover:bg-[#333333] motion-reduce:hover:shadow-none`
      } ${pulse ? "nyra-venue-card--pulse ring-1 ring-white/12" : ""}`}
    >
      {shortlistAddGlow && showSelectedCheck ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] rounded-xl nyra-venue-card__shortlist-glow-layer motion-reduce:hidden"
        />
      ) : null}
      {/* Inset frame: reads as print layout, not edge-to-edge product photography */}
      <div
        className={`relative shrink-0 px-1.5 pt-1.5 sm:px-2 sm:pt-2 ${
          showSelectedChrome ? "bg-black/20" : "bg-black/25"
        }`}
      >
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-md bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] ring-1 ring-white/[0.06] sm:rounded-md">
          <Image
            src={heroSrc}
            alt={vendor.name}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, min(420px, 34vw)"
            quality={90}
            className={`object-cover transition-transform duration-[720ms] ${easePremium} motion-reduce:duration-0 group-hover:scale-[1.004] motion-reduce:group-hover:scale-100`}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/35 transition-opacity duration-[720ms] ${easePremium} motion-reduce:duration-0 group-hover:opacity-95`}
          />
          {showSelectedCheck ? (
            <div className="absolute left-1.5 top-1.5 z-[1] sm:left-2 sm:top-2">
              <VenueSelectedMark
                className={checkArrival ? "nyra-venue-selected-check--arrive" : undefined}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col px-3 pb-2 pt-2 sm:px-3.5 sm:pb-2.5 sm:pt-2">
        <header className="min-w-0 text-left">
          <p className="nyra-eyebrow mb-0.5 text-[8px] tracking-[0.16em]">{vendor.tag}</p>
          <h3
            className="line-clamp-2 text-[0.9375rem] font-medium leading-[1.14] tracking-[-0.028em] text-chat-text-primary sm:text-[1rem] sm:leading-[1.12]"
            title={vendor.name}
          >
            {vendor.name}
          </h3>
        </header>

        <EditorialHighlights highlights={vendor.highlights} selected={showSelectedChrome} />

        <div
          className={`mt-2 grid grid-cols-1 gap-1.5 border-t border-chat-border pt-2 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-chat-border`}
        >
          <MetaCell label={metaLabels[0]} value={vendor.location} />
          <MetaCell label={metaLabels[1]} value={vendor.price} />
          <MetaCell label={metaLabels[2]} value={vendor.capacity} />
        </div>

        <p
          className="mt-1.5 line-clamp-2 text-[10px] font-normal leading-snug tracking-[-0.01em] text-chat-text-secondary"
          title={rationaleTitle}
        >
          {vendor.vibe} <span className="text-chat-text-muted">·</span> {vendor.whyFit}
        </p>

        {inquirySent ? (
          <button
            type="button"
            disabled
            aria-label={lockedFooterText}
            className="mt-2 flex w-full cursor-default items-center justify-center rounded-md border border-white/[0.08] bg-black/25 px-2.5 py-1 text-center text-[11px] leading-snug text-chat-text-muted disabled:cursor-default disabled:opacity-100"
          >
            {lockedFooterText}
          </button>
        ) : (
          <div className="relative mt-2">
            <button
              type="button"
              onClick={() => onToggle()}
              aria-pressed={selected}
              className={`flex w-full items-center justify-center gap-1 rounded-md px-2.5 py-1 text-[11px] leading-snug motion-safe:transition-[background-color,color,border-color,box-shadow] motion-safe:duration-[300ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] transition-[background-color,color,border-color] duration-200 ease-out active:scale-[0.995] motion-reduce:active:scale-100 ${
                selected
                  ? "nyra-shortlist-toggle nyra-shortlist-toggle--selected shadow-none"
                  : "nyra-shortlist-toggle shadow-none"
              } ${
                shortlistAddGlow
                  ? "motion-safe:shadow-[0_0_0_1px_color-mix(in_srgb,var(--nyra-accent)_16%,transparent),0_0_28px_-10px_color-mix(in_srgb,var(--nyra-accent)_12%,transparent)] motion-safe:transition-[background-color,color,border-color,box-shadow] motion-safe:duration-[1000ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
                  : ""
              }`}
            >
              <span className="relative grid min-h-[1.25rem] w-full place-items-center">
                <span
                  aria-hidden={selected}
                  className={`col-start-1 row-start-1 transition-opacity duration-280 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0 ${
                    selected ? "pointer-events-none opacity-0" : "opacity-100"
                  }`}
                >
                  Add to shortlist
                </span>
                <span
                  aria-hidden={!selected}
                  className={`col-start-1 row-start-1 transition-opacity duration-280 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0 ${
                    selected ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  ✓ Shortlisted
                </span>
              </span>
            </button>
            {selected && onRemoveFromShortlist ? (
              <button
                type="button"
                aria-label={`Remove ${vendor.name} from shortlist`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveFromShortlist();
                }}
                className="absolute right-1.5 top-1/2 z-[1] -translate-y-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium leading-snug text-chat-text-muted transition-[background-color,color] duration-200 ease-out hover:bg-white/[0.06] hover:text-chat-text-secondary active:scale-[0.995] motion-reduce:active:scale-100"
              >
                Remove
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
