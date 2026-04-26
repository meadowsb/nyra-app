"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { RightRailVenueTile } from "@/components/RightRailVenueTile";
import {
  RAIL_STATUS_COPY,
  partitionRailVenuesForShortlistSections,
  railStatusDotClass,
  type RailVenueTileItem,
} from "@/components/selectedVenueRailModel";

const RAIL_GROUP_HEADING =
  "text-[12px] font-semibold tracking-[-0.01em] text-chat-text-secondary";

const RAIL_MOTION_CLEAR_MS = 1500;
const RAIL_STAGGER_MS = 44;
const RAIL_SHORTLIST_ARRIVE_CLEAR_MS = 1300;

function RailVenueTileRow({
  item,
  plannerDetailVenueId,
  onVenueTilePress,
  visualTone,
  statusDotClass,
  motionSurfaceClass,
  motionStyle,
  shortlistArriveMotion = false,
  /** Keeps a stable wrapper so the arrive class can drop without remounting the tile. */
  useShortlistArriveShell = false,
  reduceMotion,
}: {
  item: RailVenueTileItem;
  plannerDetailVenueId: string | null;
  onVenueTilePress: (id: string) => void;
  visualTone: "actionable" | "neutral";
  statusDotClass?: string | null;
  motionSurfaceClass?: string;
  motionStyle?: CSSProperties;
  /** New row in “Ready to contact” — subtle enter + glow (see globals). */
  shortlistArriveMotion?: boolean;
  useShortlistArriveShell?: boolean;
  reduceMotion: boolean;
}) {
  const { statusLabel, helperText } = RAIL_STATUS_COPY[item.status];
  const tile = (
    <RightRailVenueTile
      className="min-w-0 w-full"
      name={item.name}
      statusLabel={statusLabel}
      helperText={helperText}
      statusDotClass={statusDotClass ?? null}
      onPress={() => onVenueTilePress(item.id)}
      isSelected={plannerDetailVenueId === item.id}
      isArchived={item.isArchived === true}
      visualTone={visualTone}
    />
  );

  if (motionSurfaceClass && !reduceMotion) {
    return (
      <div className="min-w-0" style={motionStyle}>
        <div className={`min-w-0 ${motionSurfaceClass}`}>{tile}</div>
      </div>
    );
  }

  if (useShortlistArriveShell) {
    const arriveActive = Boolean(shortlistArriveMotion) && !reduceMotion;
    return (
      <div className="min-w-0 rounded-lg">
        <div className={arriveActive ? "min-w-0 nyra-rail-tile--shortlist-arrive" : "min-w-0"}>
          {tile}
        </div>
      </div>
    );
  }

  return tile;
}

export type ShortlistRailCollapsedProps = {
  activeRailVenues: RailVenueTileItem[];
  archivedRailVenues: RailVenueTileItem[];
  outreachMode: boolean;
  plannerDetailVenueId: string | null;
  onVenueTilePress: (venueId: string) => void;
  reduceMotion: boolean;
};

export function ShortlistRailCollapsed({
  activeRailVenues,
  archivedRailVenues,
  outreachMode,
  plannerDetailVenueId,
  onVenueTilePress,
  reduceMotion,
}: ShortlistRailCollapsedProps) {
  const headerDescription = outreachMode
    ? "Tap a venue to add notes, send a follow-up, or remove it from your shortlist."
    : "These are the only names we include in your outreach bundle—curate the list, then continue.";

  const { readyToContact, inProgress } = useMemo(
    () => partitionRailVenuesForShortlistSections(activeRailVenues),
    [activeRailVenues]
  );

  const prevSectionByVenueIdRef = useRef<Map<string, "ready" | "progress">>(new Map());
  const [inProgressMotionDelays, setInProgressMotionDelays] = useState<Map<string, number>>(
    () => new Map()
  );
  const prevReadyLenRef = useRef(readyToContact.length);
  const [readyGroupDim, setReadyGroupDim] = useState(false);

  const shortlistArriveInitialDoneRef = useRef(false);
  const prevReadyIdsRef = useRef<string[]>([]);
  const shortlistArriveTimeoutsRef = useRef<Map<string, number>>(new Map());
  const [shortlistArriveIds, setShortlistArriveIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- read latest timeout ids at unmount
      const pending = shortlistArriveTimeoutsRef.current;
      for (const tid of pending.values()) {
        window.clearTimeout(tid);
      }
      pending.clear();
    };
  }, []);

  useEffect(() => {
    const next = readyToContact.map((i) => i.id);
    if (!shortlistArriveInitialDoneRef.current) {
      shortlistArriveInitialDoneRef.current = true;
      prevReadyIdsRef.current = next;
      return;
    }
    if (reduceMotion) {
      prevReadyIdsRef.current = next;
      return;
    }
    const prevSet = new Set(prevReadyIdsRef.current);
    const added = next.filter((id) => !prevSet.has(id));
    prevReadyIdsRef.current = next;
    if (added.length === 0) return;

    setShortlistArriveIds((prev) => {
      const merged = new Set(prev);
      for (const id of added) merged.add(id);
      return merged;
    });

    for (const id of added) {
      const existing = shortlistArriveTimeoutsRef.current.get(id);
      if (existing != null) window.clearTimeout(existing);
      const tid = window.setTimeout(() => {
        shortlistArriveTimeoutsRef.current.delete(id);
        setShortlistArriveIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      }, RAIL_SHORTLIST_ARRIVE_CLEAR_MS);
      shortlistArriveTimeoutsRef.current.set(id, tid);
    }
  }, [readyToContact, reduceMotion]);

  useEffect(() => {
    const n = readyToContact.length;
    const prev = prevReadyLenRef.current;
    if (reduceMotion) {
      prevReadyLenRef.current = n;
    } else if (outreachMode && n < prev && n > 0) {
      const raf = requestAnimationFrame(() => {
        setReadyGroupDim(true);
      });
      const t = window.setTimeout(() => setReadyGroupDim(false), 280);
      prevReadyLenRef.current = n;
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(t);
      };
    } else {
      prevReadyLenRef.current = n;
    }
  }, [readyToContact.length, outreachMode, reduceMotion]);

  useEffect(() => {
    const prev = prevSectionByVenueIdRef.current;
    const next = new Map<string, "ready" | "progress">();
    for (const i of readyToContact) next.set(i.id, "ready");
    for (const i of inProgress) next.set(i.id, "progress");

    prevSectionByVenueIdRef.current = next;

    if (reduceMotion) {
      return;
    }

    const motionDelays = new Map<string, number>();
    let stagger = 0;
    for (const item of inProgress) {
      if (prev.get(item.id) === "ready") {
        motionDelays.set(item.id, stagger);
        stagger += RAIL_STAGGER_MS;
      }
    }

    if (motionDelays.size === 0) {
      return;
    }

    const raf = requestAnimationFrame(() => {
      setInProgressMotionDelays(motionDelays);
    });
    const clearTimer = window.setTimeout(() => {
      setInProgressMotionDelays(new Map());
    }, RAIL_MOTION_CLEAR_MS);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(clearTimer);
    };
  }, [readyToContact, inProgress, reduceMotion]);

  const secondSectionTitle = useMemo(() => {
    if (inProgress.length === 0) return null;
    const anyInquirySent = inProgress.some((i) => i.status === "inquiry_sent");
    const anyResponded = inProgress.some((i) => i.status === "responded");
    if (anyResponded && !anyInquirySent) {
      return "Responded";
    }
    return "In progress";
  }, [inProgress]);

  const archivedEyebrowClass =
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-chat-text-muted";

  return (
    <>
      <header className="max-w-[16rem]">
        <div className="min-w-0 flex-1">
          <p className="nyra-eyebrow">Shortlist</p>
          <h2
            id="nyra-rail-shortlist-heading"
            className="mt-2.5 text-lg font-semibold leading-[1.2] tracking-[-0.03em] text-chat-text-primary"
          >
            Selected venues
          </h2>
        </div>
        <p className="mt-2.5 text-[13px] leading-[1.55] text-chat-text-secondary">{headerDescription}</p>
      </header>

      <div
        className="mt-6 space-y-6"
        role="region"
        aria-labelledby="nyra-rail-shortlist-heading"
      >
        {activeRailVenues.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-chat-text-muted">
            No venues yet—tap Add to shortlist on a match in the thread.
          </p>
        ) : (
          <>
            {readyToContact.length > 0 ? (
              <section
                className={`min-w-0 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out ${
                  readyGroupDim ? "motion-safe:opacity-[0.72]" : ""
                }`}
                aria-label={`Ready to contact, ${readyToContact.length}`}
              >
                <h3 className={RAIL_GROUP_HEADING}>
                  Ready to contact ({readyToContact.length})
                </h3>
                <div className="mt-2 flex min-w-0 flex-col gap-2">
                  {readyToContact.map((item) => (
                    <RailVenueTileRow
                      key={item.id}
                      item={item}
                      plannerDetailVenueId={plannerDetailVenueId}
                      onVenueTilePress={onVenueTilePress}
                      visualTone="actionable"
                      statusDotClass={null}
                      useShortlistArriveShell
                      shortlistArriveMotion={shortlistArriveIds.has(item.id)}
                      reduceMotion={reduceMotion}
                    />
                  ))}
                </div>
              </section>
            ) : null}
            {inProgress.length > 0 && secondSectionTitle ? (
              <section
                className="min-w-0"
                aria-label={`${secondSectionTitle}, ${inProgress.length}`}
              >
                <h3 className={RAIL_GROUP_HEADING}>
                  {secondSectionTitle} ({inProgress.length})
                </h3>
                <div className="mt-2 flex min-w-0 flex-col gap-2">
                  {inProgress.map((item) => {
                    const motionDelays = reduceMotion ? null : inProgressMotionDelays;
                    const delayMs = motionDelays?.get(item.id);
                    const motionActive =
                      !reduceMotion && delayMs !== undefined && outreachMode;
                    return (
                      <RailVenueTileRow
                        key={item.id}
                        item={item}
                        plannerDetailVenueId={plannerDetailVenueId}
                        onVenueTilePress={onVenueTilePress}
                        visualTone="neutral"
                        statusDotClass={railStatusDotClass(item.status)}
                        motionSurfaceClass={
                          motionActive ? "nyra-rail-tile--inprogress-motion" : undefined
                        }
                        motionStyle={
                          motionActive
                            ? ({ "--nyra-rail-stagger": `${delayMs}ms` } as CSSProperties)
                            : undefined
                        }
                        reduceMotion={reduceMotion}
                      />
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      {archivedRailVenues.length > 0 ? (
        <div className="mt-8" role="region" aria-labelledby="nyra-rail-archived-heading">
          <p id="nyra-rail-archived-heading" className={archivedEyebrowClass}>
            Removed from shortlist
          </p>
          <p className="mt-1.5 text-[12px] leading-snug text-chat-text-muted">
            Not on your active list—open one to add back.
          </p>
          <div className="mt-2 flex min-w-0 flex-col gap-2">
            {archivedRailVenues.map((item) => (
              <RailVenueTileRow
                key={item.id}
                item={item}
                plannerDetailVenueId={plannerDetailVenueId}
                onVenueTilePress={onVenueTilePress}
                visualTone="neutral"
                statusDotClass={railStatusDotClass(item.status)}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
