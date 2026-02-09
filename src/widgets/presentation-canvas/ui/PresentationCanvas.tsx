"use client";

import { useMemo } from "react";
import ReactGridLayout from "react-grid-layout";
import { Database } from "lucide-react";
import { WidgetRenderer } from "@/src/entities/widget";
import type { DashboardJson } from "@/src/entities/dashboard";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface PresentationCanvasProps {
  schema: DashboardJson;
  containerWidth: number;
  selectedWidgetId: string | null;
  currentStepId: string;
  onWidgetClick: (widgetId: string) => void;
  onBackgroundClick: () => void;
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

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

export function PresentationCanvas({
  schema,
  containerWidth,
  selectedWidgetId,
  currentStepId,
  onWidgetClick,
  onBackgroundClick,
}: PresentationCanvasProps) {
  const { widgets } = schema;
  const cols = schema.settings?.gridColumns ?? 24;

  const { canvasWidth, canvasHeight, rowHeight, scale } = useMemo(() => {
    const maxWidth = containerWidth - 32;
    const scaledWidth = Math.min(maxWidth, CANVAS_WIDTH);
    const currentScale = scaledWidth / CANVAS_WIDTH;
    const scaledHeight = scaledWidth / (CANVAS_WIDTH / CANVAS_HEIGHT);
    const rows = 24;
    const calculatedRowHeight = Math.floor(scaledHeight / rows);

    return {
      canvasWidth: scaledWidth,
      canvasHeight: scaledHeight,
      rowHeight: calculatedRowHeight,
      scale: currentScale,
    };
  }, [containerWidth]);

  const layouts: LayoutItem[] = widgets.map((widget) => ({
    i: widget.id,
    x: widget.layout.x,
    y: widget.layout.y,
    w: widget.layout.w,
    h: widget.layout.h,
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

  const showLayoutBadge = currentStepId === "widgets";
  const showDataBindingIcon = currentStepId === "data-binding";

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-lg font-medium text-muted-foreground">
          이 Dashboard에 Widget이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-xs text-muted-foreground">
        Full HD (1920x1080) / 배율: {Math.round(scale * 100)}%
      </div>

      <div
        className="relative rounded-lg bg-muted/30"
        style={{ width: canvasWidth, minHeight: canvasHeight }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onBackgroundClick();
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
          compactType="vertical"
          margin={[8, 8]}
          containerPadding={[8, 8]}
        >
          {widgets.map((widget) => {
            const style = widget.style ?? {};
            const isSelected = selectedWidgetId === widget.id;
            const hasDataBinding = !!widget.dataBinding;

            return (
              <div
                key={widget.id}
                className={`flex flex-col overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : selectedWidgetId
                      ? "opacity-40"
                      : ""
                }`}
                style={{
                  backgroundColor: style.backgroundColor ?? "#ffffff",
                  borderRadius: style.borderRadius ?? 8,
                  boxShadow: getShadowStyle(style.shadow),
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onWidgetClick(widget.id);
                }}
              >
                {/* Widget Header */}
                <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                  <span className="text-sm font-medium">{widget.title}</span>
                  <div className="flex items-center gap-1.5">
                    {showDataBindingIcon && (
                      <span
                        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${
                          hasDataBinding
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Database className="h-3 w-3" />
                      </span>
                    )}
                    {showLayoutBadge && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-mono text-blue-700">
                        ({widget.layout.x},{widget.layout.y}) {widget.layout.w}x{widget.layout.h}
                      </span>
                    )}
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {widget.type}
                    </span>
                  </div>
                </div>

                {/* Widget Content */}
                <div className="flex-1 overflow-hidden">
                  <WidgetRenderer widget={widget} />
                </div>
              </div>
            );
          })}
        </GridLayout>
      </div>
    </div>
  );
}
