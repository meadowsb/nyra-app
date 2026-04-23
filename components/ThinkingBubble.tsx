type ThinkingBubbleProps = {
  thinkingMessages: readonly string[];
  thinkingMessageIndex: number;
  thinkingMessageRotationMs: number;
};

export function ThinkingBubble({
  thinkingMessages,
  thinkingMessageIndex,
  thinkingMessageRotationMs,
}: ThinkingBubbleProps) {
  return (
    <div className="flex items-center gap-3 text-[15px] text-chat-text-secondary">
      <span
        aria-hidden
        className="flex items-center gap-1.5"
        style={{ opacity: 0.85 }}
      >
        <span className="nyra-typing-dot" />
        <span className="nyra-typing-dot nyra-typing-dot--2" />
        <span className="nyra-typing-dot nyra-typing-dot--3" />
      </span>
      <span
        key={thinkingMessageIndex}
        className="block will-change-[opacity,transform]"
        style={{
          animation: `nyraThinkingMessage ${thinkingMessageRotationMs}ms ease-in-out both`,
        }}
      >
        {thinkingMessages[thinkingMessageIndex] ?? "Thinking..."}
      </span>
    </div>
  );
}
