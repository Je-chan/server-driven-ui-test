/**
 * SelectFilterWidget — 단일 선택 드롭다운 필터.
 *
 * 가장 기본적인 필터 위젯. <select> 요소로 선택지 중 하나를 고를 수 있다.
 * 선택 시 onFilterChange(filterKey, selectedValue)를 호출하여
 * useFilterValues 훅의 setFilterValue를 트리거한다.
 *
 * 추가 기능:
 * - dependsOn: 부모 필터 값에 따라 선택지(options)가 동적으로 변경
 *   예: 발전소 필터(부모) → 인버터 필터(자식)의 선택지가 바뀜
 * - fixedValue: 관리자가 잠근 값 — 사용자 변경 불가 (disabled)
 * - resolveLabel: 다국어 라벨 지원 (I18nLabel)
 * - dataSourceId: API에서 옵션을 동적으로 로드
 *   valueField/labelField로 응답 데이터를 { value, label } 매핑
 *
 * 스키마 예시:
 * { type: "filter-select", options: { filterKey: "selectedSite", options: [...], dependsOn: { ... } } }
 */
"use client";

import { ListFilter, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel } from "@/src/shared/lib";
import { useFilterOptions } from "@/src/shared/api";
import type { Widget } from "@/src/entities/dashboard";

interface SelectFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

export function SelectFilterWidget({ widget, filterValues, onFilterChange }: SelectFilterWidgetProps) {
  const locale = useLocale();
  const t = useTranslations("common");

  const opts = widget.options as {
    filterKey?: string;
    options?: { value: string; label: string }[];
    placeholder?: string;
    visible?: boolean;
    fixedValue?: unknown;
    dependsOn?: {
      filterKey: string;
      optionsMap?: Record<string, { value: string; label: string }[]>;
    };
    dataSourceId?: string;
    valueField?: string;
    labelField?: string;
    dependsOnParamKey?: string;
  } | undefined;

  const filterKey = opts?.filterKey ?? "";
  const fixedValue = opts?.fixedValue;
  const isFixed = fixedValue !== undefined && fixedValue !== null;
  const currentValue = String(filterValues[filterKey] ?? "");

  // 동적 필터 옵션: dataSourceId가 있으면 API에서 로드
  const dependsOnParam = (() => {
    if (!opts?.dependsOn?.filterKey || !opts?.dependsOnParamKey) return undefined;
    const parentValue = String(filterValues[opts.dependsOn.filterKey] ?? "");
    if (!parentValue) return undefined;
    return { key: opts.dependsOnParamKey, value: parentValue };
  })();

  const { data: apiOptions, isLoading: isLoadingOptions } = useFilterOptions({
    dataSourceId: opts?.dataSourceId ?? "",
    valueField: opts?.valueField,
    labelField: opts?.labelField,
    dependsOnParam,
    enabled: !!opts?.dataSourceId,
  });

  // 옵션 결정 우선순위: API 옵션 > dependsOn optionsMap > 정적 옵션
  let options = opts?.options ?? [];
  if (opts?.dataSourceId && apiOptions) {
    options = apiOptions;
  } else if (opts?.dependsOn?.optionsMap) {
    const parentValue = String(filterValues[opts.dependsOn.filterKey] ?? "");
    if (parentValue && opts.dependsOn.optionsMap[parentValue]) {
      options = opts.dependsOn.optionsMap[parentValue];
    }
  }

  if (!filterKey) {
    return (
      <div className="flex h-full items-center gap-2 px-3 text-muted-foreground">
        <ListFilter className="h-4 w-4" />
        <span className="text-xs">{t("setFilterKey")}</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-1 px-3">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
        {resolveLabel(widget.title, locale)}
      </label>
      <div className="relative">
        <select
          value={currentValue}
          onChange={(e) => onFilterChange(filterKey, e.target.value)}
          disabled={isFixed || isLoadingOptions}
          className="h-8 w-full rounded-md border border-border/50 bg-card px-2 text-sm shadow-sm transition-colors hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        >
          <option value="">{opts?.placeholder ?? t("select")}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {resolveLabel(opt.label, locale)}
            </option>
          ))}
        </select>
        {isLoadingOptions && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
