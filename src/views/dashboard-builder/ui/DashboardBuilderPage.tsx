"use client";

import Link from "next/link";
import { ArrowLeft, Save, Eye, Undo, Redo, Settings } from "lucide-react";
import type { DashboardEntity } from "@/src/entities/dashboard";

interface DashboardBuilderPageProps {
  dashboard: DashboardEntity;
}

export function DashboardBuilderPage({ dashboard }: DashboardBuilderPageProps) {
  const { schema } = dashboard;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold">{dashboard.title}</h1>
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Editing
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Undo className="h-4 w-4" />
          </button>
          <button className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Redo className="h-4 w-4" />
          </button>
          <div className="h-6 w-px bg-border" />
          <Link
            href={`/dashboard/${dashboard.id}`}
            className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Link>
          <button className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </header>

      {/* Builder Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Widget Palette */}
        <aside className="w-64 overflow-y-auto border-r bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
            WIDGETS
          </h2>
          <div className="space-y-2">
            {[
              { type: "kpi-card", label: "KPI Card" },
              { type: "line-chart", label: "Line Chart" },
              { type: "bar-chart", label: "Bar Chart" },
              { type: "pie-chart", label: "Pie Chart" },
              { type: "table", label: "Data Table" },
              { type: "map", label: "Map" },
              { type: "gauge", label: "Gauge" },
            ].map((widget) => (
              <div
                key={widget.type}
                className="cursor-grab rounded-md border bg-background p-3 text-sm transition-colors hover:border-primary hover:bg-accent"
                draggable
              >
                {widget.label}
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="mx-auto min-h-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background p-4">
            {schema.widgets.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center text-muted-foreground">
                <p className="text-lg font-medium">Drop widgets here</p>
                <p className="mt-1 text-sm">
                  Drag widgets from the left panel to build your dashboard
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {schema.widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="group relative cursor-pointer rounded-lg border-2 border-transparent bg-card p-4 shadow-sm transition-all hover:border-primary hover:shadow-md"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">{widget.title}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {widget.type}
                      </span>
                    </div>
                    <div className="flex h-32 items-center justify-center rounded bg-muted/50 text-sm text-muted-foreground">
                      {widget.type}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-sm font-medium text-white">
                        Click to edit
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Property Panel */}
        <aside className="w-80 overflow-y-auto border-l bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              PROPERTIES
            </h2>
            <button className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Settings className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Select a widget to edit its properties
          </div>

          {/* Dashboard Settings */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              DASHBOARD SETTINGS
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Title</label>
                <input
                  type="text"
                  defaultValue={dashboard.title}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Theme</label>
                <select className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Auto Refresh (seconds)
                </label>
                <input
                  type="number"
                  defaultValue={(schema.settings?.refreshInterval ?? 0) / 1000}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
