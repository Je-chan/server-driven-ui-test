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

// UI
export { DashboardCard } from "./ui/DashboardCard";
