"use client";

import { useState, useCallback, useMemo } from "react";
import type { Widget } from "@/src/entities/dashboard";
import { formatLocalDate } from "@/src/shared/lib";

interface FilterConfig {
  filterKey: string;
  label: string;
  type: string;
  defaultValue?: unknown;
  outputKeys?: { start: string; end: string };
  presets?: string[];
  options?: { value: string; label: string }[];
  fixedValue?: unknown;
  visible?: boolean;
  dependsOn?: {
    filterKey: string;
    optionsMap: Record<string, { value: string; label: string }[]>;
  };
}

export interface FilterState {
  disabled: boolean;
  overrideOptions: { value: string; label: string }[] | null;
}

// filter- 위젯에서 필터 설정 추출
function extractFilterConfigs(widgets: Widget[]): FilterConfig[] {
  return widgets
    .filter((w) => w.type.startsWith("filter-"))
    .map((w) => {
      const opts = (w.options ?? {}) as Record<string, unknown>;
      return {
        filterKey: (opts.filterKey as string) ?? "",
        label: w.title,
        type: w.type,
        defaultValue: opts.defaultValue as unknown,
        outputKeys: opts.outputKeys as { start: string; end: string } | undefined,
        presets: opts.presets as string[] | undefined,
        options: opts.options as { value: string; label: string }[] | undefined,
        fixedValue: opts.fixedValue as unknown,
        visible: opts.visible as boolean | undefined,
        dependsOn: opts.dependsOn as FilterConfig["dependsOn"],
      };
    })
    .filter((f) => f.filterKey !== "");
}

function getDatePresetRange(preset: string): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);

  const fmt = formatLocalDate;

  switch (preset) {
    case "today":
      return { start: fmt(today), end: fmt(endOfToday) };
    case "yesterday": {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return { start: fmt(yesterday), end: fmt(today) };
    }
    case "last7days": {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: fmt(weekAgo), end: fmt(endOfToday) };
    }
    case "last30days": {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start: fmt(monthAgo), end: fmt(endOfToday) };
    }
    case "thisMonth":
      return { start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end: fmt(endOfToday) };
    default:
      return { start: fmt(today), end: fmt(endOfToday) };
  }
}

function computeInitialValues(configs: FilterConfig[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const config of configs) {
    // fixedValue가 있는 필터는 고정값 사용
    if (config.fixedValue !== undefined && config.fixedValue !== null) {
      if (config.type === "filter-datepicker") {
        const outputKeys = config.outputKeys ?? { start: "startTime", end: "endTime" };
        if (typeof config.fixedValue === "string") {
          const range = getDatePresetRange(config.fixedValue);
          values[outputKeys.start] = range.start;
          values[outputKeys.end] = range.end;
          values[`__preset_${config.filterKey}`] = config.fixedValue;
        }
      } else {
        values[config.filterKey] = config.fixedValue;
      }
      continue;
    }

    if (config.type === "filter-datepicker") {
      const outputKeys = config.outputKeys ?? { start: "startTime", end: "endTime" };
      const preset = (config.defaultValue as string) ?? "today";
      const range = getDatePresetRange(preset);
      values[outputKeys.start] = range.start;
      values[outputKeys.end] = range.end;
      values[`__preset_${config.filterKey}`] = preset;
    } else {
      if (config.defaultValue !== undefined) {
        values[config.filterKey] = config.defaultValue;
      }
    }
  }

  return values;
}

function getFixedKeys(configs: FilterConfig[]): Set<string> {
  const keys = new Set<string>();
  for (const config of configs) {
    if (config.fixedValue !== undefined && config.fixedValue !== null) {
      keys.add(config.filterKey);
      if (config.type === "filter-datepicker") {
        const outputKeys = config.outputKeys ?? { start: "startTime", end: "endTime" };
        keys.add(outputKeys.start);
        keys.add(outputKeys.end);
      }
    }
  }
  return keys;
}

export function useFilterValues(widgets: Widget[], filterMode?: "auto" | "manual") {
  const configs = useMemo(() => extractFilterConfigs(widgets), [widgets]);
  const initialValues = useMemo(() => computeInitialValues(configs), [configs]);
  const fixedKeys = useMemo(() => getFixedKeys(configs), [configs]);

  const hasFilterSubmitWidget = useMemo(
    () => widgets.some((w) => w.type === "filter-submit"),
    [widgets]
  );

  // pending: FilterBar UI에 반영되는 값
  const [pendingValues, setPendingValues] = useState<Record<string, unknown>>(initialValues);
  // applied: 위젯 데이터 조회에 사용되는 값
  const [appliedValues, setAppliedValues] = useState<Record<string, unknown>>(initialValues);

  const isManual = hasFilterSubmitWidget || filterMode === "manual";

  const updateValues = useCallback(
    (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => {
      setPendingValues((prev) => {
        const next = updater(prev);
        if (!isManual) {
          setAppliedValues(next);
        }
        return next;
      });
    },
    [isManual]
  );

  // 의존 필터의 자식 값 리셋
  const resetDependentFilters = useCallback(
    (changedKey: string, newValues: Record<string, unknown>) => {
      const result = { ...newValues };
      for (const config of configs) {
        if (config.dependsOn?.filterKey === changedKey) {
          const parentValue = String(result[changedKey] ?? "");
          const childOptions = config.dependsOn.optionsMap[parentValue];
          if (childOptions && childOptions.length > 0) {
            result[config.filterKey] = childOptions[0].value;
          } else {
            delete result[config.filterKey];
          }
        }
      }
      return result;
    },
    [configs]
  );

  const setFilterValue = useCallback(
    (key: string, value: unknown) => {
      if (fixedKeys.has(key)) return;

      updateValues((prev) => {
        const next = { ...prev, [key]: value };
        return resetDependentFilters(key, next);
      });
    },
    [updateValues, fixedKeys, resetDependentFilters]
  );

  // manual 모드: "조회" 버튼 클릭 시 호출
  const applyFilters = useCallback(() => {
    setAppliedValues(pendingValues);
  }, [pendingValues]);

  // 각 필터의 상태 계산 (disabled, overrideOptions)
  const getFilterState = useCallback(
    (filterKey: string): FilterState => {
      const config = configs.find((c) => c.filterKey === filterKey);
      if (!config?.dependsOn) {
        return { disabled: false, overrideOptions: null };
      }

      const parentValue = pendingValues[config.dependsOn.filterKey];
      if (parentValue === undefined || parentValue === null || parentValue === "") {
        return { disabled: true, overrideOptions: null };
      }

      const childOptions = config.dependsOn.optionsMap[String(parentValue)];
      if (childOptions) {
        return { disabled: false, overrideOptions: childOptions };
      }

      return { disabled: true, overrideOptions: null };
    },
    [pendingValues, configs]
  );

  const hasPendingChanges = isManual && JSON.stringify(pendingValues) !== JSON.stringify(appliedValues);

  return {
    filterValues: pendingValues,
    appliedValues,
    setFilterValue,
    applyFilters,
    hasPendingChanges,
    hasFilterSubmitWidget,
    getFilterState,
  };
}
