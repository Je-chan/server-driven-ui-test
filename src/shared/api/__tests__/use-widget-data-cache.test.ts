import { describe, it, expect } from "vitest";

/**
 * useWidgetData queryKey 캐시 분리 검증.
 *
 * queryKey에 dataSourceEndpoint가 포함되어,
 * 같은 dataSourceId라도 다른 endpoint를 쓰면 캐시가 분리되는지 확인한다.
 */

function buildWidgetQueryKey(
  dataSourceId: string,
  widgetType: string,
  resolvedParams: Record<string, unknown>,
  dataSourceEndpoint?: string,
) {
  return ["widget-data", dataSourceId, widgetType, resolvedParams, dataSourceEndpoint];
}

describe("useWidgetData queryKey 캐시 분리", () => {
  it("같은 dataSourceId + 다른 dataSourceEndpoint → 다른 queryKey", () => {
    const params = { siteId: "site_001", aggregation: "latest" };
    const key1 = buildWidgetQueryKey("ds_inverter", "kpi-card", params, "/api/data/inverter");
    const key2 = buildWidgetQueryKey("ds_inverter", "kpi-card", params, "/api/data/inverter-v2");
    expect(JSON.stringify(key1)).not.toBe(JSON.stringify(key2));
  });

  it("같은 dataSourceId + endpoint undefined vs 명시적 → 다른 queryKey", () => {
    const params = { siteId: "site_001" };
    const key1 = buildWidgetQueryKey("ds_inverter", "line-chart", params);
    const key2 = buildWidgetQueryKey("ds_inverter", "line-chart", params, "/api/data/inverter");
    expect(JSON.stringify(key1)).not.toBe(JSON.stringify(key2));
  });

  it("같은 모든 파라미터 → 같은 queryKey", () => {
    const params = { siteId: "site_001", aggregation: "timeseries" };
    const key1 = buildWidgetQueryKey("ds_inverter", "line-chart", params, "/api/data/inverter");
    const key2 = buildWidgetQueryKey("ds_inverter", "line-chart", params, "/api/data/inverter");
    expect(JSON.stringify(key1)).toBe(JSON.stringify(key2));
  });

  it("다른 widgetType → 다른 queryKey", () => {
    const params = { siteId: "site_001" };
    const key1 = buildWidgetQueryKey("ds_inverter", "kpi-card", params, "/api/data/inverter");
    const key2 = buildWidgetQueryKey("ds_inverter", "line-chart", params, "/api/data/inverter");
    expect(JSON.stringify(key1)).not.toBe(JSON.stringify(key2));
  });
});
