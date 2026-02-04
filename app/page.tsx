import { getDashboards } from "@/src/entities/dashboard";
import { DashboardListPage } from "@/src/views/dashboard-list";

export default async function Home() {
  const dashboards = await getDashboards();

  return <DashboardListPage dashboards={dashboards} />;
}
