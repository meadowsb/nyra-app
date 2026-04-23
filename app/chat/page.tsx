"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Venue = {
  id: string;
  name: string;
  location: string;
  price: string;
  tag: string;
  whyFit: string;
};

/** Total user messages allowed before the unlock card replaces the composer. */
const FREE_USER_MESSAGE_LIMIT = 2;

const mockVenues: Venue[] = [
  {
    id: "1",
    name: "The Glasshouse Miami",
    location: "Downtown Miami",
    price: "$20k–$30k",
    tag: "Modern",
    whyFit:
      "Ideal for sleek mid-size weddings that want a blank-canvas space with city energy.",
  },
  {
    id: "2",
    name: "Oceanview Terrace",
    location: "Miami Beach",
    price: "$18k–$28k",
    tag: "Waterfront",
    whyFit:
      "Perfect for sunset ceremonies with an easy indoor-outdoor flow and ocean breeze.",
  },
  {
    id: "3",
    name: "Palm Loft",
    location: "Wynwood",
    price: "$15k–$25k",
    tag: "Minimal",
    whyFit:
      "Best for intimate, design-forward weddings that want an artsy space with minimal décor.",
  },
];

type Message =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      text: string;
      venues?: Venue[];
      isThinking?: boolean;
    };

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

  const guestCountPhrase = guestCount ? `${guestCount}` : "TBD";
  const locationPhrase = location ? location : "your area";
  const stylePhrase = style ? style : "your style";
  const eventPhrase = eventType ? eventType : "event";

  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };

  const closers = [
    `Want me to tighten this toward a specific vibe within ${stylePhrase} (more intimate vs. more grand)?`,
    `If you share any must-haves (budget, indoor/outdoor, parking), I’ll refine the list even further.`,
    `If you tell me what “perfect” looks like for your ${stylePhrase} vibe, I can dial these in fast.`,
  ] as const;
  const closer = closers[hash(query) % closers.length];

  const first = `For your ${eventPhrase} in ${locationPhrase} with a guest count of ${guestCountPhrase} and a ${stylePhrase} style, I pulled venues that match the feel without forcing a one-size-fits-all pick.`;
  const second =
    "For your size, I prioritized venues that can comfortably host without feeling empty.";

  return `${first} ${second} ${closer}`;
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

const ChatPageContent = () => {
  const searchParams = useSearchParams();
  const initialQuery =
    searchParams.get("query")?.trim() ||
    "Looking for a modern venue for 80 guests in Miami";

  const initialMessages = useMemo<Message[]>(
    () => [
      {
        id: "u1",
        role: "user",
        text: initialQuery,
      },
      {
        id: "a1",
        role: "assistant",
        text: buildConciergeIntro(initialQuery),
        venues: mockVenues,
      },
    ],
    [initialQuery]
  );

  const [messages, setMessages] = useState<Message[]>(initialMessages);
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
  const venuePulseTimeoutRef = useRef<number | undefined>(undefined);
  const venueHintTimeoutRef = useRef<number | undefined>(undefined);
  const thinkingBubbleRef = useRef<HTMLDivElement | null>(null);
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantMessageRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantResultRef = useRef<HTMLDivElement | null>(null);
  const previousIsThinkingRef = useRef(isThinking);
  const previousUserMessageCountRef = useRef(0);

  const isDev = process.env.NODE_ENV === "development";

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const freeMessagesRemaining = Math.max(
    0,
    FREE_USER_MESSAGE_LIMIT - userMessageCount
  );
  const isPaywalled = userMessageCount >= FREE_USER_MESSAGE_LIMIT;

  const handleDevReset = () => {
    if (!isDev) return;

    if (venuePulseTimeoutRef.current) window.clearTimeout(venuePulseTimeoutRef.current);
    if (venueHintTimeoutRef.current) window.clearTimeout(venueHintTimeoutRef.current);
    venuePulseTimeoutRef.current = undefined;
    venueHintTimeoutRef.current = undefined;

    try {
      DEV_RESET_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // ignore
    }

    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: buildConciergeIntro(initialQuery),
        venues: mockVenues,
      },
    ]);
    setInput("");
    setSelectedVenueIds([]);
    setVenueSelectionHint(null);
    setPulseVenueCards(false);
    setIsThinking(false);
    setThinkingMessageIndex(0);
  };

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

  useEffect(() => {
    const userJustAdded =
      userMessageCount > (previousUserMessageCountRef.current ?? 0);
    const thinkingJustStarted = !previousIsThinkingRef.current && isThinking;
    const thinkingJustEnded = previousIsThinkingRef.current && !isThinking;

    previousUserMessageCountRef.current = userMessageCount;
    previousIsThinkingRef.current = isThinking;

    if (!userJustAdded && !thinkingJustStarted && !thinkingJustEnded) return;

    const raf = window.requestAnimationFrame(() => {
      if (thinkingJustStarted) {
        thinkingBubbleRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      if (thinkingJustEnded) {
        latestAssistantMessageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      latestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [userMessageCount, isThinking]);

  useEffect(() => {
    // The "previous" ref is updated in the scrolling effect above, so compute
    // completion based on message state instead of the ref.
    if (isThinking) return;

    const lastMessage = messages[messages.length - 1];
    const assistantVenuesReady =
      !!lastMessage &&
      lastMessage.role === "assistant" &&
      !!lastMessage.venues?.length;

    if (!assistantVenuesReady) return;

    const raf = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        latestAssistantResultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [isThinking, messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (userMessageCount >= FREE_USER_MESSAGE_LIMIT || isThinking) return;
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
      latestAssistantResultRef.current?.scrollIntoView({
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

  return (
    <main className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
      <div className="mx-auto flex min-h-screen max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:gap-12 lg:px-10">
        <section className="flex min-w-0 flex-1 flex-col min-h-0">
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                Concierge
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
                Nyra
              </h1>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-3">
              {isDev ? (
                <button
                  type="button"
                  onClick={handleDevReset}
                  className="rounded-full border border-neutral-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm shadow-neutral-900/5 backdrop-blur-sm transition-colors hover:bg-white"
                >
                  Reset
                </button>
              ) : null}
              {!isPaywalled ? (
                <p className="rounded-full border border-neutral-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm shadow-neutral-900/5 backdrop-blur-sm">
                  {freeMessagesRemaining} free message
                  {freeMessagesRemaining === 1 ? "" : "s"} remaining
                </p>
              ) : null}
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto pb-4">
            <div className="flex min-h-full flex-col justify-end gap-8">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  ref={index === messages.length - 1 ? latestMessageRef : undefined}
                  className={
                    message.role === "user"
                      ? "flex flex-col items-end text-right"
                      : ""
                  }
                >
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                    {message.role === "user" ? "You" : "Nyra"}
                  </p>

                  <div
                    ref={
                      message.role === "assistant" && message.isThinking
                        ? thinkingBubbleRef
                        : message.role === "assistant" && index === messages.length - 1
                          ? latestAssistantMessageRef
                          : undefined
                    }
                    className={`relative max-w-[min(100%,42rem)] text-[15px] leading-relaxed tracking-[-0.01em] transition-[opacity,transform] duration-300 ease-out tracking-[-0.01em] ${
                      message.role === "user"
                        ? "rounded-2xl bg-neutral-900 px-5 py-3.5 text-white shadow-md shadow-neutral-900/10"
                        : message.isThinking
                          ? "rounded-2xl border border-neutral-200/70 bg-neutral-100/70 px-5 py-3.5 text-neutral-700 shadow-sm shadow-neutral-900/[0.04]"
                          : "rounded-2xl border border-neutral-100 bg-white px-5 py-3.5 text-neutral-800 shadow-sm shadow-neutral-900/[0.04]"
                    }`}
                    style={
                      message.role === "assistant" && message.isThinking
                        ? { animation: "nyraThinkingBubbleIn 220ms ease-out both" }
                        : message.role === "assistant" &&
                            assistantRevealMessageId === message.id
                          ? { animation: "nyraAssistantReveal 340ms ease-out both" }
                        : undefined
                    }
                  >
                    {message.role === "assistant" &&
                    !message.isThinking &&
                    thinkingExitMessageId === message.id ? (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{ animation: "nyraThinkingBubbleOut 320ms ease-in both" }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="flex items-center gap-1.5"
                            style={{ opacity: 0.85 }}
                          >
                            <span className="nyra-typing-dot" />
                            <span className="nyra-typing-dot nyra-typing-dot--2" />
                            <span className="nyra-typing-dot nyra-typing-dot--3" />
                          </span>
                          <span className="block">
                            {THINKING_MESSAGES[thinkingMessageIndex]}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {message.role === "assistant" && message.isThinking ? (
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex items-center gap-1.5"
                          style={{ opacity: 0.85 }}
                        >
                          <span className="nyra-typing-dot" />
                          <span className="nyra-typing-dot nyra-typing-dot--2" />
                          <span className="nyra-typing-dot nyra-typing-dot--3" />
                        </span>
                        <span
                          key={thinkingMessageIndex}
                          className="block will-change-[opacity,transform]"
                          style={{
                            animation: `nyraThinkingMessage ${thinkingMessageRotationMs}ms ease-in-out both`,
                          }}
                        >
                          {THINKING_MESSAGES[thinkingMessageIndex]}
                        </span>
                      </div>
                    ) : (
                      message.text
                    )}
                  </div>

                  {message.role === "assistant" && message.venues ? (
                    <>
                      <p className="mt-4 max-w-[min(100%,42rem)] text-sm leading-relaxed text-neutral-500">
                        These are the strongest matches based on your criteria:
                      </p>
                      <div
                        ref={
                          index === messages.length - 1
                            ? latestAssistantResultRef
                            : undefined
                        }
                        className="nyra-venues-reveal mt-4 grid gap-4 sm:grid-cols-2"
                        style={{
                          animation: "nyraVenuesReveal 420ms ease-out both",
                          animationDelay: "70ms",
                        }}
                      >
                        {message.venues.map((venue) => {
                          const selected = selectedVenueIds.includes(venue.id);

                          return (
                            <div
                              key={venue.id}
                              className={`group relative rounded-2xl border p-5 shadow-sm ring-1 transition-all duration-200 hover:shadow-md hover:shadow-neutral-900/[0.08] ${
                                selected
                                  ? "border-neutral-300 bg-neutral-50 shadow-neutral-900/[0.08] ring-neutral-900/5"
                                  : "border-neutral-200/70 bg-white shadow-neutral-900/[0.06] ring-black/[0.02]"
                              } ${
                                pulseVenueCards
                                  ? "nyra-venue-card--pulse ring-neutral-900/25"
                                  : ""
                              }`}
                            >
                              {selected ? (
                                <span
                                  aria-hidden
                                  className="absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[12px] font-semibold leading-none text-white shadow-sm shadow-neutral-900/20"
                                >
                                  ✓
                                </span>
                              ) : null}
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-neutral-950">
                                  {venue.name}
                                </h3>
                                <span className="shrink-0 rounded-full border border-neutral-200/80 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
                                  {venue.tag}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                                {venue.location}
                                <span className="text-neutral-300"> · </span>
                                {venue.price}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                                {venue.whyFit}
                              </p>

                              <button
                                type="button"
                                onClick={() => toggleVenue(venue.id)}
                                className={`mt-4 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                  selected
                                    ? "bg-neutral-900 text-white shadow-sm shadow-neutral-900/15"
                                    : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                                }`}
                              >
                                {selected ? "Selected" : "Select"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-neutral-200/60 bg-neutral-50/95 py-5 backdrop-blur-md supports-[backdrop-filter]:bg-neutral-50/80">
            {isPaywalled ? (
              <>
                <p className="mb-4 text-sm leading-relaxed text-neutral-600">
                  {
                    "If you'd like, I can reach out to these venues and get real pricing and availability for you."
                  }
                </p>
                <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-7 shadow-[0_1px_0_rgba(0,0,0,0.04),0_18px_48px_-12px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.03] sm:p-9">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"
                  />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                    Your search
                  </p>
                  <p className="mt-2 text-sm font-medium text-neutral-700">
                    We found 18 venues that match your request
                  </p>
                  <h2 className="mt-3 max-w-2xl text-xl font-semibold tracking-[-0.02em] text-neutral-950 sm:text-2xl sm:leading-[1.2]">
                    Get real pricing & availability from your top matches
                  </h2>
                  <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-600">
                    We contact venues for you, confirm real pricing + open date
                    windows, then summarize everything in a decision-ready report.
                  </p>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">
                    Skip hours of emailing venues. No back-and-forth needed.
                  </p>
                  <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                    What happens next
                  </p>
                  <ol className="mt-3 space-y-3.5">
                    {[
                      "We reach out to your selected venues",
                      "We gather pricing, availability, and fit",
                      "You receive a curated report in 24–72 hours",
                    ].map((item, index) => (
                      <li
                        key={item}
                        className="flex gap-3.5 text-[15px] leading-snug text-neutral-800"
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold leading-none text-white"
                        >
                          {index + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-9">
                    <button
                      type="button"
                      onClick={handleVenueReportCta}
                      className="w-full rounded-2xl bg-neutral-900 px-6 py-4 text-[15px] font-semibold tracking-tight text-white shadow-lg shadow-neutral-900/25 transition-[transform,opacity] hover:opacity-95 active:scale-[0.99] sm:w-auto sm:min-w-[220px] sm:px-10"
                    >
                      Get my venue report — $99
                    </button>
                    {venueSelectionHint ? (
                      <p
                        className="mt-3 text-sm font-medium text-amber-800"
                        role="status"
                        aria-live="polite"
                      >
                        {venueSelectionHint}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[11px] leading-snug text-neutral-500">
                      One-time payment. No subscription.
                    </p>
                    <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-neutral-500">
                      We limit outreach requests each week to ensure quality.
                    </p>
                  </div>
                  <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
                    Used by couples planning weddings of all sizes.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 border-t border-neutral-200/70 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <p className="text-xs leading-relaxed text-neutral-500">
                      Delivered in 24–72 hours · no back-and-forth emails needed
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="w-full min-w-0">
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Refine your search..."
                    className="min-h-[48px] flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 shadow-sm shadow-neutral-900/[0.03] outline-none ring-neutral-900/5 transition-[box-shadow,border-color] placeholder:text-neutral-400 focus:border-neutral-300 focus:ring-4"
                  />
                  <button
                    type="submit"
                    disabled={isThinking}
                    className="shrink-0 rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-md shadow-neutral-900/15 transition-opacity hover:opacity-90"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-10 rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm shadow-neutral-900/[0.05] ring-1 ring-black/[0.02]">
            <p className="text-xs leading-relaxed text-neutral-500">
              Select venues to include in your outreach report
            </p>
            <h2 className="text-sm font-semibold tracking-tight text-neutral-950">
              Selected venues
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Shortlist to contact in one step.
            </p>

            {selectedVenueIds.length === 0 ? (
              <p className="mt-6 text-sm leading-relaxed text-neutral-400">
                No venues selected
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {selectedVenueIds.map((id) => {
                  const venue = venueById.get(id);
                  return (
                    <li
                      key={id}
                      className="text-sm font-medium leading-snug text-neutral-800"
                    >
                      {venue?.name}
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              onClick={handleVenueReportCta}
              className="mt-8 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-medium text-white shadow-sm shadow-neutral-900/20 transition-opacity hover:opacity-95"
            >
              Contact venues
            </button>
            {venueSelectionHint ? (
              <p
                className="mt-3 text-sm font-medium text-amber-800"
                role="status"
                aria-live="polite"
              >
                {venueSelectionHint}
              </p>
            ) : null}
          </div>
        </aside>
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

    @keyframes nyraVenuesReveal {
      0% { opacity: 0; transform: translateY(4px); max-height: 0px; }
      100% { opacity: 1; transform: translateY(0px); max-height: 800px; }
    }

    @keyframes nyraVenueSelectHintPulse {
      0%, 100% {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        border-color: rgba(229, 229, 229, 0.85);
      }
      50% {
        box-shadow:
          0 0 0 3px rgba(23, 23, 23, 0.1),
          0 10px 28px -8px rgba(0, 0, 0, 0.12);
        border-color: rgba(163, 163, 163, 0.95);
      }
    }

    .nyra-venue-card--pulse {
      animation: nyraVenueSelectHintPulse 420ms ease-in-out 2;
    }

    .nyra-venues-reveal {
      overflow: hidden;
      will-change: opacity, transform, max-height;
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
      .nyra-venues-reveal {
        animation: none !important;
        max-height: none !important;
        overflow: visible !important;
      }

      .nyra-venue-card--pulse {
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
      <main className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased" />
    }
  >
    <ThinkingStyles />
    <ChatPageContent />
  </Suspense>
);

export default ChatPage;