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
  /** dataSources[].config.endpoint — 스키마에 정의된 커스텀 엔드포인트 */
  dataSourceEndpoint?: string;
  /** schema.settings.refreshInterval (ms). 0이면 비활성 */
  refreshInterval?: number;
}

// 데이터 소스 ID를 API 엔드포인트로 매핑 (하드코딩 fallback)
const ENDPOINT_MAP: Record<string, { latest: string; timeseries: string }> = {
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

/**
 * 엔드포인트 결정 우선순위:
 * 1. dataSources[].config.endpoint (스키마 정의)
 * 2. ENDPOINT_MAP 하드코딩 fallback
 *
 * aggregation 결정 우선순위:
 * 1. resolvedParams.aggregation (명시적 지정)
 * 2. widgetType 기반 추론 (차트 → timeseries, 나머지 → latest)
 */
function buildEndpoint(
  dataSourceId: string,
  widgetType: string,
  resolvedParams?: Record<string, unknown>,
  dataSourceEndpoint?: string,
): string {
  // aggregation: 명시적 지정 우선, 없으면 widgetType 기반 추론
  const explicitAggregation = resolvedParams?.aggregation as string | undefined;
  const isChart = widgetType === "line-chart" || widgetType === "bar-chart";
  const aggregation = explicitAggregation ?? (isChart ? "timeseries" : "latest");

  // 1. 스키마에 정의된 커스텀 엔드포인트 사용
  if (dataSourceEndpoint) {
    let url = dataSourceEndpoint;
    const hasQuery = url.includes("?");

    // aggregation을 쿼리 파라미터로 추가 (이미 포함되어 있지 않은 경우)
    if (!url.includes("aggregation=")) {
      url += `${hasQuery ? "&" : "?"}aggregation=${encodeURIComponent(aggregation)}`;
    }

    // resolvedParams 추가 (aggregation 제외 — 이미 처리됨)
    if (resolvedParams) {
      for (const [key, value] of Object.entries(resolvedParams)) {
        if (key === "aggregation") continue;
        if (value !== undefined && value !== null && value !== "") {
          url += `&${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        }
      }
    }

    return url;
  }

  // 2. 하드코딩 엔드포인트 맵 fallback
  const config = ENDPOINT_MAP[dataSourceId];
  if (!config) return "";

  let url = aggregation === "timeseries" ? config.timeseries : config.latest;

  if (resolvedParams) {
    for (const [key, value] of Object.entries(resolvedParams)) {
      if (key === "aggregation") continue; // 이미 URL에 포함됨
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
  dataSourceEndpoint,
  refreshInterval,
}: UseWidgetDataParams) {
  const endpoint = buildEndpoint(dataSourceId, widgetType, resolvedParams, dataSourceEndpoint);

  return useQuery<DataResponse>({
    queryKey: ["widget-data", dataSourceId, widgetType, resolvedParams],
    queryFn: async () => {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to fetch");
      return json as DataResponse;
    },
    enabled: enabled !== false && !!endpoint,
    refetchInterval: refreshInterval && refreshInterval > 0 ? refreshInterval : false,
    ...cache,
  });
}
