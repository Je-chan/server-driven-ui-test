"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { DashboardCard, type DashboardEntity } from "@/src/entities/dashboard";

interface DashboardListPageProps {
  dashboards: DashboardEntity[];
}

export function DashboardListPage({ dashboards }: DashboardListPageProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboards</h1>
          <p className="mt-1 text-muted-foreground">
            에너지 모니터링 대시보드를 관리합니다.
          </p>
        </div>
        <Link
          href="/builder/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          New Dashboard
        </Link>
      </div>

      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No dashboards yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first dashboard to get started.
          </p>
          <Link
            href="/builder/new"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Dashboard
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
