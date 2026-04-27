/** Brief fields for a catering run; all optional to match a lightweight planner surface. */
export type CateringModuleFields = {
  guestCount?: number;
  cuisine?: string;
  dietaryNeeds?: string;
  serviceStyle?: string;
};

/** Generic planning module; one project may run several in parallel. */
export type ProjectModule = {
  moduleId: string;
  projectId: string;
  moduleType: ModuleType;
  status: ModuleStatus;
  /** Present when `moduleType === "catering"`; drives brief defaults only. */
  cateringFields?: CateringModuleFields;
};

export type ModuleType = "venue" | "catering" | "photography";

export type ModuleStatus = "draft" | "active" | "archived" | "complete";
