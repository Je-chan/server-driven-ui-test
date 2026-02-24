"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { Widget } from "@/src/entities/dashboard";
import {
  formatLocalDate,
  serializeFiltersToParams,
  deserializeParamsToFilters,
} from "@/src/shared/lib";
import type { I18nLabel } from "@/src/shared/lib";

interface FilterConfig {
  filterKey: string;
  label: I18nLabel;
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

/** 모든 필터 관련 URL 키를 수집 */
function collectAllFilterKeys(configs: FilterConfig[]): Set<string> {
  const keys = new Set<string>();
  for (const config of configs) {
    keys.add(config.filterKey);
    if (config.type === "filter-datepicker") {
      const outputKeys = config.outputKeys ?? { start: "startTime", end: "endTime" };
      keys.add(outputKeys.start);
      keys.add(outputKeys.end);
      keys.add(`__preset_${config.filterKey}`);
    }
  }
  return keys;
}

/** multi-select 필터의 키를 수집 (URL 역직렬화 시 배열로 복원) */
function collectArrayKeys(configs: FilterConfig[]): Set<string> {
  const keys = new Set<string>();
  for (const config of configs) {
    if (config.type === "filter-multiselect") {
      keys.add(config.filterKey);
    }
  }
  return keys;
}

export function useFilterValues(widgets: Widget[], filterMode?: "auto" | "manual") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const configs = useMemo(() => extractFilterConfigs(widgets), [widgets]);
  const initialValues = useMemo(() => computeInitialValues(configs), [configs]);
  const fixedKeys = useMemo(() => getFixedKeys(configs), [configs]);
  const allFilterKeys = useMemo(() => collectAllFilterKeys(configs), [configs]);
  const arrayKeys = useMemo(() => collectArrayKeys(configs), [configs]);

  const hasFilterSubmitWidget = useMemo(
    () => widgets.some((w) => w.type === "filter-submit"),
    [widgets]
  );

  const isManual = hasFilterSubmitWidget || filterMode === "manual";

  // URL에서 appliedValues 역직렬화 (fixedValue 우선)
  const appliedValues = useMemo(() => {
    const urlValues = deserializeParamsToFilters(searchParams, arrayKeys);

    // URL에 필터 파라미터가 하나도 없으면 defaults 사용
    const hasAnyFilterParam = Array.from(allFilterKeys).some((key) =>
      searchParams.has(key)
    );

    const base = hasAnyFilterParam ? { ...initialValues, ...urlValues } : { ...initialValues };

    // fixedValue 항상 우선
    for (const config of configs) {
      if (config.fixedValue !== undefined && config.fixedValue !== null) {
        if (config.type === "filter-datepicker") {
          const outputKeys = config.outputKeys ?? { start: "startTime", end: "endTime" };
          if (typeof config.fixedValue === "string") {
            const range = getDatePresetRange(config.fixedValue);
            base[outputKeys.start] = range.start;
            base[outputKeys.end] = range.end;
            base[`__preset_${config.filterKey}`] = config.fixedValue;
          }
        } else {
          base[config.filterKey] = config.fixedValue;
        }
      }
    }

    return base;
  }, [searchParams, arrayKeys, allFilterKeys, initialValues, configs]);

  // pending: FilterBar UI에 반영되는 값
  const [pendingValues, setPendingValues] = useState<Record<string, unknown>>(appliedValues);

  // appliedValues가 변경되면 pendingValues 동기화 (URL 직접 변경 등)
  const prevAppliedRef = useRef(appliedValues);
  useEffect(() => {
    if (prevAppliedRef.current !== appliedValues) {
      prevAppliedRef.current = appliedValues;
      setPendingValues(appliedValues);
    }
  }, [appliedValues]);

  // URL 업데이트 배치 처리 (DatepickerFilterWidget의 연속 호출 대응)
  const pendingUrlUpdateRef = useRef<Record<string, unknown> | null>(null);
  const urlUpdateScheduledRef = useRef(false);

  const flushUrlUpdate = useCallback(() => {
    urlUpdateScheduledRef.current = false;
    const valuesToWrite = pendingUrlUpdateRef.current;
    if (!valuesToWrite) return;
    pendingUrlUpdateRef.current = null;

    const filterParams = serializeFiltersToParams(valuesToWrite);

    // 비필터 URL 파라미터 보존
    const newParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (!allFilterKeys.has(key)) {
        newParams.set(key, value);
      }
    });
    filterParams.forEach((value, key) => {
      newParams.set(key, value);
    });

    const qs = newParams.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, allFilterKeys, pathname, router]);

  const scheduleUrlUpdate = useCallback(
    (values: Record<string, unknown>) => {
      pendingUrlUpdateRef.current = values;
      if (!urlUpdateScheduledRef.current) {
        urlUpdateScheduledRef.current = true;
        queueMicrotask(flushUrlUpdate);
      }
    },
    [flushUrlUpdate]
  );

  // 초기 로드 시 URL에 필터 파라미터가 없으면 defaults를 URL에 기록
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const hasAnyFilterParam = Array.from(allFilterKeys).some((key) =>
      searchParams.has(key)
    );
    if (!hasAnyFilterParam) {
      scheduleUrlUpdate(initialValues);
    }
  }, [allFilterKeys, searchParams, initialValues, scheduleUrlUpdate]);

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

      setPendingValues((prev) => {
        const next = resetDependentFilters(key, { ...prev, [key]: value });

        // auto 모드: 즉시 URL 업데이트
        if (!isManual) {
          scheduleUrlUpdate(next);
        }

        return next;
      });
    },
    [fixedKeys, resetDependentFilters, isManual, scheduleUrlUpdate]
  );

  // manual 모드: "조회" 버튼 클릭 시 호출
  const applyFilters = useCallback(() => {
    scheduleUrlUpdate(pendingValues);
  }, [pendingValues, scheduleUrlUpdate]);

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
