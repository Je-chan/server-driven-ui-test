"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import ReactGridLayout from "react-grid-layout";
import { Trash2, GripVertical } from "lucide-react";
import { useBuilderStore } from "@/src/features/dashboard-builder/model/builder.store";
import { getWidgetType } from "@/src/entities/widget";
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

interface BuilderCanvasProps {
  containerWidth: number;
  resolution?: ResolutionKey;
}

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

// react-grid-layout 타입 정의가 불완전하여 any 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout = ReactGridLayout as any;

export function BuilderCanvas({ containerWidth, resolution = "1920x1080" }: BuilderCanvasProps) {
  const {
    schema,
    selectedWidgetId,
    selectWidget,
    removeWidget,
    updateAllLayouts,
  } = useBuilderStore();

  const { widgets } = schema;
  const cols = schema.settings?.gridColumns ?? 24;

  // 해상도 기반 계산
  const { canvasWidth, canvasHeight, rowHeight, scale } = useMemo(() => {
    const preset = RESOLUTION_PRESETS[resolution];
    const targetAspectRatio = preset.width / preset.height;

    // 컨테이너에 맞게 스케일 조정 (패딩 고려)
    const maxWidth = containerWidth - 48; // 좌우 패딩
    const scaledWidth = Math.min(maxWidth, preset.width);
    const currentScale = scaledWidth / preset.width;
    const scaledHeight = scaledWidth / targetAspectRatio;

    // rowHeight 계산: 전체 높이를 rows로 나눔 (24 rows 기준)
    const rows = 24;
    const calculatedRowHeight = Math.floor(scaledHeight / rows);

    return {
      canvasWidth: scaledWidth,
      canvasHeight: scaledHeight,
      rowHeight: calculatedRowHeight,
      scale: currentScale,
    };
  }, [containerWidth, resolution]);

  const layouts: LayoutItem[] = widgets.map((widget) => ({
    i: widget.id,
    x: widget.layout.x,
    y: widget.layout.y,
    w: widget.layout.w,
    h: widget.layout.h,
    minW: widget.layout.minW ?? 2,
    minH: widget.layout.minH ?? 2,
  }));

  const handleLayoutChange = useCallback(
    (newLayouts: LayoutItem[]) => {
      updateAllLayouts(
        newLayouts.map((l) => ({
          i: l.i,
          x: l.x,
          y: l.y,
          w: l.w,
          h: l.h,
        }))
      );
    },
    [updateAllLayouts]
  );

  // 위젯 추가 시 해당 위젯으로 스크롤
  const prevWidgetCountRef = useRef(widgets.length);
  useEffect(() => {
    if (widgets.length > prevWidgetCountRef.current && selectedWidgetId) {
      // 새 위젯이 추가된 경우, DOM 업데이트 후 스크롤
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-widget-id="${selectedWidgetId}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    prevWidgetCountRef.current = widgets.length;
  }, [widgets.length, selectedWidgetId]);

  const handleWidgetClick = (widgetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectWidget(widgetId);
  };

  const handleCanvasClick = () => {
    selectWidget(null);
  };

  const handleRemoveWidget = (widgetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeWidget(widgetId);
  };

  return (
    <div className="flex flex-col items-center">
      {/* 해상도 정보 */}
      <div className="mb-2 text-xs text-muted-foreground">
        {RESOLUTION_PRESETS[resolution].label} • 배율: {Math.round(scale * 100)}%
      </div>

      {/* 캔버스 컨테이너 - 16:9 비율 유지 */}
      <div
        className="relative rounded-lg border-2 border-dashed border-muted-foreground/30 bg-background shadow-sm"
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
        onClick={handleCanvasClick}
      >
        {widgets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-lg font-medium text-muted-foreground">
              Widget을 여기에 배치하세요
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              왼쪽 패널에서 Widget을 클릭하여 추가하세요
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              캔버스: {Math.round(canvasWidth)}×{Math.round(canvasHeight)}px
            </p>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={layouts}
            cols={cols}
            rowHeight={rowHeight}
            width={canvasWidth}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            compactType="vertical"
            preventCollision={false}
            isResizable={true}
            isDraggable={true}
            margin={[8, 8]}
            containerPadding={[8, 8]}
          >
            {widgets.map((widget) => {
              const widgetDef = getWidgetType(widget.type);
              const isSelected = selectedWidgetId === widget.id;
              const Icon = widgetDef?.icon;

              return (
                <div
                  key={widget.id}
                  data-widget-id={widget.id}
                  className={`group relative flex flex-col overflow-hidden rounded-lg border-2 bg-card shadow-sm transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                  onClick={(e) => handleWidgetClick(widget.id, e)}
                >
                  {/* Widget Header */}
                  <div className="drag-handle flex cursor-grab items-center justify-between border-b bg-muted/30 px-2 py-1 active:cursor-grabbing">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs font-medium">{widget.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                        {widget.type}
                      </span>
                      <button
                        className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        onClick={(e) => handleRemoveWidget(widget.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Widget Content Placeholder */}
                  <div className="flex flex-1 items-center justify-center p-2">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      {Icon && <Icon className="h-6 w-6" />}
                      <span className="text-xs">{widgetDef?.label ?? widget.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </GridLayout>
        )}
      </div>
    </div>
  );
}
