import type { FormEvent } from "react";

import { PaywallCard } from "@/components/PaywallCard";
import { moduleEntityLabels, type ModuleType } from "@/lib/modules";

type ChatInputBarProps = {
  moduleType?: ModuleType;
  isPaywalled: boolean;
  isThinking: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  venueSelectionHint: string | null;
  onVenueReportCta: () => void;
};

export function ChatInputBar({
  moduleType = "venue",
  isPaywalled,
  isThinking,
  input,
  onInputChange,
  onSubmit,
  venueSelectionHint,
  onVenueReportCta,
}: ChatInputBarProps) {
  const composerHasText = input.trim().length > 0;
  const reach = moduleEntityLabels(moduleType).messageToEntity;

  return (
    <div className="shrink-0 border-t border-chat-border-muted bg-chat-canvas px-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:pb-4 sm:pt-3">
      {isPaywalled ? (
        <>
          <p className="mb-5 max-w-[min(100%,52rem)] text-[15px] leading-relaxed text-chat-text-secondary">
            {`If you'd like, I can reach out to these ${reach} and get real pricing and availability for you.`}
          </p>
          <PaywallCard
            moduleType={moduleType}
            venueSelectionHint={venueSelectionHint}
            onVenueReportCta={onVenueReportCta}
          />
        </>
      ) : (
        <form onSubmit={onSubmit} className="w-full min-w-0">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={moduleType ? "Refine your shortlist…" : "Message Nyra…"}
              className="min-h-[48px] flex-1 rounded-[1.375rem] border border-chat-border bg-chat-input px-4 py-3 text-[15px] text-chat-text-primary shadow-none outline-none transition-[box-shadow,border-color,background-color] placeholder:text-chat-text-muted focus:border-white/18 focus:bg-[#353535] focus:ring-1 focus:ring-white/12"
            />
            <button
              type="submit"
              disabled={isThinking}
              className={
                composerHasText
                  ? "nyra-btn-primary shrink-0 disabled:cursor-not-allowed"
                  : "nyra-btn-chat-secondary shrink-0 disabled:cursor-not-allowed"
              }
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
