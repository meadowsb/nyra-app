"use client";

import { useId, useMemo, useState } from "react";

import type { OutreachItem } from "@/components/SelectedVenuesSidebar";

type UpdateAllScope = "all" | "no_response" | "select";

type UpdateAllVenuesForm = {
  guestCount: string;
  budget: string;
  style: string;
  notes: string;
};

type VenueOption = { id: string; name: string };

type UpdateAllVenuesModalProps = {
  open: boolean;
  onClose: () => void;
  /** Active shortlist venues (in order) */
  venues: readonly VenueOption[];
  outreachItems: readonly OutreachItem[];
  reduceMotion: boolean;
  onSendFollowUps: (venueIds: readonly string[], message: string) => void;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-chat-border bg-chat-input px-3 py-2.5 text-[13px] leading-relaxed text-chat-text-primary placeholder:text-chat-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-white/15";

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-chat-text-muted";

function buildFollowUpMessage(form: UpdateAllVenuesForm): string {
  const lines: string[] = ["Follow-up with updated details for your event:"];
  const g = form.guestCount.trim();
  const b = form.budget.trim();
  const s = form.style.trim();
  const n = form.notes.trim();
  if (g) lines.push(`• Guest count: ${g}`);
  if (b) lines.push(`• Budget: ${b}`);
  if (s) lines.push(`• Style: ${s}`);
  if (n) lines.push(`• Notes: ${n}`);
  return lines.join("\n");
}

function venueIdsWithoutResponse(
  venueIds: readonly string[],
  outreachItems: readonly OutreachItem[]
): string[] {
  const byId = new Map(outreachItems.map((r) => [r.venueId, r]));
  return venueIds.filter((id) => {
    const row = byId.get(id);
    return row && row.status !== "replied";
  });
}

export function UpdateAllVenuesModal({
  open,
  onClose,
  venues,
  outreachItems,
  reduceMotion,
  onSendFollowUps,
}: UpdateAllVenuesModalProps) {
  const titleId = useId();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<UpdateAllVenuesForm>({
    guestCount: "",
    budget: "",
    style: "",
    notes: "",
  });
  const [scope, setScope] = useState<UpdateAllScope>("all");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(venues.map((v) => v.id))
  );

  const resolvedIds = useMemo(() => {
    const ids = venues.map((v) => v.id);
    if (scope === "all") return ids;
    if (scope === "no_response") return venueIdsWithoutResponse(ids, outreachItems);
    return ids.filter((id) => selectedIds.has(id));
  }, [venues, scope, selectedIds, outreachItems]);

  const message = useMemo(() => buildFollowUpMessage(form), [form]);

  const formHasSignal =
    form.guestCount.trim() ||
    form.budget.trim() ||
    form.style.trim() ||
    form.notes.trim();

  const canAdvanceFromStep1 = Boolean(formHasSignal);

  const canAdvanceFromStep2 =
    resolvedIds.length > 0 &&
    (scope !== "select" || selectedIds.size > 0);

  const overlayMotion = reduceMotion ? "" : "transition-opacity duration-200";

  if (!open) return null;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmSend = () => {
    if (resolvedIds.length === 0 || !formHasSignal) return;
    onSendFollowUps(resolvedIds, message);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[min(92vh,720px)] w-full max-w-[440px] flex-col rounded-t-2xl border border-chat-border bg-chat-sidebar shadow-[0_-24px_80px_-20px_rgba(0,0,0,0.65)] sm:rounded-2xl ${overlayMotion}`}
      >
        <div className="border-b border-chat-border-muted px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <p className="nyra-eyebrow">
            {step === 1 ? "Step 1 of 3" : step === 2 ? "Step 2 of 3" : "Step 3 of 3"}
          </p>
          <h2 id={titleId} className="mt-2 text-lg font-semibold text-chat-text-primary">
            {step === 1
              ? "What changed?"
              : step === 2
                ? "Who should hear it?"
                : "Confirm follow-up"}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] leading-relaxed text-chat-text-secondary">
                Share any updates you want venues to know. This adds a follow-up to each thread —
                it does not replace your original request.
              </p>
              <div>
                <label className={labelClass} htmlFor="uav-guests">
                  Guest count
                </label>
                <input
                  id="uav-guests"
                  className={inputClass}
                  value={form.guestCount}
                  onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value }))}
                  placeholder="e.g. 90 guests"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="uav-budget">
                  Budget
                </label>
                <input
                  id="uav-budget"
                  className={inputClass}
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  placeholder="e.g. $25k–$35k"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="uav-style">
                  Style
                </label>
                <input
                  id="uav-style"
                  className={inputClass}
                  value={form.style}
                  onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
                  placeholder="e.g. modern, garden-forward"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="uav-notes">
                  Notes
                </label>
                <textarea
                  id="uav-notes"
                  rows={3}
                  className={`${inputClass} min-h-[4.5rem] resize-y`}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Anything else venues should factor in…"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <fieldset className="space-y-3">
              <legend className="sr-only">Scope</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-chat-border-muted bg-white/[0.02] p-3">
                <input
                  type="radio"
                  name="uav-scope"
                  className="mt-0.5"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                />
                <span>
                  <span className="text-[13px] font-medium text-chat-text-primary">All venues</span>
                  <span className="mt-0.5 block text-[12px] text-chat-text-muted">
                    Everyone on your active shortlist ({venues.length}).
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-chat-border-muted bg-white/[0.02] p-3">
                <input
                  type="radio"
                  name="uav-scope"
                  className="mt-0.5"
                  checked={scope === "no_response"}
                  onChange={() => setScope("no_response")}
                />
                <span>
                  <span className="text-[13px] font-medium text-chat-text-primary">
                    Only venues without responses
                  </span>
                  <span className="mt-0.5 block text-[12px] text-chat-text-muted">
                    Skips venues that have already replied.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-chat-border-muted bg-white/[0.02] p-3">
                <input
                  type="radio"
                  name="uav-scope"
                  className="mt-0.5"
                  checked={scope === "select"}
                  onChange={() => setScope("select")}
                />
                <span>
                  <span className="text-[13px] font-medium text-chat-text-primary">Select venues</span>
                  <span className="mt-0.5 block text-[12px] text-chat-text-muted">
                    Choose exactly who receives this follow-up.
                  </span>
                </span>
              </label>

              {scope === "select" ? (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-chat-border-muted p-2">
                  {venues.map((v) => (
                    <label
                      key={v.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/[0.04]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(v.id)}
                        onChange={() => toggleSelected(v.id)}
                      />
                      <span className="text-[13px] text-chat-text-secondary">{v.name}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </fieldset>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <p className="text-[14px] leading-relaxed text-chat-text-primary">
                We’ll follow up with{" "}
                <span className="font-semibold text-nyra-accent">{resolvedIds.length}</span> venue
                {resolvedIds.length === 1 ? "" : "s"} using your updated details.
              </p>
              <div className="rounded-xl border border-chat-border-muted bg-white/[0.02] p-3">
                <p className={labelClass}>Message preview</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-chat-text-secondary">
                  {message}
                </pre>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-chat-border-muted px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="nyra-btn-chat-secondary px-4 py-2 text-[13px]">
            Cancel
          </button>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 2 ? 1 : 2))}
              className="nyra-btn-chat-secondary px-4 py-2 text-[13px]"
            >
              Back
            </button>
          ) : null}
          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 ? !canAdvanceFromStep1 : !canAdvanceFromStep2}
              onClick={() => {
                if (step === 1 && !canAdvanceFromStep1) return;
                if (step === 2 && !canAdvanceFromStep2) return;
                setStep((s) => (s === 1 ? 2 : 3));
              }}
              className="nyra-btn-primary px-4 py-2 text-[13px] disabled:pointer-events-none disabled:opacity-45"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={resolvedIds.length === 0 || !formHasSignal}
              onClick={handleConfirmSend}
              className="nyra-btn-primary px-4 py-2 text-[13px] disabled:pointer-events-none disabled:opacity-45"
            >
              Send follow-ups
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
