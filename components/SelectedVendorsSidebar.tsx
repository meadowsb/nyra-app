"use client";

import { useMemo } from "react";

import type { ModuleType } from "@/lib/modules";
import { moduleEntityLabels } from "@/lib/modules";
import type { Vendor } from "@/components/VenueCard";
import { ShortlistRailCollapsed } from "@/components/ShortlistRailCollapsed";
import {
  buildMasterShortlistData,
  buildOutreachRowMap,
  type MasterShortlistModuleInput,
} from "@/components/selectedVendorRailModel";
import { ComparisonView } from "@/components/ComparisonView";
import { VenueReportCtaPanel } from "@/components/VenueReportCtaPanel";
import { VenuePlannerDetailPanel } from "@/components/VenuePlannerDetailPanel";
import type { VendorDetails } from "@/components/vendorPlannerState";
import { getVendorDetails } from "@/components/vendorPlannerState";
/** Status of a single vendor in the outreach pipeline. */
export type OutreachItemStatus =
  | "queued"
  | "drafting-outreach"
  /** Inquiry sent; venue has not replied yet. */
  | "contacted"
  /** Venue has replied (use only after a real reply is recorded). */
  | "replied";

export type VendorOutreachCardState = OutreachItemStatus;

export type OutreachItem = {
  moduleId: string;
  vendorId: string;
  status: OutreachItemStatus;
  /** When this status was last set (ms); used for a compact “updated” hint. */
  statusUpdatedAt?: number;
};

export function outreachItemsFromVendorIds(
  moduleId: string,
  vendorIds: readonly string[]
): OutreachItem[] {
  const now = Date.now();
  return vendorIds.map((vendorId) => ({
    moduleId,
    vendorId,
    status: "queued",
    statusUpdatedAt: now,
  }));
}

/**
 * After outreach has started, shortlisted venues with no pipeline row yet need a
 * confirm step before we enqueue simulated outreach.
 */
export function vendorIdsPendingOutreachRow(
  outreachActive: boolean,
  selectedVendorIds: readonly string[],
  outreachItems: readonly { vendorId: string }[]
): string[] {
  if (!outreachActive) return [];
  const byId = new Set(outreachItems.map((i) => i.vendorId));
  return selectedVendorIds.filter((id) => !byId.has(id));
}

/**
 * Selected venues that are not yet “inquiry sent” (contacted): no pipeline row yet,
 * queued, or still drafting. (Rail “ready to contact” counts use `vendorIdsReadyToContact`.)
 */
export function vendorIdsAwaitingContact(
  outreachActive: boolean,
  selectedVendorIds: readonly string[],
  outreachItems: readonly OutreachItem[]
): string[] {
  if (!outreachActive) return [];
  const byId = new Map(outreachItems.map((i) => [i.vendorId, i]));
  return selectedVendorIds.filter((id) => {
    const row = byId.get(id);
    if (!row) return true;
    return row.status === "queued" || row.status === "drafting-outreach";
  });
}

/**
 * Venues not yet in the outreach pipeline: same notion as rail `shortlisted` /
 * conceptual `ready_to_contact` — excludes queued, drafting, contacted, replied.
 */
export function vendorIdsReadyToContact(
  outreachActive: boolean,
  selectedVendorIds: readonly string[],
  outreachItems: readonly OutreachItem[]
): string[] {
  if (!outreachActive) return [...selectedVendorIds];
  const byId = new Map(outreachItems.map((i) => [i.vendorId, i]));
  return selectedVendorIds.filter((id) => !byId.has(id));
}

export function shortlistHasOutreachInProgress(
  outreachActive: boolean,
  selectedVendorIds: readonly string[],
  outreachItems: readonly OutreachItem[]
): boolean {
  if (!outreachActive) return false;
  const byId = new Map(outreachItems.map((i) => [i.vendorId, i]));
  return selectedVendorIds.some((id) => {
    const row = byId.get(id);
    return row?.status === "queued" || row?.status === "drafting-outreach";
  });
}

/** Inquiry recorded or vendor replied — expanded detail should not show batch “Contact” CTAs. */
export function vendorOutreachRowIsPostInquiry(
  moduleId: string | null,
  vendorId: string | null,
  outreachItems: readonly OutreachItem[]
): boolean {
  if (vendorId == null || moduleId == null) return false;
  const row = outreachItems.find(
    (i) => i.moduleId === moduleId && i.vendorId === vendorId
  );
  return row?.status === "contacted" || row?.status === "replied";
}

/**
 * When true, the main thread venue card shows a secondary “Remove” control.
 * Hidden only after an inquiry is recorded as sent (contacted) or the venue has replied.
 */
export function vendorAllowsMainCardRemoval(
  selected: boolean,
  isInquirySent: boolean
): boolean {
  if (!selected) return false;
  return !isInquirySent;
}

/** Compact label for venue cards and rail chips during outreach. */
export function vendorOutreachCardBadgeLabel(state: VendorOutreachCardState): string {
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

function outreachStatusDetail(
  status: OutreachItemStatus,
  moduleType: ModuleType
): string {
  const to =
    moduleType === "catering" ? "caterer" : moduleType === "photography" ? "photographer" : "venue";
  const whoReplied =
    moduleType === "catering"
      ? "Caterer replied"
      : moduleType === "photography"
        ? "Photographer replied"
        : "Venue replied";
  switch (status) {
    case "queued":
      return "Waiting to send inquiry";
    case "drafting-outreach":
      return `Sending inquiry to ${to}`;
    case "contacted":
      return "Inquiry sent";
    case "replied":
      return whoReplied;
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
export function outreachStatusPresentation(
  status: OutreachItemStatus,
  moduleType: ModuleType = "venue"
) {
  return {
    label: outreachStatusLabel(status),
    dotClass: outreachStatusDotClass(status),
    detail: outreachStatusDetail(status, moduleType),
  };
}

/** Re-exported for consumers that pair outreach rows with rail tiles. */
export type { RailVendorStatus, RailVendorTileItem } from "@/components/selectedVendorRailModel";

type SelectedVendorsSidebarProps = {
  moduleType?: ModuleType;
  /** Active module shortlist ids. */
  selectedVendorIds: string[];
  /**
   * Wedding-wide shortlist per `ModuleType` (venue, catering, photography) with stable module ids;
   * drives the right rail; outreach rows still use `moduleId` on each `OutreachItem`.
   */
  shortlistByModule: readonly MasterShortlistModuleInput[];
  totalShortlistedCount: number;
  /** Full thread outreach rows (all modules) for the rail. */
  allOutreachItems: OutreachItem[];
  /**
   * User has at least one outreach row; row-level status still keys off
   * `(moduleId, vendorId)`; rows without a pipeline line stay `Ready to contact`.
   */
  outreachInitiated: boolean;
  vendorById: Map<string, Vendor>;
  venueSelectionHint: string | null;
  onVenueReportCta: () => void;
  /** Only modules the user has engaged (session) or with shortlisted vendors — drives the plan rail. */
  visibleShortlistByModule: readonly MasterShortlistModuleInput[];
  /** Opens outreach confirm for a single shortlist row (module-scoped for enqueue). */
  onVenueReportCtaThisVenueOnly?: (moduleId: string, vendorId: string) => void;
  /** When true, composer Send stays primary; Contact uses secondary. */
  composerHasText: boolean;
  /** When the active module has a pipeline, compare/update rail affordances. */
  outreachMode: boolean;
  /** Full pipeline; scoped to the active module for compare, queue, and footer. */
  outreachItems: OutreachItem[];
  plannerRef: { moduleId: string; vendorId: string } | null;
  onPlannerRefChange: (next: { moduleId: string; vendorId: string } | null) => void;
  originalSearchBrief: string;
  outreachWhatNyraAsked: string;
  vendorDetailsById: Readonly<Record<string, VendorDetails>>;
  onAddNyraNote: (vendorId: string, text: string) => void;
  onAddFollowUp: (vendorId: string, text: string) => void;
  onArchiveVendor: (moduleId: string, vendorId: string) => void;
  onRestoreVendor: (moduleId: string, vendorId: string) => void;
  reduceMotion: boolean;
  /** Wide compare table mode (desktop ~70vw); list layout stays unchanged when off. */
  railCompareOpen: boolean;
  onRailCompareOpen: () => void;
  onRailCompareClose: () => void;
  onOpenUpdateAllVenues: () => void;
};

export function SelectedVendorsSidebar({
  moduleType = "venue",
  selectedVendorIds,
  shortlistByModule,
  totalShortlistedCount,
  allOutreachItems,
  outreachInitiated,
  vendorById,
  venueSelectionHint,
  onVenueReportCta,
  visibleShortlistByModule,
  onVenueReportCtaThisVenueOnly,
  composerHasText,
  outreachMode,
  outreachItems,
  plannerRef,
  onPlannerRefChange,
  originalSearchBrief,
  outreachWhatNyraAsked,
  vendorDetailsById,
  onAddNyraNote,
  onAddFollowUp,
  onArchiveVendor,
  onRestoreVendor,
  reduceMotion,
  railCompareOpen,
  onRailCompareOpen,
  onRailCompareClose,
  onOpenUpdateAllVenues,
}: SelectedVendorsSidebarProps) {
  const entityLabels = moduleEntityLabels(moduleType);
  const outreachById = useMemo(
    () => new Map<string, (typeof outreachItems)[number]>(outreachItems.map((i) => [i.vendorId, i])),
    [outreachItems]
  );
  const outreachByKey = useMemo(() => buildOutreachRowMap(allOutreachItems), [allOutreachItems]);

  /** Shortlisted vendors with no pipeline row yet — excludes in progress and contacted. */
  const pendingAdditionalOutreachCount = useMemo(
    () => vendorIdsReadyToContact(outreachMode, selectedVendorIds, outreachItems).length,
    [outreachMode, selectedVendorIds, outreachItems]
  );

  const { groups, archived: archivedRailVenues } = useMemo(
    () =>
      buildMasterShortlistData(
        shortlistByModule,
        vendorById,
        outreachInitiated,
        outreachByKey
      ),
    [shortlistByModule, vendorById, outreachInitiated, outreachByKey]
  );

  const hasAnyOutreach = outreachInitiated;
  const railAria = "Your plan";

  const ctaProminence =
    totalShortlistedCount > 0 && !composerHasText ? "primary" : "secondary";

  const widthTransitionClass = reduceMotion
    ? ""
    : "lg:transition-[width] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)]";

  const fadeClass = reduceMotion
    ? ""
    : "transition-opacity duration-300 ease-out motion-reduce:transition-none";

  const plannerOpen = plannerRef != null;
  const railWide = plannerOpen || railCompareOpen;
  const wideAsideWidthClass = railCompareOpen
    ? "lg:w-[min(70vw,1100px)]"
    : "lg:w-[min(72vw,920px)]";

  const visibilityClass = railWide
    ? `flex max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:h-svh max-lg:w-full max-lg:max-w-none max-lg:border-0 max-lg:shadow-none lg:relative lg:inset-auto lg:h-full lg:border-l-0 lg:shadow-[-28px_0_64px_-24px_rgba(0,0,0,0.55)] lg:z-40 ${wideAsideWidthClass}`
    : "hidden border-l border-chat-border lg:z-20 lg:flex lg:h-full lg:w-[288px] lg:border-l-0";

  const plannerModuleType = useMemo(() => {
    if (plannerRef == null) return moduleType;
    return (
      shortlistByModule.find((m) => m.moduleId === plannerRef.moduleId)?.moduleType ?? moduleType
    );
  }, [plannerRef, shortlistByModule, moduleType]);

  const detailLabels = useMemo(
    () => moduleEntityLabels(plannerModuleType),
    [plannerModuleType]
  );
  const plannerModArchivedIds = useMemo(() => {
    if (plannerRef == null) return null;
    return shortlistByModule.find((m) => m.moduleId === plannerRef.moduleId)?.archivedVendorIds;
  }, [plannerRef, shortlistByModule]);
  const selectedCountInPlannerModule = useMemo(() => {
    if (plannerRef == null) return 0;
    return (shortlistByModule.find((m) => m.moduleId === plannerRef.moduleId)?.activeVendorIds
      .length) ?? 0;
  }, [plannerRef, shortlistByModule]);

  const detailVendor =
    plannerRef == null ? undefined : vendorById.get(plannerRef.vendorId);
  const detailOutreachRow =
    plannerRef == null
      ? undefined
      : allOutreachItems.find(
          (i) => i.moduleId === plannerRef.moduleId && i.vendorId === plannerRef.vendorId
        );
  const detailArchived =
    plannerRef != null && (plannerModArchivedIds?.includes(plannerRef.vendorId) === true);

  const contactThisVenueOnlyVisible =
    plannerRef != null &&
    !detailArchived &&
    detailOutreachRow == null &&
    selectedCountInPlannerModule > 1;

  /** Expanded row already has an inquiry — hide rail batch CTAs; show shortlist context instead. */
  const detailPostInquiry =
    plannerOpen &&
    plannerRef != null &&
    vendorOutreachRowIsPostInquiry(plannerRef.moduleId, plannerRef.vendorId, allOutreachItems);

  const readyToContactCount = vendorIdsReadyToContact(
    outreachMode,
    selectedVendorIds,
    outreachItems
  ).length;
  const inProgressOnShortlist = shortlistHasOutreachInProgress(
    outreachMode,
    selectedVendorIds,
    outreachItems
  );
  const detailVendorId = plannerRef?.vendorId ?? null;
  const detailModuleId = plannerRef?.moduleId ?? null;

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
              visibleShortlistByModule={visibleShortlistByModule}
              groups={groups}
              archivedRailVenues={archivedRailVenues}
              hasAnyOutreach={hasAnyOutreach}
              plannerRef={plannerRef}
              onVendorTilePress={(scope) => onPlannerRefChange(scope)}
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
                moduleType={moduleType}
                vendorIds={selectedVendorIds}
                vendorById={vendorById}
                outreachById={outreachById}
                vendorDetailsById={vendorDetailsById}
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
            {plannerOpen && detailVendorId != null && detailModuleId != null ? (
              <VenuePlannerDetailPanel
                key={`${detailModuleId}\0${detailVendorId}`}
                moduleType={plannerModuleType}
                venueName={detailVendor?.name ?? detailLabels.defaultCardName}
                outreachStatus={detailOutreachRow?.status ?? null}
                statusUpdatedAt={detailOutreachRow?.statusUpdatedAt ?? null}
                originalBrief={originalSearchBrief}
                whatNyraAsked={outreachWhatNyraAsked}
                planner={getVendorDetails(vendorDetailsById, detailVendorId)}
                isArchived={detailArchived}
                onClose={() => onPlannerRefChange(null)}
                onAddNyraNote={(text) => onAddNyraNote(detailVendorId, text)}
                onAddFollowUp={(text) => onAddFollowUp(detailVendorId, text)}
                onArchive={() => {
                  onArchiveVendor(detailModuleId, detailVendorId);
                  onPlannerRefChange(null);
                }}
                onRestore={() => onRestoreVendor(detailModuleId, detailVendorId)}
                contactThisVenueOnlyVisible={contactThisVenueOnlyVisible}
                onContactThisVenueOnly={
                  contactThisVenueOnlyVisible && onVenueReportCtaThisVenueOnly
                    ? () => onVenueReportCtaThisVenueOnly(detailModuleId, detailVendorId)
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
                  disabled={selectedVendorIds.length === 0}
                  className="nyra-btn-chat-secondary w-full py-2.5 text-[13px] disabled:pointer-events-none disabled:opacity-45"
                >
                  Compare
                </button>
              ) : null}
              <button
                type="button"
                onClick={onOpenUpdateAllVenues}
                disabled={selectedVendorIds.length === 0}
                className="nyra-btn-chat-secondary w-full py-2.5 text-[13px] disabled:pointer-events-none disabled:opacity-45"
              >
                {entityLabels.updateAllLabel}
              </button>
            </div>
          ) : null}
          {detailPostInquiry ? (
            <div className="space-y-2">
              {readyToContactCount > 0 || inProgressOnShortlist ? (
                <button
                  type="button"
                  onClick={() => onPlannerRefChange(null)}
                  className="text-left text-[13px] font-semibold text-nyra-accent underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-chat-sidebar rounded-sm"
                >
                  View shortlist →
                </button>
              ) : null}
            </div>
          ) : (
            <VenueReportCtaPanel
              variant="rail"
              moduleType={moduleType}
              selectedCount={selectedVendorIds.length}
              totalPlanSelectedCount={totalShortlistedCount}
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
