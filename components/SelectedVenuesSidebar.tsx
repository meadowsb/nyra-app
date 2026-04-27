"use client";

import { useMemo } from "react";

import type { Venue } from "@/components/VenueCard";
import { ShortlistRailCollapsed } from "@/components/ShortlistRailCollapsed";
import { buildRailVenueSections } from "@/components/selectedVenueRailModel";
import { ComparisonView } from "@/components/ComparisonView";
import { VenueReportCtaPanel } from "@/components/VenueReportCtaPanel";
import { VenuePlannerDetailPanel } from "@/components/VenuePlannerDetailPanel";
import type { VenuePlannerEntry } from "@/components/venuePlannerState";
import { getVenuePlannerEntry } from "@/components/venuePlannerState";

/** Status of a single venue in the outreach pipeline. */
export type OutreachItemStatus =
  | "queued"
  | "drafting-outreach"
  /** Inquiry sent; venue has not replied yet. */
  | "contacted"
  /** Venue has replied (use only after a real reply is recorded). */
  | "replied";

export type VenueOutreachCardState = OutreachItemStatus;

export type OutreachItem = {
  venueId: string;
  status: OutreachItemStatus;
  /** When this status was last set (ms); used for a compact “updated” hint. */
  statusUpdatedAt?: number;
};

export function outreachItemsFromVenueIds(venueIds: readonly string[]): OutreachItem[] {
  const now = Date.now();
  return venueIds.map((venueId) => ({
    venueId,
    status: "queued",
    statusUpdatedAt: now,
  }));
}

/**
 * After outreach has started, shortlisted venues with no pipeline row yet need a
 * confirm step before we enqueue simulated outreach.
 */
export function venueIdsPendingOutreachRow(
  outreachActive: boolean,
  selectedVenueIds: readonly string[],
  outreachItems: readonly { venueId: string }[]
): string[] {
  if (!outreachActive) return [];
  const byId = new Set(outreachItems.map((i) => i.venueId));
  return selectedVenueIds.filter((id) => !byId.has(id));
}

/**
 * Selected venues that are not yet “inquiry sent” (contacted): no pipeline row yet,
 * queued, or still drafting. (Rail “ready to contact” counts use `venueIdsReadyToContact`.)
 */
export function venueIdsAwaitingContact(
  outreachActive: boolean,
  selectedVenueIds: readonly string[],
  outreachItems: readonly OutreachItem[]
): string[] {
  if (!outreachActive) return [];
  const byId = new Map(outreachItems.map((i) => [i.venueId, i]));
  return selectedVenueIds.filter((id) => {
    const row = byId.get(id);
    if (!row) return true;
    return row.status === "queued" || row.status === "drafting-outreach";
  });
}

/**
 * Venues not yet in the outreach pipeline: same notion as rail `shortlisted` /
 * conceptual `ready_to_contact` — excludes queued, drafting, contacted, replied.
 */
export function venueIdsReadyToContact(
  outreachActive: boolean,
  selectedVenueIds: readonly string[],
  outreachItems: readonly OutreachItem[]
): string[] {
  if (!outreachActive) return [...selectedVenueIds];
  const byId = new Map(outreachItems.map((i) => [i.venueId, i]));
  return selectedVenueIds.filter((id) => !byId.has(id));
}

export function shortlistHasOutreachInProgress(
  outreachActive: boolean,
  selectedVenueIds: readonly string[],
  outreachItems: readonly OutreachItem[]
): boolean {
  if (!outreachActive) return false;
  const byId = new Map(outreachItems.map((i) => [i.venueId, i]));
  return selectedVenueIds.some((id) => {
    const row = byId.get(id);
    return row?.status === "queued" || row?.status === "drafting-outreach";
  });
}

/**
 * Optional rail footer line above “Contact venues” when the shortlist body already carries
 * status (grouped queue). Returns null during outreach and when the primary CTA shows its
 * own “ready to contact” line.
 */
export function formatRailVenueWorkSummaryLine(options: {
  readyToContactCount: number;
  outreachMode: boolean;
  selectedVenueCount: number;
}): string | null {
  const { readyToContactCount, outreachMode, selectedVenueCount } = options;
  if (readyToContactCount > 0) {
    return null;
  }
  if (outreachMode) {
    return null;
  }
  if (selectedVenueCount === 0) {
    return "Shortlist venues to continue";
  }
  return null;
}

/** Inquiry recorded or venue replied — expanded detail should not show batch “Contact” CTAs. */
export function venueOutreachRowIsPostInquiry(
  venueId: string | null,
  outreachActive: boolean,
  outreachItems: readonly OutreachItem[]
): boolean {
  if (venueId == null || !outreachActive) return false;
  const row = outreachItems.find((i) => i.venueId === venueId);
  return row?.status === "contacted" || row?.status === "replied";
}

/**
 * When true, the main thread venue card shows a secondary “Remove” control.
 * Hidden only after an inquiry is recorded as sent (contacted) or the venue has replied.
 */
export function venueAllowsMainCardRemoval(
  selected: boolean,
  isInquirySent: boolean
): boolean {
  if (!selected) return false;
  return !isInquirySent;
}

/** Compact label for venue cards and rail chips during outreach. */
export function venueOutreachCardBadgeLabel(state: VenueOutreachCardState): string {
  switch (state) {
    case "queued":
      return "Queued";
    case "drafting-outreach":
      return "Sending…";
    case "contacted":
      return "Inquiry sent";
    case "replied":
      return "Responded";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function outreachStatusLabel(status: OutreachItemStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "drafting-outreach":
      return "In progress";
    case "contacted":
      return "Inquiry sent";
    case "replied":
      return "Responded";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function outreachStatusDetail(status: OutreachItemStatus): string {
  switch (status) {
    case "queued":
      return "Waiting to send inquiry";
    case "drafting-outreach":
      return "Sending inquiry to venue";
    case "contacted":
      return "Inquiry sent";
    case "replied":
      return "Venue replied";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function outreachStatusDotClass(status: OutreachItemStatus): string {
  switch (status) {
    case "queued":
      return "bg-chat-text-muted/55";
    case "drafting-outreach":
      return "bg-nyra-accent/55";
    case "contacted":
      return "bg-emerald-500/45";
    case "replied":
      return "bg-sky-400/50";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Dot + label + detail for main-thread venue cards during outreach. */
export function outreachStatusPresentation(status: OutreachItemStatus) {
  return {
    label: outreachStatusLabel(status),
    dotClass: outreachStatusDotClass(status),
    detail: outreachStatusDetail(status),
  };
}

/** Re-exported for consumers that pair outreach rows with rail tiles. */
export type { RailVenueStatus, RailVenueTileItem } from "@/components/selectedVenueRailModel";

type SelectedVenuesSidebarProps = {
  selectedVenueIds: string[];
  archivedVenueIds: readonly string[];
  venueById: Map<string, Venue>;
  venueSelectionHint: string | null;
  onVenueReportCta: () => void;
  /** Opens outreach confirm for a single shortlisted venue (when multiple are selected). */
  onVenueReportCtaThisVenueOnly?: (venueId: string) => void;
  /** When true, composer Send stays primary; Contact uses secondary. */
  composerHasText: boolean;
  /** When true, venue tiles reflect outreach progress on the same shortlist rail. */
  outreachMode: boolean;
  outreachItems: OutreachItem[];
  plannerDetailVenueId: string | null;
  onPlannerDetailVenueIdChange: (venueId: string | null) => void;
  originalSearchBrief: string;
  outreachWhatNyraAsked: string;
  venuePlannerById: Readonly<Record<string, VenuePlannerEntry>>;
  onAddNyraNote: (venueId: string, text: string) => void;
  onAddFollowUp: (venueId: string, text: string) => void;
  onArchiveVenue: (venueId: string) => void;
  onRestoreVenue: (venueId: string) => void;
  reduceMotion: boolean;
  /** Wide compare table mode (desktop ~70vw); list layout stays unchanged when off. */
  railCompareOpen: boolean;
  onRailCompareOpen: () => void;
  onRailCompareClose: () => void;
  onOpenUpdateAllVenues: () => void;
};

export function SelectedVenuesSidebar({
  selectedVenueIds,
  archivedVenueIds,
  venueById,
  venueSelectionHint,
  onVenueReportCta,
  onVenueReportCtaThisVenueOnly,
  composerHasText,
  outreachMode,
  outreachItems,
  plannerDetailVenueId,
  onPlannerDetailVenueIdChange,
  originalSearchBrief,
  outreachWhatNyraAsked,
  venuePlannerById,
  onAddNyraNote,
  onAddFollowUp,
  onArchiveVenue,
  onRestoreVenue,
  reduceMotion,
  railCompareOpen,
  onRailCompareOpen,
  onRailCompareClose,
  onOpenUpdateAllVenues,
}: SelectedVenuesSidebarProps) {
  const outreachById = useMemo(
    () => new Map(outreachItems.map((i) => [i.venueId, i])),
    [outreachItems]
  );

  /** Shortlisted venues with no pipeline row yet — excludes in progress and contacted. */
  const pendingAdditionalOutreachCount = useMemo(
    () => venueIdsReadyToContact(outreachMode, selectedVenueIds, outreachItems).length,
    [outreachMode, selectedVenueIds, outreachItems]
  );

  const { active: activeRailVenues, archived: archivedRailVenues } = useMemo(
    () =>
      buildRailVenueSections(
        selectedVenueIds,
        archivedVenueIds,
        venueById,
        outreachMode,
        outreachById
      ),
    [selectedVenueIds, archivedVenueIds, venueById, outreachMode, outreachById]
  );

  const railAria = "Selected venues";

  const ctaProminence =
    pendingAdditionalOutreachCount > 0
      ? "primary"
      : outreachMode || composerHasText || selectedVenueIds.length === 0
        ? "secondary"
        : "primary";

  const widthTransitionClass = reduceMotion
    ? ""
    : "lg:transition-[width] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)]";

  const fadeClass = reduceMotion
    ? ""
    : "transition-opacity duration-300 ease-out motion-reduce:transition-none";

  const plannerOpen = plannerDetailVenueId != null;
  const railWide = plannerOpen || railCompareOpen;
  const wideAsideWidthClass = railCompareOpen
    ? "lg:w-[min(70vw,1100px)]"
    : "lg:w-[min(72vw,920px)]";

  const visibilityClass = railWide
    ? `flex max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:h-svh max-lg:w-full max-lg:max-w-none max-lg:border-0 max-lg:shadow-none lg:relative lg:inset-auto lg:h-full lg:border-l-0 lg:shadow-[-28px_0_64px_-24px_rgba(0,0,0,0.55)] lg:z-40 ${wideAsideWidthClass}`
    : "hidden border-l border-chat-border lg:z-20 lg:flex lg:h-full lg:w-[288px] lg:border-l-0";

  const detailVenue = plannerDetailVenueId ? venueById.get(plannerDetailVenueId) : undefined;
  const detailOutreachRow = plannerDetailVenueId
    ? outreachItems.find((i) => i.venueId === plannerDetailVenueId)
    : undefined;
  const detailArchived = plannerDetailVenueId
    ? archivedVenueIds.includes(plannerDetailVenueId)
    : false;

  const contactThisVenueOnlyVisible =
    Boolean(plannerDetailVenueId) &&
    !detailArchived &&
    detailOutreachRow == null &&
    selectedVenueIds.length > 1;

  /** Expanded venue already received an inquiry — hide rail batch CTAs; show shortlist context instead. */
  const detailPostInquiry =
    plannerOpen &&
    plannerDetailVenueId != null &&
    venueOutreachRowIsPostInquiry(plannerDetailVenueId, outreachMode, outreachItems);

  const readyToContactCount = venueIdsReadyToContact(
    outreachMode,
    selectedVenueIds,
    outreachItems
  ).length;
  const inProgressOnShortlist = shortlistHasOutreachInProgress(
    outreachMode,
    selectedVenueIds,
    outreachItems
  );
  const railVenueWorkSummaryLine = formatRailVenueWorkSummaryLine({
    readyToContactCount,
    outreachMode,
    selectedVenueCount: selectedVenueIds.length,
  });

  return (
    <aside
      className={`relative min-h-0 min-w-0 shrink-0 flex-col bg-chat-sidebar lg:overflow-hidden lg:border-l-0 ${visibilityClass} ${widthTransitionClass}`}
      aria-label={railAria}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          <div
            className={`min-h-0 overflow-y-auto overscroll-y-contain pl-4 pr-5 pb-5 pt-10 xl:pb-6 xl:pt-11 ${
              plannerOpen || railCompareOpen
                ? `pointer-events-none absolute inset-0 opacity-0 ${fadeClass}`
                : `relative h-full opacity-100 ${fadeClass}`
            }`}
            aria-hidden={plannerOpen || railCompareOpen}
          >
            <ShortlistRailCollapsed
              activeRailVenues={activeRailVenues}
              archivedRailVenues={archivedRailVenues}
              outreachMode={outreachMode}
              plannerDetailVenueId={plannerDetailVenueId}
              onVenueTilePress={(id) => onPlannerDetailVenueIdChange(id)}
              reduceMotion={reduceMotion}
            />
          </div>
          <div
            className={`min-h-0 overflow-y-auto overscroll-y-contain pl-4 pr-5 pb-5 pt-10 xl:pb-6 xl:pt-11 ${
              railCompareOpen && !plannerOpen
                ? `relative h-full min-h-0 opacity-100 ${fadeClass}`
                : `pointer-events-none absolute inset-0 opacity-0 ${fadeClass}`
            }`}
            aria-hidden={!railCompareOpen || plannerOpen}
          >
            {railCompareOpen && !plannerOpen ? (
              <ComparisonView
                venueIds={selectedVenueIds}
                venueById={venueById}
                outreachById={outreachById}
                venuePlannerById={venuePlannerById}
                onClose={onRailCompareClose}
                onUpdateAllVenues={outreachMode ? onOpenUpdateAllVenues : undefined}
              />
            ) : null}
          </div>
          <div
            className={`min-h-0 overflow-y-auto overscroll-y-contain pl-4 pr-5 pb-5 pt-10 xl:pb-6 xl:pt-11 ${
              plannerOpen
                ? `relative h-full min-h-0 opacity-100 ${fadeClass}`
                : `pointer-events-none absolute inset-0 opacity-0 ${fadeClass}`
            }`}
            aria-hidden={!plannerOpen}
          >
            {plannerOpen && plannerDetailVenueId ? (
              <VenuePlannerDetailPanel
                key={plannerDetailVenueId}
                venueName={detailVenue?.name ?? "Venue"}
                outreachStatus={detailOutreachRow?.status ?? null}
                statusUpdatedAt={detailOutreachRow?.statusUpdatedAt ?? null}
                originalBrief={originalSearchBrief}
                whatNyraAsked={outreachWhatNyraAsked}
                planner={getVenuePlannerEntry(venuePlannerById, plannerDetailVenueId)}
                isArchived={detailArchived}
                onClose={() => onPlannerDetailVenueIdChange(null)}
                onAddNyraNote={(text) => onAddNyraNote(plannerDetailVenueId, text)}
                onAddFollowUp={(text) => onAddFollowUp(plannerDetailVenueId, text)}
                onArchive={() => {
                  onArchiveVenue(plannerDetailVenueId);
                  onPlannerDetailVenueIdChange(null);
                }}
                onRestore={() => onRestoreVenue(plannerDetailVenueId)}
                contactThisVenueOnlyVisible={contactThisVenueOnlyVisible}
                onContactThisVenueOnly={
                  contactThisVenueOnlyVisible && onVenueReportCtaThisVenueOnly
                    ? () => onVenueReportCtaThisVenueOnly(plannerDetailVenueId)
                    : undefined
                }
              />
            ) : null}
          </div>
        </div>

        <footer className="shrink-0 border-t border-chat-border-muted bg-chat-sidebar pl-4 pr-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:pt-3.5 xl:pb-6">
          {outreachMode && !plannerOpen ? (
            <div className="mb-3 flex flex-col gap-2">
              {!railCompareOpen ? (
                <button
                  type="button"
                  onClick={onRailCompareOpen}
                  disabled={selectedVenueIds.length === 0}
                  className="nyra-btn-chat-secondary w-full py-2.5 text-[13px] disabled:pointer-events-none disabled:opacity-45"
                >
                  Compare
                </button>
              ) : null}
              <button
                type="button"
                onClick={onOpenUpdateAllVenues}
                disabled={selectedVenueIds.length === 0}
                className="nyra-btn-chat-secondary w-full py-2.5 text-[13px] disabled:pointer-events-none disabled:opacity-45"
              >
                Update all venues
              </button>
            </div>
          ) : null}
          {detailPostInquiry ? (
            <div className="space-y-2">
              {railVenueWorkSummaryLine ? (
                <p className="text-[13px] leading-snug text-chat-text-secondary">
                  {railVenueWorkSummaryLine}
                </p>
              ) : null}
              {readyToContactCount > 0 || inProgressOnShortlist ? (
                <button
                  type="button"
                  onClick={() => onPlannerDetailVenueIdChange(null)}
                  className="text-left text-[13px] font-semibold text-nyra-accent underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-chat-sidebar rounded-sm"
                >
                  View shortlist →
                </button>
              ) : null}
            </div>
          ) : (
            <VenueReportCtaPanel
              variant="rail"
              selectedCount={selectedVenueIds.length}
              venueSelectionHint={venueSelectionHint}
              onVenueReportCta={onVenueReportCta}
              ctaProminence={ctaProminence}
              outreachActive={outreachMode}
              pendingAdditionalOutreachCount={pendingAdditionalOutreachCount}
            />
          )}
        </footer>
      </div>
    </aside>
  );
}
