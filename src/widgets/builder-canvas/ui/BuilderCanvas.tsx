"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import ReactGridLayout from "react-grid-layout";
import { Trash2, GripVertical, LayoutGrid, Layers, Eye } from "lucide-react";
import { useBuilderStore } from "@/src/features/dashboard-builder/model/builder.store";
import { getWidgetType } from "@/src/entities/widget";
import { resolveLabel } from "@/src/shared/lib";
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
  const locale = useLocale();
  const tb = useTranslations("builder");
  const {
    schema,
    selectedWidgetId,
    selectedCardId,
    selectWidget,
    selectCard,
    removeWidget,
    removeChildWidget,
    updateAllLayouts,
    updateChildLayouts,
  } = useBuilderStore();

  const { widgets } = schema;
  const cols = schema.settings?.gridColumns ?? 24;

  const rowHeight = schema.settings?.rowHeight ?? 30;

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
    // 컨테이너 위젯(card, conditional-slot) 클릭 시 자동으로 편집 모드 진입
    const widget = widgets.find((w) => w.id === widgetId);
    if (widget?.type === "card" || widget?.type === "conditional-slot") {
      selectCard(widgetId);
    } else {
      selectCard(null);
    }
  };

  const handleChildWidgetClick = (cardId: string, childId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectWidget(childId);
    selectCard(cardId);
  };

  // 내부 그리드 이벤트가 외부 그리드로 전파되는 것을 차단
  const stopInnerGridPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleCanvasClick = () => {
    selectWidget(null);
    selectCard(null);
  };

  const handleRemoveWidget = (widgetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeWidget(widgetId);
  };

  const handleRemoveChildWidget = (cardId: string, childId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeChildWidget(cardId, childId);
  };

  const handleChildLayoutChange = useCallback(
    (cardId: string, newLayouts: LayoutItem[]) => {
      updateChildLayouts(
        cardId,
        newLayouts.map((l) => ({
          i: l.i,
          x: l.x,
          y: l.y,
          w: l.w,
          h: l.h,
        }))
      );

      // 자식 레이아웃 변경 후 Card 높이 자동 조정
      const maxChildBottom = newLayouts.reduce((max, l) => Math.max(max, l.y + l.h), 0);
      const headerGridUnits = Math.ceil(36 / rowHeight); // 헤더 높이를 grid unit으로 변환
      const paddingGridUnits = Math.ceil(8 / rowHeight); // containerPadding 보상
      const requiredCardH = maxChildBottom + headerGridUnits + paddingGridUnits;
      const card = widgets.find((w) => w.id === cardId);
      if (card && card.layout.h < requiredCardH) {
        updateAllLayouts(
          widgets.map((w) => ({
            i: w.id,
            x: w.layout.x,
            y: w.layout.y,
            w: w.layout.w,
            h: w.id === cardId ? requiredCardH : w.layout.h,
          }))
        );
      }
    },
    [updateChildLayouts, updateAllLayouts, widgets]
  );

  // Card 내부 그리드의 픽셀 너비 계산
  const getCardInnerWidth = useCallback(
    (cardLayoutW: number) => {
      const margin = 8;
      const containerPad = 8;
      const colWidth = (canvasWidth - containerPad * 2 - margin * (cols - 1)) / cols;
      return colWidth * cardLayoutW + margin * (cardLayoutW - 1);
    },
    [canvasWidth, cols]
  );

  return (
    <div className="flex flex-col items-center">
      {/* 해상도 정보 */}
      <div className="mb-2 text-xs text-muted-foreground">
        {RESOLUTION_PRESETS[resolution].label} • {Math.round(scale * 100)}%
      </div>

      {/* 캔버스 컨테이너 - 16:9 비율 유지 */}
      <div
        className="relative rounded-lg border-2 border-dashed border-muted-foreground/30 bg-background shadow-sm"
        style={{
          width: canvasWidth,
          minHeight: 400,
        }}
        onClick={handleCanvasClick}
      >
        {widgets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-lg font-medium text-muted-foreground">
              {tb("emptyCanvas")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tb("emptyCanvasHint")}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              {Math.round(canvasWidth)}px • rowHeight: {rowHeight}
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
            compactType={null}
            preventCollision={true}
            isResizable={true}
            isDraggable={true}
            margin={[8, 0]}
            containerPadding={[8, 8]}
          >
            {widgets.map((widget) => {
              const widgetDef = getWidgetType(widget.type);
              const isSelected = selectedWidgetId === widget.id;
              const Icon = widgetDef?.icon;
              const isFilter = widget.type.startsWith("filter-");
              const isForm = widget.type === "form";
              const isCard = widget.type === "card";
              const isConditionalSlot = widget.type === "conditional-slot";
              const hasConditions = (widget.conditions?.rules?.length ?? 0) > 0;
              const filterKey = isFilter ? (widget.options as { filterKey?: string } | undefined)?.filterKey : undefined;
              const formId = isForm ? (widget.options as { formId?: string } | undefined)?.formId : undefined;

              if (isCard) {
                const children = widget.children ?? [];
                const cardOptions = widget.options as { showHeader?: boolean; headerTitle?: string } | undefined;
                const showHeader = cardOptions?.showHeader ?? true;
                const headerTitle = cardOptions?.headerTitle || widget.title;
                const cardInnerWidth = getCardInnerWidth(widget.layout.w);
                const innerCols = widget.layout.w;
                const childLayouts: LayoutItem[] = children.map((c) => ({
                  i: c.id,
                  x: c.layout.x,
                  y: c.layout.y,
                  w: c.layout.w,
                  h: c.layout.h,
                  minW: c.layout.minW ?? 2,
                  minH: c.layout.minH ?? 2,
                }));

                return (
                  <div
                    key={widget.id}
                    data-widget-id={widget.id}
                    className={`group/card relative flex flex-col overflow-hidden rounded-lg border-2 bg-card shadow-sm transition-all ${
                      selectedCardId === widget.id
                        ? "border-blue-400 ring-2 ring-blue-200"
                        : isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                    }`}
                    onClick={(e) => handleWidgetClick(widget.id, e)}
                  >
                    {/* Card Header (drag handle) */}
                    <div className="drag-handle flex cursor-grab items-center justify-between border-b bg-muted/30 px-2 py-1 active:cursor-grabbing">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        <LayoutGrid className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate text-xs font-medium">
                          {showHeader ? resolveLabel(headerTitle, locale) : resolveLabel(widget.title, locale)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasConditions && (
                          <span className="flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-700">
                            <Eye className="h-2.5 w-2.5" />
                            {tb("conditional")}
                          </span>
                        )}
                        <span className="rounded bg-blue-100 px-1 py-0.5 text-[10px] text-blue-700">
                          card
                        </span>
                        <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                          {children.length} children
                        </span>
                        <button
                          className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover/card:opacity-100"
                          onClick={(e) => handleRemoveWidget(widget.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Card Inner Grid */}
                    <div
                      className="flex-1 overflow-auto"
                      onMouseDown={stopInnerGridPropagation}
                      onTouchStart={stopInnerGridPropagation}
                    >
                      {children.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          {tb("emptyConditionalSlot")}
                        </div>
                      ) : (
                        <GridLayout
                          className="layout"
                          layout={childLayouts}
                          cols={innerCols}
                          rowHeight={rowHeight}
                          width={cardInnerWidth}
                          onLayoutChange={(newLayouts: LayoutItem[]) =>
                            handleChildLayoutChange(widget.id, newLayouts)
                          }
                          draggableHandle=".child-drag-handle"
                          compactType="vertical"
                          preventCollision={false}
                          isResizable={true}
                          isDraggable={true}
                          margin={[4, 4] as [number, number]}
                          containerPadding={[4, 4] as [number, number]}
                        >
                          {children.map((child) => {
                            const childDef = getWidgetType(child.type);
                            const isChildSelected = selectedWidgetId === child.id;
                            const ChildIcon = childDef?.icon;

                            return (
                              <div
                                key={child.id}
                                data-widget-id={child.id}
                                className={`group/child relative flex flex-col overflow-hidden rounded border-2 bg-card shadow-sm transition-all ${
                                  isChildSelected
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-transparent hover:border-muted-foreground/30"
                                }`}
                                onClick={(e) => handleChildWidgetClick(widget.id, child.id, e)}
                              >
                                <div className="child-drag-handle flex cursor-grab items-center justify-between border-b bg-muted/20 px-1.5 py-0.5 active:cursor-grabbing">
                                  <div className="flex items-center gap-1 overflow-hidden">
                                    <GripVertical className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground" />
                                    <span className="truncate text-[10px] font-medium">{resolveLabel(child.title, locale)}</span>
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                                      {child.type}
                                    </span>
                                    <button
                                      className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover/child:opacity-100"
                                      onClick={(e) => handleRemoveChildWidget(widget.id, child.id, e)}
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-1 items-center justify-center p-1">
                                  <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                                    {ChildIcon && <ChildIcon className="h-4 w-4" />}
                                    <span className="text-[10px]">{childDef?.label ?? child.type}</span>
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

              if (isConditionalSlot) {
                const children = widget.children ?? [];

                return (
                  <div
                    key={widget.id}
                    data-widget-id={widget.id}
                    className={`group/slot relative flex flex-col overflow-hidden rounded-lg border-2 bg-card shadow-sm transition-all ${
                      selectedCardId === widget.id
                        ? "border-purple-400 ring-2 ring-purple-200"
                        : isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                    }`}
                    onClick={(e) => handleWidgetClick(widget.id, e)}
                  >
                    {/* Conditional Slot Header (drag handle) */}
                    <div className="drag-handle flex cursor-grab items-center justify-between border-b bg-muted/30 px-2 py-1 active:cursor-grabbing">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        <Layers className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate text-xs font-medium">
                          {resolveLabel(widget.title, locale)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasConditions && (
                          <span className="flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-700">
                            <Eye className="h-2.5 w-2.5" />
                            {tb("conditional")}
                          </span>
                        )}
                        <span className="rounded bg-purple-100 px-1 py-0.5 text-[10px] text-purple-700">
                          conditional-slot
                        </span>
                        <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                          {tb("slotCount", { count: children.length })}
                        </span>
                        <button
                          className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover/slot:opacity-100"
                          onClick={(e) => handleRemoveWidget(widget.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Slot List */}
                    <div className="flex-1 overflow-auto p-2">
                      {children.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          {tb("emptyConditionalSlot")}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {children.map((child) => {
                            const childDef = getWidgetType(child.type);
                            const isChildSelected = selectedWidgetId === child.id;
                            const ChildIcon = childDef?.icon;
                            const childHasConditions = (child.conditions?.rules?.length ?? 0) > 0;

                            return (
                              <div
                                key={child.id}
                                data-widget-id={child.id}
                                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 transition-all ${
                                  isChildSelected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                    : "border-muted hover:border-muted-foreground/30 hover:bg-muted/30"
                                }`}
                                onClick={(e) => handleChildWidgetClick(widget.id, child.id, e)}
                              >
                                {ChildIcon && <ChildIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />}
                                <span className="flex-1 truncate text-xs font-medium">
                                  {resolveLabel(child.title, locale)}
                                </span>
                                <div className="flex items-center gap-1">
                                  {childHasConditions ? (
                                    <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-700">
                                      {tb("conditional")}
                                    </span>
                                  ) : (
                                    <span className="rounded bg-gray-100 px-1 py-0.5 text-[9px] text-gray-500">
                                      {tb("slotFallback")}
                                    </span>
                                  )}
                                  <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                                    {child.type}
                                  </span>
                                  <button
                                    className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover/slot:opacity-100"
                                    onClick={(e) => handleRemoveChildWidget(widget.id, child.id, e)}
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="mt-2 text-center text-[10px] text-muted-foreground">
                        {tb("addSlotHint")}
                      </div>
                    </div>
                  </div>
                );
              }

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
                      <span className="truncate text-xs font-medium">{resolveLabel(widget.title, locale)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasConditions && (
                        <span className="flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-700">
                          <Eye className="h-2.5 w-2.5" />
                          {tb("conditional")}
                        </span>
                      )}
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
                      {Icon && <Icon className={isFilter || isForm ? "h-4 w-4" : "h-6 w-6"} />}
                      <span className="text-xs">{widgetDef?.label ?? widget.type}</span>
                      {isFilter && filterKey && (
                        <span className="text-[10px] text-muted-foreground/60">filterKey: {filterKey}</span>
                      )}
                      {isForm && formId && (
                        <span className="text-[10px] text-muted-foreground/60">formId: {formId}</span>
                      )}
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
