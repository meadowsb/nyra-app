"use client";

import type { Vendor } from "@/components/VenueCard";
import type { OutreachItem, OutreachItemStatus } from "@/components/SelectedVendorsSidebar";
import type { VendorDetails } from "@/components/vendorPlannerState";
import { getVendorDetails } from "@/components/vendorPlannerState";
import { moduleEntityLabels, type ModuleType } from "@/lib/modules";

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

function availabilityLabel(status: OutreachItemStatus | undefined): string {
  if (!status) return "—";
  switch (status) {
    case "queued":
      return "Queued";
    case "drafting-outreach":
      return "Sending inquiry";
    case "contacted":
      return "Awaiting reply";
    case "replied":
      return "Replied";
    default: {
      const _e: never = status;
      return _e;
    }
  }
}

function latestNotePreview(
  planner: VendorDetails,
  maxLen = 72
): string {
  const merged = [
    ...planner.nyraNotes.map((e) => ({ at: e.at, text: e.text })),
    ...planner.followUps.map((e) => ({ at: e.at, text: e.text })),
  ].sort((a, b) => b.at - a.at);
  if (merged.length === 0) return "—";
  const t = merged[0].text.trim();
  if (!t) return "—";
  return t.length <= maxLen ? t : `${t.slice(0, maxLen - 1)}…`;
}

const rowLabelClass =
  "sticky left-0 z-[1] w-[min(7.5rem,28vw)] shrink-0 border-r border-chat-border-muted bg-chat-sidebar px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-chat-text-muted";

const cellClass =
  "min-w-[7.5rem] border-b border-chat-border-muted px-2 py-2.5 text-[13px] leading-snug text-chat-text-secondary";

export type ComparisonViewProps = {
  moduleType?: ModuleType;
  vendorIds: readonly string[];
  vendorById: Map<string, Vendor>;
  outreachById: Map<string, OutreachItem>;
  vendorDetailsById: Readonly<Record<string, VendorDetails>>;
  onClose: () => void;
  /** Shown beside close — optional second action in wide compare header */
  onUpdateAllVenues?: () => void;
};

const ROW_KEYS = ["price", "capacity", "availability", "notes"] as const;

export function ComparisonView({
  moduleType = "venue",
  vendorIds,
  vendorById,
  outreachById,
  vendorDetailsById,
  onClose,
  onUpdateAllVenues,
}: ComparisonViewProps) {
  const el = moduleEntityLabels(moduleType);
  const columns = vendorIds.map((id) => {
    const v = vendorById.get(id);
    const row = outreachById.get(id);
    const planner = getVendorDetails(vendorDetailsById, id);
    return {
      id,
      name: v?.name ?? el.defaultCardName,
      price: v?.price ?? "—",
      capacity: v?.capacity ?? "—",
      availability: availabilityLabel(row?.status),
      notes: latestNotePreview(planner),
    };
  });

  return (
    <div className="min-w-0">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-chat-border-muted pb-4">
        <div className="min-w-0">
          <p className="nyra-eyebrow">Compare</p>
          <h2 className="mt-2 text-lg font-semibold leading-tight tracking-[-0.03em] text-chat-text-primary">
            Side by side
          </h2>
          <p className="mt-1.5 text-[12px] leading-snug text-chat-text-muted">
            {`Price, capacity, availability, and your latest note per ${el.listNounSingular}.`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {onUpdateAllVenues ? (
            <button
              type="button"
              onClick={onUpdateAllVenues}
              disabled={vendorIds.length === 0}
              className="nyra-btn-chat-secondary px-3 py-2 text-[12px] disabled:pointer-events-none disabled:opacity-45"
            >
              {el.updateAllLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-chat-border bg-white/[0.04] px-3 py-2 text-[12px] font-semibold tracking-[-0.02em] text-chat-text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-[color,background-color,border-color] hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-chat-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-chat-sidebar"
          >
            <CloseIcon className="h-3.5 w-3.5" />
            Close
          </button>
        </div>
      </header>

      <div className="mt-4 overflow-x-auto rounded-xl border border-chat-border-muted">
        {columns.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-chat-text-muted">
            {`Add ${el.listNoun} to your shortlist to compare them here.`}
          </p>
        ) : null}
        {columns.length === 0 ? null : (
        <table className="w-full min-w-[min(100%,520px)] border-collapse text-left">
          <thead>
            <tr className="border-b border-chat-border-muted">
              <th scope="col" className={`${rowLabelClass} py-3 align-bottom`} />
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className="min-w-[7.5rem] border-b border-chat-border-muted px-2 py-3 align-bottom text-[12px] font-semibold leading-tight tracking-[-0.02em] text-chat-text-primary"
                >
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROW_KEYS.map((key) => (
              <tr key={key}>
                <th scope="row" className={rowLabelClass}>
                  {key === "price"
                    ? "Price"
                    : key === "capacity"
                      ? "Capacity"
                      : key === "availability"
                        ? "Availability"
                        : "Notes"}
                </th>
                {columns.map((c) => (
                  <td key={`${c.id}-${key}`} className={cellClass}>
                    {key === "price"
                      ? c.price
                      : key === "capacity"
                        ? c.capacity
                        : key === "availability"
                          ? c.availability
                          : c.notes}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
