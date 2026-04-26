"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import type { OutreachItemStatus } from "@/components/SelectedVenuesSidebar";
import type { PlannerTextEntry, VenuePlannerEntry } from "@/components/venuePlannerState";

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

const sectionEyebrow =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-chat-text-muted";

/** Expanded planner only: label + helper aligned with rail semantics; pipeline uses distinct labels where the rail still says “Shortlisted”. */
function plannerOutreachStatusPresentation(status: OutreachItemStatus): {
  label: string;
  helper: string;
  dotClass: string;
} {
  switch (status) {
    case "queued":
      return {
        label: "Queued",
        helper: "Waiting to send inquiry",
        dotClass: "bg-chat-text-muted/55",
      };
    case "drafting-outreach":
      return {
        label: "Sending",
        helper: "Nyra is contacting this venue",
        dotClass: "bg-nyra-accent/55",
      };
    case "contacted":
      return {
        label: "Inquiry sent",
        helper: "Waiting for venue response.",
        dotClass: "bg-emerald-500/45",
      };
    case "replied":
      return {
        label: "Response received",
        helper: "Review this venue's reply.",
        dotClass: "bg-sky-400/50",
      };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function plannerShortlistStatusPresentation(): {
  label: string;
  helper: string;
  dotClass: string;
} {
  return {
    label: "Shortlisted",
    helper: "Ready to contact",
    dotClass: "bg-chat-text-muted/55",
  };
}

/** Relative time for “Inquiry sent … ago” (contacted state). */
function formatInquirySentRelative(statusUpdatedAt: number): string {
  const diffMs = Date.now() - statusUpdatedAt;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "Inquiry sent just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? "Inquiry sent 1 minute ago" : `Inquiry sent ${min} minutes ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? "Inquiry sent 1 hour ago" : `Inquiry sent ${hr} hours ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return day === 1 ? "Inquiry sent 1 day ago" : `Inquiry sent ${day} days ago`;
  return `Inquiry sent ${new Date(statusUpdatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

const statusBlockSurface =
  "rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:px-5 sm:py-5";

const outreachStatusEyebrow =
  "text-[12px] font-semibold uppercase tracking-[0.14em] text-chat-text-primary";

const proseClass = "text-[13px] leading-relaxed text-chat-text-secondary";

const SUMMARY_MAX = 110;

function truncateForSummary(text: string, max = SUMMARY_MAX): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max).trimEnd();
  const lastSpace = slice.lastIndexOf(" ");
  const head = lastSpace > 40 ? slice.slice(0, lastSpace) : slice;
  return `${head}…`;
}

const GUEST_RE =
  /\b(\d{1,5})\s*(guests?|people|attendees?|pax)\b/i;
const GUEST_RE_ALT = /\b(?:for|of|about)\s+(\d{1,5})\s+(?:guests?|people)\b/i;

function extractGuestCountBullet(brief: string): string | null {
  const m = brief.match(GUEST_RE) ?? brief.match(GUEST_RE_ALT);
  if (!m) return null;
  const n = m[1] ?? m[0];
  return `About ${n} guests`;
}

function extractBudgetBullet(brief: string): string | null {
  const range = brief.match(/\$\s*[\d,]+(?:\s*[-–]\s*\$\s*[\d,]+)?/);
  if (range) return `Budget: ${range[0].replace(/\s+/g, " ")}`;
  const labeled = brief.match(
    /\b(?:budget|around)\s*:?\s*([\$.\d,\s]+(?:k|K)?)\b/i
  );
  if (labeled?.[1]) return `Budget: ${labeled[1].trim().slice(0, 72)}`;
  return null;
}

const MONTH_RE =
  /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i;

function extractWhenWhereBullet(brief: string): string | null {
  const lines = brief.split(/\n+|•|·|\u2022/).map((s) => s.trim()).filter(Boolean);
  const withMonthOrYear = lines.find(
    (s) => MONTH_RE.test(s) || /\b20\d{2}\b/.test(s)
  );
  if (withMonthOrYear) return truncateForSummary(withMonthOrYear, 130);
  for (const line of lines) {
    if (line.length < 8) continue;
    if (/^\d{1,5}\s*(guests?|people|attendees?|pax)\.?$/i.test(line)) continue;
    return truncateForSummary(line, 130);
  }
  const one = brief.trim();
  if (one.length < 8) return null;
  if (/^\d{1,5}\s*(guests?|people)\.?$/i.test(one)) return null;
  return truncateForSummary(one, 130);
}

type SummaryBullet = { key: string; text: string };

/** Guest count → date/location → budget → what was asked; uses existing brief strings only. */
function buildWhatNyraSentBullets(originalBrief: string, whatNyraAsked: string): SummaryBullet[] {
  const brief = originalBrief.trim();
  const asked = whatNyraAsked.trim();
  const bullets: SummaryBullet[] = [];

  const guest = brief ? extractGuestCountBullet(brief) : null;
  if (guest) bullets.push({ key: "guests", text: guest });

  const whenWhereRaw = brief ? extractWhenWhereBullet(brief) : null;
  const whenWhereDuplicative =
    Boolean(guest) &&
    whenWhereRaw != null &&
    /\b(guests?|people|attendees?)\b/i.test(whenWhereRaw) &&
    !MONTH_RE.test(whenWhereRaw) &&
    !/\b20\d{2}\b/.test(whenWhereRaw);
  if (whenWhereRaw && !whenWhereDuplicative) {
    bullets.push({ key: "whenwhere", text: whenWhereRaw });
  }

  const budget = brief ? extractBudgetBullet(brief) : null;
  if (budget) bullets.push({ key: "budget", text: budget });

  const hasStructured = Boolean(guest || whenWhereRaw || budget);
  if (brief && !hasStructured) {
    bullets.push({ key: "brief", text: truncateForSummary(brief, 130) });
  }

  if (asked) {
    bullets.push({ key: "asked", text: truncateForSummary(asked, 140) });
  }

  return bullets;
}

type OutreachTimeline = {
  primaryLine: string;
  secondaryLine: string | null;
  nextStep: string;
};

function outreachTimelineCopy(
  outreachStatus: OutreachItemStatus | null,
  statusUpdatedAt: number | null
): OutreachTimeline {
  const ts =
    typeof statusUpdatedAt === "number" && Number.isFinite(statusUpdatedAt)
      ? statusUpdatedAt
      : null;

  if (outreachStatus == null) {
    return {
      primaryLine: "Ready to contact",
      secondaryLine: "Nyra will reach out to check availability and pricing",
      nextStep:
        "Use Contact venues at the bottom of the shortlist. The button shows how many shortlisted venues are included.",
    };
  }

  switch (outreachStatus) {
    case "queued":
      return {
        primaryLine: "Queued to send",
        secondaryLine: "Nyra will reach out to this venue shortly.",
        nextStep: "Inquiries send in order with your other shortlisted venues.",
      };
    case "drafting-outreach":
      return {
        primaryLine: "Sending your inquiry",
        secondaryLine: "Nyra is contacting this venue now.",
        nextStep:
          "You will see timing and a message summary here as soon as the inquiry is sent.",
      };
    case "contacted":
      return {
        primaryLine: ts != null ? formatInquirySentRelative(ts) : "Inquiry sent",
        secondaryLine: "Waiting for venue response",
        nextStep: "Nyra will follow up in 48 hours if no reply.",
      };
    case "replied":
      return {
        primaryLine: "Venue responded",
        secondaryLine: "Review this venue's reply.",
        nextStep:
          "Nyra will keep following up for you. Add a specific question only if you want something extra.",
      };
    default: {
      const _exhaustive: never = outreachStatus;
      return _exhaustive;
    }
  }
}

const inputBase =
  "mt-2 min-h-[4rem] w-full resize-y rounded-xl px-3 py-2.5 text-[13px] leading-relaxed text-chat-text-primary placeholder:text-chat-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-white/15";

const inputClassFollow =
  "mt-1.5 min-h-[2.75rem] w-full resize-y rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-2 text-[12px] leading-relaxed text-chat-text-primary placeholder:text-chat-text-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/12 sm:min-h-[3rem]";

const inputClassNote =
  `${inputBase} border border-chat-border-muted bg-white/[0.02] focus-visible:ring-white/12`;

function SectionClarityBadge({
  children,
  variant,
  className,
}: {
  children: ReactNode;
  variant: "venue" | "private";
  className?: string;
}) {
  const base =
    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]";
  if (variant === "venue") {
    return (
      <span
        className={`${base} border border-emerald-400/25 bg-emerald-500/[0.12] text-emerald-100/90 ${className ?? ""}`}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`${base} border border-white/[0.08] bg-white/[0.04] text-chat-text-muted ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

function EntryList({
  label,
  entries,
  emptyHint,
}: {
  label: string;
  entries: PlannerTextEntry[];
  emptyHint: string;
}) {
  if (entries.length === 0) {
    return (
      <div>
        <p className={sectionEyebrow}>{label}</p>
        <p className={`mt-2 text-[12px] leading-snug text-chat-text-muted`}>{emptyHint}</p>
      </div>
    );
  }
  return (
    <div>
      <p className={sectionEyebrow}>{label}</p>
      <ul className="mt-2 flex list-none flex-col gap-2 p-0">
        {entries.map((e) => (
          <li
            key={e.id}
            className="rounded-xl border border-chat-border-muted bg-white/[0.03] px-3 py-2.5"
          >
            <p className={proseClass}>{e.text}</p>
            <p className="mt-1.5 text-[11px] text-chat-text-muted">
              {new Date(e.at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FollowUpEntryList({ entries }: { entries: PlannerTextEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="mt-2 flex list-none flex-col gap-2 p-0">
      {entries.map((e) => (
        <li
          key={e.id}
          className="rounded-xl border border-chat-border-muted bg-white/[0.03] px-3 py-2.5"
        >
          <p className={proseClass}>{e.text}</p>
          <p className="mt-1.5 text-[11px] text-chat-text-muted">
            {new Date(e.at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </li>
      ))}
    </ul>
  );
}

export type VenuePlannerDetailPanelProps = {
  venueName: string;
  outreachStatus: OutreachItemStatus | null;
  /** When the outreach row last changed status; for “contacted”, drives “Inquiry sent … ago”. */
  statusUpdatedAt?: number | null;
  originalBrief: string;
  whatNyraAsked: string;
  planner: VenuePlannerEntry;
  isArchived: boolean;
  onClose: () => void;
  onAddNyraNote: (text: string) => void;
  onAddFollowUp: (text: string) => void;
  onArchive: () => void;
  onRestore: () => void;
  /** When true with `onContactThisVenueOnly`, show a secondary scoped outreach action. */
  contactThisVenueOnlyVisible?: boolean;
  onContactThisVenueOnly?: () => void;
};

function isInquirySentOrReplied(status: OutreachItemStatus | null): boolean {
  return status === "contacted" || status === "replied";
}

export function VenuePlannerDetailPanel({
  venueName,
  outreachStatus,
  statusUpdatedAt,
  originalBrief,
  whatNyraAsked,
  planner,
  isArchived,
  onClose,
  onAddNyraNote,
  onAddFollowUp,
  onArchive,
  onRestore,
  contactThisVenueOnlyVisible = false,
  onContactThisVenueOnly,
}: VenuePlannerDetailPanelProps) {
  const noteDraftId = useId();
  const followDraftId = useId();
  const followComposerPanelId = useId();
  const [noteDraft, setNoteDraft] = useState("");
  const [followDraft, setFollowDraft] = useState("");
  const [followUpAck, setFollowUpAck] = useState(false);
  const [followComposerOpen, setFollowComposerOpen] = useState(false);
  const [inquiryFullOpen, setInquiryFullOpen] = useState(false);
  const followUpAckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (followUpAckTimerRef.current != null) {
        clearTimeout(followUpAckTimerRef.current);
      }
    };
  }, []);

  const briefTrim = originalBrief.trim();
  const askedTrim = whatNyraAsked.trim();

  const ts =
    typeof statusUpdatedAt === "number" && Number.isFinite(statusUpdatedAt)
      ? statusUpdatedAt
      : null;

  const timeline = outreachTimelineCopy(outreachStatus, ts);

  const postContactStatusDotClass =
    outreachStatus != null && isInquirySentOrReplied(outreachStatus)
      ? plannerOutreachStatusPresentation(outreachStatus).dotClass
      : plannerShortlistStatusPresentation().dotClass;

  const submitNote = () => {
    const t = noteDraft.trim();
    if (!t) return;
    onAddNyraNote(t);
    setNoteDraft("");
  };

  const submitFollow = () => {
    const t = followDraft.trim();
    if (!t) return;
    onAddFollowUp(t);
    setFollowDraft("");
    if (followUpAckTimerRef.current != null) {
      clearTimeout(followUpAckTimerRef.current);
    }
    setFollowUpAck(true);
    followUpAckTimerRef.current = setTimeout(() => {
      followUpAckTimerRef.current = null;
      setFollowUpAck(false);
    }, 4000);
  };

  const messageSummaryBullets = buildWhatNyraSentBullets(briefTrim, askedTrim);
  const hasInquirySummary = Boolean(briefTrim || askedTrim);
  const showWhatNyraSentDetail =
    outreachStatus === "contacted" || outreachStatus === "replied";
  const fullMessageWorthToggle =
    briefTrim.length > SUMMARY_MAX ||
    askedTrim.length > SUMMARY_MAX ||
    (Boolean(briefTrim) && Boolean(askedTrim));

  /** Before an inquiry is on record (includes queued / drafting). Full tools once sent or venue replied. */
  const showPreContactSimplified = !isInquirySentOrReplied(outreachStatus);
  const preContactPresentation =
    outreachStatus == null
      ? {
          dotClass: "bg-amber-300/72",
          title: "Ready to contact",
          subtitle: "Nyra will reach out to check availability and pricing",
        }
      : outreachStatus === "drafting-outreach"
        ? {
            dotClass: plannerOutreachStatusPresentation("drafting-outreach").dotClass,
            title: "Sending",
            subtitle: "Nyra is contacting this venue",
          }
        : {
            dotClass: plannerOutreachStatusPresentation("queued").dotClass,
            title: plannerOutreachStatusPresentation("queued").label,
            subtitle: plannerOutreachStatusPresentation("queued").helper,
          };

  return (
    <div
      id="nyra-venue-planner-panel"
      className="min-w-0"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <header className="flex items-start justify-between gap-4 border-b border-chat-border-muted pb-5">
        <div className="min-w-0 flex-1">
          <p className="nyra-eyebrow">Venue</p>
          <h2 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.03em] text-chat-text-primary">
            {venueName}
          </h2>
          {isArchived ? (
            <p className="mt-3 text-[12px] font-medium text-amber-200/90">
              Removed from shortlist — not on your active list.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-chat-border bg-white/[0.04] px-3 py-2 text-[12px] font-semibold tracking-[-0.02em] text-chat-text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-[color,background-color,border-color] hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-chat-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-chat-sidebar"
        >
          <CloseIcon className="h-3.5 w-3.5" />
          Close
        </button>
      </header>

      <div className="mt-5 flex flex-col gap-6">
        {showPreContactSimplified ? (
          <div>
            <p className={outreachStatusEyebrow}>Outreach status</p>
            <div className={`mt-3 ${statusBlockSurface}`}>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-0">
                <span
                  className={`row-start-1 mt-[0.35em] size-2 shrink-0 self-start rounded-full ${preContactPresentation.dotClass}`}
                  aria-hidden
                />
                <p className="col-start-2 row-start-1 text-[14px] font-semibold leading-snug tracking-[-0.02em] text-chat-text-primary">
                  {preContactPresentation.title}
                </p>
                <div className="col-start-2 row-start-2 mt-1.5 min-w-0 space-y-1">
                  <p className="text-[11.5px] leading-snug text-chat-text-secondary/65">
                    {preContactPresentation.subtitle}
                  </p>
                  {outreachStatus == null ? (
                    <p className="text-[11.5px] leading-snug text-chat-text-secondary/65">
                      Based on your guest count, date, and budget
                    </p>
                  ) : null}
                </div>
              </div>
              {outreachStatus == null &&
              contactThisVenueOnlyVisible &&
              onContactThisVenueOnly ? (
                <button
                  type="button"
                  onClick={onContactThisVenueOnly}
                  className="mt-3 inline-flex max-w-full self-start rounded-sm border-0 bg-transparent px-0 py-0.5 text-left text-[12px] font-normal leading-snug tracking-[-0.01em] text-chat-text-muted/90 underline decoration-white/[0.12] decoration-1 underline-offset-[0.22em] transition-[color,text-decoration-color] hover:text-chat-text-secondary hover:decoration-white/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-chat-sidebar"
                >
                  Contact only this venue →
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div>
              <p className={outreachStatusEyebrow}>Outreach status</p>
              <div className={`mt-3 ${statusBlockSurface}`}>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-0.5" aria-hidden>
                    <span className={`size-2 shrink-0 rounded-full ${postContactStatusDotClass}`} />
                    <div className="my-1.5 w-px min-h-[12px] flex-1 bg-gradient-to-b from-white/22 to-white/8" />
                    <span className="size-1.5 shrink-0 rounded-full bg-white/28" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-[14px] font-semibold leading-snug tracking-[-0.02em] text-chat-text-primary">
                      {timeline.primaryLine}
                    </p>
                    {timeline.secondaryLine ? (
                      <p className="text-[13px] leading-snug text-chat-text-secondary">{timeline.secondaryLine}</p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.045] px-3.5 py-3 text-[13px] font-medium leading-relaxed text-chat-text-primary">
                  No action needed — Nyra will handle follow-ups automatically
                </p>

                <div className="mt-4 border-t border-white/[0.08] pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-chat-text-muted">
                    Next step
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-chat-text-secondary">{timeline.nextStep}</p>
                </div>

                <div className="mt-4 border-t border-white/[0.08] pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-chat-text-muted">
                    What Nyra sent
                  </p>
                  {showWhatNyraSentDetail ? (
                    hasInquirySummary ? (
                      <>
                        {!inquiryFullOpen ? (
                          messageSummaryBullets.length > 0 ? (
                            <ul className="mt-2 list-disc space-y-1.5 pl-4 marker:text-chat-text-muted">
                              {messageSummaryBullets.map((b) => (
                                <li key={b.key} className={`${proseClass} pl-0.5`}>
                                  {b.text}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={`mt-2 text-[12px] leading-snug text-chat-text-muted`}>
                              A summary of what went to this venue will appear here.
                            </p>
                          )
                        ) : (
                          <div className="mt-2 space-y-3 rounded-xl border border-chat-border-muted bg-white/[0.03] px-3 py-3">
                            {briefTrim ? (
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-chat-text-muted">
                                  From your brief
                                </p>
                                <p className={`mt-1.5 whitespace-pre-wrap ${proseClass}`}>{originalBrief}</p>
                              </div>
                            ) : null}
                            {askedTrim ? (
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-chat-text-muted">
                                  {"Nyra's message to the venue"}
                                </p>
                                <p className={`mt-1.5 whitespace-pre-wrap ${proseClass}`}>{whatNyraAsked}</p>
                              </div>
                            ) : null}
                          </div>
                        )}
                        {fullMessageWorthToggle ? (
                          <button
                            type="button"
                            onClick={() => setInquiryFullOpen((o) => !o)}
                            aria-expanded={inquiryFullOpen}
                            className="mt-2 text-left text-[12px] font-semibold text-nyra-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-chat-sidebar rounded-sm"
                          >
                            {inquiryFullOpen ? "Show summary" : "View full message"}
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <p className={`mt-2 text-[12px] leading-snug text-chat-text-muted`}>
                        Once the inquiry is sent, a short summary of what went to this venue will appear
                        here.
                      </p>
                    )
                  ) : (
                    <p className={`mt-2 text-[12px] leading-snug text-chat-text-muted`}>
                      You will see guest count, timing, budget, and what was asked once the inquiry is
                      sent.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className={sectionEyebrow}>Optional: ask something specific</p>
                <SectionClarityBadge
                  variant="venue"
                  className="border-emerald-400/15 bg-emerald-500/[0.06] text-[9px] text-emerald-100/75"
                >
                  Sent to venue
                </SectionClarityBadge>
              </div>
              {planner.followUps.length > 0 ? (
                <FollowUpEntryList entries={planner.followUps} />
              ) : null}
              <button
                type="button"
                hidden={followComposerOpen}
                onClick={() => setFollowComposerOpen(true)}
                aria-expanded={followComposerOpen}
                aria-controls={followComposerPanelId}
                className="mt-2 w-full rounded-lg border border-dashed border-white/[0.12] bg-transparent px-3 py-2.5 text-left text-[12px] font-semibold leading-snug text-chat-text-secondary transition-[color,background-color,border-color] hover:border-white/[0.18] hover:bg-white/[0.03] hover:text-chat-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-chat-sidebar"
              >
                Want Nyra to ask something specific?
              </button>
              <div
                id={followComposerPanelId}
                hidden={!followComposerOpen}
                className="mt-2"
              >
                <p className="text-[11px] leading-snug text-chat-text-muted">
                  Nyra will already follow up automatically. Add something only if you want to.
                </p>
                <label htmlFor={followDraftId} className="sr-only">
                  Optional message for Nyra to send to this venue
                </label>
                <textarea
                  id={followDraftId}
                  value={followDraft}
                  onChange={(e) => setFollowDraft(e.target.value)}
                  rows={2}
                  placeholder="e.g. Ask if outside catering is allowed, and confirm rain backup options"
                  className={inputClassFollow}
                />
                <button
                  type="button"
                  onClick={submitFollow}
                  disabled={!followDraft.trim()}
                  className="mt-2 nyra-btn-chat-secondary w-full disabled:pointer-events-none disabled:opacity-45"
                >
                  Have Nyra follow up
                </button>
                <button
                  type="button"
                  onClick={() => setFollowComposerOpen(false)}
                  className="mt-2 text-[11px] font-medium text-chat-text-muted underline-offset-2 hover:text-chat-text-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-chat-sidebar rounded-sm"
                >
                  Hide
                </button>
                {followUpAck ? (
                  <p className="mt-2 text-[12px] font-medium leading-snug text-emerald-200/90" role="status">
                    Nyra is following up with this venue
                  </p>
                ) : null}
              </div>
            </div>

            <EntryList
              label="Notes for Nyra"
              entries={planner.nyraNotes}
              emptyHint="Private context for Nyra only — not sent to venues."
            />

            <div className="rounded-xl border border-chat-border-muted/80 bg-white/[0.015] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-[13px] font-medium tracking-[-0.015em] text-chat-text-secondary">
                  Internal note
                </h3>
                <SectionClarityBadge variant="private">Private</SectionClarityBadge>
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-chat-text-muted">
                Only Nyra will see this. Not sent to the venue.
              </p>
              <label htmlFor={noteDraftId} className="sr-only">
                Internal note for Nyra
              </label>
              <textarea
                id={noteDraftId}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                placeholder="e.g. Prioritize venues with outdoor ceremony options…"
                className={inputClassNote}
              />
              <button
                type="button"
                onClick={submitNote}
                disabled={!noteDraft.trim()}
                className="mt-2 nyra-btn-chat-secondary w-full disabled:pointer-events-none disabled:opacity-45"
              >
                Save internal note
              </button>
            </div>
          </>
        )}

        <div className="border-t border-chat-border-muted pt-2">
          {isArchived ? (
            <button type="button" onClick={onRestore} className="nyra-btn-primary w-full">
              Restore to shortlist
            </button>
          ) : (
            <button type="button" onClick={onArchive} className="nyra-btn-chat-secondary w-full">
              Remove from shortlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
