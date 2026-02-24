"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Widget } from "@/src/entities/dashboard";
import { resolveLabel, evaluateConditions } from "@/src/shared/lib";
import { WidgetRenderer } from "./WidgetRenderer";
import type { FormManagerReturn } from "@/src/features/dashboard-form";

interface FilterSubmitProps {
  applyFilters: () => void;
  hasPendingChanges: boolean;
}

interface ConditionalSlotWidgetProps {
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

const getShadowStyle = (shadow?: string) => {
  switch (shadow) {
    case "none": return "none";
    case "sm": return "0 1px 2px 0 rgb(0 0 0 / 0.05)";
    case "md": return "0 4px 6px -1px rgb(0 0 0 / 0.1)";
    case "lg": return "0 10px 15px -3px rgb(0 0 0 / 0.1)";
    default: return "0 1px 2px 0 rgb(0 0 0 / 0.05)";
  }
};

export function ConditionalSlotWidget({
  widget,
  filterValues,
  appliedFilterValues,
  onFilterChange,
  formManager,
  dataSources,
  filterSubmitProps,
}: ConditionalSlotWidgetProps) {
  const locale = useLocale();
  const tb = useTranslations("builder");
  const allChildren = widget.children ?? [];

  const activeChild = useMemo(() => {
    if (allChildren.length === 0) return null;
    if (!filterValues) return allChildren[0];

    // 조건이 있는 자식 중 첫 매칭
    const withConditions = allChildren.filter(
      (c) => c.conditions?.rules?.length
    );
    const matched = withConditions.find((c) =>
      evaluateConditions(c.conditions, filterValues)
    );
    if (matched) return matched;

    // fallback: 조건 없는 첫 자식
    const fallback = allChildren.find(
      (c) => !c.conditions?.rules?.length
    );
    return fallback ?? null;
  }, [allChildren, filterValues]);

  const style = widget.style ?? {};

  if (!activeChild) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          backgroundColor: style.backgroundColor ?? "#ffffff",
          borderRadius: style.borderRadius ?? 8,
          boxShadow: getShadowStyle(style.shadow),
        }}
      >
        <span className="text-sm text-muted-foreground">
          {tb("emptyConditionalSlot")}
        </span>
      </div>
    );
  }

  const isFilter = activeChild.type.startsWith("filter-");

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        backgroundColor: style.backgroundColor ?? "#ffffff",
        borderRadius: style.borderRadius ?? 8,
        boxShadow: getShadowStyle(style.shadow),
      }}
    >
      {/* 활성 자식의 헤더 — 필터는 헤더 생략 */}
      {!isFilter && (
        <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
          <span className="text-sm font-medium">
            {resolveLabel(activeChild.title, locale)}
          </span>
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {activeChild.type}
          </span>
        </div>
      )}

      {/* 활성 자식 렌더링 */}
      <div className="flex-1 overflow-hidden">
        <WidgetRenderer
          widget={activeChild}
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
}
