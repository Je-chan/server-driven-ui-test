"use client";

import { useQuery } from "@tanstack/react-query";

interface FilterOption {
  value: string;
  label: string;
}

interface UseFilterOptionsParams {
  /** dataSources[].id — 데이터 소스 참조 키 */
  dataSourceId: string;
  /** 응답 데이터에서 value로 사용할 필드 */
  valueField?: string;
  /** 응답 데이터에서 label로 사용할 필드 */
  labelField?: string;
  /** 부모 필터 의존: 쿼리 파라미터로 전달할 값 */
  dependsOnParam?: { key: string; value: string };
  /** 활성화 여부 */
  enabled?: boolean;
}

// dataSourceId → endpoint 하드코딩 매핑 (fallback)
const FILTER_ENDPOINT_MAP: Record<string, string> = {
  ds_sites: "/api/data/sites",
  ds_asset_tree: "/api/data/sites",
};

/**
 * 필터 옵션을 API에서 동적으로 로드하는 훅.
 *
 * dataSourceId를 기반으로 endpoint를 결정하고,
 * 응답의 data[]에서 valueField/labelField를 추출하여
 * { value, label }[] 형태로 반환한다.
 */
export function useFilterOptions({
  dataSourceId,
  valueField = "id",
  labelField = "name",
  dependsOnParam,
  enabled = true,
}: UseFilterOptionsParams) {
  const endpoint = FILTER_ENDPOINT_MAP[dataSourceId];

  const queryUrl = (() => {
    if (!endpoint) return "";
    if (dependsOnParam?.value) {
      return `${endpoint}?${encodeURIComponent(dependsOnParam.key)}=${encodeURIComponent(dependsOnParam.value)}`;
    }
    return endpoint;
  })();

  return useQuery<FilterOption[]>({
    queryKey: ["filter-options", dataSourceId, dependsOnParam?.value],
    queryFn: async () => {
      const res = await fetch(queryUrl);
      const json = await res.json();
      if (!json.success || !json.data) return [];

      return (json.data as Record<string, unknown>[]).map((item) => ({
        value: String(item[valueField] ?? ""),
        label: String(item[labelField] ?? ""),
      }));
    },
    enabled: enabled && !!queryUrl,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000,
  });
}
