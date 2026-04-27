"use client";

const TILE_SURFACE_NEUTRAL =
  "rounded-lg border border-white/[0.055] bg-white/[0.035] px-2.5 py-2 leading-snug shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";

const TILE_SURFACE_ACTIONABLE =
  "rounded-lg border border-white/[0.09] bg-white/[0.052] px-2.5 py-2 leading-snug shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";

const TYPE_BADGE_CLASS =
  "inline-flex shrink-0 items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-chat-text-muted";

export type RightRailVenueTileProps = {
  name: string;
  statusLabel: string;
  helperText: string;
  /** When set, renders a compact module chip beside the status (plan canvas rail). */
  typeBadge?: string;
  /** Tailwind classes for the status indicator dot; omit to hide the dot. */
  statusDotClass?: string | null;
  /** Merged onto the same surface as every other status (e.g. min-w-0 in a flex column). */
  className?: string;
  /** When set, the tile is a focusable control (planner sheet). */
  onPress?: () => void;
  /** Planner sheet target is this venue. */
  isSelected?: boolean;
  /** Archived shortlist row. */
  isArchived?: boolean;
  /**
   * `actionable` — shortlist queue items that need attention (brighter surface, stronger type).
   * `neutral` — inquiry sent / responded; calmer presentation.
   */
  visualTone?: "actionable" | "neutral";
};

/**
 * Chat right rail: one fixed layout for every venue row (name, status, helper).
 * Review actions live in the rail footer, not on the tile.
 */
export function RightRailVenueTile({
  name,
  statusLabel,
  helperText,
  typeBadge,
  statusDotClass,
  className,
  onPress,
  isSelected,
  isArchived,
  visualTone = "neutral",
}: RightRailVenueTileProps) {
  const ariaLabel = [name, typeBadge, statusLabel, helperText].filter(Boolean).join(". ");
  const baseSurface = visualTone === "actionable" ? TILE_SURFACE_ACTIONABLE : TILE_SURFACE_NEUTRAL;
  const surfaceClass = className ? `${baseSurface} ${className}` : baseSurface;
  const showDot = Boolean(statusDotClass);
  const stateClass = [
    onPress ? "w-full cursor-pointer text-left transition-[border-color,background-color,opacity]" : "",
    onPress
      ? visualTone === "actionable"
        ? "hover:border-white/[0.12] hover:bg-white/[0.06]"
        : "hover:border-white/[0.1] hover:bg-white/[0.05]"
      : "",
    isSelected ? "border-white/[0.14] bg-white/[0.06] ring-1 ring-white/[0.06]" : "",
    isArchived ? "opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const nameClass =
    visualTone === "actionable"
      ? "truncate text-[13px] font-semibold tracking-[-0.02em] text-chat-text-primary"
      : "truncate text-[13px] font-medium tracking-[-0.01em] text-chat-text-primary";

  const primaryStatusClass =
    visualTone === "actionable"
      ? "min-w-0 truncate text-[12px] font-semibold leading-snug tracking-[-0.01em] text-chat-text-primary"
      : "min-w-0 truncate text-[12px] font-medium leading-snug tracking-[-0.01em] text-chat-text-secondary";

  const secondaryStatusClass = "mt-1 truncate text-[12px] leading-snug text-chat-text-muted";

  const statusRow =
    statusLabel && typeBadge ? (
      <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
        <span className={TYPE_BADGE_CLASS}>{typeBadge}</span>
        {showDot ? (
          <div className="flex min-w-0 min-h-0 items-center gap-1.5">
            <span
              className={`size-1.5 shrink-0 rounded-full ${statusDotClass}`}
              aria-hidden
            />
            <span className={primaryStatusClass}>{statusLabel}</span>
          </div>
        ) : (
          <span className={`min-w-0 ${primaryStatusClass}`}>{statusLabel}</span>
        )}
      </div>
    ) : statusLabel ? (
      showDot ? (
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          <span
            className={`size-1.5 shrink-0 rounded-full ${statusDotClass}`}
            aria-hidden
          />
          <span className={primaryStatusClass}>{statusLabel}</span>
        </div>
      ) : (
        <p className={`mt-1.5 ${primaryStatusClass}`}>{statusLabel}</p>
      )
    ) : null;

  const body = (
    <>
      <p className={nameClass}>{name}</p>
      {statusRow}
      {!typeBadge && helperText ? <p className={secondaryStatusClass}>{helperText}</p> : null}
    </>
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        aria-label={ariaLabel}
        aria-pressed={isSelected}
        className={`${surfaceClass} ${stateClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nyra-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-chat-sidebar`}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={`${surfaceClass} ${stateClass}`} aria-label={ariaLabel}>
      {body}
    </div>
  );
}
