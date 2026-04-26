"use client";

import type { CSSProperties, ReactNode } from "react";

import { usePrefersReducedMotion } from "@/components/AssistantStreamedText";
import { LandingVenueExample } from "@/components/LandingVenueExample";

const RESPONSE_LINE_1 =
  "For your wedding in Miami with a guest count of 80 and a modern style, I pulled venues that match the feel ";
const RESPONSE_LINE_2 = "without forcing a one-size-fits-all pick.";

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function smoothstep01(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** Progress through [a, b] for global p in [0, 1]. */
function spanT(p: number, a: number, b: number) {
  if (b <= a) {
    return p >= b ? 1 : 0;
  }
  return clamp01((p - a) / (b - a));
}

function bandReveal(p: number, start: number, end: number) {
  return smoothstep01(spanT(p, start, end));
}

export type LandingExampleChatPreviewProps = {
  /** 0 = before animation, 1 = complete; driven by scroll in production. */
  scrollProgress: number;
};

function bubbleStyle(opacity: number): CSSProperties {
  const o = clamp01(opacity);
  return {
    opacity: o,
    transform: o > 0 ? "translateY(0)" : "translateY(0.5rem)",
    transition: "none",
  };
}

function lineStyle(opacity: number): CSSProperties {
  const o = clamp01(opacity);
  return {
    opacity: o,
    transform: o > 0 ? "translateY(0)" : "translateY(0.375rem)",
    transition: "none",
  };
}

function Line({
  opacity,
  children,
  className = "",
}: {
  opacity: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`block ${className}`} style={lineStyle(opacity)}>
      {children}
    </span>
  );
}

/**
 * Landing sample chat: phases are derived only from `scrollProgress`
 * (normalized scroll through the sticky track). No timers or autoplay.
 */
export function LandingExampleChatPreview({ scrollProgress }: LandingExampleChatPreviewProps) {
  const reducedMotion = usePrefersReducedMotion();
  const p = reducedMotion ? 1 : clamp01(scrollProgress);

  // 0–30%: user message
  const userPhase = bandReveal(p, 0, 0.3);

  // 30–60%: typing / loading
  const thinkingFadeIn = bandReveal(p, 0.3, 0.36);
  const thinkingFadeOut = bandReveal(p, 0.52, 0.6);
  const thinkingOpacity = clamp01(thinkingFadeIn * (1 - thinkingFadeOut));

  // 60–100%: assistant reply + cards
  const r = p < 0.6 ? 0 : (p - 0.6) / 0.4;
  const line1Op = smoothstep01(r / 0.14);
  const line2Op = smoothstep01(clamp01((r - 0.1) / 0.16));
  const labelOp = smoothstep01(clamp01((r - 0.24) / 0.14));
  const c1 = smoothstep01(clamp01((r - 0.38) / 0.16));
  const c2 = smoothstep01(clamp01((r - 0.52) / 0.16));
  const c3 = smoothstep01(clamp01((r - 0.66) / 0.34));

  const nyraHeaderOpacity = clamp01(
    Math.max(thinkingFadeIn, thinkingOpacity, line1Op, line2Op, labelOp, c1, c2, c3),
  );

  const showThinkingShell = thinkingOpacity > 0.02;
  const hideAssistantCopyForThinking = thinkingOpacity > 0.06 && p < 0.6;
  const cardAlphas: [number, number, number] = [c1, c2, c3];
  const showVenueGrid = labelOp > 0.04 || c1 > 0.04;

  return (
    <div className="mx-auto mt-0 w-full min-w-0 max-w-none overflow-hidden rounded-2xl p-7 sm:p-9">
      <div className="flex min-w-0 flex-col">
        <div
          className="nyra-user-row flex min-w-0 w-full justify-end"
          style={bubbleStyle(userPhase)}
        >
          <div className="flex min-w-0 w-fit max-w-[min(100%,28rem)] flex-col items-end gap-1.5 sm:max-w-[min(100%,30rem)] sm:gap-2">
            <p className="nyra-eyebrow mb-0 w-full shrink-0 pe-0.5 text-right leading-none">You</p>
            <div className="nyra-user-bubble relative min-w-0 w-fit max-w-full break-words rounded-2xl px-3.5 py-2 text-left text-[15px] leading-relaxed tracking-[-0.01em] sm:px-4 sm:py-2.5">
              Looking for a modern venue for 80 guests in Miami.
            </div>
          </div>
        </div>

        <div className="nyra-assistant-row mt-4 flex min-w-0 w-full flex-col items-stretch gap-1.5 sm:mt-5 sm:gap-2">
          <p
            className="nyra-eyebrow mb-0 w-full shrink-0 text-left leading-none"
            style={{
              opacity: nyraHeaderOpacity,
              transform: nyraHeaderOpacity > 0 ? "translateY(0)" : "translateY(0.375rem)",
              transition: "none",
            }}
          >
            Nyra
          </p>

          <div className="flex min-w-0 w-full flex-col gap-3 sm:gap-4">
            {showThinkingShell ? (
              <div className="min-w-0" style={{ opacity: thinkingOpacity, transition: "none" }}>
                <p
                  className="px-4 text-left text-[13px] leading-snug tracking-[-0.01em] text-chat-text-muted sm:px-[1.125rem]"
                  aria-live="polite"
                >
                  Nyra is finding matches…
                </p>
              </div>
            ) : null}

            <div
              className={`relative min-w-0 w-full px-4 pb-0.5 pt-2 text-[15px] leading-[1.62] tracking-[-0.01em] text-chat-text-primary sm:px-[1.125rem] sm:pb-1 sm:pt-2 ${
                hideAssistantCopyForThinking ? "hidden" : ""
              }`}
              aria-hidden={hideAssistantCopyForThinking}
            >
              <Line opacity={line1Op}>{RESPONSE_LINE_1}</Line>
              <Line opacity={line2Op} className="mt-0.5 sm:mt-0">
                {RESPONSE_LINE_2}
              </Line>
            </div>

            <div
              className={
                hideAssistantCopyForThinking
                  ? "hidden min-w-0 flex-col gap-1.5 sm:gap-1.5"
                  : "flex min-w-0 flex-col gap-1.5 sm:gap-1.5"
              }
            >
              <div className="min-w-0" style={{ opacity: labelOp, transition: "none" }}>
                <p className="text-left text-[11.5px] font-medium leading-snug tracking-[-0.01em] text-chat-text-secondary sm:text-[12px]">
                  These are the strongest matches based on your criteria:
                </p>
              </div>
              {showVenueGrid ? <LandingVenueExample cardRevealAlpha={cardAlphas} /> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
