import type { Venue } from "@/components/VenueCard";
import { VenueReportCtaPanel } from "@/components/VenueReportCtaPanel";

type SelectedVenuesSidebarProps = {
  selectedVenueIds: string[];
  venueById: Map<string, Venue>;
  venueSelectionHint: string | null;
  onVenueReportCta: () => void;
  /** When true, composer Send stays primary; Contact uses secondary. */
  composerHasText: boolean;
};

export function SelectedVenuesSidebar({
  selectedVenueIds,
  venueById,
  venueSelectionHint,
  onVenueReportCta,
  composerHasText,
}: SelectedVenuesSidebarProps) {
  return (
    <aside
      className="relative hidden h-full min-h-0 w-[288px] shrink-0 flex-col border-l border-chat-border bg-chat-sidebar lg:z-20 lg:flex lg:overflow-hidden lg:border-l-0"
      aria-label="Report shortlist"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pl-4 pr-5 pb-5 pt-10 xl:pb-6 xl:pt-11">
          <header className="max-w-[15rem]">
            <p className="nyra-eyebrow">Shortlist</p>
            <h2 className="mt-2.5 text-lg font-semibold leading-[1.2] tracking-[-0.03em] text-chat-text-primary">
              Selected venues
            </h2>
            <p className="mt-2.5 text-[13px] leading-[1.55] text-chat-text-secondary">
              These are the only names we include in your outreach bundle—curate the list,
              then continue.
            </p>
          </header>

          <div className="mt-6" role="region" aria-label="Venues on your shortlist">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-chat-text-muted">
              On your list
            </p>
            <div className="mt-2">
              {selectedVenueIds.length === 0 ? (
                <p className="text-[13px] leading-relaxed text-chat-text-muted">
                  No venues yet—tap Add to shortlist on a match in the thread.
                </p>
              ) : (
                <ol className="flex flex-col gap-1.5">
                  {selectedVenueIds.map((id, index) => {
                    const venue = venueById.get(id);
                    return (
                      <li
                        key={id}
                        className="flex items-center gap-2.5"
                      >
                        <span
                          aria-hidden
                          className="flex size-5 shrink-0 items-center justify-center rounded-md border border-chat-border bg-white/[0.06] text-[10px] font-semibold leading-none tabular-nums text-chat-text-muted"
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 text-[13px] font-medium leading-[1.2] text-chat-text-primary">
                          {venue?.name}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-chat-border-muted bg-chat-sidebar pl-4 pr-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:pt-3.5 xl:pb-6">
          <VenueReportCtaPanel
            variant="rail"
            selectedCount={selectedVenueIds.length}
            venueSelectionHint={venueSelectionHint}
            onVenueReportCta={onVenueReportCta}
            ctaProminence={
              !composerHasText && selectedVenueIds.length > 0 ? "primary" : "secondary"
            }
          />
        </footer>
      </div>
    </aside>
  );
}
