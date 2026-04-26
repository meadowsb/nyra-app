/** Matches `OutreachItem.status` for rail resolution without importing the sidebar module. */
type RailOutreachStatus = "queued" | "drafting-outreach" | "contacted" | "replied";

export type OutreachRowForRail = {
  venueId: string;
  status: RailOutreachStatus;
};

/** Canonical rail tile model; copy comes only from `status`. */
export type RailVenueStatus =
  | "shortlisted"
  | "inquiry_queued"
  /** Pipeline is actively sending; not “inquiry sent” yet. */
  | "inquiry_sending"
  | "inquiry_sent"
  | "responded";

export type RailVenueTileItem = {
  id: string;
  name: string;
  status: RailVenueStatus;
  /** Archived row: dimmed in the rail; tap to manage or restore. */
  isArchived?: boolean;
};

export const RAIL_STATUS_COPY: Record<RailVenueStatus, { statusLabel: string; helperText: string }> = {
  shortlisted: { statusLabel: "Ready to contact", helperText: "" },
  inquiry_queued: { statusLabel: "Preparing outreach…", helperText: "" },
  inquiry_sending: { statusLabel: "Nyra is contacting venue…", helperText: "" },
  inquiry_sent: { statusLabel: "Inquiry sent", helperText: "Waiting for response" },
  responded: { statusLabel: "Responded", helperText: "Response ready to review." },
};

/** Shortlist rail: partition active tiles for section headers and styling (shortlist order preserved). */
const RAIL_READY_TO_CONTACT_STATUSES: ReadonlySet<RailVenueStatus> = new Set(["shortlisted"]);

const RAIL_IN_PROGRESS_SECTION_STATUSES: ReadonlySet<RailVenueStatus> = new Set([
  "inquiry_queued",
  "inquiry_sending",
  "inquiry_sent",
  "responded",
]);

export function partitionRailVenuesForShortlistSections(
  items: readonly RailVenueTileItem[]
): { readyToContact: RailVenueTileItem[]; inProgress: RailVenueTileItem[] } {
  const readyToContact: RailVenueTileItem[] = [];
  const inProgress: RailVenueTileItem[] = [];
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

export function railStatusDotClass(status: RailVenueStatus): string {
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

function resolveRailVenueStatus(
  venueId: string,
  outreachMode: boolean,
  outreachById: Map<string, OutreachRowForRail>
): RailVenueStatus {
  if (!outreachMode) return "shortlisted";
  const row = outreachById.get(venueId);
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
export function orderedRailVenueIds(selectedVenueIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of selectedVenueIds) {
    if (!seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  return ordered;
}

function tileForId(
  id: string,
  venueById: Map<string, { name: string }>,
  outreachMode: boolean,
  outreachById: Map<string, OutreachRowForRail>,
  isArchived: boolean
): RailVenueTileItem {
  return {
    id,
    name: venueById.get(id)?.name ?? "Venue",
    status: resolveRailVenueStatus(id, outreachMode, outreachById),
    isArchived,
  };
}

/** Active shortlist first; archived venues are tracked separately for restore. */
export function buildRailVenueSections(
  activeVenueIds: readonly string[],
  archivedVenueIds: readonly string[],
  venueById: Map<string, { name: string }>,
  outreachMode: boolean,
  outreachById: Map<string, OutreachRowForRail>
): { active: RailVenueTileItem[]; archived: RailVenueTileItem[] } {
  return {
    active: orderedRailVenueIds(activeVenueIds).map((id) =>
      tileForId(id, venueById, outreachMode, outreachById, false)
    ),
    archived: orderedRailVenueIds(archivedVenueIds).map((id) =>
      tileForId(id, venueById, outreachMode, outreachById, true)
    ),
  };
}

export function getVenueOutreachRailCopy(
  venueId: string,
  outreachMode: boolean,
  outreachById: Map<string, OutreachRowForRail>
): { headline: string; detail: string } {
  const status = resolveRailVenueStatus(venueId, outreachMode, outreachById);
  const copy = RAIL_STATUS_COPY[status];
  return { headline: copy.statusLabel, detail: copy.helperText };
}
