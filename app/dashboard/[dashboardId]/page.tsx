import { notFound } from "next/navigation";
import { getDashboardById } from "@/src/entities/dashboard";
import { DashboardViewerPage } from "@/src/views/dashboard-viewer";

interface PageProps {
  params: Promise<{ dashboardId: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { dashboardId } = await params;
  const dashboard = await getDashboardById(dashboardId);

  if (!dashboard) {
    notFound();
  }

  return <DashboardViewerPage dashboard={dashboard} />;
}
