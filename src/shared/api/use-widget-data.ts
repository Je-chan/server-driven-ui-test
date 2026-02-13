"use client";

import { useQuery } from "@tanstack/react-query";

interface DataResponse {
  success: boolean;
  data: Record<string, unknown>[];
  summary?: Record<string, number>;
  error?: string;
}

interface UseWidgetDataParams {
  dataSourceId: string;
  widgetType: string;
  resolvedParams: Record<string, unknown>;
  cache?: Record<string, unknown>;
  enabled?: boolean;
}

// 데이터 소스 ID를 API 엔드포인트로 매핑
function buildEndpoint(
  dataSourceId: string,
  widgetType: string,
  resolvedParams?: Record<string, unknown>,
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

  if (resolvedParams) {
    for (const [key, value] of Object.entries(resolvedParams)) {
      if (value !== undefined && value !== null && value !== "") {
        url += `&${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
      }
    }
  }

  return url;
}

export function useWidgetData({
  dataSourceId,
  widgetType,
  resolvedParams,
  cache,
  enabled,
}: UseWidgetDataParams) {
  const endpoint = buildEndpoint(dataSourceId, widgetType, resolvedParams);

  return useQuery<DataResponse>({
    queryKey: ["widget-data", dataSourceId, widgetType, resolvedParams],
    queryFn: async () => {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to fetch");
      return json as DataResponse;
    },
    enabled: enabled !== false && !!endpoint,
    ...cache,
  });
}
