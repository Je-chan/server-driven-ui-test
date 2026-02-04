// Public API for dashboard entity

// Types
export type {
  DashboardEntity,
  DashboardJson,
  DashboardSettings,
  Widget,
  WidgetLayout,
  WidgetStyle,
  Filter,
} from "./model/types";

export {
  dashboardJsonSchema,
  dashboardSettingsSchema,
  widgetSchema,
  widgetLayoutSchema,
  widgetStyleSchema,
  filterSchema,
} from "./model/types";

// API
export {
  getDashboards,
  getDashboardById,
  createDashboard,
  updateDashboard,
  deleteDashboard,
} from "./api/dashboard.api";

// UI
export { DashboardCard } from "./ui/DashboardCard";
