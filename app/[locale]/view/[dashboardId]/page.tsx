import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getDashboardById } from "@/src/entities/dashboard";
import { FullscreenViewerPage } from "@/src/views/fullscreen-viewer";

interface PageProps {
  params: Promise<{ locale: string; dashboardId: string }>;
}

export default async function FullscreenViewPage({ params }: PageProps) {
  const { locale, dashboardId } = await params;
  setRequestLocale(locale);

  const dashboard = await getDashboardById(dashboardId);

  if (!dashboard) {
    notFound();
  }

  return (
    <Suspense>
      <FullscreenViewerPage dashboard={dashboard} />
    </Suspense>
  );
}
