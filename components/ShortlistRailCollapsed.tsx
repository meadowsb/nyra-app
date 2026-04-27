"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { RightRailVenueTile } from "@/components/RightRailVenueTile";
import {
  flattenMasterShortlistActiveItems,
  planCanvasRowStatus,
  planModuleTypeBadgeLabel,
  railStatusDotClass,
  railVendorKey,
  type MasterShortlistGroup,
  type MasterShortlistModuleInput,
  type RailVendorTileItem,
} from "@/components/selectedVendorRailModel";

const RAIL_SHORTLIST_ARRIVE_CLEAR_MS = 1300;

function RailPlanCanvasRow({
  item,
  plannerRef,
  onVendorTilePress,
  visualTone,
  statusDotClass,
  shortlistArriveMotion = false,
  useShortlistArriveShell = false,
  reduceMotion,
}: {
  item: RailVendorTileItem;
  plannerRef: { moduleId: string; vendorId: string } | null;
  onVendorTilePress: (scope: { moduleId: string; vendorId: string }) => void;
  visualTone: "actionable" | "neutral";
  statusDotClass?: string | null;
  shortlistArriveMotion?: boolean;
  useShortlistArriveShell?: boolean;
  reduceMotion: boolean;
}) {
  const statusLabel = planCanvasRowStatus(item.status);
  const tile = (
    <RightRailVenueTile
      className="min-w-0 w-full"
      name={item.name}
      typeBadge={planModuleTypeBadgeLabel(item.moduleType)}
      statusLabel={statusLabel}
      helperText=""
      statusDotClass={statusDotClass ?? null}
      onPress={() => onVendorTilePress({ moduleId: item.moduleId, vendorId: item.id })}
      isSelected={plannerRef?.moduleId === item.moduleId && plannerRef.vendorId === item.id}
      isArchived={item.isArchived === true}
      visualTone={visualTone}
    />
  );

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
  /** Planning modules to show: session-activated and/or with shortlisted vendors (same shape as the full list). */
  visibleShortlistByModule: readonly MasterShortlistModuleInput[];
  /** Categorized shortlist; flattened to a single plan list for display. */
  groups: readonly MasterShortlistGroup[];
  archivedRailVenues: RailVendorTileItem[];
  hasAnyOutreach: boolean;
  plannerRef: { moduleId: string; vendorId: string } | null;
  onVendorTilePress: (scope: { moduleId: string; vendorId: string }) => void;
  reduceMotion: boolean;
};

export function ShortlistRailCollapsed({
  visibleShortlistByModule,
  groups,
  archivedRailVenues,
  hasAnyOutreach,
  plannerRef,
  onVendorTilePress,
  reduceMotion,
}: ShortlistRailCollapsedProps) {
  const flatItems = useMemo(
    () => flattenMasterShortlistActiveItems(groups, visibleShortlistByModule),
    [groups, visibleShortlistByModule]
  );

  const isPlanEmpty = flatItems.length === 0;

  const readyItems = useMemo(
    () => flatItems.filter((i) => i.status === "shortlisted"),
    [flatItems]
  );

  const prevReadyKeysRef = useRef<string[]>([]);
  const shortlistArriveTimeoutsRef = useRef<Map<string, number>>(new Map());
  const shortlistArriveInitialDoneRef = useRef(false);
  const [shortlistArriveKeys, setShortlistArriveKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    return () => {
      const pending = shortlistArriveTimeoutsRef.current;
      for (const tid of pending.values()) {
        window.clearTimeout(tid);
      }
      pending.clear();
    };
  }, []);

  useEffect(() => {
    const next = readyItems.map((i) => railVendorKey(i.moduleId, i.id));
    if (!shortlistArriveInitialDoneRef.current) {
      shortlistArriveInitialDoneRef.current = true;
      prevReadyKeysRef.current = next;
      return;
    }
    if (reduceMotion) {
      prevReadyKeysRef.current = next;
      return;
    }
    const prevSet = new Set(prevReadyKeysRef.current);
    const added = next.filter((k) => !prevSet.has(k));
    prevReadyKeysRef.current = next;
    if (added.length === 0) return;

    setShortlistArriveKeys((prev) => {
      const merged = new Set(prev);
      for (const k of added) merged.add(k);
      return merged;
    });

    for (const k of added) {
      const existing = shortlistArriveTimeoutsRef.current.get(k);
      if (existing != null) window.clearTimeout(existing);
      const tid = window.setTimeout(() => {
        shortlistArriveTimeoutsRef.current.delete(k);
        setShortlistArriveKeys((prev) => {
          const n = new Set(prev);
          n.delete(k);
          return n;
        });
      }, RAIL_SHORTLIST_ARRIVE_CLEAR_MS);
      shortlistArriveTimeoutsRef.current.set(k, tid);
    }
  }, [readyItems, reduceMotion]);

  const archivedEyebrowClass =
    "text-[11px] font-semibold uppercase tracking-[0.16em] text-chat-text-muted";

  return (
    <>
      <header className="max-w-[16rem]">
        <h2
          id="nyra-rail-plan-heading"
          className="text-lg font-semibold leading-[1.2] tracking-[-0.03em] text-chat-text-primary"
        >
          Your plan
        </h2>
        {isPlanEmpty ? (
          <div className="mt-6 space-y-2">
            <p className="text-[13px] leading-[1.55] text-chat-text-secondary">
              Nothing here yet.
            </p>
            <p className="text-[13px] leading-[1.55] text-chat-text-muted">
              Shortlist anything you like — it will appear here.
            </p>
          </div>
        ) : (
          <p className="mt-2.5 text-[13px] leading-[1.55] text-chat-text-secondary">
            {hasAnyOutreach
              ? "Tap an item for notes, follow-ups, and status."
              : "Shortlist matches from any category—they show up here in one place."}
          </p>
        )}
      </header>

      {!isPlanEmpty ? (
        <div
          className="mt-6 flex min-w-0 flex-col gap-2"
          role="list"
          aria-labelledby="nyra-rail-plan-heading"
        >
          {flatItems.map((item) => {
            const k = railVendorKey(item.moduleId, item.id);
            const actionable = item.status === "shortlisted";
            return (
              <div key={k} role="listitem" className="min-w-0">
                <RailPlanCanvasRow
                  item={item}
                  plannerRef={plannerRef}
                  onVendorTilePress={onVendorTilePress}
                  visualTone={actionable ? "actionable" : "neutral"}
                  statusDotClass={
                    actionable ? null : railStatusDotClass(item.status)
                  }
                  useShortlistArriveShell={actionable}
                  shortlistArriveMotion={actionable && shortlistArriveKeys.has(k)}
                  reduceMotion={reduceMotion}
                />
              </div>
            );
          })}
        </div>
      ) : null}

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
              <RailPlanCanvasRow
                key={railVendorKey(item.moduleId, item.id)}
                item={item}
                plannerRef={plannerRef}
                onVendorTilePress={onVendorTilePress}
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
