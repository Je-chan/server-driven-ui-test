/**
 * WidgetRenderer — Server-Driven UI의 핵심 렌더링 엔진.
 *
 * JSON 스키마의 위젯 정의(Widget)를 받아 적절한 React 컴포넌트로 렌더링한다.
 * 위젯 타입에 따라 3가지 렌더링 경로로 분기한다:
 *
 * ┌────────────────────────────────────────────────────┐
 * │                  WidgetRenderer                     │
 * │                                                    │
 * │  widget.type 에 따른 분기:                          │
 * │                                                    │
 * │  1. "filter-submit" → FilterSubmitWidget            │
 * │     (조회 버튼, applyFilters 호출)                   │
 * │                                                    │
 * │  2. "filter-*" → renderFilterWidget()               │
 * │     (필터 위젯 — 데이터 페칭 없이 즉시 렌더링)        │
 * │     ├ filter-select    → SelectFilterWidget         │
 * │     ├ filter-multiselect → MultiSelectFilterWidget  │
 * │     ├ filter-treeselect → TreeSelectFilterWidget     │
 * │     ├ filter-input     → InputFilterWidget          │
 * │     ├ filter-tab       → TabFilterWidget            │
 * │     ├ filter-toggle    → ToggleFilterWidget         │
 * │     └ filter-datepicker → DatepickerFilterWidget    │
 * │                                                    │
 * │  3. "form" → FormWidget                             │
 * │     (폼 위젯 — formManager를 통한 폼 상태 관리)      │
 * │                                                    │
 * │  4. 나머지 → DataWidgetRenderer                     │
 * │     (데이터 위젯 — API 호출 + 시각화)                │
 * │     ├ kpi-card   → KpiCardContent                   │
 * │     ├ table      → TableContent                     │
 * │     ├ line-chart → LineChartContent                  │
 * │     └ bar-chart  → BarChartContent                  │
 * └────────────────────────────────────────────────────┘
 *
 * 데이터 위젯의 렌더링 흐름:
 * 1. resolveTemplateParams()로 {{filter.xxx}} 템플릿 치환
 * 2. useWidgetData() 훅으로 API 호출 (TanStack Query)
 * 3. 위젯 타입별 Content 컴포넌트로 시각화
 */
"use client";

import { useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";
import type { Widget } from "@/src/entities/dashboard";
import { resolveTemplateParams, resolveLabel, type I18nLabel } from "@/src/shared/lib";
import { useWidgetData } from "@/src/shared/api";
import {
  SelectFilterWidget,
  MultiSelectFilterWidget,
  TreeSelectFilterWidget,
  InputFilterWidget,
  TabFilterWidget,
  ToggleFilterWidget,
  DatepickerFilterWidget,
  FilterSubmitWidget,
} from "./filters";
import { FormWidget } from "./forms";
import type { FormManagerReturn } from "@/src/features/dashboard-form";

interface FilterSubmitProps {
  applyFilters: () => void;
  hasPendingChanges: boolean;
}

interface WidgetRendererProps {
  widget: Widget;
  filterValues?: Record<string, unknown>;
  appliedFilterValues?: Record<string, unknown>;
  onFilterChange?: (key: string, value: unknown) => void;
  formManager?: FormManagerReturn;
  dataSources?: Record<string, unknown>[];
  filterSubmitProps?: FilterSubmitProps;
}

interface DataResponse {
  success: boolean;
  data: Record<string, unknown>[];
  summary?: Record<string, number>;
  error?: string;
}

/**
 * 메인 위젯 렌더러 — 위젯 타입에 따라 적절한 컴포넌트로 분기.
 *
 * 분기 우선순위:
 * 1. filter-submit → FilterSubmitWidget (조회 버튼)
 * 2. filter-* + onFilterChange → renderFilterWidget (필터 위젯)
 * 3. form + formManager → FormWidget (폼 위젯)
 * 4. 나머지 → DataWidgetRenderer (데이터 위젯 — API 호출 후 시각화)
 *
 * 필터 위젯은 filterValues(pending)를 받고, 데이터 위젯은 appliedFilterValues를 받는다.
 * 이 구분이 auto/manual 모드의 UX 차이를 만든다.
 */
export function WidgetRenderer({ widget, filterValues, appliedFilterValues, onFilterChange, formManager, dataSources, filterSubmitProps }: WidgetRendererProps) {
  const tw = useTranslations("widget");

  // 1단계: filter-submit 위젯은 조회 버튼으로 렌더링
  if (widget.type === "filter-submit") {
    if (filterSubmitProps) {
      return <FilterSubmitWidget widget={widget} {...filterSubmitProps} />;
    }
    return (
      <div className="flex h-full items-center justify-center p-2">
        <div className="flex h-full w-full items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 text-sm text-muted-foreground">
          {tw("submitButton")}
        </div>
      </div>
    );
  }

  // 2단계: 필터 위젯은 데이터 페칭 없이 즉시 렌더링
  // filterValues(pending)를 사용하여 UI에 현재 선택 상태를 즉시 반영
  if (widget.type.startsWith("filter-") && onFilterChange && filterValues) {
    return renderFilterWidget(widget, filterValues, onFilterChange);
  }

  // 3단계: 폼 위젯은 formManager를 통해 렌더링
  if (widget.type === "form" && formManager) {
    return <FormWidget widget={widget} formManager={formManager} />;
  }

  // 4단계: 데이터 위젯 — appliedFilterValues로 API 호출 후 시각화
  // appliedFilterValues를 우선 사용하여 "확정된" 필터 값으로 데이터를 가져온다
  return <DataWidgetRenderer widget={widget} filterValues={appliedFilterValues ?? filterValues} dataSources={dataSources} />;
}

/**
 * 필터 위젯 타입별 분기 — switch 문으로 적절한 필터 컴포넌트 렌더링.
 * 각 필터 위젯은 filterValues에서 자신의 filterKey에 해당하는 값을 읽고,
 * 사용자 조작 시 onFilterChange(filterKey, newValue)를 호출한다.
 */
function renderFilterWidget(
  widget: Widget,
  filterValues: Record<string, unknown>,
  onFilterChange: (key: string, value: unknown) => void,
) {
  switch (widget.type) {
    case "filter-select":
      return <SelectFilterWidget widget={widget} filterValues={filterValues} onFilterChange={onFilterChange} />;
    case "filter-multiselect":
      return <MultiSelectFilterWidget widget={widget} filterValues={filterValues} onFilterChange={onFilterChange} />;
    case "filter-treeselect":
      return <TreeSelectFilterWidget widget={widget} filterValues={filterValues} onFilterChange={onFilterChange} />;
    case "filter-input":
      return <InputFilterWidget widget={widget} filterValues={filterValues} onFilterChange={onFilterChange} />;
    case "filter-tab":
      return <TabFilterWidget widget={widget} filterValues={filterValues} onFilterChange={onFilterChange} />;
    case "filter-toggle":
      return <ToggleFilterWidget widget={widget} filterValues={filterValues} onFilterChange={onFilterChange} />;
    case "filter-datepicker":
      return <DatepickerFilterWidget widget={widget} filterValues={filterValues} onFilterChange={onFilterChange} />;
    default:
      return (
        <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
          <span className="text-xs">Unknown filter type: {widget.type}</span>
        </div>
      );
  }
}

/**
 * 데이터 위젯 렌더러 — 필터 값으로 API를 호출하고 결과를 시각화.
 *
 * 렌더링 파이프라인:
 * 1. resolveTemplateParams(): dataBinding.requestParams의 {{filter.xxx}}를 실제 값으로 치환
 * 2. 시간 필터(startTime/endTime) 자동 주입
 * 3. useWidgetData(): TanStack Query로 /api/data 엔드포인트 호출
 * 4. 위젯 타입별 Content 컴포넌트로 시각화 (KpiCard, Table, LineChart, BarChart)
 *
 * 데이터 소스의 cache 설정(staleTime/gcTime)을 useWidgetData에 전달하여
 * 데이터 소스 타입별 차등 캐싱을 구현한다.
 */
function DataWidgetRenderer({
  widget,
  filterValues,
  dataSources,
}: {
  widget: Widget;
  filterValues?: Record<string, unknown>;
  dataSources?: Record<string, unknown>[];
}) {
  const tw = useTranslations("widget");
  const tc = useTranslations("common");

  const dataBinding = widget.dataBinding as {
    dataSourceId?: string;
    requestParams?: Record<string, unknown>;
    mapping?: {
      timeField?: string;
      dimensions?: string[];
      measurements?: { field: string; label: I18nLabel; unit?: I18nLabel; color?: string }[];
    };
  } | undefined;

  // ── 1. 필터 파라미터 치환 ({{filter.xxx}} → 실제 값) ──
  // resolveTemplateParams()로 템플릿 변수를 치환하고,
  // startTime/endTime이 명시적으로 없으면 filterValues에서 자동 주입
  const resolvedParams = useMemo(() => {
    const params = dataBinding?.requestParams && filterValues
      ? resolveTemplateParams(dataBinding.requestParams, filterValues)
      : {};

    const paramsWithTime = { ...params };
    if (filterValues) {
      if (filterValues.startTime && !paramsWithTime.startTime) {
        paramsWithTime.startTime = filterValues.startTime;
      }
      if (filterValues.endTime && !paramsWithTime.endTime) {
        paramsWithTime.endTime = filterValues.endTime;
      }
    }

    return paramsWithTime;
  }, [dataBinding?.requestParams, filterValues]);

  // ── 2. 데이터 소스의 캐시 설정 조회 ──
  // schema.dataSources에서 해당 dataSourceId의 cache 객체를 찾아
  // useWidgetData에 staleTime/gcTime으로 전달
  const cache = useMemo(() => {
    if (!dataSources || !dataBinding?.dataSourceId) return undefined;
    const ds = dataSources.find(
      (s) => (s as { id?: string }).id === dataBinding.dataSourceId,
    ) as { cache?: Record<string, unknown> } | undefined;
    return ds?.cache;
  }, [dataSources, dataBinding?.dataSourceId]);

  const { data, isLoading, error } = useWidgetData({
    dataSourceId: dataBinding?.dataSourceId ?? "",
    widgetType: widget.type,
    resolvedParams,
    cache,
    enabled: !!dataBinding?.dataSourceId,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <span className="text-xs text-center">{error.message}</span>
      </div>
    );
  }

  if (!dataBinding?.dataSourceId) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
        <span className="text-xs">{tw("noDataSource")}</span>
      </div>
    );
  }

  // ── 3. 위젯 타입별 시각화 컴포넌트 분기 ──
  switch (widget.type) {
    case "kpi-card":
      return <KpiCardContent data={data ?? null} mapping={dataBinding.mapping} />;
    case "table":
      return <TableContent data={data ?? null} mapping={dataBinding.mapping} />;
    case "line-chart":
      return <LineChartContent data={data ?? null} mapping={dataBinding.mapping} />;
    case "bar-chart":
      return <BarChartContent data={data ?? null} mapping={dataBinding.mapping} />;
    default:
      return (
        <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
          <span className="text-xs">{tw("unsupportedType", { type: widget.type })}</span>
        </div>
      );
  }
}

// KPI 카드 컨텐츠
function KpiCardContent({
  data,
  mapping,
}: {
  data: DataResponse | null;
  mapping?: {
    measurements?: { field: string; label: I18nLabel; unit?: I18nLabel; color?: string }[];
  };
}) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const tw = useTranslations("widget");

  if (!data?.summary && !data?.data?.length) {
    return <div className="text-center text-sm text-muted-foreground">{tc("noData")}</div>;
  }

  const measurement = mapping?.measurements?.[0];
  if (!measurement) {
    return <div className="text-center text-sm text-muted-foreground">{tw("noMeasurement")}</div>;
  }

  // summary에서 값 찾기 또는 data에서 계산
  let value: number | null = null;
  const summary = data.summary as Record<string, number> | undefined;

  // summary 필드 매핑
  const summaryFieldMap: Record<string, string> = {
    activePower: "totalActivePower",
    dailyEnergy: "totalDailyEnergy",
    efficiency: "avgEfficiency",
    irradiance: "avgIrradiance",
    temperature: "avgTemperature",
  };

  const summaryField = summaryFieldMap[measurement.field] ?? measurement.field;

  if (summary && summaryField in summary) {
    value = summary[summaryField];
  } else if (data.data?.length) {
    // data 배열에서 첫번째 값 또는 합계/평균 계산
    const values = data.data
      .map((d) => d[measurement.field] as number)
      .filter((v) => typeof v === "number");

    if (values.length > 0) {
      value = values.reduce((a, b) => a + b, 0);
      if (measurement.field.includes("efficiency") || measurement.field.includes("temperature")) {
        value = value / values.length; // 평균
      }
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-2">
      <div
        className="text-3xl font-bold"
        style={{ color: measurement.color ?? "#000" }}
      >
        {value !== null ? formatNumber(value) : "-"}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {resolveLabel(measurement.unit, locale)}
      </div>
    </div>
  );
}

// 테이블 컨텐츠
function TableContent({
  data,
  mapping,
}: {
  data: DataResponse | null;
  mapping?: {
    dimensions?: string[];
    measurements?: { field: string; label: I18nLabel; unit?: I18nLabel }[];
  };
}) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const tw = useTranslations("widget");

  if (!data?.data?.length) {
    return <div className="text-center text-sm text-muted-foreground p-4">{tc("noData")}</div>;
  }

  const dimensions = mapping?.dimensions ?? [];
  const measurements = mapping?.measurements ?? [];
  const columns = [...dimensions, ...measurements.map((m) => m.field)];
  const headers: { field: string; label: string; unit?: string }[] = [
    ...dimensions.map((d) => ({ field: d, label: formatFieldName(d) })),
    ...measurements.map((m) => ({ field: m.field, label: resolveLabel(m.label, locale), unit: resolveLabel(m.unit, locale) || undefined })),
  ];

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted">
          <tr>
            {headers.map((h) => (
              <th key={h.field} className="px-2 py-1 text-left font-medium">
                {h.label}
                {h.unit && <span className="text-muted-foreground ml-1">({h.unit})</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.data.slice(0, 10).map((row, idx) => (
            <tr key={idx} className="border-t hover:bg-muted/50">
              {columns.map((col) => (
                <td key={col} className="px-2 py-1">
                  {formatCellValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.data.length > 10 && (
        <div className="p-2 text-center text-xs text-muted-foreground">
          {tw("moreRows", { count: data.data.length - 10 })}
        </div>
      )}
    </div>
  );
}

// 라인 차트 컨텐츠
function LineChartContent({
  data,
  mapping,
}: {
  data: DataResponse | null;
  mapping?: {
    timeField?: string;
    measurements?: { field: string; label: I18nLabel; unit?: I18nLabel; color?: string }[];
  };
}) {
  const locale = useLocale();
  const tw = useTranslations("widget");

  if (!data?.data?.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{tw("noChartData")}</div>;
  }

  const measurements = mapping?.measurements ?? [];
  const timeField = mapping?.timeField ?? "timestamp";

  // 데이터를 시간순으로 정렬하고 차트용 데이터로 변환
  const chartData = processChartData(data.data, timeField, measurements);

  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{tw("noChartData")}</div>;
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => formatTimeLabel(value)}
          />
          <YAxis tick={{ fontSize: 10 }} width={40} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            labelFormatter={(value) => formatTimeLabel(value)}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {measurements.map((m) => (
            <Line
              key={m.field}
              type="monotone"
              dataKey={m.field}
              name={resolveLabel(m.label, locale)}
              stroke={m.color ?? "#3b82f6"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 바 차트 컨텐츠
function BarChartContent({
  data,
  mapping,
}: {
  data: DataResponse | null;
  mapping?: {
    timeField?: string;
    dimensions?: string[];
    measurements?: { field: string; label: I18nLabel; unit?: I18nLabel; color?: string }[];
  };
}) {
  const locale = useLocale();
  const tw = useTranslations("widget");

  if (!data?.data?.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{tw("noChartData")}</div>;
  }

  const measurements = mapping?.measurements ?? [];
  const dimensions = mapping?.dimensions ?? [];
  const categoryField = dimensions[0] ?? mapping?.timeField ?? "timestamp";

  // 카테고리별로 집계
  const chartData = processBarChartData(data.data, categoryField, measurements);

  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{tw("noChartData")}</div>;
  }

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="category" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={40} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {measurements.map((m) => (
            <Bar
              key={m.field}
              dataKey={m.field}
              name={resolveLabel(m.label, locale)}
              fill={m.color ?? "#3b82f6"}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 차트 데이터 처리 함수
function processChartData(
  rawData: Record<string, unknown>[],
  timeField: string,
  measurements: { field: string }[]
): Record<string, unknown>[] {
  // 시간별로 그룹핑하여 평균 계산
  const timeGroups = new Map<string, Record<string, number[]>>();

  for (const row of rawData) {
    const timestamp = row[timeField];
    if (!timestamp) continue;

    const timeKey = new Date(timestamp as string).toISOString();

    if (!timeGroups.has(timeKey)) {
      timeGroups.set(timeKey, {});
    }

    const group = timeGroups.get(timeKey)!;
    for (const m of measurements) {
      const value = row[m.field];
      if (typeof value === "number") {
        if (!group[m.field]) group[m.field] = [];
        group[m.field].push(value);
      }
    }
  }

  // 평균 계산 및 정렬
  const result: Record<string, unknown>[] = [];
  const sortedKeys = Array.from(timeGroups.keys()).sort();

  for (const timeKey of sortedKeys) {
    const group = timeGroups.get(timeKey)!;
    const entry: Record<string, unknown> = { time: timeKey };

    for (const m of measurements) {
      const values = group[m.field];
      if (values && values.length > 0) {
        entry[m.field] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }

    result.push(entry);
  }

  return result;
}

// 바 차트 데이터 처리 함수
function processBarChartData(
  rawData: Record<string, unknown>[],
  categoryField: string,
  measurements: { field: string }[]
): Record<string, unknown>[] {
  // 카테고리별로 그룹핑
  const categoryGroups = new Map<string, Record<string, number[]>>();

  for (const row of rawData) {
    const category = row[categoryField];
    if (!category) continue;

    const categoryKey = String(category);

    if (!categoryGroups.has(categoryKey)) {
      categoryGroups.set(categoryKey, {});
    }

    const group = categoryGroups.get(categoryKey)!;
    for (const m of measurements) {
      const value = row[m.field];
      if (typeof value === "number") {
        if (!group[m.field]) group[m.field] = [];
        group[m.field].push(value);
      }
    }
  }

  // 합계/평균 계산
  const result: Record<string, unknown>[] = [];

  for (const [category, group] of categoryGroups) {
    const entry: Record<string, unknown> = { category };

    for (const m of measurements) {
      const values = group[m.field];
      if (values && values.length > 0) {
        // 합계 사용 (필요시 평균으로 변경 가능)
        entry[m.field] = values.reduce((a, b) => a + b, 0);
      }
    }

    result.push(entry);
  }

  return result.slice(0, 20); // 최대 20개 카테고리
}

// 유틸리티 함수들
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + "M";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(2) + "k";
  }
  return value.toFixed(value < 10 ? 2 : 1);
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") return formatNumber(value);
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(value).toLocaleString();
  }
  return String(value);
}

function formatTimeLabel(value: string): string {
  try {
    const date = new Date(value);
    return date.toLocaleDateString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}
