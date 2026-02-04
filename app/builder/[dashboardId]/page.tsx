import { notFound } from "next/navigation";
import { getDashboardById } from "@/src/entities/dashboard";
import { DashboardBuilderPage } from "@/src/views/dashboard-builder";

interface PageProps {
  params: Promise<{ dashboardId: string }>;
}

export default async function BuilderPage({ params }: PageProps) {
  const { dashboardId } = await params;
  const dashboard = await getDashboardById(dashboardId);

  if (!dashboard) {
    notFound();
  }

  return <DashboardBuilderPage dashboard={dashboard} />;
}
