/**
 * useFilterValues — 대시보드 필터 시스템의 핵심 상태 관리 훅.
 *
 * Server-Driven UI에서 필터 위젯(filter-*)과 데이터 위젯 사이의
 * 데이터 흐름을 관리하는 중심 허브 역할을 한다.
 *
 * ┌──────────────┐    setFilterValue     ┌──────────────┐
 * │ Filter Widget │ ──────────────────▶  │ pendingValues │
 * │ (filter-*)    │                      │ (UI 즉시반영)  │
 * └──────────────┘                       └──────┬───────┘
 *                                               │
 *                          ┌────────────────────┼────────────────────┐
 *                          │ auto 모드           │ manual 모드         │
 *                          │ 즉시 URL 기록       │ "조회" 버튼 클릭 시  │
 *                          └────────┬───────────┴────────┬───────────┘
 *                                   ▼                    ▼
 *                            ┌──────────────┐     ┌──────────────┐
 *                            │ URL Params   │     │ applyFilters │
 *                            │ (SearchParams)│     └──────┬───────┘
 *                            └──────┬───────┘            │
 *                                   ▼                    ▼
 *                            ┌──────────────────────────────┐
 *                            │ appliedValues (URL에서 역직렬화) │
 *                            └──────────────┬───────────────┘
 *                                           ▼
 *                            ┌──────────────────────────────┐
 *                            │ DataWidgetRenderer            │
 *                            │ resolveTemplateParams() 호출   │
 *                            │ → {{filter.xxx}} 치환         │
 *                            │ → useWidgetData() 리페치      │
 *                            └──────────────────────────────┘
 *
 * 주요 기능:
 * - 이중 상태 관리: pendingValues(UI 반영) / appliedValues(데이터 페칭)
 * - URL 동기화: 필터 상태를 SearchParams에 저장 (북마크/공유 가능)
 * - queueMicrotask 배치: DatepickerFilterWidget의 연속 호출을 하나의 URL 업데이트로 병합
 * - 의존 필터: 부모 필터 변경 시 자식 필터 값 자동 리셋 (dependsOn)
 * - 고정값(fixedValue): 관리자가 잠근 필터는 변경 불가
 * - auto/manual 모드: filter-submit 위젯 유무로 자동 결정
 *
 * 사용처:
 * - DashboardViewerPage: 뷰어에서 필터 상태 관리
 * - PresentationPage: 발표 모드에서 필터 상태 관리
 */
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

/**
 * 위젯 스키마에서 추출한 개별 필터 설정.
 * filter-* 위젯의 options 필드에서 꺼낸 정보를 정규화한 형태.
 */
interface FilterConfig {
  filterKey: string;                                          // 필터 값을 저장할 키 (filterValues[filterKey])
  label: I18nLabel;                                           // 필터 표시 라벨 (다국어)
  type: string;                                               // 위젯 타입 (filter-select, filter-datepicker 등)
  defaultValue?: unknown;                                     // 초기값
  outputKeys?: { start: string; end: string };                // datepicker 전용: 시작/종료 시간을 별도 키로 출력
  presets?: string[];                                         // datepicker 전용: 날짜 프리셋 목록
  options?: { value: string; label: string }[];               // select/tab 등의 선택지 목록
  fixedValue?: unknown;                                       // 고정값 — 설정 시 필터 변경 불가
  visible?: boolean;                                          // 필터 표시 여부 (false면 숨김)
  dependsOn?: {                                               // 의존 필터 설정
    filterKey: string;                                        //   부모 필터의 filterKey
    optionsMap: Record<string, { value: string; label: string }[]>;  // 부모 값 → 자식 선택지 매핑
  };
}

/**
 * 개별 필터의 런타임 상태.
 * SelectFilterWidget 등이 getFilterState()를 호출하여
 * 자신이 비활성화 상태인지, 옵션이 오버라이드되었는지 확인한다.
 */
export interface FilterState {
  disabled: boolean;                                         // true면 필터 UI 비활성화 (의존 부모 값 없음)
  overrideOptions: { value: string; label: string }[] | null; // 부모 값에 의해 변경된 선택지 (dependsOn)
}

/**
 * widgets 배열에서 filter-* 타입 위젯을 찾아 FilterConfig로 변환.
 * 위젯의 options 필드에서 filterKey, defaultValue, dependsOn 등을 추출한다.
 * filterKey가 비어있는 위젯은 설정 미완료로 판단하여 제외.
 */
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

/**
 * 날짜 프리셋 문자열("today", "last7days" 등)을 실제 날짜 범위로 변환.
 * filter-datepicker의 프리셋 버튼 클릭 시 사용.
 * formatLocalDate()로 로컬 타임존 기반의 ISO 문자열을 생성한다.
 */
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

/**
 * 모든 필터의 초기값을 계산.
 * - fixedValue가 있으면 고정값 사용 (변경 불가)
 * - datepicker는 프리셋 문자열을 실제 날짜 범위로 변환
 * - 그 외는 defaultValue를 그대로 사용
 *
 * 결과 예시:
 * { selectedSite: "site_001", startTime: "2026-02-27...", endTime: "2026-02-27...", __preset_timeRange: "today" }
 */
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

/**
 * fixedValue가 설정된 필터의 모든 관련 키를 수집.
 * setFilterValue()에서 이 키들은 변경을 거부한다.
 * datepicker는 outputKeys(start/end)도 고정 대상에 포함.
 */
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

/**
 * 대시보드 필터 상태를 관리하는 메인 훅.
 *
 * @param widgets    - 대시보드의 전체 위젯 배열 (filter-* 위젯을 자동 추출)
 * @param filterMode - 필터 모드 오버라이드 ("auto" | "manual"). 미지정 시 filter-submit 위젯 유무로 자동 판단.
 *
 * @returns
 * - filterValues: 현재 필터 값 (pendingValues — UI에 즉시 반영)
 * - appliedValues: 적용된 필터 값 (URL에서 역직렬화 — 데이터 위젯이 참조)
 * - setFilterValue: 필터 값 변경 함수 (auto면 즉시 URL 반영, manual이면 pending만 갱신)
 * - applyFilters: manual 모드에서 "조회" 버튼 클릭 시 호출 → pending을 URL에 기록
 * - hasPendingChanges: pending ≠ applied인지 여부 (조회 버튼 활성화 조건)
 * - hasFilterSubmitWidget: filter-submit 위젯 존재 여부
 * - getFilterState: 특정 필터의 disabled/overrideOptions 상태 조회
 */
export function useFilterValues(widgets: Widget[], filterMode?: "auto" | "manual") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ── 초기 설정 계산 (모두 useMemo로 캐싱) ──
  const configs = useMemo(() => extractFilterConfigs(widgets), [widgets]);
  const initialValues = useMemo(() => computeInitialValues(configs), [configs]);
  const fixedKeys = useMemo(() => getFixedKeys(configs), [configs]);
  const allFilterKeys = useMemo(() => collectAllFilterKeys(configs), [configs]);
  const arrayKeys = useMemo(() => collectArrayKeys(configs), [configs]);

  // filter-submit 위젯이 있으면 manual 모드로 전환
  const hasFilterSubmitWidget = useMemo(
    () => widgets.some((w) => w.type === "filter-submit"),
    [widgets]
  );

  const isManual = hasFilterSubmitWidget || filterMode === "manual";

  // ── appliedValues: URL SearchParams에서 역직렬화한 "확정된" 필터 값 ──
  // DataWidgetRenderer는 이 값으로 resolveTemplateParams()를 호출한다.
  // fixedValue가 설정된 필터는 URL 값과 관계없이 항상 고정값으로 덮어쓴다.
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

  // ── pendingValues: UI에 즉시 반영되는 "임시" 필터 값 ──
  // 사용자가 필터를 조작하면 pendingValues가 먼저 바뀌고,
  // auto 모드에서는 즉시 URL에 기록 → appliedValues도 갱신,
  // manual 모드에서는 "조회" 버튼 클릭 시에만 URL에 기록.
  const [pendingValues, setPendingValues] = useState<Record<string, unknown>>(appliedValues);

  // appliedValues가 변경되면 pendingValues 동기화 (URL 직접 변경, 뒤로가기 등)
  const prevAppliedRef = useRef(appliedValues);
  useEffect(() => {
    if (prevAppliedRef.current !== appliedValues) {
      prevAppliedRef.current = appliedValues;
      setPendingValues(appliedValues);
    }
  }, [appliedValues]);

  // ── URL 업데이트 배치 처리 (queueMicrotask) ──
  // DatepickerFilterWidget은 프리셋 클릭 시 startTime, endTime, __preset를
  // 연속 3번 onFilterChange()를 호출한다. 이를 하나의 URL 업데이트로 병합하기 위해
  // queueMicrotask를 사용한 마이크로태스크 배치 패턴을 적용한다.
  //
  // 호출 흐름:
  // 1. setFilterValue("startTime", "2026-02-27") → scheduleUrlUpdate(values)
  // 2. setFilterValue("endTime", "2026-02-27")   → scheduleUrlUpdate(values) — ref 덮어쓰기만
  // 3. setFilterValue("__preset_timeRange", "today") → scheduleUrlUpdate(values) — ref 덮어쓰기만
  // 4. 마이크로태스크 큐 실행 → flushUrlUpdate() → router.replace() 1회만 호출
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

  // ── 의존 필터(dependsOn) 연쇄 리셋 ──
  // 부모 필터 값이 변경되면, 해당 부모에 의존하는 자식 필터의 값을
  // 새로운 옵션 목록의 첫 번째 항목으로 자동 리셋한다.
  // 예: "발전소" 필터 변경 → "인버터" 필터의 선택지가 바뀌고 첫 항목으로 리셋
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

  /**
   * 필터 값 변경 — 각 필터 위젯의 onChange에서 호출.
   * 1. fixedValue 필터는 변경 거부
   * 2. 의존 필터 연쇄 리셋 실행
   * 3. auto 모드: 즉시 URL에 기록 (→ appliedValues 갱신 → 데이터 위젯 리페치)
   * 4. manual 모드: pendingValues만 갱신 (→ 조회 버튼 클릭 시 URL 기록)
   */
  const setFilterValue = useCallback(
    (key: string, value: unknown) => {
      // fixedValue가 설정된 키는 변경 불가
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

  /** manual 모드에서 "조회" 버튼(FilterSubmitWidget) 클릭 시 호출.
   *  pendingValues를 URL에 기록하여 appliedValues로 확정한다. */
  const applyFilters = useCallback(() => {
    scheduleUrlUpdate(pendingValues);
  }, [pendingValues, scheduleUrlUpdate]);

  /**
   * 특정 필터의 런타임 상태를 계산 (dependsOn 기반).
   * - 부모 필터 값이 없으면 disabled: true
   * - 부모 값에 대응하는 옵션이 있으면 overrideOptions로 반환
   * SelectFilterWidget 등이 이 함수로 자신의 상태를 조회한다.
   */
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
