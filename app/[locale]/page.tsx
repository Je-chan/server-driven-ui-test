import { setRequestLocale } from "next-intl/server";
import { getDashboards } from "@/src/entities/dashboard";
import { DashboardListPage } from "@/src/views/dashboard-list";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const dashboards = await getDashboards();

  return <DashboardListPage dashboards={dashboards} />;
}
