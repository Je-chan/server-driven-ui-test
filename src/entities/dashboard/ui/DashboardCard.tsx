"use client";

import Link from "next/link";
import { LayoutDashboard, Calendar, Eye, Pencil, Presentation } from "lucide-react";
import type { DashboardEntity } from "../model/types";

interface DashboardCardProps {
  dashboard: DashboardEntity;
}

export function DashboardCard({ dashboard }: DashboardCardProps) {
  const widgetCount = dashboard.schema.widgets?.length ?? 0;
  const formattedDate = new Date(dashboard.updatedAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="group relative rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{dashboard.title}</h3>
            {dashboard.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {dashboard.description}
              </p>
            )}
          </div>
        </div>
        {dashboard.isPublished && (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            게시됨
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <LayoutDashboard className="h-4 w-4" />
          <span>{widgetCount} widgets</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/dashboard/${dashboard.id}`}
          className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          <Eye className="h-4 w-4" />
          보기
        </Link>
        <Link
          href={`/builder/${dashboard.id}`}
          className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Pencil className="h-4 w-4" />
          수정
        </Link>
        <Link
          href={`/presentation/${dashboard.id}`}
          className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          <Presentation className="h-4 w-4" />
          발표
        </Link>
      </div>
    </div>
  );
}
