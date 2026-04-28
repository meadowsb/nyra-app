"use client";

/** Dispatched to open the shared waitlist modal without the hero prompt / thinking flow. */
export const NYRA_OPEN_WAITLIST_DIRECT = "nyra-open-waitlist-direct";

/** Opens the shared landing waitlist modal without the hero prompt / thinking flow. */
export function LandingWaitlistDirectCta() {
  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        className="nyra-btn-primary w-full sm:w-auto sm:min-w-[240px] sm:px-10"
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new Event(NYRA_OPEN_WAITLIST_DIRECT));
        }}
      >
        Join waitlist
      </button>
    </div>
  );
}
