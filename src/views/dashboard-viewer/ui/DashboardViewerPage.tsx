"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, RefreshCw, Monitor, Maximize2, Presentation, Search } from "lucide-react";
import { ViewerCanvas, RESOLUTION_PRESETS, type ResolutionKey } from "@/src/widgets/viewer-canvas";
import { useFilterValues } from "@/src/features/dashboard-filter";
import { useFormManager } from "@/src/features/dashboard-form";
import type { DashboardEntity } from "@/src/entities/dashboard";
import { migrateFiltersToWidgets } from "@/src/entities/dashboard";

interface DashboardViewerPageProps {
  dashboard: DashboardEntity;
}

export function DashboardViewerPage({ dashboard }: DashboardViewerPageProps) {
  const schema = useMemo(() => migrateFiltersToWidgets(dashboard.schema), [dashboard.schema]);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [resolution, setResolution] = useState<ResolutionKey>("1920x1080");
  const [showResolutionMenu, setShowResolutionMenu] = useState(false);
  const filterMode = schema.settings.filterMode ?? "auto";
  const { filterValues, appliedValues, setFilterValue, applyFilters, hasPendingChanges } = useFilterValues(schema.widgets ?? [], filterMode);
  const formManager = useFormManager(schema.widgets ?? []);

  // 캔버스 컨테이너 너비 계산
  useEffect(() => {
    const updateWidth = () => {
      if (canvasContainerRef.current) {
        setContainerWidth(canvasContainerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

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
              뒤로가기
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
            {/* 해상도 선택 */}
            <div className="relative">
              <button
                onClick={() => setShowResolutionMenu(!showResolutionMenu)}
                className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Monitor className="h-4 w-4" />
                {resolution}
              </button>
              {showResolutionMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowResolutionMenu(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border bg-card py-1 shadow-lg">
                    {(Object.keys(RESOLUTION_PRESETS) as ResolutionKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setResolution(key);
                          setShowResolutionMenu(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent ${
                          resolution === key ? "bg-accent font-medium" : ""
                        }`}
                      >
                        <span>{RESOLUTION_PRESETS[key].label}</span>
                        {resolution === key && (
                          <span className="text-primary">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-border" />

            <button className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent">
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
            <Link
              href={`/view/${dashboard.id}`}
              className="flex items-center gap-2 rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Maximize2 className="h-4 w-4" />
              전체 화면
            </Link>
            <Link
              href={`/presentation/${dashboard.id}`}
              className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              <Presentation className="h-4 w-4" />
              발표
            </Link>
            <Link
              href={`/builder/${dashboard.id}`}
              className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Pencil className="h-4 w-4" />
              수정
            </Link>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main ref={canvasContainerRef} className="container mx-auto p-6">
        <ViewerCanvas
          schema={schema}
          containerWidth={containerWidth}
          resolution={resolution}
          filterValues={appliedValues}
          onFilterChange={setFilterValue}
          formManager={formManager}
        />

        {/* Dashboard 정보 */}
        <div className="mt-6 rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Dashboard 정보</h2>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">버전</dt>
              <dd className="text-sm font-medium">{schema.version}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Widgets</dt>
              <dd className="text-sm font-medium">{schema.widgets?.length ?? 0}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Filters</dt>
              <dd className="text-sm font-medium">
                {(schema.widgets ?? []).filter((w) => w.type.startsWith("filter-")).length}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">테마</dt>
              <dd className="text-sm font-medium">{schema.settings?.theme ?? "light"}</dd>
            </div>
          </dl>
        </div>
      </main>

      {/* Manual 모드: 조회 FAB */}
      {hasPendingChanges && (
        <button
          onClick={applyFilters}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          <Search className="h-4 w-4" />
          조회
        </button>
      )}
    </div>
  );
}
