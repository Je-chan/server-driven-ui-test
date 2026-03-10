"use client";

import { useQuery } from "@tanstack/react-query";

interface DataResponse {
  success: boolean;
  data: Record<string, unknown>[];
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
const ENDPOINT_MAP: Record<string, string> = {
  ds_inverter: "/api/data/inverter",
  ds_weather: "/api/data/weather",
  ds_kpi: "/api/data/kpi",
  ds_alarm: "/api/data/alarm",
  ds_battery: "/api/data/battery",
  ds_revenue: "/api/data/revenue",
  ds_grid: "/api/data/grid",
  ds_price: "/api/data/price",
  ds_meter: "/api/data/meter",
  ds_maintenance: "/api/data/maintenance",
  ds_module: "/api/data/module",
};

/**
 * 엔드포인트 결정 우선순위:
 * 1. dataSources[].config.endpoint (스키마 정의)
 * 2. ENDPOINT_MAP 하드코딩 fallback
 *
 * resolvedParams를 쿼리 파라미터로 그대로 전달한다.
 */
function buildEndpoint(
  dataSourceId: string,
  _widgetType: string,
  resolvedParams?: Record<string, unknown>,
  dataSourceEndpoint?: string,
): string {
  const baseUrl = dataSourceEndpoint ?? ENDPOINT_MAP[dataSourceId];
  if (!baseUrl) return "";

  let url = baseUrl;
  if (resolvedParams) {
    const hasQuery = url.includes("?");
    let first = !hasQuery;
    for (const [key, value] of Object.entries(resolvedParams)) {
      if (value !== undefined && value !== null && value !== "") {
        url += `${first ? "?" : "&"}${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        first = false;
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
    queryKey: ["widget-data", dataSourceId, widgetType, resolvedParams, dataSourceEndpoint],
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
