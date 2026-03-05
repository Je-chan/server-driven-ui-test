// Public API for dashboard entity

// Types
export type {
  DashboardEntity,
  DashboardJson,
  DashboardSettings,
  Widget,
  ChildWidget,
  WidgetLayout,
  WidgetStyle,
  ConditionRule,
  WidgetConditions,
  Filter,
  FilterDependency,
} from "./model/types";

export {
  dashboardJsonSchema,
  dashboardSettingsSchema,
  widgetSchema,
  childWidgetSchema,
  widgetLayoutSchema,
  widgetStyleSchema,
  conditionRuleSchema,
  widgetConditionsSchema,
  filterSchema,
  filterDependencySchema,
} from "./model/types";

// API
export {
  getDashboards,
  getDashboardById,
  createDashboard,
  updateDashboard,
  deleteDashboard,
} from "./api/dashboard.api";

// Lib
export { migrateFiltersToWidgets } from "./lib/migrate-filters";
export { normalizeSchema } from "./lib/normalize-schema";

// UI
export { DashboardCard } from "./ui/DashboardCard";
