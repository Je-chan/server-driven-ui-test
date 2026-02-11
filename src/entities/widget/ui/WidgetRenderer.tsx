"use client";

import { useEffect, useState } from "react";
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
import type { Widget } from "@/src/entities/dashboard";
import { resolveTemplateParams } from "@/src/shared/lib";
import {
  SelectFilterWidget,
  MultiSelectFilterWidget,
  TreeSelectFilterWidget,
  InputFilterWidget,
  TabFilterWidget,
  DatepickerFilterWidget,
} from "./filters";

interface WidgetRendererProps {
  widget: Widget;
  filterValues?: Record<string, unknown>;
  onFilterChange?: (key: string, value: unknown) => void;
}

interface DataResponse {
  success: boolean;
  data: Record<string, unknown>[];
  summary?: Record<string, number>;
  error?: string;
}

// 데이터 소스 ID를 API 엔드포인트로 매핑
function getEndpoint(
  dataSourceId: string,
  widgetType: string,
  resolvedParams?: Record<string, unknown>
): string {
  const isChart = widgetType === "line-chart" || widgetType === "bar-chart";

  const endpoints: Record<string, { latest: string; timeseries: string }> = {
    ds_inverter: {
      latest: "/api/data/inverter?aggregation=latest",
      timeseries: "/api/data/inverter?aggregation=timeseries",
    },
    ds_weather: {
      latest: "/api/data/weather?aggregation=latest",
      timeseries: "/api/data/weather?aggregation=timeseries",
    },
    ds_kpi: {
      latest: "/api/data/kpi?limit=1",
      timeseries: "/api/data/kpi?limit=60",
    },
    ds_alarm: {
      latest: "/api/data/alarm?limit=20",
      timeseries: "/api/data/alarm?limit=100",
    },
    ds_battery: {
      latest: "/api/data/battery?aggregation=latest",
      timeseries: "/api/data/battery?aggregation=timeseries",
    },
    ds_revenue: {
      latest: "/api/data/revenue?limit=1",
      timeseries: "/api/data/revenue?limit=60",
    },
    ds_grid: {
      latest: "/api/data/grid?aggregation=latest",
      timeseries: "/api/data/grid?aggregation=timeseries",
    },
    ds_price: {
      latest: "/api/data/price?aggregation=latest",
      timeseries: "/api/data/price?aggregation=timeseries",
    },
    ds_meter: {
      latest: "/api/data/meter?aggregation=latest",
      timeseries: "/api/data/meter?aggregation=timeseries",
    },
    ds_maintenance: {
      latest: "/api/data/maintenance?limit=20",
      timeseries: "/api/data/maintenance?limit=50",
    },
    ds_module: {
      latest: "/api/data/module?aggregation=latest",
      timeseries: "/api/data/module?aggregation=timeseries",
    },
  };

  const config = endpoints[dataSourceId];
  if (!config) return "";

  let url = isChart ? config.timeseries : config.latest;

  // 치환된 필터 파라미터를 쿼리스트링에 추가
  if (resolvedParams) {
    for (const [key, value] of Object.entries(resolvedParams)) {
      if (value !== undefined && value !== null && value !== "") {
        url += `&${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
      }
    }
  }

  return url;
}

export function WidgetRenderer({ widget, filterValues, onFilterChange }: WidgetRendererProps) {
  // 필터 위젯은 데이터 페칭 없이 즉시 렌더링
  if (widget.type.startsWith("filter-") && onFilterChange && filterValues) {
    return renderFilterWidget(widget, filterValues, onFilterChange);
  }

  return <DataWidgetRenderer widget={widget} filterValues={filterValues} />;
}

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

function DataWidgetRenderer({ widget, filterValues }: { widget: Widget; filterValues?: Record<string, unknown> }) {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dataBinding = widget.dataBinding as {
    dataSourceId?: string;
    requestParams?: Record<string, unknown>;
    mapping?: {
      timeField?: string;
      dimensions?: string[];
      measurements?: { field: string; label: string; unit?: string; color?: string }[];
    };
  } | undefined;

  // 필터 값에서 내부용 키(__preset_ 등) 제거
  const filterParamsKey = filterValues
    ? JSON.stringify(
        Object.fromEntries(
          Object.entries(filterValues).filter(([k]) => !k.startsWith("__"))
        )
      )
    : "";

  useEffect(() => {
    async function fetchData() {
      if (!dataBinding?.dataSourceId) {
        setLoading(false);
        return;
      }

      // requestParams의 {{filter.xxx}} 템플릿을 필터 값으로 치환
      const resolvedParams = dataBinding.requestParams && filterValues
        ? resolveTemplateParams(dataBinding.requestParams, filterValues)
        : undefined;

      // 시간 필터는 항상 포함 (requestParams에 명시적으로 없어도)
      const paramsWithTime = { ...resolvedParams };
      if (filterValues) {
        if (filterValues.startTime && !paramsWithTime.startTime) {
          paramsWithTime.startTime = filterValues.startTime;
        }
        if (filterValues.endTime && !paramsWithTime.endTime) {
          paramsWithTime.endTime = filterValues.endTime;
        }
      }

      const endpoint = getEndpoint(dataBinding.dataSourceId, widget.type, paramsWithTime);
      if (!endpoint) {
        setError(`Unknown data source: ${dataBinding.dataSourceId}`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(endpoint);
        const result = await response.json();

        if (result.success) {
          setData(result);
          setError(null);
        } else {
          setError(result.error ?? "Failed to fetch data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // 30초마다 데이터 갱신
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [dataBinding?.dataSourceId, widget.type, filterParamsKey]);

  if (loading) {
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
        <span className="text-xs text-center">{error}</span>
      </div>
    );
  }

  if (!dataBinding?.dataSourceId) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
        <span className="text-xs">No data source configured</span>
      </div>
    );
  }

  // 위젯 타입에 따른 렌더링
  switch (widget.type) {
    case "kpi-card":
      return <KpiCardContent data={data} mapping={dataBinding.mapping} />;
    case "table":
      return <TableContent data={data} mapping={dataBinding.mapping} />;
    case "line-chart":
      return <LineChartContent data={data} mapping={dataBinding.mapping} />;
    case "bar-chart":
      return <BarChartContent data={data} mapping={dataBinding.mapping} />;
    default:
      return (
        <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
          <span className="text-xs">Unsupported widget type: {widget.type}</span>
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
    measurements?: { field: string; label: string; unit?: string; color?: string }[];
  };
}) {
  if (!data?.summary && !data?.data?.length) {
    return <div className="text-center text-sm text-muted-foreground">No data</div>;
  }

  const measurement = mapping?.measurements?.[0];
  if (!measurement) {
    return <div className="text-center text-sm text-muted-foreground">No measurement configured</div>;
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
        {measurement.unit ?? ""}
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
    measurements?: { field: string; label: string; unit?: string }[];
  };
}) {
  if (!data?.data?.length) {
    return <div className="text-center text-sm text-muted-foreground p-4">No data</div>;
  }

  const dimensions = mapping?.dimensions ?? [];
  const measurements = mapping?.measurements ?? [];
  const columns = [...dimensions, ...measurements.map((m) => m.field)];
  const headers: { field: string; label: string; unit?: string }[] = [
    ...dimensions.map((d) => ({ field: d, label: formatFieldName(d) })),
    ...measurements.map((m) => ({ field: m.field, label: m.label, unit: m.unit })),
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
          +{data.data.length - 10} more rows
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
    measurements?: { field: string; label: string; unit?: string; color?: string }[];
  };
}) {
  if (!data?.data?.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data</div>;
  }

  const measurements = mapping?.measurements ?? [];
  const timeField = mapping?.timeField ?? "timestamp";

  // 데이터를 시간순으로 정렬하고 차트용 데이터로 변환
  const chartData = processChartData(data.data, timeField, measurements);

  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No chart data</div>;
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
              name={m.label}
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
    measurements?: { field: string; label: string; unit?: string; color?: string }[];
  };
}) {
  if (!data?.data?.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data</div>;
  }

  const measurements = mapping?.measurements ?? [];
  const dimensions = mapping?.dimensions ?? [];
  const categoryField = dimensions[0] ?? mapping?.timeField ?? "timestamp";

  // 카테고리별로 집계
  const chartData = processBarChartData(data.data, categoryField, measurements);

  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No chart data</div>;
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
              name={m.label}
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
