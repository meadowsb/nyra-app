"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ChatHeader } from "@/components/ChatHeader";
import { ChatInputBar } from "@/components/ChatInputBar";
import { ChatMessages, type Message } from "@/components/ChatMessages";
import {
  outreachItemsFromVendorIds,
  SelectedVendorsSidebar,
  vendorIdsPendingOutreachRow,
  type OutreachItem,
} from "@/components/SelectedVendorsSidebar";
import { usePrefersReducedMotion } from "@/components/AssistantStreamedText";
import {
  OUTREACH_DEFAULT_INQUIRY_BLURB,
  OutreachConfirmPanel,
  type OutreachConfirmPhase,
} from "@/components/OutreachConfirmPanel";
import { UpdateAllVenuesModal } from "@/components/UpdateAllVenuesModal";
import type { Vendor } from "@/components/VenueCard";
import { getVendorDetails, type VendorDetails } from "@/components/vendorPlannerState";
import type { MasterShortlistModuleInput } from "@/components/selectedVendorRailModel";
import {
  defaultModuleForType,
  detectModuleType,
  moduleEntityLabels,
  type ModuleType,
} from "@/lib/modules";

/** User-authored composer sends before the paywall. */
const FREE_USER_MESSAGE_LIMIT = 3;

/** User bubbles that do not count toward FREE_USER_MESSAGE_LIMIT (none: empty chat on load). */
const INTRO_USER_MESSAGE_COUNT = 0;

const venueVendors: Vendor[] = [
  {
    id: "1",
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
    id: "2",
    name: "The Miami Beach EDITION",
    location: "Miami Beach",
    price: "$30k–$50k+",
    tag: "Waterfront",
    highlights: ["Luxury resort", "Oceanfront setting"] as const,
    vibe: "Upscale beachfront hotel with indoor-outdoor flow",
    capacity: "Best for 80–200 guests",
    whyFit:
      "Perfect for high-end weddings with seamless ceremony-to-reception transitions.",
    heroImage:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=2400&q=90&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "The Sacred Space Miami",
    location: "Wynwood",
    price: "$15k–$25k",
    tag: "Garden",
    highlights: ["Outdoor courtyard", "Lush greenery"] as const,
    vibe: "Tropical garden oasis in the middle of the city",
    capacity: "Best for 50–150 guests",
    whyFit: "Great for couples wanting an intimate, nature-forward setting with character.",
    heroImage:
      "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=2400&q=90&auto=format&fit=crop",
  },
];

const photographyVendors: Vendor[] = [
  {
    id: "p1",
    name: "Luna & Co. Weddings",
    location: "Editorial candid",
    price: "8–10 hours; 2 shooters",
    tag: "Documentary",
    highlights: ["Sneak peek 1 week", "Online gallery + print store"] as const,
    vibe: "Natural light with a warm film-inspired grade",
    capacity: "$3.2k–$5.5k",
    whyFit: "A balanced fit for couples who want a cohesive gallery without a heavy all-day production footprint.",
    heroImage:
      "https://images.unsplash.com/photo-1511285560929-771b7e3f35ca?w=2400&q=90&auto=format&fit=crop",
    metaRowLabels: ["STYLE", "COVERAGE", "BUDGET"] as const,
  },
  {
    id: "p2",
    name: "Marlowe Photo Studio",
    location: "Fine-art + on-camera flash",
    price: "8h standard; rehearsal add-on",
    tag: "Classic",
    highlights: ["Full gallery 4 weeks", "RAW + album design"] as const,
    vibe: "Timeless color with clean reception flash when the room needs it",
    capacity: "$2.5k–$4.2k",
    whyFit: "Reliable for mixed indoor/outdoor venues where lighting can swing across the run‑of‑show.",
    heroImage:
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=2400&q=90&auto=format&fit=crop",
    metaRowLabels: ["STYLE", "COVERAGE", "BUDGET"] as const,
  },
  {
    id: "p3",
    name: "Golden Hour Collective",
    location: "Cinematic + posed portraiture",
    price: "Bespoke; film + second shooter",
    tag: "Cinematic",
    highlights: ["Feature film 6–8 min", "Heirloom lay-flat album"] as const,
    vibe: "Wide establishing shots, tight emotion in ceremony, and controlled portraiture in golden hour",
    capacity: "$4.5k+",
    whyFit: "Ideal when the brief centers on a tight portrait window and a polished long-form video memory.",
    heroImage:
      "https://images.unsplash.com/photo-1520854221050-0f4caff4492c?w=2400&q=90&auto=format&fit=crop",
    metaRowLabels: ["STYLE", "COVERAGE", "BUDGET"] as const,
  },
];

const cateringVendors: Vendor[] = [
  {
    id: "c1",
    name: "Saffron & Sage Catering",
    location: "New American + Med",
    price: "Vegan, GF, nut-aware",
    tag: "Plated or stations",
    highlights: ["Full service", "Tasting before book"] as const,
    vibe: "Seasonal menus with a structured tasting before you lock a path for service",
    capacity: "$$–$$$ (per person)",
    whyFit: "Strong for Miami heat + Saturday timelines where prep windows need to be explicit in the contract.",
    heroImage:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=2400&q=90&auto=format&fit=crop",
    metaRowLabels: ["CUISINE", "DIETARY", "BUDGET"] as const,
  },
  {
    id: "c2",
    name: "Miami Table Co.",
    location: "Family-style + late bites",
    price: "Omni, halal, kosher ask",
    tag: "Hospitality-led",
    highlights: ["Pacing for speeches", "Bar package"] as const,
    vibe: "High-touch service pacing so courses don’t collide with toasts and speeches",
    capacity: "$$+ (per person)",
    whyFit: "A fit for mixed headcounts and dietary mixes where you need one crew owning the run‑of‑show.",
    heroImage:
      "https://images.unsplash.com/photo-1556910096-6f5e944e1f56?w=2400&q=90&auto=format&fit=crop",
    metaRowLabels: ["CUISINE", "DIETARY", "BUDGET"] as const,
  },
  {
    id: "c3",
    name: "Coconut Grove Catering",
    location: "Latin + coastal",
    price: "Plant-based focus",
    tag: "Cocktail-first",
    highlights: ["Stations or passed", "High volume"] as const,
    vibe: "Bright, coastal flavors with a polished on-site team for cocktail-to-last-call flow",
    capacity: "$$$+ (per person)",
    whyFit: "Great when the party expects a long cocktail arc and a flexible floor plan to swap formats.",
    heroImage:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=2400&q=90&auto=format&fit=crop",
    metaRowLabels: ["CUISINE", "DIETARY", "BUDGET"] as const,
  },
];

type QuerySignals = {
  guestCount?: number;
  location?: string;
  style?: string;
  eventType?: string;
};

const STYLE_KEYWORDS = [
  "modern",
  "minimal",
  "minimalist",
  "waterfront",
  "beach",
  "garden",
  "industrial",
  "classic",
  "romantic",
  "rustic",
  "luxe",
  "luxury",
  "editorial",
  "boho",
  "vintage",
  "intimate",
] as const;

const EVENT_KEYWORDS = [
  "wedding",
  "rehearsal dinner",
  "engagement party",
  "birthday",
  "anniversary",
  "corporate",
  "gala",
  "retreat",
] as const;

function titleCase(phrase: string) {
  return phrase
    .trim()
    .split(/\s+/g)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function normalizeStyle(style: string) {
  const trimmed = style.trim().toLowerCase();
  if (trimmed === "minimalist") return "minimal";
  if (trimmed === "luxury") return "luxe";
  return trimmed;
}

function parseQuerySignals(query: string): QuerySignals {
  const lower = query.toLowerCase();
  const guestMatch =
    lower.match(/(\d{1,4})\s*(?:guests|people|ppl|attendees)\b/i) ||
    lower.match(/\b(\d{1,4})\b/);
  const guestCount = guestMatch ? Number(guestMatch[1]) : undefined;

  const eventType =
    EVENT_KEYWORDS.find((kw) => lower.includes(kw)) ||
    (lower.includes("wedding") ? "wedding" : undefined);

  const styleHit = STYLE_KEYWORDS.find((kw) => lower.includes(kw));
  const style = styleHit ? normalizeStyle(styleHit) : undefined;

  const inMatch = query.match(/\bin\s+([^.,;\n]+)$/i) || query.match(/\bin\s+([^.,;\n]+)/i);
  const rawLocation = inMatch?.[1]?.trim();
  const location = rawLocation ? titleCase(rawLocation) : undefined;

  return {
    guestCount: Number.isFinite(guestCount) ? guestCount : undefined,
    eventType,
    style,
    location,
  };
}

function buildConciergeIntro(query: string) {
  const { guestCount, location, style, eventType } = parseQuerySignals(query);

  const occasion = eventType ?? "event";
  const guestsLabel = guestCount != null ? `~${guestCount} guests` : "guest count (TBD)";
  const locationLabel = location ?? "location (TBD)";
  const styleLabel = style ?? "style (TBD)";

  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };

  const spine = `For your ${occasion}, I’m anchoring on ${guestsLabel}, ${locationLabel}, and ${styleLabel} as the spine—so the shortlist isn’t “on theme,” it’s internally consistent.`;

  let why: string;
  if (guestCount != null && location && style) {
    why = `I picked these because they each hold ~${guestCount} without dead corners, read ${style} from the architecture (not rented props), and sit in ${location} where Saturday-night logistics won’t quietly capsize the flow.`;
  } else if (guestCount != null && location) {
    why = `I picked these because they’re sized for ~${guestCount} and grounded in ${location}; ${
      style
        ? `with ${style} in mind, I avoided rooms that would need a heavy disguise.`
        : "once style locks, I’ll swap anything that fights that direction."
    }`;
  } else if (guestCount != null && style) {
    why = `I picked these because the capacity band matches ~${guestCount} and the room reads ${style} honestly; ${
      location
        ? `I’m treating ${location} as the geography to stress-test next.`
        : "tell me the city next so I can stress-test geography, not vibes."
    }`;
  } else if (location && style) {
    why = `I picked these because ${location} and ${style} narrow the field fast; ${
      guestCount != null
        ? `I’m also watching how ~${guestCount} guests move through ceremony, dinner, and dancing without bottlenecks.`
        : "guest count is the next lever that changes which rooms actually work."
    }`;
  } else {
    why = `I picked these because the throughline is spatial discipline—so when ${guestsLabel}, ${locationLabel}, and ${styleLabel} firm up, we’re adjusting details instead of restarting from zero.`;
  }

  const closers = [
    guestCount != null && style
      ? `If you want the night to feel sharper or softer at ~${guestCount} within that ${style} lane, say which—and I’ll re-rank.`
      : location
        ? `If ${location} can flex by one neighborhood without changing the brief, tell me which boundary is negotiable.`
        : `Reply with one hard constraint (budget band, indoor/outdoor, or ceremony time) and I’ll re-rank against it.`,
    guestCount != null
      ? `Tell me if ~${guestCount} is a hard ceiling or a planning number—capacity math changes a few quiet “great” venues.`
      : `Tell me your best estimate on headcount—even a range—because it changes which rooms stay honest.`,
    style
      ? `If ${style} for you means lighter finishes (or heavier texture), say so—I’ll bias texture instead of square footage.`
      : `If you already know the ceremony vibe (standing vs. seated, short vs. long), that one detail reshuffles this list faster than adjectives.`,
  ] as const;

  const closer = closers[hash(query) % closers.length];

  return `${spine} ${why} ${closer}`;
}

function buildCateringConciergeIntro(query: string) {
  const { guestCount, location, eventType } = parseQuerySignals(query);
  const occasion = eventType ?? "event";
  const guestsLabel = guestCount != null ? `~${guestCount} guests` : "headcount (TBD)";
  const locationLabel = location ?? "location (TBD)";

  const spine = `For your ${occasion}, I’m calibrating caterers to ${guestsLabel} in ${locationLabel}—so proposals match service style, dietary coverage, and realistic staffing.`;

  const why =
    guestCount != null && location
      ? `These teams routinely execute at that scale in ${location}; I’ve biased toward ones that keep tasting and prep windows predictable when the run‑of‑show is still moving.`
      : `These teams line up for your brief first; with ${guestsLabel} and a firmer service format, we’ll lock menu paths before anyone quotes too narrow.`;

  const closer = `If alcohol service or dietary mix is non‑negotiable, say the word and I’ll re-rank the shortlist.`;

  return `${spine} ${why} ${closer}`;
}

function buildPhotographyConciergeIntro(query: string) {
  const { guestCount, location, style, eventType } = parseQuerySignals(query);
  const occasion = eventType ?? "event";
  const guestsLabel = guestCount != null ? `~${guestCount} guests` : "headcount (TBD)";
  const locationLabel = location ?? "location (TBD)";

  const spine = `For your ${occasion}, I’m matching photographers to ${guestsLabel} in ${locationLabel}—so coverage, timing, and deliverables line up with the real run‑of‑show.`;

  const why = style
    ? `These teams are strong in a ${style} visual lane; I’ve biased toward schedules that don’t require you to miss cocktail hour for forty minutes of romantics unless you want that.`
    : `These teams fit your brief first; once the timeline and shot list firm up, we can tighten second‑shooter and hour counts before anyone quotes too narrow.`;

  const closer = `If you want mostly documentary coverage vs. a heavier portrait block, say which—I'll re-rank.`;

  return `${spine} ${why} ${closer}`;
}

const VENUE_THINKING_MESSAGES = [
  "Scanning venues...",
  "Filtering by guest count...",
  "Matching your style...",
] as const;

const CATERING_THINKING_MESSAGES = [
  "Scanning caterers...",
  "Aligning on menus and service style...",
  "Cross-checking dietary and staffing...",
] as const;

const PHOTOGRAPHY_THINKING_MESSAGES = [
  "Scanning photographers...",
  "Matching style and coverage...",
  "Cross-checking timelines and deliverables...",
] as const;

function thinkingMessagePool(m: ModuleType) {
  if (m === "catering") return CATERING_THINKING_MESSAGES;
  if (m === "photography") return PHOTOGRAPHY_THINKING_MESSAGES;
  return VENUE_THINKING_MESSAGES;
}

// Keep the "thinking" experience premium and time-boxed.
const SIMULATED_RESPONSE_DELAY_MS = 2200;
const THINKING_MESSAGE_ROTATION_MIN_MS = 800;
const THINKING_MESSAGE_ROTATION_MAX_MS = 1200;

/** Preserves existing browser storage after internal rename to vendor ids. */
const LS_CHAT_SELECTED_VENUE_IDS = "nyra:chat:selectedVenueIds";

const DEV_RESET_STORAGE_KEYS = [
  "nyra:chat:messages",
  "nyra:chat:userMessageCount",
  LS_CHAT_SELECTED_VENUE_IDS,
];

function selectionRequiredHintForModule(moduleType: ModuleType) {
  const w = moduleEntityLabels(moduleType).listNounSingular;
  return `Select at least one ${w} to include in your report`;
}

const VENUE_CARD_PULSE_MS = 1100;

/** Simulated outreach rail: one venue at a time, queued → drafting → contacted. */
const OUTREACH_QUEUED_TO_DRAFTING_MIN_MS = 520;
const OUTREACH_QUEUED_TO_DRAFTING_MAX_MS = 880;
const OUTREACH_DRAFTING_HOLD_MIN_MS = 1300;
const OUTREACH_DRAFTING_HOLD_MAX_MS = 2100;
const OUTREACH_BETWEEN_VENUES_MIN_MS = 360;
const OUTREACH_BETWEEN_VENUES_MAX_MS = 620;

/** Shortlist block fade/slide (`nyraResultsPackIn` in ThinkingStyles). */
const NYRA_RESULTS_PACK_DURATION_MS = 460;
/** Max `animation-delay` on venue card intros + their duration (ThinkingStyles). */
const NYRA_VENUE_CARD_INTRO_TAIL_MS = 210 + 500;
/** Extra time for layout after intros before scrollIntoView. */
const NYRA_VENUES_SCROLL_SETTLE_MS = 72;
/** Wait for shortlist layout/animations after text completes before scrolling to cards. */
const VENUE_SCROLL_AFTER_TEXT_COMPLETE_MS =
  NYRA_RESULTS_PACK_DURATION_MS + NYRA_VENUE_CARD_INTRO_TAIL_MS + NYRA_VENUES_SCROLL_SETTLE_MS;

function mockVendorsForModule(moduleType: ModuleType): Vendor[] {
  if (moduleType === "catering") return cateringVendors;
  if (moduleType === "photography") return photographyVendors;
  return venueVendors;
}

function buildAssistantIntroForModule(query: string, moduleType: ModuleType): string {
  if (moduleType === "catering") return buildCateringConciergeIntro(query);
  if (moduleType === "photography") return buildPhotographyConciergeIntro(query);
  return buildConciergeIntro(query);
}

const ChatPageContent = () => {
  const [currentModuleType, setCurrentModuleType] = useState<ModuleType | null>(null);
  const activeModule = useMemo(
    () =>
      currentModuleType != null ? defaultModuleForType(currentModuleType) : null,
    [currentModuleType]
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const entityLabels = useMemo(
    () => moduleEntityLabels(currentModuleType ?? "venue"),
    [currentModuleType]
  );
  const [input, setInput] = useState("");
  const [selectedVendorIdsByModuleId, setSelectedVendorIdsByModuleId] = useState<
    Record<string, string[]>
  >({});
  const selectedVendorIds =
    activeModule != null
      ? (selectedVendorIdsByModuleId[activeModule.moduleId] ?? [])
      : [];
  const [outreachInitiated, setOutreachInitiated] = useState(false);
  const [outreachItems, setOutreachItems] = useState<OutreachItem[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessageIndex, setThinkingMessageIndex] = useState(0);
  const [thinkingMessageRotationMs, setThinkingMessageRotationMs] = useState(
    THINKING_MESSAGE_ROTATION_MIN_MS
  );
  const [thinkingExitMessageId, setThinkingExitMessageId] = useState<string | null>(
    null
  );
  const [assistantRevealMessageId, setAssistantRevealMessageId] = useState<
    string | null
  >(null);
  const [venueSelectionHint, setVenueSelectionHint] = useState<string | null>(null);
  const [outreachConfirmOpen, setOutreachConfirmOpen] = useState(false);
  const [outreachConfirmPhase, setOutreachConfirmPhase] =
    useState<OutreachConfirmPhase>("review");
  const [outreachProgressVenueIds, setOutreachProgressVenueIds] = useState<
    string[] | null
  >(null);
  const outreachProgressVenueIdsRef = useRef<string[] | null>(null);
  const [outreachReviewVenueNote, setOutreachReviewVenueNote] = useState("");
  /** Snapshot / edits for the planning brief while the outreach review modal is open. */
  const [outreachReviewEventBrief, setOutreachReviewEventBrief] = useState("");
  /** Venue ids unchecked in the review modal (excluded from this send only). */
  const [outreachReviewExcludedVenueIds, setOutreachReviewExcludedVenueIds] = useState<
    readonly string[]
  >([]);
  /** When set, review/progress outreach is limited to these venue ids (single-venue flow). */
  const [outreachConfirmScopeIds, setOutreachConfirmScopeIds] = useState<
    string[] | null
  >(null);
  const [outreachWhatNyraAsked, setOutreachWhatNyraAsked] = useState("");
  const [archivedVendorIdsByModuleId, setArchivedVendorIdsByModuleId] = useState<
    Record<string, string[]>
  >({});
  const [vendorDetailsById, setVendorDetailsById] = useState<Record<string, VendorDetails>>(
    {}
  );
  const [plannerRef, setPlannerRef] = useState<{
    moduleId: string;
    vendorId: string;
  } | null>(null);
  const [railCompareOpen, setRailCompareOpen] = useState(false);
  const [updateAllVenuesModalOpen, setUpdateAllVenuesModalOpen] = useState(false);
  const [pulseVenueCards, setPulseVenueCards] = useState(false);
  const [isTextStreaming, setIsTextStreaming] = useState(false);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const venuePulseTimeoutRef = useRef<number | undefined>(undefined);
  const venueHintTimeoutRef = useRef<number | undefined>(undefined);
  const outreachSimulationTimeoutsRef = useRef<number[]>([]);
  const outreachItemsRef = useRef<OutreachItem[]>([]);
  const outreachConfirmTargetModuleIdRef = useRef<string | null>(null);
  const outreachInitiatedRef = useRef(false);
  const outreachWorkerBusyRef = useRef(false);
  const tryProcessOutreachQueueRef = useRef<() => void>(() => {});
  /** Confirmed outreach payload after the user starts outreach (for API / future UI). */
  const outreachBundleRef = useRef<{ eventSummary: string; venueNote: string } | null>(
    null
  );
  const venueTurnAssistantIdRef = useRef<string | null>(null);
  const thinkingBubbleRef = useRef<HTMLDivElement | null>(null);
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantMessageRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantResultRef = useRef<HTMLDivElement | null>(null);
  const previousIsThinkingRef = useRef(isThinking);
  const previousUserMessageCountRef = useRef(0);

  const isDev = process.env.NODE_ENV === "development";
  const prefersReducedMotion = usePrefersReducedMotion();

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  const originalSearchBrief = useMemo(() => {
    const first = messages.find((m) => m.role === "user");
    return first?.text?.trim() ?? "";
  }, [messages]);

  const getSelectedIdsForModule = useCallback(
    (m: ModuleType) => {
      const id = defaultModuleForType(m).moduleId;
      return selectedVendorIdsByModuleId[id] ?? [];
    },
    [selectedVendorIdsByModuleId]
  );

  const shortlistByModule = useMemo((): MasterShortlistModuleInput[] => {
    return (["venue", "catering", "photography"] as const).map((t) => {
      const m = defaultModuleForType(t);
      return {
        moduleId: m.moduleId,
        moduleType: t,
        activeVendorIds: selectedVendorIdsByModuleId[m.moduleId] ?? [],
        archivedVendorIds: archivedVendorIdsByModuleId[m.moduleId] ?? [],
      };
    });
  }, [selectedVendorIdsByModuleId, archivedVendorIdsByModuleId]);

  const totalShortlistedCount = useMemo(
    () => shortlistByModule.reduce((n, m) => n + m.activeVendorIds.length, 0),
    [shortlistByModule]
  );

  const visibleShortlistByModule = useMemo(
    () =>
      shortlistByModule.filter(
        (m) =>
          m.activeVendorIds.length > 0 ||
          (activeModule != null && m.moduleId === activeModule.moduleId)
      ),
    [shortlistByModule, activeModule]
  );

  const outreachItemsThisModule = useMemo(
    () =>
      activeModule == null
        ? []
        : outreachItems.filter((i) => i.moduleId === activeModule.moduleId),
    [outreachItems, activeModule]
  );

  const effectiveOutreachMode = outreachInitiated && outreachItemsThisModule.length > 0;

  const handlePlannerRefChange = useCallback(
    (next: { moduleId: string; vendorId: string } | null) => {
      setRailCompareOpen(false);
      setPlannerRef(next);
    },
    []
  );

  const handleRailCompareOpen = useCallback(() => {
    setPlannerRef(null);
    setRailCompareOpen(true);
  }, []);

  const handleRailCompareClose = useCallback(() => {
    setRailCompareOpen(false);
  }, []);

  const handleOpenUpdateAllVenues = useCallback(() => {
    setRailCompareOpen(false);
    setUpdateAllVenuesModalOpen(true);
  }, []);

  const handleBulkVenueFollowUps = useCallback((vendorIds: readonly string[], message: string) => {
    const text = message.trim();
    if (!text || vendorIds.length === 0) return;
    const at = Date.now();
    setVendorDetailsById((prev) => {
      const next = { ...prev };
      for (const vendorId of vendorIds) {
        const cur = getVendorDetails(next, vendorId);
        const entry = { id: crypto.randomUUID(), text, at };
        next[vendorId] = { ...cur, followUps: [...cur.followUps, entry] };
      }
      return next;
    });
  }, []);

  const plannerSheetOpen = plannerRef != null || railCompareOpen;

  useEffect(() => {
    if (plannerRef == null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      handlePlannerRefChange(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [plannerRef, handlePlannerRefChange]);

  const billableUserMessages = Math.max(0, userMessageCount - INTRO_USER_MESSAGE_COUNT);
  const freeMessagesRemaining = Math.max(
    0,
    FREE_USER_MESSAGE_LIMIT - billableUserMessages
  );
  const isPaywalled = billableUserMessages >= FREE_USER_MESSAGE_LIMIT;

  const handleDevReset = () => {
    if (!isDev) return;

    if (venuePulseTimeoutRef.current) window.clearTimeout(venuePulseTimeoutRef.current);
    if (venueHintTimeoutRef.current) window.clearTimeout(venueHintTimeoutRef.current);
    outreachSimulationTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    outreachSimulationTimeoutsRef.current = [];
    venuePulseTimeoutRef.current = undefined;
    venueHintTimeoutRef.current = undefined;
    venueTurnAssistantIdRef.current = null;

    try {
      DEV_RESET_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // ignore
    }

    setMessages([]);
    setInput("");
    setCurrentModuleType(null);
    setSelectedVendorIdsByModuleId({});
    setOutreachInitiated(false);
    setOutreachItems([]);
    setOutreachConfirmOpen(false);
    setOutreachConfirmPhase("review");
    setOutreachProgressVenueIds(null);
    setOutreachReviewVenueNote("");
    setOutreachReviewEventBrief("");
    setOutreachReviewExcludedVenueIds([]);
    setOutreachConfirmScopeIds(null);
    setOutreachWhatNyraAsked("");
    setArchivedVendorIdsByModuleId({});
    setVendorDetailsById({});
    setPlannerRef(null);
    setRailCompareOpen(false);
    setUpdateAllVenuesModalOpen(false);
    outreachBundleRef.current = null;
    setVenueSelectionHint(null);
    setPulseVenueCards(false);
    setIsTextStreaming(false);
    setIsTextComplete(false);
    setIsThinking(false);
    setThinkingMessageIndex(0);
    setThinkingExitMessageId(null);
    setAssistantRevealMessageId(null);
  };

  // Full reset on each browser load / dev server entry (not on every state update).
  useEffect(() => {
    if (venuePulseTimeoutRef.current) window.clearTimeout(venuePulseTimeoutRef.current);
    if (venueHintTimeoutRef.current) window.clearTimeout(venueHintTimeoutRef.current);
    outreachSimulationTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    outreachSimulationTimeoutsRef.current = [];
    venuePulseTimeoutRef.current = undefined;
    venueHintTimeoutRef.current = undefined;
    venueTurnAssistantIdRef.current = null;

    try {
      DEV_RESET_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // ignore
    }

    queueMicrotask(() => {
      setMessages([]);
      setCurrentModuleType(null);
      setSelectedVendorIdsByModuleId({});
      setOutreachInitiated(false);
      setOutreachItems([]);
      setOutreachConfirmOpen(false);
      setOutreachConfirmPhase("review");
      setOutreachProgressVenueIds(null);
      setOutreachReviewVenueNote("");
      setOutreachReviewEventBrief("");
      setOutreachReviewExcludedVenueIds([]);
      setOutreachConfirmScopeIds(null);
      setOutreachWhatNyraAsked("");
      setArchivedVendorIdsByModuleId({});
      setVendorDetailsById({});
      setPlannerRef(null);
      setRailCompareOpen(false);
      setUpdateAllVenuesModalOpen(false);
      outreachBundleRef.current = null;
      setInput("");
      setVenueSelectionHint(null);
      setPulseVenueCards(false);
      setIsTextStreaming(false);
      setIsTextComplete(false);
      setIsThinking(false);
      setThinkingMessageIndex(0);
      setThinkingExitMessageId(null);
      setAssistantRevealMessageId(null);

      previousUserMessageCountRef.current = 0;
      previousIsThinkingRef.current = false;
    });
  }, []);

  useEffect(() => {
    if (!isThinking) return;

    const nextRotationMs = () =>
      Math.floor(
        THINKING_MESSAGE_ROTATION_MIN_MS +
          Math.random() *
            (THINKING_MESSAGE_ROTATION_MAX_MS - THINKING_MESSAGE_ROTATION_MIN_MS)
      );

    let timeoutId: number | undefined;

    const pool = thinkingMessagePool(currentModuleType ?? "venue");
    const scheduleNext = () => {
      const ms = nextRotationMs();
      setThinkingMessageRotationMs(ms);
      timeoutId = window.setTimeout(() => {
        setThinkingMessageIndex((prev) => (prev + 1) % pool.length);
        scheduleNext();
      }, ms);
    };

    scheduleNext();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isThinking, currentModuleType]);

  /** After outreach starts, advance each queued venue one at a time (demo). */
  const tryProcessOutreachQueue = useCallback(() => {
    if (!outreachInitiatedRef.current) return;
    if (outreachWorkerBusyRef.current) return;

    const items = outreachItemsRef.current;
    const next = items.find((row) => row.status === "queued");
    if (!next) return;

    outreachWorkerBusyRef.current = true;
    const vendorId = next.vendorId;
    const timeouts = outreachSimulationTimeoutsRef.current;

    const jitter = (min: number, max: number) => {
      if (prefersReducedMotion) return 0;
      return min + Math.floor(Math.random() * (max - min + 1));
    };

    const after = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      timeouts.push(id);
    };

    after(jitter(OUTREACH_QUEUED_TO_DRAFTING_MIN_MS, OUTREACH_QUEUED_TO_DRAFTING_MAX_MS), () => {
      setOutreachItems((prev) => {
        const row = prev.find((r) => r.vendorId === vendorId);
        if (!row || row.status !== "queued") {
          outreachWorkerBusyRef.current = false;
          queueMicrotask(() => tryProcessOutreachQueueRef.current());
          return prev;
        }
        const draftingAt = Date.now();
        return prev.map((r) =>
          r.vendorId === vendorId
            ? { ...r, status: "drafting-outreach", statusUpdatedAt: draftingAt }
            : r
        );
      });

      after(
        prefersReducedMotion
          ? 48
          : jitter(OUTREACH_DRAFTING_HOLD_MIN_MS, OUTREACH_DRAFTING_HOLD_MAX_MS),
        () => {
          setOutreachItems((prev) => {
            const row = prev.find((r) => r.vendorId === vendorId);
            if (!row || row.status !== "drafting-outreach") {
              outreachWorkerBusyRef.current = false;
              queueMicrotask(() => tryProcessOutreachQueueRef.current());
              return prev;
            }
            const contactedAt = Date.now();
            return prev.map((r) =>
              r.vendorId === vendorId
                ? { ...r, status: "contacted", statusUpdatedAt: contactedAt }
                : r
            );
          });

          after(
            prefersReducedMotion
              ? 32
              : jitter(OUTREACH_BETWEEN_VENUES_MIN_MS, OUTREACH_BETWEEN_VENUES_MAX_MS),
            () => {
              outreachWorkerBusyRef.current = false;
              tryProcessOutreachQueueRef.current();
            }
          );
        }
      );
    });
  }, [prefersReducedMotion]);

  useLayoutEffect(() => {
    outreachItemsRef.current = outreachItems;
    outreachInitiatedRef.current = outreachInitiated;
    tryProcessOutreachQueueRef.current = tryProcessOutreachQueue;
  }, [outreachItems, outreachInitiated, tryProcessOutreachQueue]);

  useEffect(() => {
    if (!outreachInitiated) {
      outreachWorkerBusyRef.current = false;
      outreachSimulationTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      outreachSimulationTimeoutsRef.current = [];
      return;
    }
    tryProcessOutreachQueueRef.current();
  }, [outreachInitiated, outreachItems, tryProcessOutreachQueue]);

  /** New assistant turn with a shortlist: arm streaming / completion before venues mount. */
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || last.isThinking || !last.vendors?.length) return;

    queueMicrotask(() => {
      if (prefersReducedMotion) {
        venueTurnAssistantIdRef.current = last.id;
        setIsTextStreaming(false);
        setIsTextComplete(true);
        return;
      }

      if (venueTurnAssistantIdRef.current !== last.id) {
        venueTurnAssistantIdRef.current = last.id;
        setIsTextStreaming(true);
        setIsTextComplete(false);
      }
    });
  }, [messages, prefersReducedMotion]);

  useEffect(() => {
    const userJustAdded =
      userMessageCount > (previousUserMessageCountRef.current ?? 0);
    const thinkingJustStarted = !previousIsThinkingRef.current && isThinking;
    const thinkingJustEnded = previousIsThinkingRef.current && !isThinking;

    previousUserMessageCountRef.current = userMessageCount;
    previousIsThinkingRef.current = isThinking;

    if (!userJustAdded && !thinkingJustStarted && !thinkingJustEnded) return;

    const lastMessage = messages[messages.length - 1];

    const raf = window.requestAnimationFrame(() => {
      if (thinkingJustStarted) {
        thinkingBubbleRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      if (thinkingJustEnded) {
        if (lastMessage?.role === "assistant") {
          latestAssistantMessageRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
        return;
      }

      latestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [userMessageCount, isThinking, messages]);

  /** While text streams, keep the assistant bubble in view (not the hidden shortlist). */
  useEffect(() => {
    if (!isTextStreaming || isTextComplete) return;

    const raf = window.requestAnimationFrame(() => {
      latestAssistantMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [isTextStreaming, isTextComplete]);

  /** After streaming completes, shortlist mounts — scroll once the grid is measurable. */
  useEffect(() => {
    if (!isTextComplete || isThinking) return;

    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || !last.vendors?.length) return;

    const waitMs = prefersReducedMotion ? 48 : VENUE_SCROLL_AFTER_TEXT_COMPLETE_MS;

    const timeoutId = window.setTimeout(() => {
      const scrollWhenLaidOut = (attempt: number) => {
        const section = latestAssistantResultRef.current;
        if (!section) return;

        const grid = section.querySelector<HTMLElement>(".nyra-venues-grid");
        const minHeight = 80;
        const gridReady = grid != null && grid.offsetHeight >= minHeight;

        if (!gridReady && attempt < 12) {
          window.requestAnimationFrame(() => scrollWhenLaidOut(attempt + 1));
          return;
        }

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            latestAssistantResultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        });
      };

      window.requestAnimationFrame(() => scrollWhenLaidOut(0));
    }, waitMs);

    return () => window.clearTimeout(timeoutId);
  }, [isTextComplete, isThinking, prefersReducedMotion, messages]);

  const handleAssistantStreamProgress = useCallback(() => {
    window.requestAnimationFrame(() => {
      latestAssistantMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const handleAssistantStreamComplete = useCallback(() => {
    setIsTextStreaming(false);
    setIsTextComplete(true);
  }, []);

  const sendUserMessage = (rawText: string) => {
    if (billableUserMessages >= FREE_USER_MESSAGE_LIMIT || isThinking) return false;
    const trimmed = rawText.trim();
    if (!trimmed) return false;

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    const mType = detectModuleType(trimmed);
    setCurrentModuleType(mType);
    const pool = thinkingMessagePool(mType);
    const assistantPlaceholderId = crypto.randomUUID();
    const assistantPlaceholderMessage: Message = {
      id: assistantPlaceholderId,
      role: "assistant",
      text: pool[0] ?? "Thinking...",
      isThinking: true,
    };

    const newAssistantMessage: Message = {
      id: assistantPlaceholderId,
      role: "assistant",
      text: buildAssistantIntroForModule(trimmed, mType),
      vendors: mockVendorsForModule(mType),
      resultModuleType: mType,
    };

    setMessages((prev) => [...prev, newUserMessage, assistantPlaceholderMessage]);
    setThinkingMessageIndex(0);
    setThinkingMessageRotationMs(THINKING_MESSAGE_ROTATION_MIN_MS);
    setIsThinking(true);

    window.setTimeout(() => {
      // Smoothly transition the thinking bubble into the final assistant response.
      setThinkingExitMessageId(assistantPlaceholderId);
      setAssistantRevealMessageId(assistantPlaceholderId);

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantPlaceholderId ? newAssistantMessage : message
        )
      );
      setIsThinking(false);

      window.setTimeout(() => {
        setThinkingExitMessageId((current) =>
          current === assistantPlaceholderId ? null : current
        );
        setAssistantRevealMessageId((current) =>
          current === assistantPlaceholderId ? null : current
        );
      }, 520);
    }, SIMULATED_RESPONSE_DELAY_MS);

    return true;
  };

  const sendLandingQueryRef = useRef(sendUserMessage);
  sendLandingQueryRef.current = sendUserMessage;

  /**
   * Landing hero submits via GET `/chat?query=...`. Consume after the mount-reset
   * microtask (see effect above) so messages are not cleared after send; strip `query`
   * from the URL immediately so Strict Mode remount / refresh does not resend.
   */
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const url = new URL(window.location.href);
        const trimmed = url.searchParams.get("query")?.trim() ?? "";
        if (!trimmed) return;

        url.searchParams.delete("query");
        const qs = url.searchParams.toString();
        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`
        );

        sendLandingQueryRef.current(trimmed);
      } catch {
        // ignore invalid URL / storage
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    if (sendUserMessage(t)) {
      setInput("");
    }
  };

  const toggleVenue = (id: string, resultModule: ModuleType) => {
    const modId = defaultModuleForType(resultModule).moduleId;
    setSelectedVendorIdsByModuleId((prev) => {
      const list = prev[modId] ?? [];
      if (!list.includes(id)) {
        setArchivedVendorIdsByModuleId((a) => {
          const forMod = a[modId] ?? [];
          if (!forMod.includes(id)) return a;
          return { ...a, [modId]: forMod.filter((x) => x !== id) };
        });
        return { ...prev, [modId]: [...list, id] };
      }
      if (outreachInitiatedRef.current) {
        const row = outreachItemsRef.current.find(
          (i) => i.moduleId === modId && i.vendorId === id
        );
        if (row && (row.status === "contacted" || row.status === "replied")) {
          return prev;
        }
      }
      if (outreachInitiatedRef.current) {
        setOutreachItems((items) =>
          items.filter((item) => !(item.moduleId === modId && item.vendorId === id))
        );
      }
      return { ...prev, [modId]: list.filter((v) => v !== id) };
    });
    setVenueSelectionHint(null);
  };

  const removeVenueFromShortlist = useCallback(
    (venueId: string, resultModule?: ModuleType) => {
      const m: ModuleType = resultModule ?? currentModuleType ?? "venue";
      const modId = defaultModuleForType(m).moduleId;
      if (outreachInitiatedRef.current) {
        const row = outreachItemsRef.current.find(
          (i) => i.moduleId === modId && i.vendorId === venueId
        );
        if (row && (row.status === "contacted" || row.status === "replied")) {
          return;
        }
      }
      setSelectedVendorIdsByModuleId((p) => ({
        ...p,
        [modId]: (p[modId] ?? []).filter((x) => x !== venueId),
      }));
      if (outreachInitiatedRef.current) {
        setOutreachItems((items) =>
          items.filter((item) => !(item.moduleId === modId && item.vendorId === venueId))
        );
      }
      setVenueSelectionHint(null);
    },
    [currentModuleType]
  );

  const handleAddNyraNote = useCallback((venueId: string, text: string) => {
    const entry = { id: crypto.randomUUID(), text, at: Date.now() };
    setVendorDetailsById((prev) => {
      const cur = getVendorDetails(prev, venueId);
      return { ...prev, [venueId]: { ...cur, nyraNotes: [...cur.nyraNotes, entry] } };
    });
  }, []);

  const handleAddFollowUp = useCallback((venueId: string, text: string) => {
    const entry = { id: crypto.randomUUID(), text, at: Date.now() };
    setVendorDetailsById((prev) => {
      const cur = getVendorDetails(prev, venueId);
      return { ...prev, [venueId]: { ...cur, followUps: [...cur.followUps, entry] } };
    });
  }, []);

  const handleArchiveVenue = useCallback((modId: string, venueId: string) => {
    setSelectedVendorIdsByModuleId((p) => ({
      ...p,
      [modId]: (p[modId] ?? []).filter((id) => id !== venueId),
    }));
    setArchivedVendorIdsByModuleId((a) => {
      const forMod = a[modId] ?? [];
      if (forMod.includes(venueId)) return a;
      return { ...a, [modId]: [...forMod, venueId] };
    });
    if (outreachInitiatedRef.current) {
      setOutreachItems((items) =>
        items.filter((item) => !(item.moduleId === modId && item.vendorId === venueId))
      );
    }
  }, []);

  const handleRestoreVenue = useCallback((modId: string, venueId: string) => {
    setArchivedVendorIdsByModuleId((a) => ({
      ...a,
      [modId]: (a[modId] ?? []).filter((id) => id !== venueId),
    }));
    setSelectedVendorIdsByModuleId((p) => {
      const cur = p[modId] ?? [];
      if (cur.includes(venueId)) return p;
      return { ...p, [modId]: [...cur, venueId] };
    });
  }, []);

  const closeOutreachConfirmModal = useCallback(() => {
    outreachConfirmTargetModuleIdRef.current = null;
    setOutreachConfirmOpen(false);
    setOutreachConfirmPhase("review");
    setOutreachProgressVenueIds(null);
    setOutreachConfirmScopeIds(null);
  }, []);

  const handleStopOutreachBatch = useCallback(() => {
    const batch = outreachProgressVenueIdsRef.current;
    outreachSimulationTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    outreachSimulationTimeoutsRef.current = [];
    outreachWorkerBusyRef.current = false;

    if (batch?.length) {
      const batchSet = new Set(batch);
      setOutreachItems((prev) =>
        prev.filter((row) => {
          if (!batchSet.has(row.vendorId)) return true;
          if (row.status === "contacted" || row.status === "replied") return true;
          return false;
        })
      );
    }
    closeOutreachConfirmModal();
    queueMicrotask(() => {
      tryProcessOutreachQueueRef.current();
    });
  }, [closeOutreachConfirmModal]);

  const openOutreachConfirm = useCallback(
    (scopeVenueIds?: readonly string[] | null, targetModuleId?: string) => {
      setOutreachReviewVenueNote("");
      setOutreachReviewEventBrief(originalSearchBrief);
      setOutreachReviewExcludedVenueIds([]);
      setOutreachConfirmPhase("review");
      setOutreachProgressVenueIds(null);
      outreachConfirmTargetModuleIdRef.current = targetModuleId ?? null;
      setOutreachConfirmScopeIds(
        scopeVenueIds != null && scopeVenueIds.length > 0 ? [...scopeVenueIds] : null
      );
      setOutreachConfirmOpen(true);
    },
    [originalSearchBrief]
  );

  const toggleOutreachReviewVenueIncluded = useCallback((venueId: string) => {
    setOutreachReviewExcludedVenueIds((prev) =>
      prev.includes(venueId) ? prev.filter((id) => id !== venueId) : [...prev, venueId]
    );
  }, []);

  const handleVenueReportCtaThisVenueOnly = useCallback(
    (moduleId: string, venueId: string) => {
      openOutreachConfirm([venueId], moduleId);
    },
    [openOutreachConfirm]
  );

  const handleVenueReportCta = () => {
    if (activeModule == null) return;

    if (outreachInitiated && outreachItemsThisModule.length > 0) {
      const withoutRow = vendorIdsPendingOutreachRow(
        true,
        selectedVendorIds,
        outreachItemsThisModule
      );
      const inFlight = selectedVendorIds.filter((id) => {
        const row = outreachItemsThisModule.find((i) => i.vendorId === id);
        return row?.status === "queued" || row?.status === "drafting-outreach";
      });
      if (withoutRow.length > 0) {
        openOutreachConfirm();
        return;
      }
      if (inFlight.length > 0) {
        setOutreachProgressVenueIds([...inFlight]);
        setOutreachConfirmPhase("progress");
        setOutreachConfirmOpen(true);
        return;
      }
      return;
    }

    if (selectedVendorIds.length > 0) {
      openOutreachConfirm();
      return;
    }

    const needSelectionHint = selectionRequiredHintForModule(activeModule.moduleType);
    setVenueSelectionHint(needSelectionHint);
    setPulseVenueCards(true);
    if (venuePulseTimeoutRef.current) window.clearTimeout(venuePulseTimeoutRef.current);
    if (venueHintTimeoutRef.current) window.clearTimeout(venueHintTimeoutRef.current);
    venuePulseTimeoutRef.current = window.setTimeout(() => {
      setPulseVenueCards(false);
      venuePulseTimeoutRef.current = undefined;
    }, VENUE_CARD_PULSE_MS);
    venueHintTimeoutRef.current = window.setTimeout(() => {
      setVenueSelectionHint((current) => (current === needSelectionHint ? null : current));
      venueHintTimeoutRef.current = undefined;
    }, 6000);

    window.requestAnimationFrame(() => {
      if (isTextComplete && latestAssistantResultRef.current) {
        latestAssistantResultRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }
      latestAssistantMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleConfirmOutreach = useCallback(() => {
    if (activeModule == null) return;

    const note = outreachReviewVenueNote.trim();
    const askBlurb = note || OUTREACH_DEFAULT_INQUIRY_BLURB;
    setOutreachWhatNyraAsked(askBlurb);

    outreachBundleRef.current = {
      eventSummary:
        outreachReviewEventBrief.trim() ||
        originalSearchBrief.trim() ||
        "From your planning thread.",
      venueNote: note,
    };

    if (venuePulseTimeoutRef.current) window.clearTimeout(venuePulseTimeoutRef.current);
    if (venueHintTimeoutRef.current) window.clearTimeout(venueHintTimeoutRef.current);
    venuePulseTimeoutRef.current = undefined;
    venueHintTimeoutRef.current = undefined;
    setVenueSelectionHint(null);
    setPulseVenueCards(false);

    const scope = outreachConfirmScopeIds;
    const applyScope = (ids: readonly string[]) => {
      if (scope == null || scope.length === 0) return [...ids];
      const allowed = new Set(scope);
      return ids.filter((id) => allowed.has(id));
    };

    const excluded = new Set(outreachReviewExcludedVenueIds);
    const filterExcluded = (ids: readonly string[]) =>
      ids.filter((id) => !excluded.has(id));

    if (!outreachInitiated) {
      if (selectedVendorIds.length === 0) return;
      const idsForSend = filterExcluded(applyScope(selectedVendorIds));
      if (idsForSend.length === 0) return;
      setOutreachProgressVenueIds([...idsForSend]);
      setOutreachConfirmPhase("progress");
      setOutreachInitiated(true);
      const mid = outreachConfirmTargetModuleIdRef.current ?? activeModule.moduleId;
      outreachConfirmTargetModuleIdRef.current = null;
      setOutreachItems(outreachItemsFromVendorIds(mid, idsForSend));
      setOutreachConfirmScopeIds(null);
      return;
    }

    const pendingIds = vendorIdsPendingOutreachRow(
      true,
      selectedVendorIds,
      outreachItemsThisModule
    );
    const idsForSend = filterExcluded(applyScope(pendingIds));
    if (idsForSend.length === 0) return;

    setOutreachProgressVenueIds([...idsForSend]);
    setOutreachConfirmPhase("progress");
    const mid = outreachConfirmTargetModuleIdRef.current ?? activeModule.moduleId;
    outreachConfirmTargetModuleIdRef.current = null;
    const now = Date.now();
    setOutreachItems((prev) => {
      const have = new Set(
        prev.filter((r) => r.moduleId === mid).map((r) => r.vendorId)
      );
      const additions = idsForSend
        .filter((id) => !have.has(id))
        .map((vendorId) => ({
          moduleId: mid,
          vendorId,
          status: "queued" as const,
          statusUpdatedAt: now,
        }));
      return additions.length ? [...prev, ...additions] : prev;
    });
    setOutreachConfirmScopeIds(null);
  }, [
    activeModule,
    originalSearchBrief,
    outreachConfirmScopeIds,
    outreachInitiated,
    outreachItems,
    outreachReviewEventBrief,
    outreachReviewExcludedVenueIds,
    outreachReviewVenueNote,
    selectedVendorIds,
    outreachItemsThisModule,
  ]);

  useEffect(() => {
    if (outreachConfirmPhase !== "progress" || !outreachProgressVenueIds?.length) return;
    const byId = new Map(outreachItems.map((i) => [i.vendorId, i]));
    const allSent = outreachProgressVenueIds.every((id) => {
      const row = byId.get(id);
      return row && (row.status === "contacted" || row.status === "replied");
    });
    if (!allSent) return;
    queueMicrotask(() => {
      setOutreachConfirmPhase("success");
    });
  }, [outreachConfirmPhase, outreachProgressVenueIds, outreachItems]);

  useLayoutEffect(() => {
    outreachProgressVenueIdsRef.current = outreachProgressVenueIds;
  }, [outreachProgressVenueIds]);

  useEffect(() => {
    return () => {
      if (venuePulseTimeoutRef.current) window.clearTimeout(venuePulseTimeoutRef.current);
      if (venueHintTimeoutRef.current) window.clearTimeout(venueHintTimeoutRef.current);
      outreachSimulationTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      outreachSimulationTimeoutsRef.current = [];
    };
  }, []);

  const vendorById = useMemo(() => {
    const map = new Map<string, Vendor>();
    for (const message of messages) {
      if (message.role === "assistant" && message.vendors?.length) {
        for (const v of message.vendors) map.set(v.id, v);
      }
    }
    for (const v of venueVendors) map.set(v.id, v);
    for (const v of cateringVendors) map.set(v.id, v);
    for (const v of photographyVendors) map.set(v.id, v);
    return map;
  }, [messages]);

  const outreachConfirmVenues = useMemo(() => {
    if (!outreachConfirmOpen) return [];
    const baseIds = outreachInitiated
      ? vendorIdsPendingOutreachRow(true, selectedVendorIds, outreachItems)
      : selectedVendorIds;
    const scope = outreachConfirmScopeIds;
    const ids =
      scope != null && scope.length > 0
        ? baseIds.filter((id) => scope.includes(id))
        : baseIds;
    return ids.map((id) => ({
      id,
      name: vendorById.get(id)?.name ?? entityLabels.defaultCardName,
    }));
  }, [
    entityLabels.defaultCardName,
    outreachConfirmOpen,
    outreachConfirmScopeIds,
    outreachInitiated,
    outreachItems,
    selectedVendorIds,
    vendorById,
  ]);

  const outreachProgressVenueRows = useMemo(() => {
    if (!outreachProgressVenueIds?.length) return null;
    return outreachProgressVenueIds.map((id) => ({
      id,
      name: vendorById.get(id)?.name ?? entityLabels.defaultCardName,
    }));
  }, [entityLabels.defaultCardName, outreachProgressVenueIds, vendorById]);

  const updateAllModalVenues = useMemo(
    () =>
      selectedVendorIds.map((id) => ({
        id,
        name: vendorById.get(id)?.name ?? entityLabels.defaultCardName,
      })),
    [entityLabels.defaultCardName, selectedVendorIds, vendorById]
  );

  const thinkingMessageList = useMemo(
    () => [...thinkingMessagePool(currentModuleType ?? "venue")],
    [currentModuleType]
  );

  const composerHasText = input.trim().length > 0;

  return (
    <main className="nyra-chat-shell h-svh max-h-svh min-h-0 overflow-hidden bg-chat-canvas font-sans text-chat-text-primary antialiased">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1200px] flex-col lg:mx-0 lg:max-w-none lg:flex-row lg:divide-x lg:divide-chat-border lg:bg-chat-pane">
        <section
          className={`relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-chat-pane px-2 sm:px-3 ${
            prefersReducedMotion
              ? ""
              : "motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out"
          } ${plannerSheetOpen ? "opacity-[0.42]" : "opacity-100"}`}
        >
          <div className="shrink-0 px-4 sm:px-[1.125rem]">
            <ChatHeader
              isDev={isDev}
              onDevReset={handleDevReset}
              isPaywalled={isPaywalled}
              freeMessagesRemaining={freeMessagesRemaining}
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-t border-chat-border bg-chat-pane">
            <ChatMessages
              moduleType={currentModuleType ?? undefined}
              messages={messages}
              onSelectExamplePrompt={sendUserMessage}
              latestMessageRef={latestMessageRef}
              thinkingBubbleRef={thinkingBubbleRef}
              latestAssistantMessageRef={latestAssistantMessageRef}
              latestAssistantResultRef={latestAssistantResultRef}
              selectedVendorIds={selectedVendorIds}
              getSelectedIdsForModule={getSelectedIdsForModule}
              pulseVenueCards={pulseVenueCards}
              onToggleVenue={toggleVenue}
              onRemoveVenueFromShortlist={removeVenueFromShortlist}
              venueSelectionHint={venueSelectionHint}
              onVenueReportCta={handleVenueReportCta}
              composerHasText={composerHasText}
              thinkingMessages={thinkingMessageList}
              thinkingMessageIndex={thinkingMessageIndex}
              thinkingMessageRotationMs={thinkingMessageRotationMs}
              thinkingExitMessageId={thinkingExitMessageId}
              assistantRevealMessageId={assistantRevealMessageId}
              isTextComplete={isTextComplete}
              outreachMode={effectiveOutreachMode}
              outreachItems={outreachItems}
              pipelineOutreachItems={outreachItemsThisModule}
              plannerRef={plannerRef}
              onAssistantStreamProgress={handleAssistantStreamProgress}
              onAssistantStreamComplete={handleAssistantStreamComplete}
            />

            <ChatInputBar
              moduleType={currentModuleType ?? undefined}
              isPaywalled={isPaywalled}
              isThinking={isThinking}
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              venueSelectionHint={venueSelectionHint}
              onVenueReportCta={handleVenueReportCta}
            />
          </div>

          {plannerRef != null ? (
            <div
              role="presentation"
              aria-hidden
              className="absolute inset-0 z-10 cursor-default bg-transparent pointer-events-auto"
              onClick={() => handlePlannerRefChange(null)}
            />
          ) : null}
        </section>

        <SelectedVendorsSidebar
          moduleType={currentModuleType ?? undefined}
          selectedVendorIds={selectedVendorIds}
          shortlistByModule={shortlistByModule}
          visibleShortlistByModule={visibleShortlistByModule}
          totalShortlistedCount={totalShortlistedCount}
          allOutreachItems={outreachItems}
          outreachInitiated={outreachInitiated}
          vendorById={vendorById}
          venueSelectionHint={venueSelectionHint}
          onVenueReportCta={handleVenueReportCta}
          onVenueReportCtaThisVenueOnly={handleVenueReportCtaThisVenueOnly}
          composerHasText={composerHasText}
          outreachMode={effectiveOutreachMode}
          outreachItems={outreachItemsThisModule}
          plannerRef={plannerRef}
          onPlannerRefChange={handlePlannerRefChange}
          originalSearchBrief={originalSearchBrief}
          outreachWhatNyraAsked={outreachWhatNyraAsked}
          vendorDetailsById={vendorDetailsById}
          onAddNyraNote={handleAddNyraNote}
          onAddFollowUp={handleAddFollowUp}
          onArchiveVendor={handleArchiveVenue}
          onRestoreVendor={handleRestoreVenue}
          reduceMotion={prefersReducedMotion}
          railCompareOpen={railCompareOpen}
          onRailCompareOpen={handleRailCompareOpen}
          onRailCompareClose={handleRailCompareClose}
          onOpenUpdateAllVenues={handleOpenUpdateAllVenues}
        />

        {updateAllVenuesModalOpen ? (
          <UpdateAllVenuesModal
            moduleType={currentModuleType ?? "venue"}
            open
            onClose={() => setUpdateAllVenuesModalOpen(false)}
            venues={updateAllModalVenues}
            outreachItems={outreachItemsThisModule}
            reduceMotion={prefersReducedMotion}
            onSendFollowUps={handleBulkVenueFollowUps}
          />
        ) : null}

        <OutreachConfirmPanel
          moduleType={currentModuleType ?? "venue"}
          open={outreachConfirmOpen}
          phase={outreachConfirmPhase}
          progressVenues={outreachProgressVenueRows}
          outreachItems={outreachItems}
          reduceMotion={prefersReducedMotion}
          searchBrief={outreachReviewEventBrief}
          onSearchBriefCommit={setOutreachReviewEventBrief}
          excludedVenueIds={outreachReviewExcludedVenueIds}
          onToggleVenueIncluded={toggleOutreachReviewVenueIncluded}
          venues={outreachConfirmVenues}
          venueNote={outreachReviewVenueNote}
          onVenueNoteChange={setOutreachReviewVenueNote}
          onRemoveVenue={removeVenueFromShortlist}
          onCancel={closeOutreachConfirmModal}
          onViewProgress={closeOutreachConfirmModal}
          onStopOutreach={handleStopOutreachBatch}
          onStart={handleConfirmOutreach}
        />
      </div>
    </main>
  );
};

const ThinkingStyles = () => (
  <style>{`
    @keyframes nyraThinkingMessage {
      0% { opacity: 0; transform: translateY(2px); }
      18% { opacity: 1; transform: translateY(0px); }
      82% { opacity: 1; transform: translateY(0px); }
      100% { opacity: 0; transform: translateY(-1px); }
    }

    @keyframes nyraThinkingDot {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
      40% { transform: translateY(-2px); opacity: 0.85; }
    }

    @keyframes nyraThinkingBubbleIn {
      0% { opacity: 0; transform: translateY(2px); }
      100% { opacity: 1; transform: translateY(0px); }
    }

    @keyframes nyraThinkingBubbleOut {
      0% { opacity: 1; transform: translateY(0px); filter: blur(0px); }
      100% { opacity: 0; transform: translateY(-2px); filter: blur(1px); }
    }

    @keyframes nyraAssistantReveal {
      0% { opacity: 0; transform: translateY(3px); }
      100% { opacity: 1; transform: translateY(0px); }
    }

    @keyframes nyraResultsPackIn {
      0% { opacity: 0; transform: translateY(4px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes nyraVenueCardIntro {
      0% { opacity: 0; transform: translateY(6px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    .nyra-results-pack {
      opacity: 0;
      animation: nyraResultsPackIn 460ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .nyra-venue-card-intro {
      opacity: 0;
      animation: nyraVenueCardIntro 500ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .nyra-venue-card-intro--1 { animation-delay: 80ms; }
    .nyra-venue-card-intro--2 { animation-delay: 140ms; }
    .nyra-venue-card-intro--3 { animation-delay: 200ms; }
    .nyra-venue-card-intro--4 { animation-delay: 260ms; }
    .nyra-venue-card-intro--5 { animation-delay: 320ms; }
    .nyra-venue-card-intro--6 { animation-delay: 380ms; }

    @keyframes nyraVenueSelectHintSoft {
      0% {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
        border-color: rgba(255, 255, 255, 0.08);
      }
      48% {
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.1),
          0 10px 28px -12px rgba(0, 0, 0, 0.45);
        border-color: rgba(255, 255, 255, 0.14);
      }
      100% {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
        border-color: rgba(255, 255, 255, 0.08);
      }
    }

    .nyra-venue-card--pulse {
      animation: nyraVenueSelectHintSoft 980ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    @keyframes nyraVenueSelectedCheckIn {
      0% {
        opacity: 0;
        transform: scale(0.92);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .nyra-venue-selected-check--arrive {
      animation: nyraVenueSelectedCheckIn 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .nyra-typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background: rgb(82 82 82);
      animation: nyraThinkingDot 1.15s ease-in-out infinite;
    }

    .nyra-typing-dot--2 { animation-delay: 140ms; }
    .nyra-typing-dot--3 { animation-delay: 280ms; }

    @media (prefers-reduced-motion: reduce) {
      .nyra-results-pack,
      .nyra-venue-card-intro {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }

      .nyra-venue-card--pulse {
        animation: none !important;
      }

      .nyra-venue-selected-check--arrive {
        animation: none !important;
      }

      .nyra-typing-dot {
        animation: none !important;
      }
    }
  `}</style>
);

const ChatPage = () => (
  <>
    <ThinkingStyles />
    <ChatPageContent />
  </>
);

export default ChatPage;
