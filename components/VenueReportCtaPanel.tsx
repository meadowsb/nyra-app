type VenueReportCtaPanelProps = {
  selectedCount: number;
  venueSelectionHint: string | null;
  onVenueReportCta: () => void;
  className?: string;
  /** Desktop rail: action only (copy lives in the sidebar body). */
  variant?: "default" | "rail";
  /**
   * When "primary", full accent (venues on shortlist). When "secondary", neutral until user selects venues.
   */
  ctaProminence: "primary" | "secondary";
  /** After initial outreach kickoff: rail uses pipeline-aware CTAs when true. */
  outreachActive?: boolean;
  /**
   * While outreach is live: shortlisted venues with no outreach row yet (not contacted).
   * When positive, show primary “Contact venues (N)” and a compact “Ready to contact” timeline line above it; when zero, the rail hides this block.
   */
  pendingAdditionalOutreachCount?: number;
  /** Desktop rail only: contextual line above the button; omitted when the pending-contact helper line is shown. */
  railVenueWorkSummaryLine?: string | null;
};

/**
 * Shared “Contact venues” block: short copy + action + validation hint.
 * Used under venue cards (mobile) and inside the shortlist sidebar (desktop).
 */
export function VenueReportCtaPanel({
  selectedCount,
  venueSelectionHint,
  onVenueReportCta,
  className,
  variant = "default",
  ctaProminence,
  outreachActive = false,
  pendingAdditionalOutreachCount = 0,
  railVenueWorkSummaryLine,
}: VenueReportCtaPanelProps) {
  const helper =
    selectedCount === 0
      ? "Pick one or more matches above, then continue—we bundle outreach into a single report."
      : `We’ll reach out to ${selectedCount} venue${selectedCount === 1 ? "" : "s"} together so you get pricing and availability without managing separate threads.`;

  const isRail = variant === "rail";
  const showPendingContactCta =
    outreachActive && pendingAdditionalOutreachCount > 0;
  const isPrimaryCta =
    showPendingContactCta || (ctaProminence === "primary" && !outreachActive);

  const contactButtonLabel = showPendingContactCta
    ? `Contact venues (${pendingAdditionalOutreachCount})`
    : `Contact venues (${selectedCount})`;

  const readyToContactLine = showPendingContactCta
    ? `${pendingAdditionalOutreachCount} ready to contact`
    : null;

  const hideRailsContactBlock =
    isRail && outreachActive && pendingAdditionalOutreachCount === 0;

  const railContextLineClass =
    "mb-2 text-[12px] font-medium leading-snug tracking-[-0.01em] text-chat-text-secondary";

  const contactButtonClass = isPrimaryCta
    ? isRail
      ? "nyra-btn-primary nyra-btn-primary--rail w-full"
      : "nyra-btn-primary nyra-btn-primary--panel mt-4 w-full"
    : isRail
      ? "nyra-btn-chat-secondary w-full"
      : "nyra-btn-chat-secondary mt-4 w-full";

  /** Sidebar always passes a formatted line; omit the paragraph when absent. */
  const railSummaryLine =
    railVenueWorkSummaryLine === undefined ? null : railVenueWorkSummaryLine;

  return (
    <div className={className}>
      {isRail ? null : (
        <>
          <p className="nyra-eyebrow">Next step</p>
          <p className="mt-2 text-[13px] leading-relaxed text-chat-text-secondary">{helper}</p>
        </>
      )}
      {!isRail && readyToContactLine ? (
        <p className="mt-3 text-[12px] font-medium leading-snug tracking-[-0.01em] text-chat-text-muted motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out">
          {readyToContactLine}
        </p>
      ) : null}
      {!hideRailsContactBlock ? (
        <>
          {isRail && showPendingContactCta ? (
            <div
              className={`mb-2 motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]`}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-0">
                <span
                  className="row-start-1 mt-[0.35em] size-2 shrink-0 self-start rounded-full bg-amber-300/72"
                  aria-hidden
                />
                <p className="col-start-2 row-start-1 text-[12px] font-semibold leading-snug tracking-[-0.01em] text-chat-text-primary">
                  Ready to contact
                </p>
                <div className="col-start-2 row-start-2 mt-1 min-w-0 space-y-1">
                  <p className="text-[11.5px] leading-snug text-chat-text-secondary/65">
                    Nyra will reach out to check availability and pricing
                  </p>
                  <p className="text-[11.5px] leading-snug text-chat-text-secondary/65">
                    Based on your guest count, date, and budget
                  </p>
                </div>
              </div>
            </div>
          ) : isRail && railSummaryLine ? (
            <p
              className={`${railContextLineClass} motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]`}
            >
              {railSummaryLine}
            </p>
          ) : null}
          <div>
            <button type="button" onClick={onVenueReportCta} className={contactButtonClass}>
              {contactButtonLabel}
            </button>
          </div>
        </>
      ) : null}
      {venueSelectionHint ? (
        <p
          className={
            isRail
              ? "mt-2.5 text-[13px] font-medium text-amber-200/95"
              : "mt-3 text-sm font-medium text-amber-200/95"
          }
          role="status"
          aria-live="polite"
        >
          {venueSelectionHint}
        </p>
      ) : null}
    </div>
  );
}
