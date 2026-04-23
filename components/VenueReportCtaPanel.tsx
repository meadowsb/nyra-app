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
}: VenueReportCtaPanelProps) {
  const helper =
    selectedCount === 0
      ? "Pick one or more matches above, then continue—we bundle outreach into a single report."
      : `We’ll reach out to ${selectedCount} venue${selectedCount === 1 ? "" : "s"} together so you get pricing and availability without managing separate threads.`;

  const isRail = variant === "rail";
  const isPrimaryCta = ctaProminence === "primary";

  const contactButtonClass = isPrimaryCta
    ? isRail
      ? "nyra-btn-primary nyra-btn-primary--rail w-full"
      : "nyra-btn-primary nyra-btn-primary--panel mt-4 w-full"
    : isRail
      ? "nyra-btn-chat-secondary w-full"
      : "nyra-btn-chat-secondary mt-4 w-full";

  return (
    <div className={className}>
      {isRail ? null : (
        <>
          <p className="nyra-eyebrow">Next step</p>
          <p className="mt-2 text-[13px] leading-relaxed text-chat-text-secondary">{helper}</p>
        </>
      )}
      <button type="button" onClick={onVenueReportCta} className={contactButtonClass}>
        Contact venues
      </button>
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
