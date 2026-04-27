import { moduleEntityLabels, type ModuleType } from "@/lib/modules";

type PaywallCardProps = {
  moduleType?: ModuleType;
  venueSelectionHint: string | null;
  onVenueReportCta: () => void;
};

export function PaywallCard({
  moduleType = "venue",
  venueSelectionHint,
  onVenueReportCta,
}: PaywallCardProps) {
  const n = moduleEntityLabels(moduleType).listNoun;
  const reportLabel =
    moduleType === "catering" ? "catering" : moduleType === "photography" ? "photography" : "venue";
  const steps = [
    `We reach out to your selected ${n}`,
    "We gather pricing and availability",
    "You receive a curated report in 24–72 hours",
  ] as const;
  return (
    <div className="nyra-surface-elevated rounded-2xl border border-chat-border bg-chat-raised p-7 sm:p-9">
      <p className="nyra-eyebrow">What happens next</p>
      <ol className="mt-4 space-y-3.5">
        {steps.map((item, index) => (
          <li
            key={item}
            className="flex gap-3 text-[14px] leading-snug text-chat-text-secondary"
          >
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-chat-border bg-white/[0.06] text-[10px] font-semibold leading-none text-chat-text-primary"
            >
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10 border-t border-chat-border pt-8">
        <button
          type="button"
          onClick={onVenueReportCta}
          className="nyra-btn-primary w-full sm:w-auto sm:min-w-[240px] sm:px-10"
        >
          Get my {reportLabel} report — $99
        </button>
        {venueSelectionHint ? (
          <p
            className="mt-3 text-sm font-medium text-amber-200/95"
            role="status"
            aria-live="polite"
          >
            {venueSelectionHint}
          </p>
        ) : null}
        <p className="mt-3 text-[12px] leading-relaxed text-chat-text-muted">
          One-time payment. No subscription.
        </p>
      </div>
    </div>
  );
}
