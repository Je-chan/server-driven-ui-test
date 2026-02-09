import { notFound } from "next/navigation";
import { getDashboardById } from "@/src/entities/dashboard";
import { PresentationPage } from "@/src/views/presentation";

interface PageProps {
  params: Promise<{ dashboardId: string }>;
}

export default async function PresentationRoute({ params }: PageProps) {
  const { dashboardId } = await params;
  const dashboard = await getDashboardById(dashboardId);

  if (!dashboard) {
    notFound();
  }

  return <PresentationPage dashboard={dashboard} />;
}
