/**
 * ConditionalSlotWidget — 조건부 렌더링 컨테이너 위젯.
 *
 * 여러 자식 위젯(children[])을 보유하고, 현재 필터 값(filterValues)에 따라
 * 조건에 맞는 **하나의 자식만 렌더링**한다.
 *
 * 동작 흐름:
 * 1. children 배열이 비어있으면 → "빈 슬롯" 플레이스홀더 표시
 * 2. filterValues가 없으면 → 첫 번째 자식 렌더링 (빌더 미리보기 용도)
 * 3. conditions가 있는 자식들을 순회하며 evaluateConditions()로 매칭 검사
 * 4. 첫 번째 매칭 자식을 activeChild로 선택
 * 5. 매칭 없으면 → 조건이 없는 첫 자식(폴백)을 선택
 * 6. activeChild를 WidgetRenderer로 실제 렌더링
 *
 * 스키마 예시:
 * {
 *   "type": "conditional-slot",
 *   "children": [
 *     { "type": "line-chart", "conditions": { "logic": "and", "rules": [{ "variable": "viewMode", "operator": "eq", "value": "detail" }] } },
 *     { "type": "kpi-card" }  // conditions 없음 → 폴백
 *   ]
 * }
 */
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
  widget: Widget;                                    // conditional-slot 위젯 스키마
  canvasWidth: number;
  rowHeight: number;
  cols: number;
  filterValues?: Record<string, unknown>;            // 현재 필터 값 (조건 평가에 사용)
  appliedFilterValues?: Record<string, unknown>;     // 적용된 필터 값 (데이터 위젯에 전달)
  onFilterChange?: (key: string, value: unknown) => void;
  formManager?: FormManagerReturn;
  dataSources?: Record<string, unknown>[];
  filterSubmitProps?: FilterSubmitProps;
}

/** 위젯 스타일의 shadow 값을 CSS box-shadow 문자열로 변환 */
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

  /**
   * 활성 자식 결정 로직 (조건부 렌더링의 핵심):
   *
   * 우선순위:
   * 1. 조건이 있는 자식 중 filterValues와 매칭되는 첫 번째 자식
   * 2. 조건이 없는 첫 번째 자식 (폴백/기본값 역할)
   * 3. 아무것도 없으면 null (빈 슬롯 표시)
   */
  const activeChild = useMemo(() => {
    if (allChildren.length === 0) return null;
    // 빌더에서 filterValues가 없을 때는 첫 자식을 미리보기로 표시
    if (!filterValues) return allChildren[0];

    // Step 1: 조건이 설정된 자식들만 필터링
    const withConditions = allChildren.filter(
      (c) => c.conditions?.rules?.length
    );
    // Step 2: evaluateConditions로 filterValues와 대조하여 첫 매칭 찾기
    const matched = withConditions.find((c) =>
      evaluateConditions(c.conditions, filterValues)
    );
    if (matched) return matched;

    // Step 3: 매칭 없으면 조건이 없는 자식(폴백)을 선택
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
