"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import ReactGridLayout from "react-grid-layout";
import { X, ArrowLeft, Settings, RefreshCw, Search } from "lucide-react";
import { WidgetRenderer, CardWidget, ConditionalSlotWidget } from "@/src/entities/widget";
import { resolveLabel, evaluateConditions } from "@/src/shared/lib";
import { useFilterValues } from "@/src/features/dashboard-filter";
import { useFormManager } from "@/src/features/dashboard-form";
import type { DashboardEntity } from "@/src/entities/dashboard";
import { normalizeSchema } from "@/src/entities/dashboard";
import { LocaleToggle } from "@/src/shared/ui/LocaleToggle";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface FullscreenViewerPageProps {
  dashboard: DashboardEntity;
}

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  static: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout = ReactGridLayout as any;

export function FullscreenViewerPage({ dashboard }: FullscreenViewerPageProps) {
  const locale = useLocale();
  const t = useTranslations("common");
  const td = useTranslations("dashboard");
  const router = useRouter();
  const schema = useMemo(() => normalizeSchema(dashboard.schema), [dashboard.schema]);
  const [showControls, setShowControls] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const filterMode = schema.settings.filterMode ?? "auto";
  const { filterValues, appliedValues, setFilterValue, applyFilters, hasPendingChanges, hasFilterSubmitWidget } = useFilterValues(schema.widgets ?? [], filterMode);
  const formManager = useFormManager(schema.widgets ?? []);

  // 조건부 렌더링: filterValues 기반으로 표시할 위젯 필터링
  const visibleWidgets = useMemo(() => {
    return schema.widgets.filter((w) => evaluateConditions(w.conditions, filterValues));
  }, [schema.widgets, filterValues]);

  // 기본 해상도 설정 (1920x1080 기준)
  const targetWidth = 1920;
  const cols = schema.settings?.gridColumns ?? 24;
  const rowHeight = schema.settings?.rowHeight ?? 1;

  // ESC 키로 나가기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push(`/dashboard/${dashboard.id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, dashboard.id]);

  // 마우스 이동 시 컨트롤 표시
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.clientY < 100) {
      setShowControls(true);
    } else {
      setShowControls(false);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExit = () => {
    router.push(`/dashboard/${dashboard.id}`);
  };

  const handleGoHome = () => {
    router.push("/");
  };

  // 레이아웃 생성
  const layouts: LayoutItem[] = visibleWidgets.map((widget) => ({
    i: widget.id,
    x: widget.layout.x,
    y: widget.layout.y,
    w: widget.layout.w,
    h: widget.layout.h,
    static: true,
  }));

  // 그림자 스타일 매핑
  const getShadowStyle = (shadow?: string) => {
    switch (shadow) {
      case "none":
        return "none";
      case "sm":
        return "0 1px 2px 0 rgb(0 0 0 / 0.05)";
      case "md":
        return "0 4px 6px -1px rgb(0 0 0 / 0.1)";
      case "lg":
        return "0 10px 15px -3px rgb(0 0 0 / 0.1)";
      default:
        return "0 1px 2px 0 rgb(0 0 0 / 0.05)";
    }
  };

  if (visibleWidgets.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
        <p className="text-lg font-medium text-muted-foreground">
          {td("noWidgets")}
        </p>
        <button
          onClick={handleExit}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("back")}
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-screen overflow-auto bg-background"
      onMouseMove={handleMouseMove}
    >
      {/* 상단 컨트롤 바 (hover 시 표시) */}
      <div
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          showControls
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="flex items-center justify-between bg-background/95 px-4 py-2 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("home")}
            </button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-sm font-semibold">{dashboard.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={t("refresh")}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push(`/builder/${dashboard.id}`)}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={t("edit")}
            >
              <Settings className="h-4 w-4" />
            </button>
            <LocaleToggle />
            <button
              onClick={handleExit}
              className="flex items-center gap-2 rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              title={t("close")}
            >
              <X className="h-4 w-4" />
              {t("close")}
            </button>
          </div>
        </div>
      </div>

      {/* ESC 힌트 (우측 하단) */}
      <div className="fixed bottom-4 right-4 z-50 rounded-md bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
        {td("escToExit")}
      </div>

      {/* 대시보드 캔버스 */}
      <div
        className="min-h-screen"
        style={{
          width: targetWidth,
          minWidth: targetWidth,
        }}
      >
        <GridLayout
          key={refreshKey}
          className="layout"
          layout={layouts}
          cols={cols}
          rowHeight={rowHeight}
          width={targetWidth}
          isDraggable={false}
          isResizable={false}
          compactType={null}
          margin={[8, 0]}
          containerPadding={[8, 8]}
        >
          {visibleWidgets.map((widget) => {
            const style = widget.style ?? {};
            const isFilter = widget.type.startsWith("filter-");
            if (widget.type === "card") {
              return (
                <div key={widget.id}>
                  <CardWidget
                    widget={widget}
                    canvasWidth={targetWidth}
                    rowHeight={rowHeight}
                    cols={cols}
                    filterValues={filterValues}
                    appliedFilterValues={appliedValues}
                    onFilterChange={setFilterValue}
                    formManager={formManager}
                    dataSources={schema.dataSources}
                    filterSubmitProps={{ applyFilters, hasPendingChanges }}
                  />
                </div>
              );
            }

            if (widget.type === "conditional-slot") {
              return (
                <div key={widget.id}>
                  <ConditionalSlotWidget
                    widget={widget}
                    canvasWidth={targetWidth}
                    rowHeight={rowHeight}
                    cols={cols}
                    filterValues={filterValues}
                    appliedFilterValues={appliedValues}
                    onFilterChange={setFilterValue}
                    formManager={formManager}
                    dataSources={schema.dataSources}
                    filterSubmitProps={{ applyFilters, hasPendingChanges }}
                  />
                </div>
              );
            }

            return (
              <div
                key={widget.id}
                className="flex flex-col overflow-hidden"
                style={{
                  backgroundColor: style.backgroundColor ?? "#ffffff",
                  borderRadius: style.borderRadius ?? 8,
                  boxShadow: getShadowStyle(style.shadow),
                }}
              >
                {/* Widget Header — 필터 위젯은 헤더 생략 */}
                {!isFilter && (
                  <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                    <span className="text-sm font-medium">{resolveLabel(widget.title, locale)}</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {widget.type}
                    </span>
                  </div>
                )}

                {/* Widget Content */}
                <div className="flex-1 overflow-hidden">
                  <WidgetRenderer
                    widget={widget}
                    filterValues={filterValues}
                    appliedFilterValues={appliedValues}
                    onFilterChange={setFilterValue}
                    formManager={formManager}
                    dataSources={schema.dataSources}
                    filterSubmitProps={{ applyFilters, hasPendingChanges }}
                  />
                </div>
              </div>
            );
          })}
        </GridLayout>
      </div>

      {/* Manual 모드: 조회 FAB (filter-submit 위젯이 없을 때만) */}
      {hasPendingChanges && !hasFilterSubmitWidget && (
        <button
          onClick={applyFilters}
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          <Search className="h-4 w-4" />
          {t("search")}
        </button>
      )}
    </div>
  );
}
