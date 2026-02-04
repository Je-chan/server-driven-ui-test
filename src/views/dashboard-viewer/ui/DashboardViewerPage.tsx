"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, RefreshCw } from "lucide-react";
import type { DashboardEntity } from "@/src/entities/dashboard";

interface DashboardViewerPageProps {
  dashboard: DashboardEntity;
}

export function DashboardViewerPage({ dashboard }: DashboardViewerPageProps) {
  const { schema } = dashboard;
  const widgetCount = schema.widgets?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-lg font-semibold">{dashboard.title}</h1>
              {dashboard.description && (
                <p className="text-sm text-muted-foreground">
                  {dashboard.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link
              href={`/builder/${dashboard.id}`}
              className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto p-4">
        {widgetCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-32">
            <p className="text-lg font-medium text-muted-foreground">
              No widgets in this dashboard
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit this dashboard to add widgets
            </p>
            <Link
              href={`/builder/${dashboard.id}`}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open Builder
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Dashboard Preview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schema.widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="rounded-lg border bg-background p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{widget.title}</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {widget.type}
                    </span>
                  </div>
                  <div className="flex h-32 items-center justify-center rounded bg-muted/50 text-sm text-muted-foreground">
                    Widget: {widget.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Info */}
        <div className="mt-6 rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Dashboard Info</h2>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">Version</dt>
              <dd className="text-sm font-medium">{schema.version}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Widgets</dt>
              <dd className="text-sm font-medium">{widgetCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Filters</dt>
              <dd className="text-sm font-medium">{schema.filters?.length ?? 0}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Theme</dt>
              <dd className="text-sm font-medium">{schema.settings?.theme ?? "light"}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
