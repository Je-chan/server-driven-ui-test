import { notFound } from "next/navigation";
import { getDashboardById } from "@/src/entities/dashboard";
import { FullscreenViewerPage } from "@/src/views/fullscreen-viewer";

interface PageProps {
  params: Promise<{ dashboardId: string }>;
}

export default async function FullscreenViewPage({ params }: PageProps) {
  const { dashboardId } = await params;
  const dashboard = await getDashboardById(dashboardId);

  if (!dashboard) {
    notFound();
  }

  return <FullscreenViewerPage dashboard={dashboard} />;
}
