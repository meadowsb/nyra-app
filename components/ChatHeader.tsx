type ChatHeaderProps = {
  isDev: boolean;
  onDevReset: () => void;
  isPaywalled: boolean;
  freeMessagesRemaining: number;
};

export function ChatHeader({
  isDev,
  onDevReset,
  isPaywalled,
  freeMessagesRemaining,
}: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 py-1.5 sm:py-2">
      <div className="min-w-0">
        <h1 className="mb-0 flex shrink-0 items-center truncate text-[11px] leading-none">
          <span className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border border-[rgba(192,132,151,0.25)] bg-[rgba(192,132,151,0.12)]">
            <svg
              className="block h-[19px] w-[19px] shrink-0"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Nyra"
              role="img"
            >
              <g fill="rgb(250 250 250)">
                <g transform="translate(16 11.5)">
                  <ellipse rx="3.1" ry="5.4" transform="rotate(0)" />
                  <ellipse rx="3.1" ry="5.4" transform="rotate(72)" />
                  <ellipse rx="3.1" ry="5.4" transform="rotate(144)" />
                  <ellipse rx="3.1" ry="5.4" transform="rotate(216)" />
                  <ellipse rx="3.1" ry="5.4" transform="rotate(288)" />
                  <circle r="2.35" />
                </g>
              </g>
              <path
                d="M16 16.75v10.25M11.5 21.25c1.75-1.25 3.25-2.75 4.5-4.75"
                stroke="rgb(250 250 250)"
                strokeWidth="2.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </h1>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        {isDev ? (
          <button
            type="button"
            onClick={onDevReset}
            className="rounded-full border border-chat-border bg-chat-raised px-2.5 py-1 text-[11px] font-medium text-chat-text-muted transition-colors hover:border-white/15 hover:bg-[#353535] hover:text-chat-text-secondary"
          >
            Reset
          </button>
        ) : null}
        {!isPaywalled ? (
          <p className="rounded-full border border-chat-border bg-chat-raised px-2.5 py-1 text-[10px] font-medium text-chat-text-muted sm:text-[11px]">
            {freeMessagesRemaining} free message
            {freeMessagesRemaining === 1 ? "" : "s"} remaining
          </p>
        ) : null}
      </div>
    </header>
  );
}
