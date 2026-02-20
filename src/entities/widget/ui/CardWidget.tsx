"use client";

import { useMemo } from "react";
import ReactGridLayout from "react-grid-layout";
import type { Widget } from "@/src/entities/dashboard";
import { WidgetRenderer } from "./WidgetRenderer";
import type { FormManagerReturn } from "@/src/features/dashboard-form";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface FilterSubmitProps {
  applyFilters: () => void;
  hasPendingChanges: boolean;
}

interface CardWidgetProps {
  widget: Widget;
  canvasWidth: number;
  rowHeight: number;
  cols: number;
  filterValues?: Record<string, unknown>;
  appliedFilterValues?: Record<string, unknown>;
  onFilterChange?: (key: string, value: unknown) => void;
  formManager?: FormManagerReturn;
  dataSources?: Record<string, unknown>[];
  filterSubmitProps?: FilterSubmitProps;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout = ReactGridLayout as any;

const MARGIN: [number, number] = [8, 8];
const CONTAINER_PADDING: [number, number] = [8, 8];

export function CardWidget({
  widget,
  canvasWidth,
  rowHeight,
  cols,
  filterValues,
  appliedFilterValues,
  onFilterChange,
  formManager,
  dataSources,
  filterSubmitProps,
}: CardWidgetProps) {
  const children = widget.children ?? [];
  const options = widget.options as { showHeader?: boolean; headerTitle?: string } | undefined;
  const style = widget.style ?? {};
  const showHeader = options?.showHeader ?? true;
  const headerTitle = options?.headerTitle || widget.title;

  // Card 내부 그리드의 픽셀 너비 계산
  const cardInnerWidth = useMemo(() => {
    const colWidth = (canvasWidth - CONTAINER_PADDING[0] * 2 - MARGIN[0] * (cols - 1)) / cols;
    return colWidth * widget.layout.w + MARGIN[0] * (widget.layout.w - 1);
  }, [canvasWidth, cols, widget.layout.w]);

  // 내부 그리드 cols = Card의 layout.w 값
  const innerCols = widget.layout.w;

  const innerLayouts = children.map((child) => ({
    i: child.id,
    x: child.layout.x,
    y: child.layout.y,
    w: child.layout.w,
    h: child.layout.h,
    static: true,
  }));

  const getShadowStyle = (shadow?: string) => {
    switch (shadow) {
      case "none": return "none";
      case "sm": return "0 1px 2px 0 rgb(0 0 0 / 0.05)";
      case "md": return "0 4px 6px -1px rgb(0 0 0 / 0.1)";
      case "lg": return "0 10px 15px -3px rgb(0 0 0 / 0.1)";
      default: return "0 1px 2px 0 rgb(0 0 0 / 0.05)";
    }
  };

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        backgroundColor: style.backgroundColor ?? "#ffffff",
        borderRadius: style.borderRadius ?? 8,
        boxShadow: getShadowStyle(style.shadow),
      }}
    >
      {showHeader && (
        <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
          <span className="text-sm font-medium">{headerTitle}</span>
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            card
          </span>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {children.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            빈 Card
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={innerLayouts}
            cols={innerCols}
            rowHeight={rowHeight}
            width={cardInnerWidth}
            isDraggable={false}
            isResizable={false}
            compactType={null}
            margin={MARGIN}
            containerPadding={[4, 4]}
          >
            {children.map((child) => {
              const isFilter = child.type.startsWith("filter-");

              return (
                <div
                  key={child.id}
                  className="flex flex-col overflow-hidden"
                >
                  {/* 자식 위젯 헤더 — 필터는 생략 */}
                  {!isFilter && (
                    <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5">
                      <span className="text-xs font-medium">{child.title}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {child.type}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden">
                    <WidgetRenderer
                      widget={child}
                      filterValues={filterValues}
                      appliedFilterValues={appliedFilterValues}
                      onFilterChange={onFilterChange}
                      formManager={formManager}
                      dataSources={dataSources}
                      filterSubmitProps={filterSubmitProps}
                    />
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
