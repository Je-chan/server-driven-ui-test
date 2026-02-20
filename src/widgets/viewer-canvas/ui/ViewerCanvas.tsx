"use client";

import { useMemo } from "react";
import ReactGridLayout from "react-grid-layout";
import { WidgetRenderer, CardWidget } from "@/src/entities/widget";
import type { DashboardJson } from "@/src/entities/dashboard";
import type { FormManagerReturn } from "@/src/features/dashboard-form";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// 지원하는 해상도 프리셋
export const RESOLUTION_PRESETS = {
  "1920x1080": { width: 1920, height: 1080, label: "Full HD (1920×1080)" },
  "2560x1440": { width: 2560, height: 1440, label: "QHD (2560×1440)" },
  "1366x768": { width: 1366, height: 768, label: "HD (1366×768)" },
  "3840x2160": { width: 3840, height: 2160, label: "4K (3840×2160)" },
} as const;

export type ResolutionKey = keyof typeof RESOLUTION_PRESETS;

interface ViewerCanvasProps {
  schema: DashboardJson;
  containerWidth: number;
  resolution?: ResolutionKey;
  filterValues?: Record<string, unknown>;
  appliedFilterValues?: Record<string, unknown>;
  onFilterChange?: (key: string, value: unknown) => void;
  formManager?: FormManagerReturn;
  applyFilters?: () => void;
  hasPendingChanges?: boolean;
}

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  static: boolean;
}

// react-grid-layout 타입 정의가 불완전하여 any 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout = ReactGridLayout as any;

export function ViewerCanvas({ schema, containerWidth, resolution = "1920x1080", filterValues, appliedFilterValues, onFilterChange, formManager, applyFilters, hasPendingChanges }: ViewerCanvasProps) {
  const { widgets } = schema;
  const cols = schema.settings?.gridColumns ?? 24;

  const rowHeight = schema.settings?.rowHeight ?? 10;

  // 해상도 기반 캔버스 너비 계산
  const { canvasWidth, scale } = useMemo(() => {
    const preset = RESOLUTION_PRESETS[resolution];

    const maxWidth = containerWidth - 48;
    const scaledWidth = Math.min(maxWidth, preset.width);
    const currentScale = scaledWidth / preset.width;

    return {
      canvasWidth: scaledWidth,
      scale: currentScale,
    };
  }, [containerWidth, resolution]);

  // 레이아웃 생성 (static으로 설정하여 드래그/리사이즈 불가)
  const layouts: LayoutItem[] = widgets.map((widget) => ({
    i: widget.id,
    x: widget.layout.x,
    y: widget.layout.y,
    w: widget.layout.w,
    h: widget.layout.h,
    static: true, // 뷰어에서는 편집 불가
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

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-lg font-medium text-muted-foreground">
          이 Dashboard에 Widget이 없습니다
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Dashboard를 수정하여 Widget을 추가하세요
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* 해상도 정보 */}
      <div className="mb-2 text-xs text-muted-foreground">
        {RESOLUTION_PRESETS[resolution].label} • 배율: {Math.round(scale * 100)}%
      </div>

      {/* 캔버스 컨테이너 */}
      <div
        className="relative rounded-lg bg-muted/30"
        style={{
          width: canvasWidth,
        }}
      >
        <GridLayout
          className="layout"
          layout={layouts}
          cols={cols}
          rowHeight={rowHeight}
          width={canvasWidth}
          isDraggable={false}
          isResizable={false}
          compactType={null}
          margin={[8, 8]}
          containerPadding={[8, 8]}
        >
          {widgets.map((widget) => {
            const style = widget.style ?? {};
            const isFilter = widget.type.startsWith("filter-");
            const isCard = widget.type === "card";

            if (isCard) {
              return (
                <div key={widget.id}>
                  <CardWidget
                    widget={widget}
                    canvasWidth={canvasWidth}
                    rowHeight={rowHeight}
                    cols={cols}
                    filterValues={filterValues}
                    appliedFilterValues={appliedFilterValues}
                    onFilterChange={onFilterChange}
                    formManager={formManager}
                    dataSources={schema.dataSources}
                    filterSubmitProps={applyFilters ? { applyFilters, hasPendingChanges: hasPendingChanges ?? false } : undefined}
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
                    <span className="text-sm font-medium">{widget.title}</span>
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
                    appliedFilterValues={appliedFilterValues}
                    onFilterChange={onFilterChange}
                    formManager={formManager}
                    dataSources={schema.dataSources}
                    filterSubmitProps={applyFilters ? { applyFilters, hasPendingChanges: hasPendingChanges ?? false } : undefined}
                  />
                </div>
              </div>
            );
          })}
        </GridLayout>
      </div>
    </div>
  );
}
