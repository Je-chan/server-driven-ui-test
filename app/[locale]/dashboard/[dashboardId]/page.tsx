import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getDashboardById } from "@/src/entities/dashboard";
import { DashboardViewerPage } from "@/src/views/dashboard-viewer";

interface PageProps {
  params: Promise<{ locale: string; dashboardId: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale, dashboardId } = await params;
  setRequestLocale(locale);

  const dashboard = await getDashboardById(dashboardId);

  if (!dashboard) {
    notFound();
  }

  return (
    <Suspense>
      <DashboardViewerPage dashboard={dashboard} />
    </Suspense>
  );
}
