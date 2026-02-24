"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardCard, type DashboardEntity } from "@/src/entities/dashboard";
import { LocaleToggle } from "@/src/shared/ui/LocaleToggle";

interface DashboardListPageProps {
  dashboards: DashboardEntity[];
}

export function DashboardListPage({ dashboards }: DashboardListPageProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <Link
            href="/builder/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            {t("newDashboard")}
          </Link>
        </div>
      </div>

      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">{t("noDashboards")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noDashboardsDesc")}
          </p>
          <Link
            href="/builder/new"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("createDashboard")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => (
            <DashboardCard key={dashboard.id} dashboard={dashboard} />
          ))}
        </div>
      )}
    </div>
  );
}
