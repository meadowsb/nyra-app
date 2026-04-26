export type PlannerTextEntry = {
  id: string;
  text: string;
  at: number;
};

export type VenuePlannerEntry = {
  nyraNotes: PlannerTextEntry[];
  followUps: PlannerTextEntry[];
};

export function emptyVenuePlannerEntry(): VenuePlannerEntry {
  return { nyraNotes: [], followUps: [] };
}

export function getVenuePlannerEntry(
  byId: Readonly<Record<string, VenuePlannerEntry>>,
  venueId: string
): VenuePlannerEntry {
  return byId[venueId] ?? emptyVenuePlannerEntry();
}
