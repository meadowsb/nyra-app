const OVERLAY_PREP_MS = 200;

/**
 * Blur focused fields, scroll to top, and wait for iOS keyboard to dismiss
 * before showing a fixed full-viewport overlay.
 */
export async function prepareForOverlay(
  knownInputs?: readonly (HTMLElement | null)[]
): Promise<void> {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  for (const el of knownInputs ?? []) {
    el?.blur();
  }

  try {
    window.scrollTo({ top: 0, behavior: "instant" });
  } catch {
    window.scrollTo(0, 0);
  }

  await new Promise((resolve) => setTimeout(resolve, OVERLAY_PREP_MS));
}
