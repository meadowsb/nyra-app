"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import { ChatHeader } from "@/components/ChatHeader";
import { ChatInputBar } from "@/components/ChatInputBar";
import { ChatMessages, type Message } from "@/components/ChatMessages";
import { SelectedVenuesSidebar } from "@/components/SelectedVenuesSidebar";
import { usePrefersReducedMotion } from "@/components/AssistantStreamedText";
import type { Venue } from "@/components/VenueCard";

/** User-authored composer sends allowed before the unlock card (intro seed does not count). */
const FREE_USER_MESSAGE_LIMIT = 3;

/** Seeded opener includes this many user bubbles; they do not count toward FREE_USER_MESSAGE_LIMIT. */
const INTRO_USER_MESSAGE_COUNT = 1;

const mockVenues: Venue[] = [
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
    heroPreset: "modern-city",
  },
  {
    id: "2",
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
  {
    id: "3",
    name: "Palm Loft",
    location: "Wynwood",
    price: "$15k–$25k",
    tag: "Minimal",
    highlights: ["Blank-canvas space", "Outdoor-friendly"] as const,
    vibe: "North-lit loft with beams and polished concrete",
    capacity: "Best for 30–70 guests",
    whyFit:
      "Best for intimate, design-forward weddings that want an artsy space with minimal décor.",
    heroPreset: "loft-industrial",
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

const THINKING_MESSAGES = [
  "Scanning venues...",
  "Filtering by guest count...",
  "Matching your style...",
];

// Keep the "thinking" experience premium and time-boxed.
const SIMULATED_RESPONSE_DELAY_MS = 2200;
const THINKING_MESSAGE_ROTATION_MIN_MS = 800;
const THINKING_MESSAGE_ROTATION_MAX_MS = 1200;

const DEV_RESET_STORAGE_KEYS = [
  "nyra:chat:messages",
  "nyra:chat:userMessageCount",
  "nyra:chat:selectedVenueIds",
];

const VENUE_SELECTION_REQUIRED_HINT =
  "Select at least one venue to include in your report";

const VENUE_CARD_PULSE_MS = 1400;

/** Shortlist block fade/slide (`nyraResultsPackIn` in ThinkingStyles). */
const NYRA_RESULTS_PACK_DURATION_MS = 460;
/** Max `animation-delay` on venue card intros + their duration (ThinkingStyles). */
const NYRA_VENUE_CARD_INTRO_TAIL_MS = 210 + 500;
/** Extra time for layout after intros before scrollIntoView. */
const NYRA_VENUES_SCROLL_SETTLE_MS = 72;
/** Wait for shortlist layout/animations after text completes before scrolling to cards. */
const VENUE_SCROLL_AFTER_TEXT_COMPLETE_MS =
  NYRA_RESULTS_PACK_DURATION_MS + NYRA_VENUE_CARD_INTRO_TAIL_MS + NYRA_VENUES_SCROLL_SETTLE_MS;

function buildInitialMessages(query: string): Message[] {
  return [
    {
      id: "u1",
      role: "user",
      text: query,
    },
    {
      id: "a1",
      role: "assistant",
      text: buildConciergeIntro(query),
      venues: mockVenues,
    },
  ];
}

const ChatPageContent = () => {
  const searchParams = useSearchParams();
  const initialQuery =
    searchParams.get("query")?.trim() ||
    "Looking for a modern venue for 80 guests in Miami";

  const [messages, setMessages] = useState<Message[]>(() =>
    buildInitialMessages(initialQuery)
  );
  const [input, setInput] = useState("");
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>([]);
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
  const [pulseVenueCards, setPulseVenueCards] = useState(false);
  const [isTextStreaming, setIsTextStreaming] = useState(false);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const venuePulseTimeoutRef = useRef<number | undefined>(undefined);
  const venueHintTimeoutRef = useRef<number | undefined>(undefined);
  const venueTurnAssistantIdRef = useRef<string | null>(null);
  const thinkingBubbleRef = useRef<HTMLDivElement | null>(null);
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantMessageRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantResultRef = useRef<HTMLDivElement | null>(null);
  const previousIsThinkingRef = useRef(isThinking);
  const previousUserMessageCountRef = useRef(INTRO_USER_MESSAGE_COUNT);

  const isDev = process.env.NODE_ENV === "development";
  const prefersReducedMotion = usePrefersReducedMotion();

  const userMessageCount = messages.filter((m) => m.role === "user").length;
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
    venuePulseTimeoutRef.current = undefined;
    venueHintTimeoutRef.current = undefined;
    venueTurnAssistantIdRef.current = null;

    try {
      DEV_RESET_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // ignore
    }

    setMessages(buildInitialMessages(initialQuery));
    setInput("");
    setSelectedVenueIds([]);
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
    venuePulseTimeoutRef.current = undefined;
    venueHintTimeoutRef.current = undefined;
    venueTurnAssistantIdRef.current = null;

    try {
      DEV_RESET_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // ignore
    }

    const refreshed = buildInitialMessages(initialQuery);
    queueMicrotask(() => {
      setMessages(refreshed);
      setSelectedVenueIds([]);
      setInput("");
      setVenueSelectionHint(null);
      setPulseVenueCards(false);
      setIsTextStreaming(false);
      setIsTextComplete(false);
      setIsThinking(false);
      setThinkingMessageIndex(0);
      setThinkingExitMessageId(null);
      setAssistantRevealMessageId(null);

      previousUserMessageCountRef.current = refreshed.filter((m) => m.role === "user").length;
      previousIsThinkingRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once on mount; initialQuery is first paint only
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

    const scheduleNext = () => {
      const ms = nextRotationMs();
      setThinkingMessageRotationMs(ms);
      timeoutId = window.setTimeout(() => {
        setThinkingMessageIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
        scheduleNext();
      }, ms);
    };

    scheduleNext();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isThinking]);

  /** New assistant turn with a shortlist: arm streaming / completion before venues mount. */
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || last.isThinking || !last.venues?.length) return;

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
    if (!last || last.role !== "assistant" || !last.venues?.length) return;

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (billableUserMessages >= FREE_USER_MESSAGE_LIMIT || isThinking) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    const assistantPlaceholderId = crypto.randomUUID();
    const assistantPlaceholderMessage: Message = {
      id: assistantPlaceholderId,
      role: "assistant",
      text: THINKING_MESSAGES[0] ?? "Thinking...",
      isThinking: true,
    };

    const newAssistantMessage: Message = {
      id: assistantPlaceholderId,
      role: "assistant",
      text: buildConciergeIntro(trimmed),
      venues: mockVenues,
    };

    setMessages((prev) => [...prev, newUserMessage, assistantPlaceholderMessage]);
    setInput("");
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
  };

  const toggleVenue = (id: string) => {
    setSelectedVenueIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
    setVenueSelectionHint(null);
  };

  const handleVenueReportCta = () => {
    if (selectedVenueIds.length > 0) return;

    setVenueSelectionHint(VENUE_SELECTION_REQUIRED_HINT);
    setPulseVenueCards(true);
    if (venuePulseTimeoutRef.current) window.clearTimeout(venuePulseTimeoutRef.current);
    if (venueHintTimeoutRef.current) window.clearTimeout(venueHintTimeoutRef.current);
    venuePulseTimeoutRef.current = window.setTimeout(() => {
      setPulseVenueCards(false);
      venuePulseTimeoutRef.current = undefined;
    }, VENUE_CARD_PULSE_MS);
    venueHintTimeoutRef.current = window.setTimeout(() => {
      setVenueSelectionHint((current) =>
        current === VENUE_SELECTION_REQUIRED_HINT ? null : current
      );
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

  useEffect(() => {
    return () => {
      if (venuePulseTimeoutRef.current) window.clearTimeout(venuePulseTimeoutRef.current);
      if (venueHintTimeoutRef.current) window.clearTimeout(venueHintTimeoutRef.current);
    };
  }, []);

  const venueById = useMemo(() => {
    const map = new Map<string, Venue>();
    for (const message of messages) {
      if (message.role === "assistant" && message.venues?.length) {
        for (const venue of message.venues) map.set(venue.id, venue);
      }
    }
    for (const venue of mockVenues) map.set(venue.id, venue);
    return map;
  }, [messages]);

  const composerHasText = input.trim().length > 0;

  return (
    <main className="nyra-chat-shell h-svh max-h-svh min-h-0 overflow-hidden bg-chat-canvas font-sans text-chat-text-primary antialiased">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1200px] flex-col lg:mx-0 lg:max-w-none lg:flex-row lg:divide-x lg:divide-chat-border lg:bg-chat-pane">
        <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-chat-pane px-2 sm:px-3">
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
              messages={messages}
              latestMessageRef={latestMessageRef}
              thinkingBubbleRef={thinkingBubbleRef}
              latestAssistantMessageRef={latestAssistantMessageRef}
              latestAssistantResultRef={latestAssistantResultRef}
              selectedVenueIds={selectedVenueIds}
              pulseVenueCards={pulseVenueCards}
              onToggleVenue={toggleVenue}
              venueSelectionHint={venueSelectionHint}
              onVenueReportCta={handleVenueReportCta}
              composerHasText={composerHasText}
              thinkingMessages={THINKING_MESSAGES}
              thinkingMessageIndex={thinkingMessageIndex}
              thinkingMessageRotationMs={thinkingMessageRotationMs}
              thinkingExitMessageId={thinkingExitMessageId}
              assistantRevealMessageId={assistantRevealMessageId}
              isTextComplete={isTextComplete}
              onAssistantStreamProgress={handleAssistantStreamProgress}
              onAssistantStreamComplete={handleAssistantStreamComplete}
            />

            <ChatInputBar
              isPaywalled={isPaywalled}
              isThinking={isThinking}
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              venueSelectionHint={venueSelectionHint}
              onVenueReportCta={handleVenueReportCta}
            />
          </div>
        </section>

        <SelectedVenuesSidebar
          selectedVenueIds={selectedVenueIds}
          venueById={venueById}
          venueSelectionHint={venueSelectionHint}
          onVenueReportCta={handleVenueReportCta}
          composerHasText={composerHasText}
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

    @keyframes nyraVenueSelectHintPulse {
      0%, 100% {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
        border-color: rgba(255, 255, 255, 0.08);
      }
      50% {
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.12),
          0 12px 32px -10px rgba(0, 0, 0, 0.55);
        border-color: rgba(255, 255, 255, 0.16);
      }
    }

    .nyra-venue-card--pulse {
      animation: nyraVenueSelectHintPulse 420ms ease-in-out 2;
    }

    @keyframes nyraVenueSelectedLift {
      0% {
        transform: translateY(2px) scale(0.994);
      }
      100% {
        transform: translateY(0) scale(1);
      }
    }

    @keyframes nyraVenueSelectedCheckIn {
      0% {
        opacity: 0;
        transform: scale(0.86);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .nyra-venue-card--selected {
      animation: nyraVenueSelectedLift 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .nyra-venue-selected-check {
      animation: nyraVenueSelectedCheckIn 300ms cubic-bezier(0.22, 1, 0.36, 1) 40ms both;
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

      .nyra-venue-card--selected,
      .nyra-venue-selected-check {
        animation: none !important;
      }

      .nyra-typing-dot {
        animation: none !important;
      }
    }
  `}</style>
);

const ChatPage = () => (
  <Suspense
    fallback={
      <main className="nyra-chat-shell h-svh max-h-svh min-h-0 overflow-hidden bg-chat-canvas font-sans text-chat-text-primary antialiased" />
    }
  >
    <ThinkingStyles />
    <ChatPageContent />
  </Suspense>
);

export default ChatPage;
