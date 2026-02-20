"use client";

import { X } from "lucide-react";
import { useBuilderStore } from "@/src/features/dashboard-builder/model/builder.store";
import { WIDGET_TYPES, type WidgetTypeDefinition } from "@/src/entities/widget";

export function WidgetPalette() {
  const { addWidget, addChildWidget, selectedCardId, selectCard, schema } = useBuilderStore();

  // selectedCardId가 있으면 Card 이름 찾기
  const selectedCard = selectedCardId
    ? schema.widgets.find((w) => w.id === selectedCardId)
    : null;

  const handleAddWidget = (widgetDef: WidgetTypeDefinition) => {
    const isFilter = widgetDef.category === "filter";

    // Card가 선택되어 있으면 자식으로 추가
    if (selectedCardId && selectedCard) {
      const children = selectedCard.children ?? [];
      const cardCols = selectedCard.layout.w;

      // Card 내부 cols에 비례하여 기본 크기 스케일링 (24-col 기준 → cardCols 기준)
      const scaledW = Math.max(
        widgetDef.minSize.w,
        Math.min(Math.round((widgetDef.defaultSize.w / 24) * cardCols), cardCols)
      );
      const h = widgetDef.defaultSize.h;

      // compactType="vertical"이므로 x만 적절히 잡으면 자동 배치
      // 같은 행에서 빈 x 위치 탐색
      const maxY = children.reduce((max, c) => Math.max(max, c.layout.y + c.layout.h), 0);
      let bestX = 0;
      let bestY = maxY; // 기본: 맨 아래

      // 기존 행들에서 빈 공간 찾기
      for (let y = 0; y <= maxY; y++) {
        for (let x = 0; x <= cardCols - scaledW; x++) {
          const fits = !children.some(
            (c) => c.layout.x < x + scaledW && c.layout.x + c.layout.w > x && c.layout.y < y + h && c.layout.y + c.layout.h > y
          );
          if (fits) {
            bestX = x;
            bestY = y;
            y = maxY + 1; // 바깥 루프 탈출
            break;
          }
        }
      }

      addChildWidget(selectedCardId, {
        type: widgetDef.type,
        title: `${widgetDef.label} ${children.length + 1}`,
        layout: {
          x: bestX,
          y: bestY,
          w: scaledW,
          h,
          minW: widgetDef.minSize.w,
          minH: widgetDef.minSize.h,
        },
        style: isFilter
          ? { backgroundColor: "transparent", borderRadius: 0, padding: 0, shadow: "none" }
          : {},
        options: widgetDef.defaultOptions,
      });
      return;
    }

    // 최상위에 추가
    const maxY = schema.widgets.reduce((max, w) => {
      return Math.max(max, w.layout.y + w.layout.h);
    }, 0);

    addWidget({
      type: widgetDef.type,
      title: `${widgetDef.label} ${schema.widgets.length + 1}`,
      layout: {
        x: 0,
        y: maxY,
        w: widgetDef.defaultSize.w,
        h: widgetDef.defaultSize.h,
        minW: widgetDef.minSize.w,
        minH: widgetDef.minSize.h,
      },
      style: isFilter
        ? { backgroundColor: "transparent", borderRadius: 0, padding: 0, shadow: "none" }
        : { backgroundColor: "#ffffff", borderRadius: 8, padding: 16, shadow: "sm" },
      options: widgetDef.defaultOptions,
    });
  };

  const categories = [
    { key: "container", label: "Containers" },
    { key: "filter", label: "Filters" },
    { key: "form", label: "Forms" },
    { key: "card", label: "Cards" },
    { key: "chart", label: "Charts" },
    { key: "table", label: "Tables" },
    { key: "map", label: "Maps" },
    { key: "status", label: "Status" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Card 선택 컨텍스트 표시 */}
      {selectedCardId && selectedCard && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <span className="text-xs font-medium text-blue-700">
            [{selectedCard.title}]에 추가 중
          </span>
          <button
            onClick={() => selectCard(null)}
            className="rounded p-0.5 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {categories.map((category) => {
        let categoryWidgets = WIDGET_TYPES.filter((w) => w.category === category.key);

        // Card 내부에 추가할 때는 card 타입(컨테이너) 숨김 (중첩 불가)
        if (selectedCardId) {
          categoryWidgets = categoryWidgets.filter((w) => w.type !== "card");
        }

        if (categoryWidgets.length === 0) return null;

        return (
          <div key={category.key}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category.label}
            </h3>
            <div className="space-y-2">
              {categoryWidgets.map((widgetDef) => {
                const Icon = widgetDef.icon;
                return (
                  <button
                    key={widgetDef.type}
                    onClick={() => handleAddWidget(widgetDef)}
                    className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-accent"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-medium">{widgetDef.label}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {widgetDef.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
