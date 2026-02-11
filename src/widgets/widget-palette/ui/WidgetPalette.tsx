"use client";

import { useBuilderStore } from "@/src/features/dashboard-builder/model/builder.store";
import { WIDGET_TYPES, type WidgetTypeDefinition } from "@/src/entities/widget";

export function WidgetPalette() {
  const { addWidget, schema } = useBuilderStore();

  const handleAddWidget = (widgetDef: WidgetTypeDefinition) => {
    // 새 위젯의 y 위치 계산 (기존 위젯들 아래에 배치)
    const maxY = schema.widgets.reduce((max, w) => {
      return Math.max(max, w.layout.y + w.layout.h);
    }, 0);

    const isFilter = widgetDef.category === "filter";

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
    { key: "filter", label: "Filters" },
    { key: "card", label: "Cards" },
    { key: "chart", label: "Charts" },
    { key: "table", label: "Tables" },
    { key: "map", label: "Maps" },
    { key: "status", label: "Status" },
  ] as const;

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const widgets = WIDGET_TYPES.filter((w) => w.category === category.key);
        if (widgets.length === 0) return null;

        return (
          <div key={category.key}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category.label}
            </h3>
            <div className="space-y-2">
              {widgets.map((widgetDef) => {
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
