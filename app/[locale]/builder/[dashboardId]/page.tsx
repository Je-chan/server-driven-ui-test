import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getDashboardById } from "@/src/entities/dashboard";
import { DashboardBuilderPage } from "@/src/views/dashboard-builder";

interface PageProps {
  params: Promise<{ locale: string; dashboardId: string }>;
}

export default async function BuilderPage({ params }: PageProps) {
  const { locale, dashboardId } = await params;
  setRequestLocale(locale);

  const dashboard = await getDashboardById(dashboardId);

  if (!dashboard) {
    notFound();
  }

  return <DashboardBuilderPage dashboard={dashboard} />;
}
