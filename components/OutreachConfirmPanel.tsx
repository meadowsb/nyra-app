"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { OutreachItem, OutreachItemStatus } from "@/components/SelectedVenuesSidebar";

type OutreachConfirmVenueRow = { id: string; name: string };

export type OutreachConfirmPhase = "review" | "progress" | "success";

/** Used when the optional note is blank; keep in sync with `handleConfirmOutreach` in `app/chat/page.tsx`. */
export const OUTREACH_DEFAULT_INQUIRY_BLURB =
  "Standard inquiry for availability, ballpark pricing, and fit with the guest count and style in your brief.";

type StructuredBrief = {
  guestCount: string;
  location: string;
  date: string;
  budget: string;
  additionalContext: string;
};

const emptyStructured = (): StructuredBrief => ({
  guestCount: "",
  location: "",
  date: "",
  budget: "",
  additionalContext: "",
});

const LINE_KEYS = [
  ["guestCount", "Guests:"],
  ["location", "Location:"],
  ["date", "Date:"],
  ["budget", "Budget:"],
] as const;

function skipBlankLines(lines: readonly string[], start: number): number {
  let i = start;
  while (i < lines.length && !lines[i]!.trim()) i += 1;
  return i;
}

/** Parse stored brief; legacy freeform becomes `additionalContext` only. */
function parseStructuredBrief(raw: string): StructuredBrief {
  const t = raw.trim();
  if (!t) return emptyStructured();

  const lines = t.split(/\r?\n/);
  const first = skipBlankLines(lines, 0);
  const firstLine = (lines[first] ?? "").trim();
  const looksStructured = firstLine.toLowerCase().startsWith(LINE_KEYS[0][1].toLowerCase());
  if (!looksStructured) {
    return { ...emptyStructured(), additionalContext: t };
  }

  const keyed = new Map<string, string>();
  let i = first;
  for (const [field, prefix] of LINE_KEYS) {
    i = skipBlankLines(lines, i);
    const line = lines[i] ?? "";
    if (!line.toLowerCase().startsWith(prefix.toLowerCase())) {
      break;
    }
    keyed.set(field, line.slice(prefix.length).trim());
    i += 1;
  }

  i = skipBlankLines(lines, i);
  const ctxHeader = /^additional context:\s*$/i;
  if (lines[i] != null && ctxHeader.test(lines[i]!.trim())) {
    i += 1;
  }

  const additionalContext = lines.slice(i).join("\n").trim();

  return {
    guestCount: keyed.get("guestCount") ?? "",
    location: keyed.get("location") ?? "",
    date: keyed.get("date") ?? "",
    budget: keyed.get("budget") ?? "",
    additionalContext,
  };
}

function composeStructuredBrief(s: StructuredBrief): string {
  const parts: string[] = [];
  const g = s.guestCount.trim();
  const loc = s.location.trim();
  const d = s.date.trim();
  const b = s.budget.trim();
  const ctx = s.additionalContext.trim();

  parts.push(`Guests: ${g}`);
  parts.push(`Location: ${loc}`);
  parts.push(`Date: ${d}`);
  parts.push(`Budget: ${b}`);
  if (ctx) {
    parts.push("");
    parts.push("Additional context:");
    parts.push(ctx);
  }
  return parts.join("\n");
}

function dashOr(value: string): string {
  const t = value.trim();
  return t ? t : "—";
}

function BriefStructuredSummary({
  s,
  id,
  highlightRequiredGaps,
}: {
  s: StructuredBrief;
  id?: string;
  highlightRequiredGaps: boolean;
}) {
  const gOk = Boolean(s.guestCount.trim());
  const locOk = Boolean(s.location.trim());
  const rowValueClass = (ok: boolean) =>
    highlightRequiredGaps && !ok
      ? "text-amber-200/95"
      : "text-chat-text-primary";

  return (
    <div id={id} className="mt-2 rounded-xl border border-chat-border-muted bg-white/[0.02] px-3 py-3 sm:px-3.5">
      <dl className="m-0 grid gap-2.5 text-[13px] leading-snug">
        <div className="grid min-w-0 grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 gap-y-0.5 sm:grid-cols-[minmax(0,8.5rem)_1fr]">
          <dt className="m-0 font-semibold text-chat-text-primary">
            Guest count <span className="text-amber-200/90">*</span>
          </dt>
          <dd className={`m-0 min-w-0 font-medium ${rowValueClass(gOk)}`}>{dashOr(s.guestCount)}</dd>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 gap-y-0.5 sm:grid-cols-[minmax(0,8.5rem)_1fr]">
          <dt className="m-0 font-semibold text-chat-text-primary">
            Location <span className="text-amber-200/90">*</span>
          </dt>
          <dd className={`m-0 min-w-0 font-medium ${rowValueClass(locOk)}`}>{dashOr(s.location)}</dd>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 gap-y-0.5 sm:grid-cols-[minmax(0,8.5rem)_1fr]">
          <dt className="m-0 font-semibold text-chat-text-primary">Date</dt>
          <dd className={`m-0 min-w-0 font-medium ${rowValueClass(true)}`}>{dashOr(s.date)}</dd>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 gap-y-0.5 sm:grid-cols-[minmax(0,8.5rem)_1fr]">
          <dt className="m-0 font-semibold text-chat-text-primary">Budget</dt>
          <dd className={`m-0 min-w-0 font-medium ${rowValueClass(true)}`}>{dashOr(s.budget)}</dd>
        </div>
      </dl>
      {s.additionalContext.trim() ? (
        <div className="mt-3 border-t border-chat-border-muted pt-3">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-chat-text-primary">
            Additional notes
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-chat-text-secondary">
            {s.additionalContext.trim()}
          </p>
        </div>
      ) : null}
    </div>
  );
}

type OutreachConfirmPanelProps = {
  open: boolean;
  phase?: OutreachConfirmPhase;
  /** Snapshot order + labels while sending (after confirm). */
  progressVenues?: readonly OutreachConfirmVenueRow[] | null;
  outreachItems?: readonly OutreachItem[];
  reduceMotion?: boolean;
  /** Planning brief for this outreach (editable in review). */
  searchBrief: string;
  onSearchBriefCommit: (value: string) => void;
  /** Unchecked = excluded from this send only (shortlist unchanged). */
  excludedVenueIds: readonly string[];
  onToggleVenueIncluded: (venueId: string) => void;
  venues: readonly OutreachConfirmVenueRow[];
  venueNote: string;
  onVenueNoteChange: (value: string) => void;
  onRemoveVenue: (venueId: string) => void;
  onCancel: () => void;
  onViewProgress: () => void;
  /** End the in-progress batch: clear unsent queued/drafting rows for this batch only. */
  onStopOutreach: () => void;
  onStart: () => void;
};

const noteTextareaClass =
  "mt-1.5 min-h-[4rem] w-full resize-y rounded-xl border border-chat-border bg-chat-input px-3 py-2.5 text-[13px] leading-relaxed text-chat-text-primary placeholder:text-chat-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-white/15";

const fieldInputClass =
  "mt-1.5 w-full rounded-xl border border-chat-border bg-chat-input px-3 py-2 text-[13px] leading-snug text-chat-text-primary placeholder:text-chat-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-white/15";

const fieldLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-chat-text-muted";

const briefEditSectionTitleClass =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-chat-text-muted";

const inlineTextBtnClass =
  "rounded-md px-2 py-1 text-[12px] font-semibold text-nyra-accent transition-colors hover:bg-nyra-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/15";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function checklistLabel(status: OutreachItemStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "drafting-outreach":
      return "Sending…";
    case "contacted":
    case "replied":
      return "Inquiry sent";
    default: {
      const _e: never = status;
      return _e;
    }
  }
}

function ProgressStatusIcon({
  status,
  reduceMotion,
}: {
  status: OutreachItemStatus;
  reduceMotion: boolean;
}) {
  if (status === "contacted" || status === "replied") {
    return (
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/12 text-emerald-400/95"
      >
        <CheckIcon className="size-3" />
      </span>
    );
  }
  if (status === "drafting-outreach") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden>
        <span
          className={`size-2 rounded-full bg-nyra-accent shadow-[0_0_0_3px_rgba(192,132,151,0.18)] ${reduceMotion ? "" : "motion-safe:animate-pulse"}`}
        />
      </span>
    );
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden>
      <span className="size-2 rounded-full bg-chat-text-muted/45" />
    </span>
  );
}

export function OutreachConfirmPanel({
  open,
  phase = "review",
  progressVenues = null,
  outreachItems = [],
  reduceMotion = false,
  searchBrief,
  onSearchBriefCommit,
  excludedVenueIds,
  onToggleVenueIncluded,
  venues,
  venueNote,
  onVenueNoteChange,
  onRemoveVenue,
  onCancel,
  onViewProgress,
  onStopOutreach,
  onStart,
}: OutreachConfirmPanelProps) {
  const titleId = useId();
  const summaryId = useId();
  const noteFieldId = useId();
  const progressSubtitleId = useId();
  const successBodyId = useId();
  const guestFieldId = useId();
  const locationFieldId = useId();
  const dateFieldId = useId();
  const budgetFieldId = useId();
  const contextFieldId = useId();
  const startRef = useRef<HTMLButtonElement>(null);
  const viewProgressRef = useRef<HTMLButtonElement>(null);
  const guestInputRef = useRef<HTMLInputElement>(null);
  const savedHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Expanded inline fields (auto-saved; no separate save step). */
  const [briefExpanded, setBriefExpanded] = useState(false);
  /** After blur on a required field, show subtle emphasis on any still-empty required inputs. */
  const [requiredFieldsAttention, setRequiredFieldsAttention] = useState(false);
  const [savedHintVisible, setSavedHintVisible] = useState(false);

  const excludedSet = useMemo(() => new Set(excludedVenueIds), [excludedVenueIds]);

  const includedVenueCount = useMemo(
    () => venues.reduce((n, v) => (excludedSet.has(v.id) ? n : n + 1), 0),
    [venues, excludedSet]
  );

  const committedStructured = useMemo(() => parseStructuredBrief(searchBrief), [searchBrief]);

  const outreachByVenueId = useMemo(() => {
    const m = new Map<string, OutreachItem>();
    for (const row of outreachItems) m.set(row.venueId, row);
    return m;
  }, [outreachItems]);

  const briefComplete = useMemo(() => {
    const s = committedStructured;
    return Boolean(s.guestCount.trim() && s.location.trim());
  }, [committedStructured]);

  const startOutreachDisabled = includedVenueCount === 0 || !briefComplete;

  const handleStartOutreachClick = () => {
    if (startOutreachDisabled) return;
    onStart();
  };

  const updateBrief = (patch: Partial<StructuredBrief>) => {
    onSearchBriefCommit(composeStructuredBrief({ ...committedStructured, ...patch }));
    setSavedHintVisible(true);
    if (savedHintTimeoutRef.current) clearTimeout(savedHintTimeoutRef.current);
    savedHintTimeoutRef.current = setTimeout(() => {
      setSavedHintVisible(false);
      savedHintTimeoutRef.current = null;
    }, 1400);
  };

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setBriefExpanded(false);
    });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    startRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (savedHintTimeoutRef.current) clearTimeout(savedHintTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!briefExpanded || !open) return;
    queueMicrotask(() => guestInputRef.current?.focus({ preventScroll: true }));
  }, [briefExpanded, open]);

  useEffect(() => {
    if (open && phase === "success") {
      queueMicrotask(() => viewProgressRef.current?.focus({ preventScroll: true }));
    }
  }, [open, phase]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (phase === "review") {
        onCancel();
        return;
      }
      if (phase === "progress") {
        return;
      }
      onViewProgress();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onViewProgress, phase]);

  if (!open) return null;

  const isReview = phase === "review";
  const isProgress = phase === "progress";
  const isSuccess = phase === "success";

  const backdropDismiss = () => {
    if (isReview) onCancel();
    else if (isSuccess) onViewProgress();
  };

  const dialogDescribedBy = isReview
    ? `${summaryId} ${noteFieldId}`
    : isProgress
      ? progressSubtitleId
      : successBodyId;

  const expandBriefFields = () => {
    setRequiredFieldsAttention(false);
    setBriefExpanded(true);
  };

  const collapseBriefFields = () => {
    setRequiredFieldsAttention(false);
    setBriefExpanded(false);
  };

  const markRequiredAttentionIfIncomplete = () => {
    const s = committedStructured;
    if (!s.guestCount.trim() || !s.location.trim()) {
      setRequiredFieldsAttention(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
      {isProgress ? (
        <div
          aria-hidden
          className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-[2px]"
        />
      ) : (
        <button
          type="button"
          aria-label={
            isReview ? "Close confirmation" : "View progress in sidebar"
          }
          className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          onClick={backdropDismiss}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={dialogDescribedBy}
        aria-busy={isProgress}
        className="relative z-[1] flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-chat-border bg-chat-raised nyra-surface-soft sm:max-h-[min(86vh,640px)] sm:rounded-2xl"
      >
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 sm:px-6 ${isProgress ? "pb-7 pt-6 sm:pb-8 sm:pt-7" : isSuccess ? "pb-6 pt-6 sm:pb-7 sm:pt-7" : "pb-4 pt-6 sm:pb-5 sm:pt-7"}`}
        >
          {isReview ? (
            <>
              <p className="nyra-eyebrow">Start outreach</p>
              <h2
                id={titleId}
                className="mt-2.5 text-lg font-semibold leading-[1.2] tracking-[-0.03em] text-chat-text-primary"
              >
                Review your outreach
              </h2>

              <div className="mt-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-chat-text-muted">
                    Event brief
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    {briefExpanded ? (
                      <div
                        className="relative flex h-6 min-w-[2.75rem] items-center justify-end"
                        aria-hidden
                      >
                        <span
                          className={`absolute right-0 text-[11px] font-medium text-emerald-400/90 ${
                            reduceMotion ? "" : "motion-safe:transition-opacity motion-safe:duration-300"
                          } ${savedHintVisible ? "opacity-100" : "opacity-0"}`}
                        >
                          Saved
                        </span>
                      </div>
                    ) : null}
                    {!briefExpanded ? (
                      <button type="button" onClick={expandBriefFields} className={inlineTextBtnClass}>
                        Edit
                      </button>
                    ) : (
                      <button type="button" onClick={collapseBriefFields} className={inlineTextBtnClass}>
                        Done
                      </button>
                    )}
                  </div>
                </div>

                {!briefExpanded ? (
                  <div className="mt-2 space-y-3">
                    <BriefStructuredSummary
                      id={summaryId}
                      s={committedStructured}
                      highlightRequiredGaps={!briefComplete}
                    />
                    {!briefComplete ? (
                      <div
                        role="status"
                        className="rounded-xl border border-amber-500/45 bg-amber-500/[0.12] px-3.5 py-3 sm:px-4"
                      >
                        <div className="flex gap-3">
                          <span
                            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-200"
                            aria-hidden
                          >
                            <AlertTriangleIcon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold leading-snug text-chat-text-primary">
                              Missing event details
                            </p>
                            <p className="mt-1 text-[13px] font-medium leading-relaxed text-chat-text-primary">
                              Complete required fields to continue
                            </p>
                            <p className="mt-1.5 text-[12px] leading-relaxed text-chat-text-secondary">
                              Without these, venues cannot quote meaningfully or hold dates.
                            </p>
                            <button
                              type="button"
                              onClick={expandBriefFields}
                              className="mt-3 rounded-lg bg-chat-text-primary px-3 py-2 text-[12px] font-semibold text-chat-sidebar transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80"
                            >
                              Edit details
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div
                    id={summaryId}
                    className="mt-3 rounded-xl border border-chat-border-muted bg-white/[0.02] px-3 py-3.5 sm:px-3.5"
                  >
                    <p className="m-0 text-[12px] leading-snug text-chat-text-secondary">
                      <span className="font-semibold text-amber-200/90">*</span> Required to start
                      outreach
                    </p>

                    <div className="mt-4 flex flex-col gap-4">
                      <div>
                        <p className={`m-0 ${briefEditSectionTitleClass}`}>Required to start outreach</p>
                        <div className="mt-3 flex flex-col gap-4">
                          <div>
                            <label htmlFor={guestFieldId} className={fieldLabelClass}>
                              Guest count <span className="text-amber-200/90">*</span>
                            </label>
                            <input
                              ref={guestInputRef}
                              id={guestFieldId}
                              type="text"
                              inputMode="numeric"
                              aria-required
                              value={committedStructured.guestCount}
                              onChange={(e) => updateBrief({ guestCount: e.target.value })}
                              onBlur={markRequiredAttentionIfIncomplete}
                              placeholder="80"
                              autoComplete="off"
                              className={
                                fieldInputClass +
                                (requiredFieldsAttention && !committedStructured.guestCount.trim()
                                  ? " border-amber-500/55 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.22)] focus-visible:ring-amber-400/30"
                                  : "")
                              }
                            />
                          </div>
                          <div>
                            <label className={fieldLabelClass} htmlFor={locationFieldId}>
                              Location <span className="text-amber-200/90">*</span>
                            </label>
                            <input
                              id={locationFieldId}
                              type="text"
                              aria-required
                              value={committedStructured.location}
                              onChange={(e) => updateBrief({ location: e.target.value })}
                              onBlur={markRequiredAttentionIfIncomplete}
                              placeholder="Miami"
                              autoComplete="address-level2"
                              className={
                                fieldInputClass +
                                (requiredFieldsAttention && !committedStructured.location.trim()
                                  ? " border-amber-500/55 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.22)] focus-visible:ring-amber-400/30"
                                  : "")
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-chat-border-muted pt-4">
                        <p className={`m-0 ${briefEditSectionTitleClass}`}>Optional details</p>
                        <div className="mt-3 flex flex-col gap-4">
                          <div>
                            <label className={fieldLabelClass} htmlFor={dateFieldId}>
                              Date
                            </label>
                            <input
                              id={dateFieldId}
                              type="text"
                              value={committedStructured.date}
                              onChange={(e) => updateBrief({ date: e.target.value })}
                              placeholder="June 2026 or flexible"
                              autoComplete="off"
                              className={fieldInputClass}
                            />
                          </div>
                          <div>
                            <label className={fieldLabelClass} htmlFor={budgetFieldId}>
                              Budget
                            </label>
                            <input
                              id={budgetFieldId}
                              type="text"
                              value={committedStructured.budget}
                              onChange={(e) => updateBrief({ budget: e.target.value })}
                              placeholder="$15k–$25k or rough range"
                              autoComplete="off"
                              className={fieldInputClass}
                            />
                          </div>
                          <div>
                            <label className={fieldLabelClass} htmlFor={contextFieldId}>
                              Additional context
                            </label>
                            <textarea
                              id={contextFieldId}
                              value={committedStructured.additionalContext}
                              onChange={(e) => updateBrief({ additionalContext: e.target.value })}
                              rows={3}
                              placeholder="Style, timing, accessibility, anything venues should know…"
                              className={noteTextareaClass}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-chat-text-muted">
                  Venues
                </p>
                <ul className="mt-2 flex list-none flex-col gap-1.5 p-0" aria-label="Venues for this outreach">
                  {venues.map((row) => {
                    const included = !excludedSet.has(row.id);
                    return (
                      <li
                        key={row.id}
                        className={`flex min-h-0 items-center gap-2.5 rounded-lg py-0.5 ${included ? "" : "opacity-[0.62]"}`}
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={included}
                          onClick={() => onToggleVenueIncluded(row.id)}
                          aria-label={
                            included
                              ? `${row.name}, included in this send`
                              : `${row.name}, skipped for this send`
                          }
                          className={
                            "flex size-5 shrink-0 items-center justify-center rounded border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/15 " +
                            (included
                              ? "border-nyra-accent/45 bg-nyra-accent/14 text-nyra-accent"
                              : "border-chat-border bg-white/[0.04] text-chat-text-muted")
                          }
                        >
                          {included ? <CheckIcon className="size-3" /> : null}
                        </button>
                        <span className="min-w-0 flex-1 text-[13px] font-medium leading-[1.2] text-chat-text-primary">
                          {row.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveVenue(row.id)}
                          aria-label={`Remove ${row.name} from your shortlist`}
                          className="shrink-0 rounded-md p-1 text-chat-text-muted/80 transition-colors hover:text-chat-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
                        >
                          <TrashIcon className="pointer-events-none size-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-6">
                <label htmlFor={noteFieldId} className={fieldLabelClass}>
                  Note to venues <span className="font-normal normal-case tracking-normal text-chat-text-muted">(optional)</span>
                </label>
                <textarea
                  id={noteFieldId}
                  value={venueNote}
                  onChange={(e) => onVenueNoteChange(e.target.value)}
                  rows={3}
                  placeholder="Anything specific for this send…"
                  className={noteTextareaClass}
                />
              </div>
            </>
          ) : null}

          {isProgress && progressVenues?.length ? (
            <div role="status" aria-live="polite" aria-atomic="false">
              <p className="nyra-eyebrow">Outreach started</p>
              <h2
                id={titleId}
                className="mt-2.5 text-lg font-semibold leading-[1.2] tracking-[-0.03em] text-chat-text-primary"
              >
                Contacting venues…
              </h2>
              <p
                id={progressSubtitleId}
                className="mt-2 text-[13px] leading-relaxed text-chat-text-secondary"
              >
                Nyra is sending your inquiries now.
              </p>
              <ol className="mt-6 flex list-none flex-col gap-3 p-0">
                {progressVenues.map((row) => {
                  const item = outreachByVenueId.get(row.id);
                  const status: OutreachItemStatus = item?.status ?? "queued";
                  return (
                    <li
                      key={row.id}
                      className="flex min-h-0 items-start gap-3 rounded-xl border border-chat-border-muted bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="mt-0.5">
                        <ProgressStatusIcon status={status} reduceMotion={reduceMotion} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium leading-[1.25] text-chat-text-primary">
                          {row.name}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-snug text-chat-text-muted">
                          {checklistLabel(status)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}

          {isSuccess ? (
            <div role="status" aria-live="polite">
              <p className="nyra-eyebrow">Outreach live</p>
              <h2
                id={titleId}
                className="mt-2.5 text-lg font-semibold leading-[1.2] tracking-[-0.03em] text-chat-text-primary"
              >
                All set
              </h2>
              <p
                id={successBodyId}
                className="mt-2 text-[13px] leading-relaxed text-chat-text-secondary"
              >
                {
                  "We've contacted your selected venues. You'll see replies here as they come in."
                }
              </p>
            </div>
          ) : null}
        </div>

        {isReview ? (
          <footer className="shrink-0 border-t border-chat-border-muted bg-chat-sidebar px-5 py-4 sm:px-6 sm:py-4">
            {!briefComplete && includedVenueCount > 0 ? (
              <p className="mb-3 text-[13px] font-semibold leading-snug text-chat-text-primary">
                Complete required fields to continue
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="nyra-btn-chat-secondary w-full sm:w-auto sm:min-w-[7.5rem]"
              >
                Cancel
              </button>
              <button
                ref={startRef}
                type="button"
                onClick={handleStartOutreachClick}
                disabled={startOutreachDisabled}
                className="nyra-btn-primary w-full sm:w-auto sm:min-w-[10.5rem]"
              >
                Start outreach
              </button>
            </div>
          </footer>
        ) : null}

        {isProgress && progressVenues?.length ? (
          <footer className="shrink-0 border-t border-chat-border-muted bg-chat-sidebar px-5 py-4 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={onStopOutreach}
              className="nyra-btn-chat-secondary w-full sm:ml-auto sm:w-auto sm:min-w-[10.5rem]"
            >
              Stop outreach
            </button>
          </footer>
        ) : null}

        {isSuccess ? (
          <footer className="shrink-0 border-t border-chat-border-muted bg-chat-sidebar px-5 py-4 sm:px-6 sm:py-4">
            <button
              ref={viewProgressRef}
              type="button"
              onClick={onViewProgress}
              className="nyra-btn-primary w-full sm:ml-auto sm:w-auto sm:min-w-[10.5rem]"
            >
              View progress
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
