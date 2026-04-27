import type { ModuleType, ProjectModule } from "./types";
import { DEMO_PROJECT_ID, DEFAULT_VENUE_MODULE_ID } from "./constants";

export const CATERING_MODULE_FIELD_KEYS = [
  "guestCount",
  "cuisine",
  "dietaryNeeds",
  "serviceStyle",
] as const;

/** Per-module product defaults. */
export type ModuleConfigEntry = {
  moduleId: (projectId: string) => string;
  buildDefaultModule: (projectId: string) => ProjectModule;
};

const venueModule: ModuleConfigEntry = {
  moduleId: () => DEFAULT_VENUE_MODULE_ID,
  buildDefaultModule: (projectId) => ({
    moduleId: DEFAULT_VENUE_MODULE_ID,
    projectId,
    moduleType: "venue",
    status: "active",
  }),
};

const cateringModule: ModuleConfigEntry = {
  moduleId: (projectId) => `${projectId}:module:catering`,
  buildDefaultModule: (projectId) => ({
    moduleId: `${projectId}:module:catering`,
    projectId,
    moduleType: "catering",
    status: "active",
    cateringFields: {
      guestCount: undefined,
      cuisine: undefined,
      dietaryNeeds: undefined,
      serviceStyle: undefined,
    },
  }),
};

const photographyModule: ModuleConfigEntry = {
  moduleId: (projectId) => `${projectId}:module:photography`,
  buildDefaultModule: (projectId) => ({
    moduleId: `${projectId}:module:photography`,
    projectId,
    moduleType: "photography",
    status: "draft",
  }),
};

/** One entry per `ModuleType` (see `defaultModuleForType` for a bootstrapped instance). */
export const moduleConfig: Record<ModuleType, ModuleConfigEntry> = {
  venue: venueModule,
  catering: cateringModule,
  photography: photographyModule,
};

export function defaultModuleForType(
  type: ModuleType,
  projectId: string = DEMO_PROJECT_ID
): ProjectModule {
  return moduleConfig[type].buildDefaultModule(projectId);
}
