import { moduleConfig } from "./moduleConfig";
import { DEMO_PROJECT_ID } from "./constants";
import type { ProjectModule } from "./types";

export type { ModuleType, ModuleStatus, ProjectModule, CateringModuleFields } from "./types";
export {
  moduleConfig,
  defaultModuleForType,
  type ModuleConfigEntry,
} from "./moduleConfig";
export { CATERING_MODULE_FIELD_KEYS } from "./moduleConfig";
export { detectModuleType, resolveModuleTypeFromSearchParams } from "./resolveModuleType";
export { moduleEntityLabels, resultPackLeadIn } from "./chatLabels";
export { DEMO_PROJECT_ID, DEFAULT_VENUE_MODULE_ID } from "./constants";

/** Default `module_type: "venue"` instance for the current product surface. */
export const defaultVenueModule: ProjectModule =
  moduleConfig.venue.buildDefaultModule(DEMO_PROJECT_ID);
