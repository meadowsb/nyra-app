import { useMemo, type RefObject } from "react";

import {
  AssistantStreamedText,
  usePrefersReducedMotion,
} from "@/components/AssistantStreamedText";
import { ThinkingBubble } from "@/components/ThinkingBubble";
import {
  vendorAllowsMainCardRemoval,
  vendorIdsReadyToContact,
  vendorOutreachRowIsPostInquiry,
  type OutreachItem,
} from "@/components/SelectedVendorsSidebar";
import type { Vendor } from "@/components/VenueCard";
import { VenueCard } from "@/components/VenueCard";
import { VenueReportCtaPanel } from "@/components/VenueReportCtaPanel";
import { defaultModuleForType, resultPackLeadIn, type ModuleType } from "@/lib/modules";

export type Message =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      text: string;
      vendors?: Vendor[];
      isThinking?: boolean;
      /** Module the shortlist + mock cards in this turn belong to. */
      resultModuleType?: ModuleType;
    };

type UserMessage = Extract<Message, { role: "user" }>;
type AssistantMessage = Extract<Message, { role: "assistant" }>;

type ChatTurn =
  | { id: string; user: UserMessage; assistant: AssistantMessage | null }
  | { id: string; user: null; assistant: AssistantMessage };

type ChatMessagesProps = {
  moduleType?: ModuleType;
  messages: Message[];
  latestMessageRef: RefObject<HTMLDivElement | null>;
  thinkingBubbleRef: RefObject<HTMLDivElement | null>;
  latestAssistantMessageRef: RefObject<HTMLDivElement | null>;
  latestAssistantResultRef: RefObject<HTMLDivElement | null>;
  selectedVendorIds: string[];
  getSelectedIdsForModule: (moduleType: ModuleType) => string[];
  pulseVenueCards: boolean;
  onToggleVenue: (id: string, resultModule: ModuleType) => void;
  onRemoveVenueFromShortlist: (id: string, resultModule: ModuleType) => void;
  venueSelectionHint: string | null;
  onVenueReportCta: () => void;
  /** When true, Send is primary; mobile Contact stays secondary until composer is empty. */
  composerHasText: boolean;
  thinkingMessages: readonly string[];
  thinkingMessageIndex: number;
  thinkingMessageRotationMs: number;
  thinkingExitMessageId: string | null;
  assistantRevealMessageId: string | null;
  /** When false, the latest assistant shortlist stays mounted off until streamed text finishes. */
  isTextComplete: boolean;
  /** After “Contact venues”, rail / CTAs use pipeline state; main venue cards use only shortlisted vs inquiry-sent ids. */
  outreachMode: boolean;
  /** Full pipeline; used to resolve each card’s inquiry state by (module, vendor) in thread history. */
  outreachItems: OutreachItem[];
  /** Rows for the **active** module (footer counts / queue); omit duplicate-module pipeline noise. */
  pipelineOutreachItems: OutreachItem[];
  /**
   * When set to a post-inquiry vendor, hide the mobile thread “Contact” strip
   * (rail footer handles context). Module-scoped for correct pipeline match.
   */
  plannerRef?: { moduleId: string; vendorId: string } | null;
  onAssistantStreamStart?: () => void;
  onAssistantStreamProgress?: () => void;
  onAssistantStreamComplete?: () => void;
  /** Fills the composer and sends; used for the initial empty-state example prompts. */
  onSelectExamplePrompt?: (text: string) => void;
};

const EXAMPLE_PROMPTS = [
  "Planning a wedding in Miami for 80 guests",
  "Looking for a venue in Tampa",
  "Need catering for 100 guests",
  "Find a photographer in Miami",
] as const;

function resolveModuleTypeForMessage(
  message: { resultModuleType?: ModuleType | undefined },
  moduleType: ModuleType | undefined
): ModuleType {
  return message.resultModuleType ?? moduleType ?? "venue";
}

export function ChatMessages({
  moduleType,
  messages,
  latestMessageRef,
  thinkingBubbleRef,
  latestAssistantMessageRef,
  latestAssistantResultRef,
  selectedVendorIds,
  getSelectedIdsForModule,
  pulseVenueCards,
  onToggleVenue,
  onRemoveVenueFromShortlist,
  venueSelectionHint,
  onVenueReportCta,
  composerHasText,
  thinkingMessages,
  thinkingMessageIndex,
  thinkingMessageRotationMs,
  thinkingExitMessageId,
  assistantRevealMessageId,
  isTextComplete,
  outreachMode,
  outreachItems,
  pipelineOutreachItems,
  plannerRef = null,
  onAssistantStreamStart,
  onAssistantStreamProgress,
  onAssistantStreamComplete,
  onSelectExamplePrompt,
}: ChatMessagesProps) {
  /** Shrink-wrap on the right so short user lines read as bubbles, not full-width blocks. */
  const userMessageCol =
    "flex min-w-0 w-fit max-w-[min(92%,28rem)] flex-col items-end gap-1.5 sm:max-w-[min(92%,30rem)] sm:gap-2";

  /** Full-width turns, left-anchored; horizontal rhythm comes from scroll padding, not centered max-width. */
  const turnLayout = "w-full min-w-0";

  /** Space between assistant copy and the venue shortlist below it. */
  const assistantToVenuesGap = "gap-3 sm:gap-4";

  const prefersReducedMotion = usePrefersReducedMotion();

  const pendingAdditionalOutreachCount = useMemo(
    () => vendorIdsReadyToContact(outreachMode, selectedVendorIds, pipelineOutreachItems).length,
    [outreachMode, selectedVendorIds, pipelineOutreachItems]
  );

  const outreachRow = (resultModule: ModuleType, vendorId: string) => {
    const mid = defaultModuleForType(resultModule).moduleId;
    return outreachItems.find(
      (item) => item.moduleId === mid && item.vendorId === vendorId
    );
  };

  const suppressMobileVenueReportCta = vendorOutreachRowIsPostInquiry(
    plannerRef?.moduleId ?? null,
    plannerRef?.vendorId ?? null,
    outreachItems
  );

  const turns = useMemo((): ChatTurn[] => {
    const out: ChatTurn[] = [];
    let i = 0;
    while (i < messages.length) {
      const m = messages[i];
      if (m.role === "user") {
        const next = messages[i + 1];
        if (next?.role === "assistant") {
          out.push({ id: m.id, user: m, assistant: next });
          i += 2;
        } else {
          out.push({ id: m.id, user: m, assistant: null });
          i += 1;
        }
      } else {
        out.push({ id: m.id, user: null, assistant: m });
        i += 1;
      }
    }
    return out;
  }, [messages]);

  const streamAssistantId = useMemo(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && !last.isThinking) return last.id;
    return null;
  }, [messages]);

  const assistantBody = (message: AssistantMessage) => {
    const streamHere = message.id === streamAssistantId && !prefersReducedMotion;

    if (streamHere) {
      return (
        <AssistantStreamedText
          key={message.id}
          text={message.text}
          messageId={message.id}
          thinkingExitMessageId={thinkingExitMessageId}
          onStreamStart={onAssistantStreamStart}
          onStreamProgress={onAssistantStreamProgress}
          onStreamComplete={onAssistantStreamComplete}
        />
      );
    }

    return <span className="block whitespace-pre-wrap">{message.text}</span>;
  };

  const renderUserBubble = (message: UserMessage) => (
    <div className="nyra-user-bubble relative min-w-0 w-fit max-w-full break-words rounded-2xl px-3.5 py-2 text-left text-[15px] leading-relaxed tracking-[-0.01em] transition-[opacity,transform] duration-300 ease-out sm:px-4 sm:py-2.5">
      {message.text}
    </div>
  );

  const renderUserRowContent = (message: UserMessage) => (
    <div className={userMessageCol}>
      <p className="nyra-eyebrow mb-0 w-full shrink-0 pe-0.5 text-right leading-none">You</p>
      {renderUserBubble(message)}
    </div>
  );

  const renderVenueCardsRow = (
    message: AssistantMessage,
    isLastInThread: boolean,
    showVenueResults: boolean
  ) => {
    if (!message.vendors?.length || !showVenueResults) return null;

    const resultModuleM = resolveModuleTypeForMessage(message, moduleType);

    return (
      <div
        ref={isLastInThread ? latestAssistantResultRef : undefined}
        className="nyra-venue-cards-row flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-chat-border bg-chat-raised nyra-assistant-reply-surface"
      >
        <div
          className={`flex flex-col gap-0.5 border-t border-chat-border-muted bg-[#252525] px-3 pb-1.5 pt-0.5 sm:gap-0.5 sm:px-3 sm:pb-1.5 sm:pt-0.5 lg:px-[1.125rem] lg:pb-2 lg:pt-1 ${
            prefersReducedMotion ? "" : "nyra-results-pack"
          }`}
        >
            <p className="text-left text-[11.5px] font-medium leading-snug tracking-[-0.01em] text-chat-text-secondary sm:text-[12px]">
            {resultPackLeadIn(resultModuleM)}
          </p>
          <div className="nyra-venues-grid grid items-start gap-1.5 sm:grid-cols-2 sm:gap-1.5 lg:grid-cols-3 lg:gap-1.5">
            {message.vendors.map((v, venueIndex) => {
              const forModuleIds = getSelectedIdsForModule(resultModuleM);
              const isSelected = forModuleIds.includes(v.id);
              const row = outreachRow(resultModuleM, v.id);
              const isInquirySent =
                row?.status === "contacted" || row?.status === "replied";
              const canRemoveFromCard = vendorAllowsMainCardRemoval(
                isSelected,
                isInquirySent
              );

              return (
                <div
                  key={v.id}
                  className={
                    prefersReducedMotion
                      ? undefined
                      : `nyra-venue-card-intro nyra-venue-card-intro--${Math.min(venueIndex + 1, 6)}`
                  }
                >
                  <VenueCard
                    vendor={v}
                    selected={isSelected}
                    inquirySent={isInquirySent}
                    inquirySentLabel={
                      row?.status === "replied" ? "Responded" : "Inquiry sent"
                    }
                    pulse={pulseVenueCards}
                    onToggle={() => onToggleVenue(v.id, resultModuleM)}
                    onRemoveFromShortlist={
                      canRemoveFromCard
                        ? () => onRemoveVenueFromShortlist(v.id, resultModuleM)
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>
          {isLastInThread && !suppressMobileVenueReportCta ? (
            <div className="pt-3 lg:hidden">
              <VenueReportCtaPanel
                moduleType={resultModuleM}
                selectedCount={selectedVendorIds.length}
                venueSelectionHint={venueSelectionHint}
                onVenueReportCta={onVenueReportCta}
                outreachActive={outreachMode}
                pendingAdditionalOutreachCount={pendingAdditionalOutreachCount}
                ctaProminence={
                  pendingAdditionalOutreachCount > 0
                    ? "primary"
                    : outreachMode ||
                        composerHasText ||
                        selectedVendorIds.length === 0
                      ? "secondary"
                      : "primary"
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderAssistantRow = (
    message: AssistantMessage,
    isLastInThread: boolean,
    options?: { offsetFromUser?: boolean }
  ) => {
    const offsetFromUser = options?.offsetFromUser === true;
    const showVenueResults =
      !!message.vendors?.length && (!isLastInThread || isTextComplete);
    const assistantHasVenues = !!message.vendors?.length;

    const attachLatestAssistantMessageRef =
      isLastInThread &&
      (!assistantHasVenues || !showVenueResults || message.isThinking);

    const thinkingOverlay =
      !message.isThinking && thinkingExitMessageId === message.id ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ animation: "nyraThinkingBubbleOut 320ms ease-in both" }}
        >
          <ThinkingBubble
            thinkingMessages={thinkingMessages}
            thinkingMessageIndex={thinkingMessageIndex}
            thinkingMessageRotationMs={thinkingMessageRotationMs}
          />
        </div>
      ) : null;

    const thinkingOverlayInset =
      !message.isThinking && assistantHasVenues && thinkingExitMessageId === message.id ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] bg-chat-raised/95 px-4 pb-0.5 pt-2 sm:px-[1.125rem] sm:pb-1 sm:pt-2"
          style={{ animation: "nyraThinkingBubbleOut 320ms ease-in both" }}
        >
          <ThinkingBubble
            thinkingMessages={thinkingMessages}
            thinkingMessageIndex={thinkingMessageIndex}
            thinkingMessageRotationMs={thinkingMessageRotationMs}
          />
        </div>
      ) : null;

    const assistantTextOnlyReadable =
      !message.isThinking && !assistantHasVenues
        ? "max-w-[min(100%,40rem)] sm:max-w-[min(100%,44rem)] lg:max-w-[min(100%,52rem)] xl:max-w-[min(100%,58rem)]"
        : "";

    const bubble = (
      <div
        ref={
          message.isThinking
            ? thinkingBubbleRef
            : attachLatestAssistantMessageRef
              ? latestAssistantMessageRef
              : undefined
        }
        className={`relative min-w-0 w-full text-[15px] tracking-[-0.01em] transition-[opacity,transform] duration-300 ease-out ${assistantTextOnlyReadable} ${
          message.isThinking
            ? "leading-relaxed rounded-2xl border border-chat-border bg-chat-assistant-surface px-4 py-2.5 text-chat-text-secondary sm:px-[1.125rem] sm:py-2.5"
            : "leading-[1.62] rounded-2xl border border-transparent bg-transparent px-4 py-2 text-chat-text-primary sm:px-[1.125rem] sm:py-2.5"
        }`}
        style={
          message.isThinking
            ? { animation: "nyraThinkingBubbleIn 220ms ease-out both" }
            : assistantRevealMessageId === message.id
              ? { animation: "nyraAssistantReveal 340ms ease-out both" }
              : undefined
        }
      >
        {!message.isThinking && thinkingExitMessageId === message.id && !assistantHasVenues
          ? thinkingOverlay
          : null}

        {message.isThinking ? (
          <ThinkingBubble
            thinkingMessages={thinkingMessages}
            thinkingMessageIndex={thinkingMessageIndex}
            thinkingMessageRotationMs={thinkingMessageRotationMs}
          />
        ) : (
          assistantBody(message)
        )}
      </div>
    );

    const assistantTextBubbleWithVenues =
      !message.isThinking && assistantHasVenues ? (
        <div
          ref={isLastInThread ? latestAssistantMessageRef : undefined}
          className="relative min-w-0 w-full px-4 pb-0.5 pt-2 text-[15px] leading-[1.62] tracking-[-0.01em] text-chat-text-primary sm:px-[1.125rem] sm:pb-1 sm:pt-2"
          style={
            assistantRevealMessageId === message.id
              ? { animation: "nyraAssistantReveal 340ms ease-out both" }
              : undefined
          }
        >
          {thinkingOverlayInset}
          {assistantBody(message)}
        </div>
      ) : null;

    return (
      <div
        className={`nyra-assistant-row flex min-w-0 w-full flex-col items-stretch gap-1.5 sm:gap-2 ${
          offsetFromUser ? "mt-4 sm:mt-5" : ""
        }`}
      >
        <p className="nyra-eyebrow mb-0 w-full shrink-0 text-left leading-none">Nyra</p>
        <div className={`flex min-w-0 w-full flex-col ${assistantToVenuesGap}`}>
          {assistantTextBubbleWithVenues ?? bubble}
          {renderVenueCardsRow(message, isLastInThread, showVenueResults)}
        </div>
      </div>
    );
  };

  const renderConversationTurn = (turn: ChatTurn, turnIndex: number) => {
    const isLastTurn = turnIndex === turns.length - 1;
    const assistant = turn.assistant;

    return (
      <section
        key={turn.id}
        ref={isLastTurn ? latestMessageRef : undefined}
        className={`nyra-turn-wrapper nyra-conversation-turn flex min-w-0 flex-col ${turnLayout} ${
          isLastTurn ? "" : "mb-8 sm:mb-10"
        }`}
      >
        {turn.user ? (
          <div className="nyra-user-row flex min-w-0 w-full justify-end">
            {renderUserRowContent(turn.user)}
          </div>
        ) : null}
        {assistant
          ? renderAssistantRow(assistant, isLastTurn, {
              offsetFromUser: Boolean(turn.user),
            })
          : null}
      </section>
    );
  };

  if (messages.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-8 [scroll-padding-block-end:1.25rem] sm:px-6 sm:py-10 sm:pb-10">
        <div className="mx-auto flex min-h-[min(100%,28rem)] w-full max-w-[32rem] flex-col items-center justify-center text-center">
          <h2 className="text-balance text-[1.25rem] font-semibold leading-snug tracking-[-0.02em] text-chat-text-primary sm:text-[1.35rem]">
            Tell me what you need help with
          </h2>
          <p className="mt-3 max-w-md text-pretty text-[15px] leading-relaxed text-chat-text-secondary sm:text-[15.5px]">
            Planning your wedding, finding vendors, or comparing options — I&rsquo;ll help you
            figure it out.
          </p>
          {onSelectExamplePrompt ? (
            <ul className="mt-8 w-full max-w-md space-y-0 text-left text-[15px] leading-relaxed sm:mt-9">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <li key={prompt} className="flex gap-0">
                  <span
                    className="shrink-0 pr-1.5 text-chat-text-secondary select-none"
                    aria-hidden
                  >
                    &bull;
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectExamplePrompt(prompt)}
                    className="shrink-0 min-w-0 text-left text-[15px] leading-relaxed text-chat-text-primary underline-offset-[3px] transition-colors hover:underline"
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-0 pt-2 pb-8 [scroll-padding-block-end:1.25rem] sm:pt-3 sm:pb-10">
      <div className="flex w-full min-w-0 flex-col">
        {turns.map((turn, turnIndex) => renderConversationTurn(turn, turnIndex))}
      </div>
    </div>
  );
}
