export type PlannerTextEntry = {
  id: string;
  text: string;
  at: number;
};

/** Private notes and follow-up threads keyed by `vendorId` for a module. */
export type VendorDetails = {
  nyraNotes: PlannerTextEntry[];
  followUps: PlannerTextEntry[];
};

export function emptyVendorDetails(): VendorDetails {
  return { nyraNotes: [], followUps: [] };
}

export function getVendorDetails(
  byId: Readonly<Record<string, VendorDetails>>,
  vendorId: string
): VendorDetails {
  return byId[vendorId] ?? emptyVendorDetails();
}
