import type { ModuleType } from "./types";

/** User-visible nouns/labels and a few CTA strings per module type. */
export function moduleEntityLabels(moduleType: ModuleType): {
  isCatering: boolean;
  listNoun: "venues" | "caterers" | "photographers";
  listNounSingular: "venue" | "caterer" | "photographer";
  listNounTitle: "Venues" | "Caterers" | "Photographers";
  defaultCardName: "Venue" | "Caterer" | "Photographer";
  shortlistToContinue: string;
  messageToEntity: "venues" | "caterers" | "photographers";
  /** e.g. “Contact caterers” for batch CTAs and planner timeline. */
  contactBatchCta: string;
  /** “Update all …” in compare and rail. */
  updateAllLabel: string;
  /** Headline on the reached-out timeline when a reply exists. */
  outreachRepliedHeadline: string;
} {
  if (moduleType === "catering") {
    return {
      isCatering: true,
      listNoun: "caterers",
      listNounSingular: "caterer",
      listNounTitle: "Caterers",
      defaultCardName: "Caterer",
      shortlistToContinue: "Shortlist caterers to continue",
      messageToEntity: "caterers",
      contactBatchCta: "Contact caterers",
      updateAllLabel: "Update all caterers",
      outreachRepliedHeadline: "Caterer responded",
    };
  }
  if (moduleType === "photography") {
    return {
      isCatering: false,
      listNoun: "photographers",
      listNounSingular: "photographer",
      listNounTitle: "Photographers",
      defaultCardName: "Photographer",
      shortlistToContinue: "Shortlist photographers to continue",
      messageToEntity: "photographers",
      contactBatchCta: "Contact photographers",
      updateAllLabel: "Update all photographers",
      outreachRepliedHeadline: "Photographer responded",
    };
  }
  return {
    isCatering: false,
    listNoun: "venues",
    listNounSingular: "venue",
    listNounTitle: "Venues",
    defaultCardName: "Venue",
    shortlistToContinue: "Shortlist venues to continue",
    messageToEntity: "venues",
    contactBatchCta: "Contact venues",
    updateAllLabel: "Update all venues",
    outreachRepliedHeadline: "Venue responded",
  };
}

/** Intro line above the result cards in chat (per module). */
export function resultPackLeadIn(moduleType: ModuleType): string {
  if (moduleType === "catering") {
    return "These are the strongest catering matches based on your brief.";
  }
  if (moduleType === "photography") {
    return "These are the strongest photographer matches based on your brief.";
  }
  return "These are the strongest venue matches based on your brief.";
}
