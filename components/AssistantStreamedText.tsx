"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/** Split into words and whitespace chunks so spacing stays natural. */
function tokenizeForStream(text: string) {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

function delayMsForToken(token: string) {
  if (/^\s+$/.test(token)) return 8;
  const base = 56;
  const lengthBoost = Math.min(36, Math.floor(token.length * 2.2));
  return base + lengthBoost;
}

export type AssistantStreamedTextProps = {
  text: string;
  messageId: string;
  /** While this matches `messageId`, hold the first frame (thinking handoff). */
  thinkingExitMessageId: string | null;
  onStreamStart?: () => void;
  /** Throttled progress ticks while tokens reveal (e.g. keep bubble in view). */
  onStreamProgress?: () => void;
  onStreamComplete?: () => void;
};

/**
 * Gradually reveals `text` word-by-word. Mount only for the active assistant
 * bubble; use plain text for history so this stays lightweight.
 */
const STREAM_PROGRESS_MIN_INTERVAL_MS = 320;

export function AssistantStreamedText({
  text,
  messageId,
  thinkingExitMessageId,
  onStreamStart,
  onStreamProgress,
  onStreamComplete,
}: AssistantStreamedTextProps) {
  const tokens = useMemo(() => tokenizeForStream(text), [text]);
  const tokensRef = useRef(tokens);

  const [visibleCount, setVisibleCount] = useState(0);
  const timeoutRef = useRef<number | undefined>(undefined);
  const visibleRef = useRef(0);
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const lastProgressAtRef = useRef(0);

  const holdForThinkingHandoff = thinkingExitMessageId === messageId;

  const streamCallbacksRef = useRef({
    onStreamStart,
    onStreamProgress,
    onStreamComplete,
  });

  useLayoutEffect(() => {
    streamCallbacksRef.current = { onStreamStart, onStreamProgress, onStreamComplete };
  }, [onStreamStart, onStreamProgress, onStreamComplete]);

  useLayoutEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  useEffect(() => {
    visibleRef.current = visibleCount;
  }, [visibleCount]);

  useEffect(() => {
    let cancelled = false;

    const clearTimer = () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };

    const schedule = (ms: number, fn: () => void) => {
      clearTimer();
      timeoutRef.current = window.setTimeout(fn, ms);
    };

    const maybeProgress = (visibleAfter: number) => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const onStreamProgressCb = streamCallbacksRef.current.onStreamProgress;
      if (
        onStreamProgressCb &&
        visibleAfter > 0 &&
        now - lastProgressAtRef.current >= STREAM_PROGRESS_MIN_INTERVAL_MS
      ) {
        lastProgressAtRef.current = now;
        onStreamProgressCb();
      }
    };

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      streamCallbacksRef.current.onStreamComplete?.();
    };

    const pump = () => {
      if (cancelled) return;

      if (holdForThinkingHandoff) {
        schedule(32, pump);
        return;
      }

      const streamTokens = tokensRef.current;
      const i = visibleRef.current;
      if (streamTokens.length === 0) {
        finish();
        return;
      }

      if (i >= streamTokens.length) {
        finish();
        return;
      }

      const next = i + 1;
      setVisibleCount(next);
      visibleRef.current = next;

      if (!startedRef.current && next > 0) {
        startedRef.current = true;
        streamCallbacksRef.current.onStreamStart?.();
      }

      maybeProgress(next);

      if (next >= streamTokens.length) {
        finish();
        return;
      }

      const pause = delayMsForToken(streamTokens[i] ?? "");
      schedule(pause, pump);
    };

    schedule(holdForThinkingHandoff ? 0 : 52, pump);

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [holdForThinkingHandoff, messageId]);

  const displayed = tokens.slice(0, visibleCount).join("");
  const showCaret = visibleCount < tokens.length;

  return (
    <span className="nyra-assistant-stream-text block whitespace-pre-wrap leading-[inherit]">
      {displayed}
      {showCaret ? (
        <span
          aria-hidden
          className="nyra-assistant-stream-caret ml-px inline-block h-[1.05em] w-px translate-y-[0.12em] bg-[rgba(236,236,236,0.55)] align-baseline"
        />
      ) : null}
      {showCaret ? (
        <span className="sr-only">Nyra is still writing…</span>
      ) : null}
    </span>
  );
}
