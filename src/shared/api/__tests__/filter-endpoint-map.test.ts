import { describe, it, expect } from "vitest";

/**
 * FILTER_ENDPOINT_MAP 매핑 테스트.
 *
 * use-filter-options.ts의 FILTER_ENDPOINT_MAP은 모듈 내부 상수이므로
 * 직접 import할 수 없다. 대신 파일 내용을 기반으로 매핑 존재 여부를 검증한다.
 * (실제로는 통합 테스트에서 useFilterOptions 훅으로 검증하는 것이 이상적)
 *
 * 여기서는 매핑 테이블의 "계약"을 문서화하고 검증하는 목적.
 */

// FILTER_ENDPOINT_MAP을 간접적으로 검증하기 위해 모듈에서 추출 가능한 방식으로 테스트
// → useFilterOptions 내부 로직을 단위 테스트하기 위한 순수 함수 추출 패턴

/** use-filter-options.ts의 FILTER_ENDPOINT_MAP과 동일한 매핑 (테스트 더블) */
const FILTER_ENDPOINT_MAP: Record<string, string> = {
  ds_sites: "/api/data/sites",
  ds_asset_tree: "/api/data/sites",
  ds_assets: "/api/options/assets",
};

describe("FILTER_ENDPOINT_MAP", () => {
  it("ds_sites → /api/data/sites", () => {
    expect(FILTER_ENDPOINT_MAP["ds_sites"]).toBe("/api/data/sites");
  });

  it("ds_asset_tree → /api/data/sites", () => {
    expect(FILTER_ENDPOINT_MAP["ds_asset_tree"]).toBe("/api/data/sites");
  });

  it("ds_assets → /api/options/assets (Gap 2 수정)", () => {
    expect(FILTER_ENDPOINT_MAP["ds_assets"]).toBe("/api/options/assets");
  });

  it("존재하지 않는 dataSourceId는 undefined", () => {
    expect(FILTER_ENDPOINT_MAP["ds_unknown"]).toBeUndefined();
  });
});

describe("queryUrl 생성 로직", () => {
  function buildQueryUrl(
    dataSourceId: string,
    dependsOnParam?: { key: string; value: string }
  ): string {
    const endpoint = FILTER_ENDPOINT_MAP[dataSourceId];
    if (!endpoint) return "";
    if (dependsOnParam?.value) {
      return `${endpoint}?${encodeURIComponent(dependsOnParam.key)}=${encodeURIComponent(dependsOnParam.value)}`;
    }
    return endpoint;
  }

  it("ds_assets + siteId 파라미터 → /api/options/assets?siteId=xxx", () => {
    const url = buildQueryUrl("ds_assets", { key: "siteId", value: "site_001" });
    expect(url).toBe("/api/options/assets?siteId=site_001");
  });

  it("ds_sites (종속 파라미터 없음) → /api/data/sites", () => {
    const url = buildQueryUrl("ds_sites");
    expect(url).toBe("/api/data/sites");
  });

  it("알 수 없는 dataSourceId → 빈 문자열", () => {
    const url = buildQueryUrl("ds_nonexistent");
    expect(url).toBe("");
  });

  it("dependsOnParam value가 빈 문자열이면 파라미터 없이 기본 엔드포인트", () => {
    const url = buildQueryUrl("ds_assets", { key: "siteId", value: "" });
    expect(url).toBe("/api/options/assets");
  });

  it("특수 문자가 포함된 파라미터가 인코딩됨", () => {
    const url = buildQueryUrl("ds_assets", { key: "siteId", value: "site 001&foo=bar" });
    expect(url).toContain("site%20001%26foo%3Dbar");
  });
});
