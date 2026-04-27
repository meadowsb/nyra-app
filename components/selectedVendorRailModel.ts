import type { ModuleType } from "@/lib/modules";
import { moduleEntityLabels } from "@/lib/modules";

/** Matches `OutreachItem.status` for rail resolution without importing the sidebar module. */
type RailOutreachStatus = "queued" | "drafting-outreach" | "contacted" | "replied";

export type OutreachRowForRail = {
  moduleId: string;
  vendorId: string;
  status: RailOutreachStatus;
};

/** Key for (moduleId, vendorId) lookups in the rail. */
export function railVendorKey(moduleId: string, vendorId: string): string {
  return `${moduleId}\0${vendorId}`;
}

export function buildOutreachRowMap(
  items: readonly OutreachRowForRail[]
): Map<string, OutreachRowForRail> {
  return new Map(items.map((i) => [railVendorKey(i.moduleId, i.vendorId), i]));
}

/** Canonical rail tile model; copy comes only from `status`. */
export type RailVendorStatus =
  | "shortlisted"
  | "inquiry_queued"
  /** Pipeline is actively sending; not “inquiry sent” yet. */
  | "inquiry_sending"
  | "inquiry_sent"
  | "responded";

export type RailVendorTileItem = {
  moduleId: string;
  moduleType: ModuleType;
  /** vendorId */
  id: string;
  name: string;
  status: RailVendorStatus;
  /** Archived row: dimmed in the rail; tap to manage or restore. */
  isArchived?: boolean;
};

export const RAIL_STATUS_COPY: Record<RailVendorStatus, { statusLabel: string; helperText: string }> = {
  shortlisted: { statusLabel: "Ready to contact", helperText: "" },
  inquiry_queued: { statusLabel: "Preparing outreach…", helperText: "" },
  inquiry_sending: { statusLabel: "Nyra is contacting the vendor…", helperText: "" },
  inquiry_sent: { statusLabel: "Inquiry sent", helperText: "Waiting for response" },
  responded: { statusLabel: "Replied", helperText: "Response ready to review." },
};

/** Shortlist rail: partition active tiles for section headers and styling (shortlist order preserved). */
const RAIL_READY_TO_CONTACT_STATUSES: ReadonlySet<RailVendorStatus> = new Set(["shortlisted"]);

const RAIL_IN_PROGRESS_SECTION_STATUSES: ReadonlySet<RailVendorStatus> = new Set([
  "inquiry_queued",
  "inquiry_sending",
  "inquiry_sent",
  "responded",
]);

export function partitionRailVendorsForShortlistSections(
  items: readonly RailVendorTileItem[]
): { readyToContact: RailVendorTileItem[]; inProgress: RailVendorTileItem[] } {
  const readyToContact: RailVendorTileItem[] = [];
  const inProgress: RailVendorTileItem[] = [];
  for (const item of items) {
    if (RAIL_READY_TO_CONTACT_STATUSES.has(item.status)) {
      readyToContact.push(item);
    } else if (RAIL_IN_PROGRESS_SECTION_STATUSES.has(item.status)) {
      inProgress.push(item);
    } else {
      inProgress.push(item);
    }
  }
  return { readyToContact, inProgress };
}

export function railStatusDotClass(status: RailVendorStatus): string {
  switch (status) {
    case "shortlisted":
    case "inquiry_queued":
      return "bg-chat-text-muted/55";
    case "inquiry_sending":
      return "bg-nyra-accent/55";
    case "inquiry_sent":
      return "bg-emerald-500/45";
    case "responded":
      return "bg-sky-400/50";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function resolveRailVendorStatus(
  moduleId: string,
  vendorId: string,
  outreachInitiated: boolean,
  outreachByKey: Map<string, OutreachRowForRail>
): RailVendorStatus {
  if (!outreachInitiated) return "shortlisted";
  const row = outreachByKey.get(railVendorKey(moduleId, vendorId));
  if (!row) return "shortlisted";
  switch (row.status) {
    case "queued":
      return "inquiry_queued";
    case "drafting-outreach":
      return "inquiry_sending";
    case "contacted":
      return "inquiry_sent";
    case "replied":
      return "responded";
    default: {
      const _exhaustive: never = row.status;
      return _exhaustive;
    }
  }
}

/** Selected shortlist order only; outreach rows do not insert or reorder ids here. */
export function orderedRailVendorIds(selectedVendorIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of selectedVendorIds) {
    if (!seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  return ordered;
}

function tileForId(
  moduleId: string,
  moduleType: ModuleType,
  id: string,
  vendorById: Map<string, { name: string }>,
  outreachInitiated: boolean,
  outreachByKey: Map<string, OutreachRowForRail>,
  isArchived: boolean,
  defaultName: string
): RailVendorTileItem {
  return {
    moduleId,
    moduleType,
    id,
    name: vendorById.get(id)?.name ?? defaultName,
    status: resolveRailVendorStatus(moduleId, id, outreachInitiated, outreachByKey),
    isArchived,
  };
}

export type MasterShortlistModuleInput = {
  moduleId: string;
  moduleType: ModuleType;
  activeVendorIds: readonly string[];
  archivedVendorIds: readonly string[];
};

export type MasterShortlistGroup = {
  moduleId: string;
  moduleType: ModuleType;
  listTitle: string;
  active: RailVendorTileItem[];
};

/** One wedding shortlist: groups with active selections per module; archived is merged at the rail. */
export function buildMasterShortlistData(
  modules: readonly MasterShortlistModuleInput[],
  vendorById: Map<string, { name: string }>,
  outreachInitiated: boolean,
  outreachByKey: Map<string, OutreachRowForRail>
): { groups: MasterShortlistGroup[]; archived: RailVendorTileItem[]; totalActiveCount: number } {
  const groups: MasterShortlistGroup[] = [];
  const archived: RailVendorTileItem[] = [];
  let totalActiveCount = 0;
  for (const mod of modules) {
    const labels = moduleEntityLabels(mod.moduleType);
    const active = orderedRailVendorIds(mod.activeVendorIds).map((id) =>
      tileForId(
        mod.moduleId,
        mod.moduleType,
        id,
        vendorById,
        outreachInitiated,
        outreachByKey,
        false,
        labels.defaultCardName
      )
    );
    for (const id of orderedRailVendorIds(mod.archivedVendorIds)) {
      archived.push(
        tileForId(
          mod.moduleId,
          mod.moduleType,
          id,
          vendorById,
          outreachInitiated,
          outreachByKey,
          true,
          labels.defaultCardName
        )
      );
    }
    if (active.length > 0) {
      totalActiveCount += active.length;
      groups.push({
        moduleId: mod.moduleId,
        moduleType: mod.moduleType,
        listTitle: labels.listNounTitle,
        active,
      });
    }
  }
  return { groups, archived, totalActiveCount };
}

export function getVendorOutreachRailCopy(
  moduleId: string,
  vendorId: string,
  outreachInitiated: boolean,
  outreachByKey: Map<string, OutreachRowForRail>
): { headline: string; detail: string } {
  const status = resolveRailVendorStatus(moduleId, vendorId, outreachInitiated, outreachByKey);
  const copy = RAIL_STATUS_COPY[status];
  return { headline: copy.statusLabel, detail: copy.helperText };
}

/** Compact type chip for the plan canvas rail (Venue / Catering / Photography). */
export function planModuleTypeBadgeLabel(moduleType: ModuleType): string {
  if (moduleType === "catering") return "Catering";
  if (moduleType === "photography") return "Photography";
  return "Venue";
}

/**
 * Single-line status for the flat plan list (assistant-led copy; keys off `RailVendorStatus`).
 */
export function planCanvasRowStatus(status: RailVendorStatus): string {
  switch (status) {
    case "shortlisted":
      return "Ready to contact";
    case "inquiry_queued":
    case "inquiry_sending":
      return "Inquiry sent";
    case "inquiry_sent":
      return "Waiting for response";
    case "responded":
      return "Replied";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** One flat list: module order from `visibleShortlistByModule`, then shortlist order within each module. */
export function flattenMasterShortlistActiveItems(
  groups: readonly MasterShortlistGroup[],
  visibleShortlistByModule: readonly MasterShortlistModuleInput[]
): RailVendorTileItem[] {
  const order = new Map(visibleShortlistByModule.map((m, i) => [m.moduleId, i]));
  const sorted = [...groups].sort(
    (a, b) => (order.get(a.moduleId) ?? 1e6) - (order.get(b.moduleId) ?? 1e6)
  );
  const out: RailVendorTileItem[] = [];
  for (const g of sorted) {
    out.push(...g.active);
  }
  return out;
}
