const OVERLAY_PREP_MS = 250;

/**
 * Blur focused fields and wait for iOS keyboard to dismiss before showing a
 * fixed full-viewport overlay.
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

  await new Promise((resolve) => setTimeout(resolve, OVERLAY_PREP_MS));
}
