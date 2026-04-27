import type { ModuleType } from "@/lib/modules";
import { moduleEntityLabels } from "@/lib/modules";

type VenueReportCtaPanelProps = {
  moduleType?: ModuleType;
  selectedCount: number;
  /**
   * Wedding-wide count for the primary button (rail); when set, used instead of
   * `selectedCount` for the label and “Continue” check.
   */
  totalPlanSelectedCount?: number;
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
   * While outreach is live: shortlisted vendors with no outreach row yet (not contacted).
   * When positive, primary “Contact selected vendors (N)”; when zero, the rail hides the contact block.
   */
  pendingAdditionalOutreachCount?: number;
};

/**
 * Shared “Contact venues” block: short copy + action + validation hint.
 * Used under venue cards (mobile) and inside the shortlist sidebar (desktop).
 */
export function VenueReportCtaPanel({
  moduleType = "venue",
  selectedCount,
  totalPlanSelectedCount,
  venueSelectionHint,
  onVenueReportCta,
  className,
  variant = "default",
  ctaProminence,
  outreachActive = false,
  pendingAdditionalOutreachCount = 0,
}: VenueReportCtaPanelProps) {
  const labels = moduleEntityLabels(moduleType);
  const n = labels.listNoun;
  const planCount = totalPlanSelectedCount ?? selectedCount;
  const helper =
    planCount === 0
      ? "Pick one or more matches above, then continue—we bundle outreach into a single report."
      : `We’ll reach out to ${planCount} ${n} together so you get pricing and availability without managing separate threads.`;

  const isRail = variant === "rail";
  const showPendingContactCta =
    !isRail && outreachActive && pendingAdditionalOutreachCount > 0;
  const isPrimaryCta = isRail
    ? planCount > 0 && ctaProminence === "primary"
    : showPendingContactCta || (ctaProminence === "primary" && !outreachActive);

  const contactButtonLabel = isRail
    ? planCount === 0
      ? "Continue"
      : "Review plan"
    : showPendingContactCta
      ? `Contact selected vendors (${pendingAdditionalOutreachCount})`
      : planCount === 0
        ? "Continue"
        : `Contact selected vendors (${planCount})`;

  const readyToContactLine = showPendingContactCta
    ? `${pendingAdditionalOutreachCount} ready to contact`
    : null;

  const contactButtonClass = isPrimaryCta
    ? isRail
      ? "nyra-btn-primary nyra-btn-primary--rail w-full"
      : "nyra-btn-primary nyra-btn-primary--panel mt-4 w-full"
    : isRail
      ? "nyra-btn-chat-secondary w-full"
      : "nyra-btn-chat-secondary mt-4 w-full";

  const railDisabledClass = isRail ? "disabled:pointer-events-none disabled:opacity-45" : "";

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
      <div>
        <button
          type="button"
          onClick={onVenueReportCta}
          disabled={isRail && planCount === 0}
          className={`${contactButtonClass} ${railDisabledClass}`.trim()}
        >
          {contactButtonLabel}
        </button>
      </div>
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
