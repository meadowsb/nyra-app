import type { ModuleType } from "./types";

type SearchGet = { get: (k: string) => string | null };

/**
 * Simple keyword-based intent for the first module in a project/chat session.
 * Order: catering-related terms, then photo terms, else venue.
 */
export function detectModuleType(prompt: string): ModuleType {
  const p = prompt.toLowerCase();
  if (p.includes("catering") || p.includes("food") || p.includes("caterer")) {
    return "catering";
  }
  if (p.includes("photographer") || p.includes("photo") || p.includes("photography")) {
    return "photography";
  }
  return "venue";
}

/** URL `module=` wins; otherwise infer from the initial `query` via `detectModuleType`. */
export function resolveModuleTypeFromSearchParams(searchParams: SearchGet): ModuleType {
  const raw = searchParams.get("module");
  if (raw === "catering") return "catering";
  if (raw === "venue") return "venue";
  if (raw === "photography") return "photography";
  const q = (searchParams.get("query") ?? "").trim();
  return detectModuleType(q);
}
