/**
 * PresentationCanvas — 발표 모드의 읽기 전용 대시보드 캔버스.
 *
 * 실제 대시보드와 동일한 그리드 레이아웃으로 위젯을 배치하되,
 * 드래그/리사이즈를 비활성화하고 프레젠테이션에 특화된 시각 효과를 제공한다.
 *
 * 스텝별 시각 효과:
 * - "filters" 스텝: filter-* 위젯만 하이라이트, 나머지 opacity 감소
 * - "widgets" 스텝: 각 위젯에 레이아웃 좌표 배지 표시 (x,y) WxH
 * - "data-binding" 스텝: dataBinding이 있는 위젯에 DB 아이콘 표시
 * - "form" 스텝: form 위젯만 하이라이트
 * - "switch-slot" 스텝: conditional-slot 위젯만 하이라이트
 *
 * Full HD(1920x1080) 기준으로 캔버스를 렌더링하고,
 * 컨테이너 너비에 맞게 축소(scale) 적용.
 * 위젯 클릭 시 onWidgetClick → PresentationPage에서 selectedWidgetId 변경 → Inspector 연동.
 */
"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import ReactGridLayout from "react-grid-layout/legacy";
import { Database, ListFilter, FileText, GitBranch } from "lucide-react";
import { WidgetRenderer } from "@/src/entities/widget";
import { resolveLabel } from "@/src/shared/lib";
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
  const locale = useLocale();
  const td = useTranslations("dashboard");
  const { widgets } = schema;
  const cols = schema.settings?.gridColumns ?? 24;

  const schemaRowHeight = schema.settings?.rowHeight ?? 30;

  const { canvasWidth, canvasHeight, rowHeight, scale } = useMemo(() => {
    const maxWidth = containerWidth - 32;
    const scaledWidth = Math.min(maxWidth, CANVAS_WIDTH);
    const currentScale = scaledWidth / CANVAS_WIDTH;
    const scaledHeight = scaledWidth / (CANVAS_WIDTH / CANVAS_HEIGHT);

    return {
      canvasWidth: scaledWidth,
      canvasHeight: scaledHeight,
      rowHeight: schemaRowHeight * currentScale,
      scale: currentScale,
    };
  }, [containerWidth, schemaRowHeight]);

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
  const showFilterBadge = currentStepId === "filters";
  const showFormBadge = currentStepId === "form";
  const showSlotBadge = currentStepId === "switch-slot";

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-lg font-medium text-muted-foreground">
          {td("noWidgets")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-xs text-muted-foreground">
        Full HD (1920x1080) / {Math.round(scale * 100)}%
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
          compactType={null}
          margin={[8, 0]}
          containerPadding={[8, 8]}
        >
          {widgets.map((widget) => {
            const style = widget.style ?? {};
            const isSelected = selectedWidgetId === widget.id;
            const hasDataBinding = !!widget.dataBinding;
            const isFilter = widget.type.startsWith("filter-");
            const isForm = widget.type === "form";
            const isSlot = widget.type === "conditional-slot";

            // 특정 스텝에서 해당 타입이 아닌 위젯은 opacity 감소
            const isHighlighted = (() => {
              if (showFilterBadge) return isFilter;
              if (showFormBadge) return isForm;
              if (showSlotBadge) return isSlot;
              return true;
            })();

            return (
              <div
                key={widget.id}
                className={`flex flex-col overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : selectedWidgetId
                      ? "opacity-40"
                      : !isHighlighted
                        ? "opacity-30"
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
                  <span className="text-sm font-medium">{resolveLabel(widget.title, locale)}</span>
                  <div className="flex items-center gap-1.5">
                    {showFilterBadge && (
                      <span
                        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${
                          isFilter
                            ? "bg-violet-100 text-violet-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <ListFilter className="h-3 w-3" />
                      </span>
                    )}
                    {showFormBadge && (
                      <span
                        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${
                          isForm
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <FileText className="h-3 w-3" />
                      </span>
                    )}
                    {showSlotBadge && (
                      <span
                        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${
                          isSlot
                            ? "bg-teal-100 text-teal-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <GitBranch className="h-3 w-3" />
                      </span>
                    )}
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
                  <WidgetRenderer widget={widget} dataSources={schema.dataSources} />
                </div>
              </div>
            );
          })}
        </GridLayout>
      </div>
    </div>
  );
}
